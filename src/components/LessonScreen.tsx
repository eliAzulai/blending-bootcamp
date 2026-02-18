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
  const [showMicPrompt, setShowMicPrompt] = useState(false);
  const [micPromptDismissed, setMicPromptDismissed] = useState(false);

  // Timer
  const startTime = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Request mic permission on mount
  useEffect(() => {
    if (!speech.isSupported) return;
    if (speech.isPermissionGranted) {
      setSpeechEnabled(true);
      return;
    }
    // Show friendly mic prompt
    setShowMicPrompt(true);
  }, [speech.isSupported, speech.isPermissionGranted]);

  // Tick the timer every second while the lesson is in progress.
  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [finished]);

  const handleMicAllow = useCallback(async () => {
    const granted = await speech.requestPermission();
    setSpeechEnabled(granted);
    setShowMicPrompt(false);
    setMicPromptDismissed(true);
  }, [speech]);

  const handleMicSkip = useCallback(() => {
    setSpeechEnabled(false);
    setShowMicPrompt(false);
    setMicPromptDismissed(true);
  }, []);

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

  // Show mic permission prompt before starting the lesson
  if (showMicPrompt && !micPromptDismissed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#FFF8E1] via-white to-[#E8F5E9] px-6">
        <div className="flex max-w-sm flex-col items-center gap-6 rounded-3xl bg-white p-8 text-center shadow-xl">
          {/* Mic icon */}
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-12 w-12 text-purple-600"
            >
              <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
              <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V21h-2a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.07A7 7 0 0 0 19 11Z" />
            </svg>
          </div>

          <h2 className="text-2xl font-extrabold text-purple-700">
            Practice saying sounds!
          </h2>
          <p className="text-base text-gray-600">
            Want to use the microphone to practice saying letter sounds out loud?
          </p>

          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={handleMicAllow}
              className="rounded-xl bg-purple-600 px-6 py-3 text-lg font-bold text-white shadow-md transition-all hover:bg-purple-700 active:scale-95"
            >
              Yes, let&apos;s go!
            </button>
            <button
              type="button"
              onClick={handleMicSkip}
              className="rounded-xl bg-gray-100 px-6 py-3 text-base font-semibold text-gray-500 transition-all hover:bg-gray-200 active:scale-95"
            >
              No thanks, I&apos;ll tap instead
            </button>
          </div>
        </div>
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
