"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lesson } from "@/types/lesson";
import { markDayComplete } from "@/lib/progress";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import BlendingExercise from "./BlendingExercise";
import CelebrationScreen from "./CelebrationScreen";
import ProgressBar from "./ProgressBar";

interface LessonScreenProps {
  lesson: Lesson;
}

/**
 * Full lesson wrapper.
 *
 * - Requests mic permission on mount (speech recognition).
 * - Displays lesson title and progress bar.
 * - Iterates through words, rendering a BlendingExercise for each.
 * - Tracks elapsed time.
 * - On completion, marks the day complete in localStorage and shows CelebrationScreen.
 */
export default function LessonScreen({ lesson }: LessonScreenProps) {
  const { day, title, words } = lesson;
  const totalWords = words.length;

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  // Speech recognition setup
  const speech = useSpeechRecognition();
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [micResolved, setMicResolved] = useState(false);

  // Timer
  const startTime = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Auto-request mic permission on mount — wait for result before showing lesson
  useEffect(() => {
    if (!speech.isSupported) {
      console.log("[WordPets] SR not supported, using tap mode");
      setMicResolved(true);
      return;
    }
    let cancelled = false;
    (async () => {
      console.log("[WordPets] Requesting mic permission...");
      const granted = await speech.requestPermission();
      console.log("[WordPets] Mic permission result:", granted);
      if (!cancelled) {
        setSpeechEnabled(granted);
        setMicResolved(true);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tick the timer every second while the lesson is in progress.
  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [finished]);

  /** Called when the child completes a single word exercise. */
  const handleWordComplete = useCallback(() => {
    const next = currentWordIndex + 1;
    if (next >= totalWords) {
      setFinished(true);
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
      markDayComplete(day, totalWords);
    } else {
      setCurrentWordIndex(next);
    }
  }, [currentWordIndex, totalWords, day]);

  /** Navigate home after celebration. */
  const handleContinue = useCallback(() => {
    window.location.href = "/";
  }, []);

  if (finished) {
    return (
      <CelebrationScreen
        wordsBlended={totalWords}
        elapsedSeconds={elapsed}
        onContinue={handleContinue}
      />
    );
  }

  // Wait for mic permission to resolve before rendering lesson
  if (!micResolved) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#FFF8E1] via-white to-[#E8F5E9]">
        <p className="text-xl font-bold text-purple-600 animate-pulse">Getting ready...</p>
      </div>
    );
  }

  const currentWord = words[currentWordIndex];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#FFF8E1] via-white to-[#E8F5E9]">
      {/* Header */}
      <header className="flex flex-col items-center gap-3 px-4 pt-6 pb-2">
        <div className="flex w-full max-w-md items-center justify-between">
          <a
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow transition-transform hover:scale-110"
            aria-label="Go home"
          >
            &#8592;
          </a>
          <div className="flex items-center gap-2">
            {speechEnabled && (
              <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700">
                Mic On
              </span>
            )}
            <span className="rounded-full bg-purple-100 px-4 py-1 text-base font-bold text-purple-700">
              Day {day}
            </span>
          </div>
        </div>
        <h1 className="text-center text-3xl font-extrabold text-purple-700">
          {title}
        </h1>
      </header>

      {/* Progress */}
      <div className="mx-auto w-full max-w-md px-4 py-3">
        <ProgressBar current={currentWordIndex} total={totalWords} />
      </div>

      {/* Exercise */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-12">
        <BlendingExercise
          key={`${day}-${currentWordIndex}`}
          word={currentWord.word}
          phonemes={currentWord.phonemes}
          onComplete={handleWordComplete}
          speechEnabled={speechEnabled}
        />
      </main>
    </div>
  );
}
