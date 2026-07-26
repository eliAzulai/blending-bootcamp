"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PetDisplay from "@/components/PetDisplay";
import { createAttemptRecorder } from "@/lib/tracker";
import { speakPhoneme, speakWord } from "@/lib/speech";
import type { HuntRound } from "@/lib/fixtures/letter-hunt";
import {
  HUNT_ALL_DONE_LINE,
  HUNT_CORRECT_LINE,
  HUNT_HEAR_SOUND_LABEL,
  HUNT_PROMPT,
  HUNT_ROUND_DONE_LINE,
  fillPetName,
} from "@/lib/child-copy";
import type { PetType, PetMood } from "@/types/database";

/**
 * Letter Hunt — onset-sound hunt (docs/mini-games/2026-07-06, Game A).
 * Post-practice play, pet-hosted. Formative: recognition scores are recorded
 * under activity_type='letter_hunt' (never 'phonics') and attach to today's
 * already-completed practice session (no new session rows).
 *
 * R13: the target is a SOUND — rendered as the glyph plus slashed teal /m/,
 * spoken via speakPhoneme (says "mmm", never the letter name). The per-picture
 * 🔊 hint speaks the picture's word only. Hints are opt-in (sound off by
 * default) and counted into content_ref.
 * R26 (practice surface): no idle animations; triggered feedback only.
 */

interface LetterHuntGameProps {
  studentId: string;
  petType: PetType;
  petName: string;
  petMood: PetMood;
  /** Today's completed practice session to attach attempts to (null = no tracking). */
  sessionId: string | null;
  rounds: HuntRound[];
}

export interface RoundResult {
  letter: string;
  score: number;
  hints: number;
  durationSeconds: number;
}

export default function LetterHuntGame({
  studentId,
  petType,
  petName,
  petMood,
  sessionId,
  rounds,
}: LetterHuntGameProps) {
  const router = useRouter();
  const [roundIndex, setRoundIndex] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const [recorder] = useState(() => createAttemptRecorder(studentId, sessionId));

  const handleRecord = (result: RoundResult) => {
    // Fire-and-forget: recording must never stall the child's play
    // (ensureSession is a no-op here; sessionId is pre-bound).
    void recorder.recordAttempt({
      activityType: "letter_hunt",
      contentRef: `letter-hunt:${result.letter}:hints=${result.hints}`,
      score: result.score,
      durationSeconds: result.durationSeconds,
    });
  };

  const handleNext = () => {
    if (roundIndex + 1 >= rounds.length) {
      setAllDone(true);
    } else {
      setRoundIndex(roundIndex + 1);
    }
  };

  if (allDone) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-amber-50 px-4 py-10">
        <PetDisplay
          petType={petType}
          petName={petName}
          mood="happy"
          size="lg"
          bouncing
        />
        <p className="text-center text-xl font-bold text-purple-700">
          {fillPetName(HUNT_ALL_DONE_LINE, petName)}
        </p>
        <button
          onClick={() => router.push("/student")}
          className="min-h-12 w-full max-w-xs rounded-2xl bg-purple-600 px-6 py-4 text-xl font-extrabold text-white shadow-lg hover:bg-purple-700 active:scale-95 transition-transform"
        >
          Back to Home 🏠
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-amber-50">
      {/* Header: home + progress */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => router.push("/student")}
          className="min-h-12 min-w-12 px-3 text-sm font-semibold text-gray-400 hover:text-gray-600"
        >
          ← Home
        </button>
        <p className="text-sm font-bold text-gray-500">
          {roundIndex + 1} / {rounds.length}
        </p>
        <div className="min-w-12" aria-hidden="true" />
      </div>

      {/* key remounts RoundView per round — per-round state resets by
          construction instead of setState-in-effect. */}
      <RoundView
        key={roundIndex}
        round={rounds[roundIndex]}
        petType={petType}
        petName={petName}
        petMood={petMood}
        isLast={roundIndex + 1 >= rounds.length}
        onRecord={handleRecord}
        onNext={handleNext}
      />
    </div>
  );
}

type ItemState = "idle" | "found" | "wrong";

interface RoundViewProps {
  round: HuntRound;
  petType: PetType;
  petName: string;
  petMood: PetMood;
  isLast: boolean;
  onRecord: (result: RoundResult) => void;
  onNext: () => void;
}

