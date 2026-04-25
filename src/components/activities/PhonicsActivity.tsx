"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BlendingExercise from "@/components/BlendingExercise";
import type { PhonicsContent } from "@/lib/fixtures/student";
import type { SessionTracker } from "@/lib/tracker";

interface PhonicsActivityProps {
  content: PhonicsContent;
  tracker: SessionTracker;
  speechEnabled?: boolean;
  onComplete: (result: { wordsCompleted: number; coinsEarned: number; durationSeconds: number }) => void;
}

const COINS_PER_WORD = 2;

export default function PhonicsActivity({
  content,
  tracker,
  speechEnabled = false,
  onComplete,
}: PhonicsActivityProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const startedAtRef = useRef<number>(0);
  const wordStartRef = useRef<number>(0);

  useEffect(() => {
    if (startedAtRef.current === 0) {
      startedAtRef.current = Date.now();
    }
    wordStartRef.current = Date.now();
  }, [wordIndex]);

  const currentWord = content.words[wordIndex];

  const handleWordComplete = useCallback(async () => {
    const wordDuration = Math.round((Date.now() - wordStartRef.current) / 1000);
    await tracker.recordAttempt({
      activityType: "phonics",
      contentRef: `${content.id}:${currentWord.word}`,
      score: 100,
      durationSeconds: wordDuration,
    });

    const nextIndex = wordIndex + 1;
    if (nextIndex >= content.words.length) {
      const totalDuration = Math.round((Date.now() - startedAtRef.current) / 1000);
      const coinsEarned = content.words.length * COINS_PER_WORD;
      onComplete({
        wordsCompleted: content.words.length,
        coinsEarned,
        durationSeconds: totalDuration,
      });
    } else {
      setWordIndex(nextIndex);
    }
  }, [tracker, content, currentWord, wordIndex, onComplete]);

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-purple-500">
        Word {wordIndex + 1} of {content.words.length}
      </p>
      <BlendingExercise
        key={`${content.id}-${wordIndex}`}
        word={currentWord.word}
        phonemes={currentWord.phonemes}
        onComplete={handleWordComplete}
        speechEnabled={speechEnabled}
      />
    </div>
  );
}
