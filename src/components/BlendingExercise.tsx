"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { speakPhoneme, speakWord, cancelSpeech } from "@/lib/speech";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import PhonemeCard, { type PhonemeState } from "./PhonemeCard";
import MicButton from "./MicButton";

interface BlendingExerciseProps {
  word: string;
  phonemes: string[];
  onComplete: () => void;
  /** Enable speech recognition mode (mic). Falls back to tap if false or unsupported. */
  speechEnabled?: boolean;
}

/* ---------- Encouragement text ---------- */

const CORRECT_MSGS = ["Great job!", "You got it!", "Amazing!", "Super sound!", "Wow!"];
const RETRY_MSGS = ["Try again!", "Almost! One more try!", "Listen and try again!"];
const SKIP_MSGS = ["That's okay! Let's keep going!", "Good try! Moving on!", "You're doing great!"];
const WORD_CORRECT_MSGS = ["Fantastic!", "You said it!", "Perfect!", "Brilliant!"];

function pick(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ---------- Stage types ---------- */

type TapStage = "tapping" | "blending" | "reveal" | "done";
type SpeechStage =
  | "phoneme-play"
  | "phoneme-listen"
  | "phoneme-correct"
  | "phoneme-incorrect"
  | "phoneme-skip"
  | "blending"
  | "word-play"
  | "word-listen"
  | "word-correct"
  | "word-incorrect"
  | "word-skip"
  | "done";

type Stage = TapStage | SpeechStage;

/* ---------- Component ---------- */

export default function BlendingExercise({
  word,
  phonemes,
  onComplete,
  speechEnabled = false,
}: BlendingExerciseProps) {
  const {
    isSupported: srSupported,
    isPermissionGranted: srPermitted,
    isListening: srListening,
    listenForPhoneme: srListenPhoneme,
    listenForWord: srListenWord,
    cancel: srCancel,
  } = useSpeechRecognition();
  const useSpeech = speechEnabled && srSupported && srPermitted;

  // Card states
  const [states, setStates] = useState<PhonemeState[]>(
    () => phonemes.map(() => "idle") as PhonemeState[],
  );
  const [nextIndex, setNextIndex] = useState(0);
  const [stage, setStage] = useState<Stage>(useSpeech ? "phoneme-play" : "tapping");
  const [message, setMessage] = useState("");

  // Attempt tracking
  const phonemeAttempts = useRef(0);
  const wordAttempts = useRef(0);
  const blendingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      srCancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset when word changes
  useEffect(() => {
    setStates(phonemes.map(() => "idle"));
    setNextIndex(0);
    setStage(useSpeech ? "phoneme-play" : "tapping");
    setMessage("");
    phonemeAttempts.current = 0;
    wordAttempts.current = 0;
    blendingRef.current = false;
  }, [word, phonemes, useSpeech]);

  /* =====================================================
   * SPEECH MODE — automatic stage progression via effects
   * ===================================================== */

  // --- Phoneme play: TTS says the phoneme, then move to listening
  useEffect(() => {
    if (stage !== "phoneme-play") return;
    let cancelled = false;

    setMessage("Listen...");
    // Highlight current card
    setStates((prev) => {
      const next = [...prev];
      next[nextIndex] = "active";
      return next;
    });

    (async () => {
      await speakPhoneme(phonemes[nextIndex]);
      if (cancelled || !mountedRef.current) return;
      // Small buffer so mic doesn't pick up speaker
      await new Promise((r) => setTimeout(r, 350));
      if (cancelled || !mountedRef.current) return;
      setStage("phoneme-listen");
    })();

    return () => { cancelled = true; };
  }, [stage, nextIndex, phonemes]);

  // --- Phoneme listen: activate mic and match
  useEffect(() => {
    if (stage !== "phoneme-listen") return;
    let cancelled = false;

    setMessage("Now you say it!");
    setStates((prev) => {
      const next = [...prev];
      next[nextIndex] = "listening";
      return next;
    });

    cancelSpeech();

    (async () => {
      const result = await srListenPhoneme(
        phonemes[nextIndex],
        phonemeAttempts.current,
      );
      if (cancelled || !mountedRef.current) return;

      if (result.matched) {
        setStage("phoneme-correct");
      } else {
        phonemeAttempts.current += 1;
        if (phonemeAttempts.current >= 2) {
          setStage("phoneme-skip");
        } else {
          setStage("phoneme-incorrect");
        }
      }
    })();

    return () => {
      cancelled = true;
      srCancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, nextIndex, phonemes]);

  // --- Phoneme correct: brief celebration, advance
  useEffect(() => {
    if (stage !== "phoneme-correct") return;
    let cancelled = false;

    setMessage(pick(CORRECT_MSGS));
    setStates((prev) => {
      const next = [...prev];
      next[nextIndex] = "correct";
      return next;
    });

    const timer = setTimeout(() => {
      if (cancelled || !mountedRef.current) return;
      advancePhoneme();
    }, 800);

    return () => { cancelled = true; clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // --- Phoneme incorrect: brief feedback, replay
  useEffect(() => {
    if (stage !== "phoneme-incorrect") return;
    let cancelled = false;

    setMessage(pick(RETRY_MSGS));
    setStates((prev) => {
      const next = [...prev];
      next[nextIndex] = "incorrect";
      return next;
    });

    const timer = setTimeout(() => {
      if (cancelled || !mountedRef.current) return;
      setStage("phoneme-play"); // replay TTS and listen again
    }, 1000);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [stage, nextIndex]);

  // --- Phoneme skip: auto-advance with encouragement
  useEffect(() => {
    if (stage !== "phoneme-skip") return;
    let cancelled = false;

    setMessage(pick(SKIP_MSGS));
    setStates((prev) => {
      const next = [...prev];
      next[nextIndex] = "active";
      return next;
    });

    const timer = setTimeout(() => {
      if (cancelled || !mountedRef.current) return;
      advancePhoneme();
    }, 1000);

    return () => { cancelled = true; clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // --- Word play: TTS says the blended word
  useEffect(() => {
    if (stage !== "word-play") return;
    let cancelled = false;

    setMessage("Listen to the word...");

    (async () => {
      await speakWord(word);
      if (cancelled || !mountedRef.current) return;
      await new Promise((r) => setTimeout(r, 350));
      if (cancelled || !mountedRef.current) return;
      setStage("word-listen");
    })();

    return () => { cancelled = true; };
  }, [stage, word]);

  // --- Word listen (manual — child taps mic button)
  // We DON'T auto-start here; the child taps MicButton to begin.

  // --- Word correct
  useEffect(() => {
    if (stage !== "word-correct") return;
    let cancelled = false;

    setMessage(pick(WORD_CORRECT_MSGS));

    const timer = setTimeout(() => {
      if (cancelled || !mountedRef.current) return;
      setStage("done");
      onComplete();
    }, 1000);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [stage, onComplete]);

  // --- Word incorrect
  useEffect(() => {
    if (stage !== "word-incorrect") return;
    let cancelled = false;

    setMessage(pick(RETRY_MSGS));

    const timer = setTimeout(() => {
      if (cancelled || !mountedRef.current) return;
      setStage("word-play"); // replay and listen again
    }, 1000);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [stage]);

  // --- Word skip
  useEffect(() => {
    if (stage !== "word-skip") return;
    let cancelled = false;

    setMessage(pick(SKIP_MSGS));

    const timer = setTimeout(() => {
      if (cancelled || !mountedRef.current) return;
      setStage("done");
      onComplete();
    }, 1000);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [stage, onComplete]);

  /* ---------- Helpers ---------- */

  function advancePhoneme() {
    const next = nextIndex + 1;
    phonemeAttempts.current = 0;

    // Mark current card as "active" (done)
    setStates((prev) => {
      const updated = [...prev];
      updated[nextIndex] = "active";
      return updated;
    });

    if (next >= phonemes.length) {
      // All phonemes done → blend
      setTimeout(() => {
        if (!mountedRef.current) return;
        setStage("blending");
        setStates(phonemes.map(() => "blended"));
        setMessage("Blending the sounds together...");

        setTimeout(async () => {
          if (!mountedRef.current) return;
          await speakWord(word);
          if (!mountedRef.current) return;
          setStage("word-play");
        }, 700);
      }, 300);
    } else {
      setNextIndex(next);
      setStage("phoneme-play");
    }
  }

  /** Handle mic button tap for word listening */
  const handleWordMicTap = useCallback(async () => {
    if (stage !== "word-listen") return;

    setMessage("Say the word!");
    cancelSpeech();

    const result = await srListenWord(word, wordAttempts.current);
    if (!mountedRef.current) return;

    if (result.matched) {
      setStage("word-correct");
    } else {
      wordAttempts.current += 1;
      if (wordAttempts.current >= 2) {
        setStage("word-skip");
      } else {
        setStage("word-incorrect");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, word]);

  /* =====================================================
   * TAP MODE — original flow (fallback)
   * ===================================================== */

  const handleTap = useCallback(
    async (index: number) => {
      if (stage !== "tapping") return;
      if (index !== nextIndex) return;

      setStates((prev) => {
        const next = [...prev];
        next[index] = "active";
        return next;
      });

      await speakPhoneme(phonemes[index]);

      const newNextIndex = index + 1;
      setNextIndex(newNextIndex);

      if (newNextIndex === phonemes.length && !blendingRef.current) {
        blendingRef.current = true;
        setTimeout(async () => {
          setStage("blending");
          setStates(phonemes.map(() => "blended"));

          await new Promise((r) => setTimeout(r, 600));
          await speakWord(word);

          setStage("reveal");
        }, 400);
      }
    },
    [stage, nextIndex, phonemes, word],
  );

  const handleConfirm = useCallback(() => {
    setStage("done");
    onComplete();
  }, [onComplete]);

  /* =====================================================
   * RENDER
   * ===================================================== */

  const isSpeechMode = useSpeech && stage !== "tapping" && stage !== "reveal";

  // Instruction text
  const instructionText = (() => {
    if (isSpeechMode) return message;
    if (stage === "tapping") return "Tap each sound!";
    if (stage === "blending") return "Slide them together...";
    if (stage === "reveal") return "Can you say it?";
    return "";
  })();

  // Mic button state for word phase
  const wordMicState = (() => {
    if (stage === "word-listen" && srListening) return "listening" as const;
    if (stage === "word-listen") return "idle" as const;
    if (stage === "word-correct") return "correct" as const;
    if (stage === "word-incorrect") return "incorrect" as const;
    return "disabled" as const;
  })();

  return (
    <div className="flex flex-col items-center gap-8 px-4">
      {/* Instruction text */}
      <p className="min-h-[2rem] text-center text-2xl font-semibold text-gray-700">
        {instructionText}
      </p>

      {/* Phoneme cards */}
      <div
        className="flex items-center justify-center"
        style={{
          gap:
            stage === "blending" ||
            stage === "word-play" ||
            stage === "word-listen" ||
            stage === "word-correct" ||
            stage === "word-incorrect" ||
            stage === "word-skip" ||
            stage === "reveal"
              ? 4
              : 20,
        }}
      >
        {phonemes.map((p, i) => (
          <PhonemeCard
            key={`${word}-${i}`}
            text={p}
            state={states[i]}
            onTap={() => handleTap(i)}
            index={i}
            total={phonemes.length}
          />
        ))}
      </div>

      {/* Tap-order hint (tap mode only) */}
      {stage === "tapping" && (
        <p className="text-lg text-gray-400">
          {nextIndex < phonemes.length ? (
            <>
              Tap{" "}
              <span className="font-bold text-purple-500">
                {phonemes[nextIndex]}
              </span>
            </>
          ) : (
            "Great!"
          )}
        </p>
      )}

      {/* Word phase (speech mode) — mic button + word display */}
      {(stage === "word-play" ||
        stage === "word-listen" ||
        stage === "word-correct" ||
        stage === "word-incorrect" ||
        stage === "word-skip") && (
        <div className="flex flex-col items-center gap-5">
          <span
            className="text-6xl font-extrabold text-purple-700"
            style={{
              animation: "popIn 0.4s cubic-bezier(.34,1.56,.64,1) forwards",
            }}
          >
            {word}
          </span>
          <MicButton
            state={wordMicState}
            onTap={handleWordMicTap}
            size="lg"
            label={
              stage === "word-listen" && !srListening
                ? "Tap to say the word!"
                : stage === "word-listen" && srListening
                  ? "Listening..."
                  : stage === "word-correct"
                    ? message
                    : stage === "word-incorrect"
                      ? message
                      : ""
            }
          />
        </div>
      )}

      {/* Reveal phase (tap mode fallback) */}
      {stage === "reveal" && (
        <div className="flex flex-col items-center gap-5 animate-in fade-in">
          <span
            className="text-6xl font-extrabold text-green-600"
            style={{
              animation: "popIn 0.4s cubic-bezier(.34,1.56,.64,1) forwards",
            }}
          >
            {word}
          </span>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-full bg-green-500 px-10 py-4 text-2xl font-bold text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            I can say it!
          </button>
        </div>
      )}

      {/* Inline keyframes for pop-in */}
      <style>{`
        @keyframes popIn {
          0%   { transform: scale(0); opacity: 0; }
          80%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
