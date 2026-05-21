"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PetDisplay from "@/components/PetDisplay";
import {
  hintForAttempt,
  rewardForCorrectWord,
  snackForWord,
  type PetKitchenPetState,
  type KitchenSnack,
} from "@/lib/pet-kitchen";
import { DonutMark } from "@/components/ui/StickerMarks";
import { speakWord } from "@/lib/speech";
import type { PhonicsContent } from "@/lib/fixtures/student";
import type { PetMood, PetType } from "@/types/database";
import type { SessionTracker } from "@/lib/tracker";

interface PetKitchenSpellingActivityProps {
  content: PhonicsContent;
  tracker: SessionTracker;
  petType: PetType;
  petName: string;
  petMood: PetMood;
  startingCoins: number;
  onComplete: (result: { wordsCompleted: number; coinsEarned: number; durationSeconds: number }) => void;
}

type Stage = "playing" | "correct" | "retrying" | "revealing" | "done";

interface TrayLetter {
  letter: string;
  id: number;
  used: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeLetters(word: string): TrayLetter[] {
  return word.split("").map((letter, id) => ({ letter, id, used: false }));
}

export default function PetKitchenSpellingActivity({
  content,
  tracker,
  petType,
  petName,
  petMood,
  startingCoins,
  onComplete,
}: PetKitchenSpellingActivityProps) {
  const words = content.words;
  const firstWord = words[0]?.word ?? "";
  const [wordIndex, setWordIndex] = useState(0);
  const [slots, setSlots] = useState<(TrayLetter | null)[]>(() =>
    firstWord.split("").map(() => null),
  );
  const [tray, setTray] = useState<TrayLetter[]>(() => shuffle(makeLetters(firstWord)));
  const [stage, setStage] = useState<Stage>("playing");
  const [attemptCount, setAttemptCount] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [message, setMessage] = useState("Listen, then decorate the donut word.");
  const [petState, setPetState] = useState<PetKitchenPetState>("watching");
  const startedAtRef = useRef<number>(0);
  const wordStartRef = useRef<number>(0);
  const earnedCoinsRef = useRef(0);

  const currentWord = words[wordIndex]?.word ?? "";
  const snack = snackForWord(wordIndex);

  useEffect(() => {
    const now = Date.now();
    if (startedAtRef.current === 0) startedAtRef.current = now;
    wordStartRef.current = now;
    speakWord(currentWord);
  }, [currentWord]);

  const checkGuess = useCallback(
    (nextGuess: string, nextAttemptCount: number, word: string, wordSnack: KitchenSnack) => {
      setAttemptCount(nextAttemptCount);

      if (nextGuess === word) {
        const reward = rewardForCorrectWord(nextAttemptCount, wordSnack);
        setStage("correct");
        setMessage(`${reward.message} +${reward.coins} coins`);
        setPetState(reward.petState);
        setEarnedCoins((coins) => {
          const next = coins + reward.coins;
          earnedCoinsRef.current = next;
          return next;
        });
        return;
      }

      if (nextAttemptCount >= 2) {
        setStage("revealing");
        setMessage(`It is ${word}. Let's decorate the next donut.`);
        setPetState("encouraging");
        return;
      }

      setStage("retrying");
      setMessage(hintForAttempt(word, nextGuess));
      setPetState("encouraging");
    },
    [],
  );

  const handleHearAgain = useCallback(() => {
    speakWord(currentWord);
    setPetState("sniffing");
  }, [currentWord]);

  const handleTrayTap = useCallback(
    (id: number) => {
      if (stage !== "playing") return;
      const letter = tray.find((item) => item.id === id);
      if (!letter || letter.used) return;
      const nextSlotIndex = slots.findIndex((slot) => slot === null);
      if (nextSlotIndex === -1) return;

      const nextSlots = [...slots];
      nextSlots[nextSlotIndex] = letter;
      const nextGuess = nextSlots.map((slot) => slot?.letter ?? "").join("");

      setPetState("sniffing");
      setTray((prev) => prev.map((item) => (item.id === id ? { ...item, used: true } : item)));
      setSlots(nextSlots);

      if (nextSlots.every(Boolean)) {
        checkGuess(nextGuess, attemptCount + 1, currentWord, snack);
      }
    },
    [attemptCount, checkGuess, currentWord, slots, snack, stage, tray],
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
      setTray((prev) => prev.map((item) => (item.id === placed.id ? { ...item, used: false } : item)));
      setPetState("watching");
    },
    [slots, stage],
  );

