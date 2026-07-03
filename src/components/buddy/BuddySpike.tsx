"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fixtureReadAloudPassages } from "@/lib/fixtures/student";
import { alignWords } from "@/lib/buddy/alignment";
import {
  buildRoutine,
  pickWarmupSounds,
  type BuddyStep,
} from "@/lib/buddy/routine";
import { abortClip, startClip, stopClip } from "@/lib/buddy/recorder";
import { cancelSpeech, speakPhoneme, speakSentence } from "@/lib/speech";
import BuddyReview, { type RecordedSentence } from "./BuddyReview";

type Phase = "setup" | "session" | "gate" | "review";
type RecState = "waiting" | "recording" | "processing";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// speechSynthesis on iOS can stall without firing onend; never let one
// stuck utterance wedge the whole pre-queued session. Cap scales with
// length so slow-rate long lines (greeting) aren't truncated mid-word.
const speakWithTimeout = (p: Promise<void>, text: string) =>
  Promise.race([p, delay(3000 + 600 * text.split(/\s+/).length)]);

export default function BuddySpike() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [childName, setChildName] = useState("");
  const [passageId, setPassageId] = useState(fixtureReadAloudPassages[0].id);
  const [customText, setCustomText] = useState("");
  const [steps, setSteps] = useState<BuddyStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [recState, setRecState] = useState<RecState>("waiting");
  const [micError, setMicError] = useState(false);
  const [reviewSentences, setReviewSentences] = useState<RecordedSentence[]>(
    [],
  );
  const recordedRef = useRef<RecordedSentence[]>([]);
  const mountedRef = useRef(true);

  // Unmount guard (house pattern from useSpeechRecognition): stop TTS,
  // release any in-flight mic recording, and block setState on a dead tree.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelSpeech();
      abortClip();
    };
  }, []);

  const passageText =
    customText.trim() ||
    fixtureReadAloudPassages.find((p) => p.id === passageId)?.text ||
    fixtureReadAloudPassages[0].text;
  const exportPassageId = customText.trim() ? "custom" : passageId;

  /** Speak and auto-advance through non-recording steps, stop at recording ones. */
  const runFrom = useCallback(
    async (queue: BuddyStep[], from: number) => {
      let i = from;
      while (i < queue.length && !queue[i].records) {
        if (!mountedRef.current) return;
        const step = queue[i];
        setStepIndex(i);
        await speakWithTimeout(speakSentence(step.buddyLine), step.buddyLine);
        if (!mountedRef.current) return;
        if (step.type === "warmup_sound" && step.target) {
          await speakWithTimeout(speakPhoneme(step.target), step.target);
          await delay(1800); // pause for the child's echo (not recorded)
          if (!mountedRef.current) return;
        }
        if (step.type === "finish") {
          setPhase("gate");
          return;
        }
        i++;
      }
      if (i < queue.length) {
        setStepIndex(i);
        await speakWithTimeout(
          speakSentence(queue[i].buddyLine),
          queue[i].buddyLine,
        );
        if (!mountedRef.current) return;
        setRecState("waiting");
      }
    },
    [],
  );

  const handleStart = useCallback(async () => {
    const name = childName.trim() || "friend";
    const routine = buildRoutine({
      childName: name,
      passageText,
      warmupSounds: pickWarmupSounds(passageText),
    });
    recordedRef.current = [];
    setSteps(routine);
    setPhase("session");
    await runFrom(routine, 0);
  }, [childName, passageText, runFrom]);

  // Buddy audio can never leak into a clip, by construction: recording only
  // starts after the prompt's TTS promise has resolved (runFrom awaits it
  // before showing the Start button), and "Great reading!" is only spoken
  // after stopClip has resolved.
  const handleRecord = useCallback(async () => {
    setMicError(false); // clear any stale banner from a failed prior attempt
    const ok = await startClip();
    if (!mountedRef.current) {
      // Unmount raced the mic permission prompt: cleanup's abortClip() ran
      // before the recorder existed, so release the just-granted mic here.
      abortClip();
      return;
    }
    if (!ok) {
      setMicError(true);
      return;
    }
    setRecState("recording");
  }, []);

  const handleDone = useCallback(async () => {
    setRecState("processing");
    const step = steps[stepIndex];
    const { blob, transcript } = await stopClip();
    if (!mountedRef.current) return;
    recordedRef.current.push({
      sentenceIndex: step.sentenceIndex ?? 0,
      target: step.target ?? "",
      transcript,
      blobUrl: blob ? URL.createObjectURL(blob) : null,
      words: alignWords(step.target ?? "", transcript),
    });
    // R7: always positive, never a verdict, regardless of what ASR heard.
    await speakWithTimeout(speakSentence("Great reading!"), "Great reading!");
    await runFrom(steps, stepIndex + 1);
  }, [steps, stepIndex, runFrom]);

  const currentStep = steps[stepIndex];

  if (phase === "setup") {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-5 px-6 py-10">
        <h1 className="text-2xl font-extrabold text-purple-700">
          Reading Buddy (spike)
        </h1>
        <label className="flex flex-col gap-1 text-sm font-bold text-gray-600">
          Child first name (spoken only, never saved)
          <input
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            className="rounded-xl border border-gray-300 px-4 py-3 text-lg"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-gray-600">
          Passage
          <select
            value={passageId}
            onChange={(e) => setPassageId(e.target.value)}
            className="rounded-xl border border-gray-300 px-4 py-3 text-lg"
          >
            {fixtureReadAloudPassages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.difficulty})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-gray-600">
          Or paste a custom passage (overrides the pick above)
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={4}
            className="rounded-xl border border-gray-300 px-4 py-3 text-lg"
          />
        </label>
        <button
          onClick={handleStart}
          className="min-h-12 rounded-2xl bg-purple-600 px-8 py-4 text-xl font-extrabold text-white shadow-lg hover:bg-purple-700 active:scale-95 transition-transform"
        >
          Start session
        </button>
      </main>
    );
  }

  if (phase === "session") {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center gap-8 px-6 py-10">
        <div className="text-7xl" aria-hidden>
          🐣
        </div>
        {currentStep?.records ? (
          <>
            <div className="w-full rounded-2xl bg-white px-6 py-5 shadow-sm">
              <p className="passage text-2xl font-semibold text-gray-800">
                {currentStep.target}
              </p>
            </div>
            {recState === "waiting" && (
              <button
                onClick={handleRecord}
                className="min-h-12 rounded-2xl bg-red-500 px-8 py-5 text-xl font-extrabold text-white shadow-lg hover:bg-red-600 active:scale-95 transition-transform"
              >
                🎙 Start Reading
              </button>
            )}
            {recState === "recording" && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 rounded-full bg-red-100 px-4 py-2">
                  <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-bold text-red-600">
                    Listening
                  </span>
                </div>
                <button
                  onClick={handleDone}
                  className="min-h-12 rounded-2xl bg-purple-600 px-8 py-5 text-xl font-extrabold text-white shadow-lg hover:bg-purple-700 active:scale-95 transition-transform"
                >
                  ✅ Done Reading
                </button>
              </div>
            )}
            {recState === "processing" && (
              <p className="text-sm text-gray-400 animate-pulse">
                One moment
              </p>
            )}
            {micError && (
              <p className="text-sm font-bold text-red-500">
                Microphone not available — ask a grown-up for help
              </p>
            )}
          </>
        ) : (
          <p className="text-lg font-bold text-gray-500">
            {currentStep?.type === "warmup_sound" ? "Listen and echo!" : "…"}
          </p>
        )}
      </main>
    );
  }

  if (phase === "gate") {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-8 px-6 py-10">
        <p className="text-3xl font-extrabold text-green-700">
          ⭐ All done! Great job!
        </p>
        <p className="text-lg font-bold text-gray-600">
          Hand the iPad to a grown-up.
        </p>
        <button
          onClick={() => {
            cancelSpeech();
            setReviewSentences(recordedRef.current);
            setPhase("review");
          }}
          className="min-h-12 rounded-2xl bg-gray-700 px-6 py-4 text-lg font-bold text-white hover:bg-gray-800"
        >
          Grown-up review
        </button>
      </main>
    );
  }

  return (
    <BuddyReview passageId={exportPassageId} sentences={reviewSentences} />
  );
}
