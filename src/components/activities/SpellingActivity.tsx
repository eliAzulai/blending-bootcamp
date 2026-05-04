"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SpellingContent } from "@/lib/fixtures/student";
import type { SessionTracker } from "@/lib/tracker";
import { speakWord } from "@/lib/speech";

interface SpellingActivityProps {
  content: SpellingContent;
  tracker: SessionTracker;
  onComplete: (result: { wordsCompleted: number; coinsEarned: number; durationSeconds: number }) => void;
}

const COINS_PER_WORD = 3;
const MAX_ATTEMPTS = 3;

type WordState = "idle" | "listening" | "correct" | "wrong" | "revealed";

export default function SpellingActivity({
  content,
  tracker,
  onComplete,
}: SpellingActivityProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [input, setInput] = useState("");
  const [state, setState] = useState<WordState>("idle");
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const startedAtRef = useRef<number>(Date.now());
  const wordStartRef = useRef<number>(Date.now());

  const currentWord = content.words[wordIndex];

  useEffect(() => {
    wordStartRef.current = Date.now();
    setState("idle");
    setInput("");
    setAttempts(0);
    inputRef.current?.focus();
  }, [wordIndex]);

  const sayWord = useCallback(() => {
    speakWord(currentWord.audioHint ?? currentWord.word);
  }, [currentWord]);

  useEffect(() => {
    sayWord();
  }, [wordIndex, sayWord]);

  const advance = useCallback(
    async (score: number) => {
      const wordDuration = Math.round((Date.now() - wordStartRef.current) / 1000);
      await tracker.recordAttempt({
        activityType: "spelling",
        contentRef: `${content.id}:${currentWord.word}`,
        score,
        durationSeconds: wordDuration,
      });

      const nextIndex = wordIndex + 1;
      if (nextIndex >= content.words.length) {
        const totalDuration = Math.round((Date.now() - startedAtRef.current) / 1000);
        onComplete({
          wordsCompleted: content.words.length,
          coinsEarned: content.words.length * COINS_PER_WORD,
          durationSeconds: totalDuration,
        });
      } else {
        setWordIndex(nextIndex);
      }
    },
    [tracker, content, currentWord, wordIndex, onComplete],
  );

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;

    if (trimmed === currentWord.word.toLowerCase()) {
      setState("correct");
      setTimeout(() => advance(100), 900);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShake(true);
      setTimeout(() => setShake(false), 400);

      if (newAttempts >= MAX_ATTEMPTS) {
        setState("revealed");
        setTimeout(() => advance(0), 1800);
      } else {
        setState("wrong");
        setInput("");
        setTimeout(() => {
          setState("idle");
          inputRef.current?.focus();
        }, 600);
      }
    }
  }, [input, currentWord, attempts, advance]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const letterBoxes = currentWord.word.split("").map((letter, i) => {
    const typedChar = input[i];
    const revealed = state === "revealed" || state === "correct";
    return (
      <div
        key={i}
        className={`flex h-14 w-12 items-center justify-center rounded-xl border-2 text-2xl font-bold transition-all ${
          revealed
            ? state === "correct"
              ? "border-green-400 bg-green-50 text-green-700"
              : "border-orange-300 bg-orange-50 text-orange-700"
            : typedChar
              ? "border-purple-400 bg-purple-50 text-purple-800"
              : "border-gray-200 bg-white text-gray-400"
        }`}
      >
        {revealed ? letter.toUpperCase() : (typedChar?.toUpperCase() ?? "_")}
      </div>
    );
  });

  return (
    <div className="flex flex-col items-center gap-8 px-4 py-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Word {wordIndex + 1} of {content.words.length}
        </p>
        <p className="mt-1 text-lg font-bold text-gray-700">{content.title}</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={sayWord}
          className="flex items-center gap-2 rounded-2xl bg-purple-100 px-6 py-4 text-xl font-bold text-purple-700 shadow-sm hover:bg-purple-200 active:scale-95 transition-transform"
          aria-label="Hear the word again"
        >
          🔊 Hear the word
        </button>
        <p className="text-sm text-gray-400">
          {attempts < MAX_ATTEMPTS
            ? `${MAX_ATTEMPTS - attempts} tries left`
            : "Let's see the answer!"}
        </p>
      </div>

      <div className={`flex gap-2 ${shake ? "animate-shake" : ""}`}>
        {letterBoxes}
      </div>

      {state === "correct" && (
        <div className="text-center text-3xl font-extrabold text-green-600 animate-bounce">
          ⭐ Correct!
        </div>
      )}

      {state === "revealed" && (
        <div className="text-center">
          <p className="text-lg font-bold text-orange-600">
            The word was: <span className="text-purple-700">{currentWord.word}</span>
          </p>
        </div>
      )}

      {state !== "correct" && state !== "revealed" && (
        <div className="w-full max-w-xs space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/[^a-zA-Z]/g, ""))}
            onKeyDown={handleKeyDown}
            maxLength={currentWord.word.length + 2}
            placeholder="Type the word..."
            className={`w-full rounded-2xl border-2 px-5 py-4 text-center text-xl font-bold outline-none transition-colors ${
              state === "wrong"
                ? "border-red-400 bg-red-50 text-red-700"
                : "border-purple-300 bg-white text-gray-800 focus:border-purple-500"
            }`}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="w-full rounded-2xl bg-purple-600 px-6 py-4 text-xl font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-40 active:scale-95 transition-transform"
          >
            Check ✓
          </button>
        </div>
      )}
    </div>
  );
}