function RoundView({
  round,
  petType,
  petName,
  petMood,
  isLast,
  onRecord,
  onNext,
}: RoundViewProps) {
  const [itemStates, setItemStates] = useState<ItemState[]>(() =>
    Array(round.items.length).fill("idle"),
  );
  const [roundDone, setRoundDone] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const wrongTapsRef = useRef(0);
  const hintsRef = useRef(0);
  const startRef = useRef<number | null>(null);

  const foundCount = itemStates.filter((s) => s === "found").length;

  // Round start: stamp the timer and say the target sound once — the child
  // needs to hear what they are hunting for; picture words stay opt-in.
  useEffect(() => {
    startRef.current ??= Date.now();
    speakPhoneme(round.letter);
  }, [round.letter]);

  const handleItemTap = (index: number) => {
    if (roundDone || itemStates[index] !== "idle") return;
    const item = round.items[index];
    const isMatch = item.onset === round.letter;
    setItemStates((prev) => {
      const next = [...prev];
      next[index] = isMatch ? "found" : "wrong";
      return next;
    });
    if (isMatch) {
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 700);
      if (foundCount + 1 >= round.matchCount) {
        setTimeout(() => {
          const wrong = wrongTapsRef.current;
          onRecord({
            letter: round.letter,
            score: Math.round(
              (100 * round.matchCount) / (round.matchCount + wrong),
            ),
            hints: hintsRef.current,
            durationSeconds: Math.round(
              (Date.now() - (startRef.current ?? Date.now())) / 1000,
            ),
          });
          setRoundDone(true);
        }, 800);
      }
    } else {
      wrongTapsRef.current += 1;
    }
  };

  const handleHint = (index: number) => {
    hintsRef.current += 1;
    speakWord(round.items[index].word);
  };

  return (
    <div className="flex flex-1 flex-col items-center gap-5 px-4 pb-8">
      <div className="flex items-center gap-3">
        <PetDisplay petType={petType} petName={petName} mood={petMood} size="sm" />
        <div className="text-left">
          <p className="text-lg font-bold text-gray-700">
            {HUNT_PROMPT.replace("{count}", String(round.matchCount))}
          </p>
          {/* R13: glyph = letter, slashed teal = sound. */}
          <p className="text-4xl font-extrabold text-gray-800">
            {round.letter.toUpperCase()}{" "}
            <span className="text-teal-600">/{round.letter}/</span>
          </p>
        </div>
      </div>

      <button
        onClick={() => speakPhoneme(round.letter)}
        className="flex min-h-12 items-center gap-2 rounded-2xl bg-purple-100 px-6 py-3 text-lg font-bold text-purple-700 shadow-sm hover:bg-purple-200 active:scale-95 transition-transform"
      >
        🔊 {HUNT_HEAR_SOUND_LABEL}
      </button>

      <p className="min-h-6 text-center text-base font-semibold text-green-700">
        {roundDone
          ? fillPetName(HUNT_ROUND_DONE_LINE, petName)
          : celebrating
            ? HUNT_CORRECT_LINE
            : `${foundCount} of ${round.matchCount} found`}
      </p>

      {/* Picture field: static hunt. Every tappable is >=48px with 8px gaps
          (R19): emoji button 80px+, hint button 48px, stacked with gap-2. */}
      <div className="grid grid-cols-4 gap-2">
        {round.items.map((item, i) => {
          const state = itemStates[i] ?? "idle";
          return (
            <div key={item.word} className="flex flex-col gap-2">
              <button
                onClick={() => handleItemTap(i)}
                disabled={state !== "idle" || roundDone}
                aria-label={`Picture ${i + 1}`}
                className={`flex h-20 w-20 flex-col items-center justify-center rounded-2xl border-2 text-4xl transition-all sm:h-24 sm:w-24 ${
                  state === "found"
                    ? "border-green-400 bg-green-50"
                    : state === "wrong"
                      ? "border-orange-200 bg-orange-50 opacity-60"
                      : "border-gray-200 bg-white hover:border-purple-300 active:scale-95"
                }`}
              >
                <span aria-hidden="true">{item.emoji}</span>
                {state === "found" && (
                  <span className="text-sm font-bold text-green-700">✓</span>
                )}
                {state === "wrong" && (
                  <span className="text-sm font-bold text-orange-500">✗</span>
                )}
              </button>
              {/* Opt-in hint: speaks the picture's word (never a letter name). */}
              <button
                onClick={() => handleHint(i)}
                disabled={state !== "idle" || roundDone}
                aria-label={`Hear picture ${i + 1}`}
                className="flex min-h-12 w-20 items-center justify-center rounded-xl bg-purple-100 text-base shadow-sm hover:bg-purple-200 disabled:opacity-40 sm:w-24"
              >
                🔊
              </button>
            </div>
          );
        })}
      </div>

      {roundDone && (
        <button
          onClick={onNext}
          className="min-h-12 w-full max-w-xs rounded-2xl bg-teal-600 px-6 py-4 text-xl font-extrabold text-white shadow-lg hover:bg-teal-700 active:scale-95 transition-transform"
        >
          {isLast ? "Finish ⭐" : "Next round ➜"}
        </button>
      )}
    </div>
  );
}
