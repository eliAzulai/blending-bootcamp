"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { speakWord } from "@/lib/speech";
import type { PhonicsContent } from "@/lib/fixtures/student";
import type { SessionTracker } from "@/lib/tracker";

interface SpellingActivityProps {
  content: PhonicsContent;
  tracker: SessionTracker;
  onComplete: (result: { wordsCompleted: number; coinsEarned: number; durationSeconds: number }) => void;
}

const COINS_PER_WORD = 2;

type Stage = "playing" | "checking-correct" | "checking-wrong" | "done";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface TrayLetter {
  letter: string;
  id: number; // unique even when the same letter appears twice
  used: boolean;
}

export default function SpellingActivity({
  content,
  tracker,
  onComplete,
}: SpellingActivityProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [slots, setSlots] = useState<(TrayLetter | null)[]>([]);
  const [tray, setTray] = useState<TrayLetter[]>([]);
  const [stage, setStage] = useState<Stage>("playing");
  const [attemptCount, setAttemptCount] = useState(0);
  const startedAtRef = useRef<number>(0);
  const wordStartRef = useRef<number>(0);

  const currentWord = content.words[wordIndex]?.word ?? "";

  // Reset slots/tray whenever the word changes
  useEffect(() => {
    if (startedAtRef.current === 0) startedAtRef.current = Date.now();
    wordStartRef.current = Date.now();
    const letters = currentWord.split("").map((letter, i) => ({
      letter,
      id: i,
      used: false,
    }));
    setSlots(currentWord.split("").map(() => null));
    setTray(shuffle(letters));
    setStage("playing");
    setAttemptCount(0);

    // Auto-play the word so the kid hears it
    speakWord(currentWord);
  }, [currentWord]);

  const handleHearAgain = useCallback(() => {
    speakWord(currentWord);
  }, [currentWord]);

  const handleTrayTap = useCallback(
    (id: number) => {
      if (stage !== "playing") return;
      const letter = tray.find((t) => t.id === id);
      if (!letter || letter.used) return;
      const nextSlotIndex = slots.findIndex((s) => s === null);
      if (nextSlotIndex === -1) return;

      setTray((prev) => prev.map((t) => (t.id === id ? { ...t, used: true } : t)));
      setSlots((prev) => {
        const next = [...prev];
        next[nextSlotIndex] = letter;
        return next;
      });
    },
    [stage, tray, slots],
  );

  const handleSlotTap = useCallback(
    (slotIndex: number) => {
      if (stage !== "playing") return;
      const placed = slots[slotIndex];
      if (!placed) return;
      setSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = null;
        return next;
      });
      setTray((prev) => prev.map((t) => (t.id === placed.id ? { ...t, used: false } : t)));
    },
    [stage, slots],
  );

  // Auto-check when all slots filled
  const allFilled = useMemo(() => slots.length > 0 && slots.every((s) => s !== null), [slots]);
  const guess = useMemo(
    () => slots.map((s) => s?.letter ?? "").join(""),
    [slots],
  );

  useEffect(() => {
    if (stage !== "playing" || !allFilled) return;
    const correct = guess === currentWord;
    setStage(correct ? "checking-correct" : "checking-wrong");
    setAttemptCount((n) => n + 1);
  }, [allFilled, guess, currentWord, stage]);

  // Handle stage transitions: correct → advance; wrong (first try) → retry; wrong (second) → reveal + advance
  useEffect(() => {
    if (stage !== "checking-correct" && stage !== "checking-wrong") return;
    let cancelled = false;

    (async () => {
      const wordDuration = Math.round((Date.now() - wordStartRef.current) / 1000);
      const score = stage === "checking-correct" ? 100 : Math.max(0, 100 - attemptCount * 50);

      // Only record on resolution (correct, or 2nd-attempt wrong reveal). 1st-attempt wrong → retry, no record yet.
      const isFinalForWord =
        stage === "checking-correct" || attemptCount >= 2;

      if (isFinalForWord) {
        await tracker.recordAttempt({
          activityType: "spelling",
          contentRef: `${content.id}:${currentWord}`,
          score,
          durationSeconds: wordDuration,
        });
      }

      const delay = stage === "checking-correct" ? 1100 : 1500;
      await new Promise((r) => setTimeout(r, delay));
      if (cancelled) return;

      if (stage === "checking-wrong" && attemptCount < 2) {
        // Reset slots/tray for retry
        const letters = currentWord.split("").map((letter, i) => ({
          letter,
          id: i,
          used: false,
        }));
        setSlots(currentWord.split("").map(() => null));
        setTray(shuffle(letters));
        setStage("playing");
        return;
      }

      const nextIndex = wordIndex + 1;
      if (nextIndex >= content.words.length) {
        const totalDuration = Math.round((Date.now() - startedAtRef.current) / 1000);
        const coinsEarned = content.words.length * COINS_PER_WORD;
        setStage("done");
        onComplete({
          wordsCompleted: content.words.length,
          coinsEarned,
          durationSeconds: totalDuration,
        });
      } else {
        setWordIndex(nextIndex);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const slotBg = (i: number): string => {
    if (stage === "checking-correct") return "bg-emerald-200 border-emerald-500";
    if (stage === "checking-wrong") {
      const correctLetter = currentWord[i];
      if (slots[i]?.letter === correctLetter) return "bg-emerald-200 border-emerald-500";
      return "bg-rose-200 border-rose-500 animate-card-wobble";
    }
    return slots[i] ? "bg-purple-100 border-purple-400" : "bg-white border-purple-200";
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-purple-500">
        Word {wordIndex + 1} of {content.words.length}
      </p>

      <button
        type="button"
        onClick={handleHearAgain}
        className="rounded-full bg-purple-100 px-6 py-3 text-lg font-bold text-purple-700 shadow-sm transition-transform hover:scale-105 active:scale-95"
      >
        🔊 Hear it again
      </button>

      {/* Slots */}
      <div className="flex items-center justify-center gap-2">
        {slots.map((slot, i) => (
          <button
            type="button"
            key={`slot-${i}`}
            onClick={() => handleSlotTap(i)}
            disabled={stage !== "playing" || !slot}
            className={`flex h-16 w-16 items-center justify-center rounded-2xl border-4 text-3xl font-extrabold transition-colors ${slotBg(i)}`}
            aria-label={slot ? `Slot ${i + 1}: ${slot.letter}` : `Empty slot ${i + 1}`}
          >
            {slot?.letter ?? ""}
          </button>
        ))}
      </div>

      {/* Tray */}
      <div className="flex items-center justify-center gap-2">
        {tray.map((t) => (
          <button
            type="button"
            key={`tray-${t.id}`}
            onClick={() => handleTrayTap(t.id)}
            disabled={t.used || stage !== "playing"}
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-2xl font-bold transition-all ${
              t.used
                ? "border-gray-200 bg-gray-100 text-gray-300"
                : "border-amber-400 bg-amber-200 text-amber-900 hover:scale-110 active:scale-95"
            }`}
          >
            {t.letter}
          </button>
        ))}
      </div>

      {stage === "checking-correct" && (
        <p className="inline-flex items-center justify-center gap-2 text-2xl font-extrabold text-emerald-600 animate-celebrate-msg">
          Yes!
          <span className="h-3 w-3 rounded-full bg-emerald-300 shadow-sm" aria-hidden />
        </p>
      )}
      {stage === "checking-wrong" && (
        <p className="text-xl font-bold text-rose-600 animate-fade-up">
          {attemptCount < 2 ? "Try again!" : `It's ${currentWord}!`}
        </p>
      )}
    </div>
  );
}