  useEffect(() => {
    if (stage !== "correct" && stage !== "retrying" && stage !== "revealing") return;
    let cancelled = false;

    async function resolveStage() {
      if (stage === "retrying") {
        await new Promise((resolve) => setTimeout(resolve, 1100));
        if (cancelled) return;
        setSlots(currentWord.split("").map(() => null));
        setTray(shuffle(makeLetters(currentWord)));
        setStage("playing");
        setPetState("watching");
        return;
      }

      const wordDuration = Math.round((Date.now() - wordStartRef.current) / 1000);
      const score = stage === "correct" ? (attemptCount <= 1 ? 100 : 75) : 25;
      await tracker.recordAttempt({
        activityType: "spelling",
        contentRef: `${content.id}:${currentWord}`,
        score,
        durationSeconds: wordDuration,
      });

      await new Promise((resolve) => setTimeout(resolve, stage === "correct" ? 1300 : 1500));
      if (cancelled) return;

      const nextIndex = wordIndex + 1;
      if (nextIndex >= words.length) {
        const totalDuration = Math.round((Date.now() - startedAtRef.current) / 1000);
        setStage("done");
        setPetState("full");
        onComplete({
          wordsCompleted: words.length,
          coinsEarned: earnedCoinsRef.current,
          durationSeconds: totalDuration,
        });
        return;
      }

      const nextWord = words[nextIndex]?.word ?? "";
      wordStartRef.current = Date.now();
      setSlots(nextWord.split("").map(() => null));
      setTray(shuffle(makeLetters(nextWord)));
      setStage("playing");
      setAttemptCount(0);
      setMessage("Listen, then decorate the donut word.");
      setPetState("watching");
      setWordIndex(nextIndex);
    }

    resolveStage();
    return () => {
      cancelled = true;
    };
  }, [attemptCount, content.id, currentWord, onComplete, stage, tracker, wordIndex, words]);

  const slotClass = (index: number): string => {
    if (stage === "correct") return "border-emerald-500 bg-emerald-100";
    if (stage === "retrying" || stage === "revealing") {
      return slots[index]?.letter === currentWord[index]
        ? "border-emerald-500 bg-emerald-100"
        : "border-rose-500 bg-rose-100 animate-card-wobble";
    }
    return slots[index] ? "border-purple-400 bg-purple-100" : "border-purple-200 bg-white";
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] items-center gap-4">
        <PetDisplay
          petType={petType}
          petName={petName}
          mood={petMood}
          coins={startingCoins + earnedCoins}
          size="sm"
          kitchenState={petState}
        />
        <div className="min-w-0 rounded-3xl bg-white px-5 py-6 text-right shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-purple-500">
            Donut {wordIndex + 1} of {words.length}
          </p>
          <p className="mt-1 text-lg font-extrabold text-gray-800">{message}</p>
        </div>
      </section>

      <section className="rounded-3xl bg-amber-100 px-5 py-7 shadow-inner">
        <div className="mb-5 flex items-center justify-center gap-3 text-6xl" aria-live="polite">
          <DonutMark
            size="lg"
            icingColor={snack.icingColor}
            sprinkleColor={snack.sprinkleColor}
            className={stage === "correct" ? "animate-bounce-in" : ""}
          />
          <span className="h-3 w-3 rounded-full bg-amber-300 shadow-sm" aria-hidden />
        </div>

        <div className="flex items-center justify-center gap-2">
          {slots.map((slot, index) => (
            <button
              type="button"
              key={`slot-${index}`}
              onClick={() => handleSlotTap(index)}
              disabled={stage !== "playing" || !slot}
              className={`flex h-16 w-16 items-center justify-center rounded-2xl border-4 text-3xl font-extrabold transition-colors ${slotClass(index)}`}
              aria-label={slot ? `Remove ${slot.letter}` : `Empty letter slot ${index + 1}`}
            >
              {slot?.letter ?? ""}
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={handleHearAgain}
        className="rounded-full bg-purple-100 px-6 py-3 text-lg font-bold text-purple-700 shadow-sm transition-transform hover:scale-105 active:scale-95"
      >
        Hear it again
      </button>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {tray.map((letter) => (
          <button
            type="button"
            key={`ingredient-${letter.id}`}
            onClick={() => handleTrayTap(letter.id)}
            disabled={letter.used || stage !== "playing"}
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-2xl font-bold transition-all ${
              letter.used
                ? "border-gray-200 bg-gray-100 text-gray-300"
                : "border-amber-400 bg-white text-amber-900 shadow-sm hover:scale-110 active:scale-95"
            }`}
          >
            {letter.letter}
          </button>
        ))}
      </div>
    </div>
  );
}
