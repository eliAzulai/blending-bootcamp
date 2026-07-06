"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WordMatchContent } from "@/lib/fixtures/student";
import type { SessionTracker } from "@/lib/tracker";
import {
  speakWord,
  speakSentence,
  speakPhoneme,
  cancelSpeech,
} from "@/lib/speech";
import { playChime, playClick } from "@/lib/sfx";
import { shuffle } from "@/lib/shuffle";

interface SoundHuntActivityProps {
  content: WordMatchContent;
  tracker: SessionTracker;
  onComplete: (result: { coinsEarned: number; durationSeconds: number }) => void;
}

const COINS_PER_ROUND = 2;

export default function SoundHuntActivity({
  content,
  tracker,
  onComplete,
}: SoundHuntActivityProps) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [wrongTries, setWrongTries] = useState(0);
  const [shakeWord, setShakeWord] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const startedAtRef = useRef(Date.now());
  const roundStartRef = useRef(Date.now());

  const round = content.rounds[roundIndex];
  const choices = useMemo(
    () => shuffle([round.target, ...round.distractors]),
    [round],
  );

  const sayPrompt = useCallback(async () => {
    cancelSpeech();
    if (content.promptKind === "starts_with" && round.sound) {
      await speakSentence("Which word starts with");
      await speakPhoneme(round.sound);
    } else {
      await speakSentence("Tap the word");
      await speakWord(round.target);
    }
  }, [content.promptKind, round]);

  useEffect(() => {
    roundStartRef.current = Date.now();
    setWrongTries(0);
    setSolved(false);
    void sayPrompt();
  }, [roundIndex, sayPrompt]);

  const handleTap = useCallback(
    async (word: string) => {
      if (solved) return;
      if (word === round.target) {
        setSolved(true);
        playChime();
        void speakWord(round.target);
        const duration = Math.round(
          (Date.now() - roundStartRef.current) / 1000,
        );
        await tracker.recordAttempt({
          activityType: "phonics",
          format: "sound_hunt",
          contentRef: `${content.id}:${round.target}`,
          score: Math.max(0, 100 - 40 * wrongTries),
          durationSeconds: duration,
        });
        setTimeout(() => {
          const next = roundIndex + 1;
          if (next >= content.rounds.length) {
            onComplete({
              coinsEarned: content.rounds.length * COINS_PER_ROUND,
              durationSeconds: Math.round(
                (Date.now() - startedAtRef.current) / 1000,
              ),
            });
          } else {
            setRoundIndex(next);
          }
        }, 1100);
      } else {
        playClick();
        setWrongTries((n) => n + 1);
        setShakeWord(word);
        setTimeout(() => setShakeWord(null), 450);
        // Speak the word they actually tapped — instructive, not punitive (R25).
        void speakWord(word);
      }
    },
    [solved, round, roundIndex, wrongTries, content, tracker, onComplete],
  );

  return (
    <div className="flex flex-col items-center gap-8 px-4 py-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Round {roundIndex + 1} of {content.rounds.length}
        </p>
        <p className="mt-1 text-lg font-bold text-gray-700">{content.title}</p>
      </div>

      <button
        onClick={() => void sayPrompt()}
        className="flex min-h-12 items-center gap-2 rounded-2xl bg-purple-100 px-6 py-4 text-xl font-bold text-purple-700 shadow-sm hover:bg-purple-200 active:scale-95 transition-transform"
        aria-label="Hear it again"
      >
        🔊 Hear it again
      </button>

      <div className="grid w-full max-w-sm grid-cols-1 gap-4">
        {choices.map((word) => {
          const isTarget = word === round.target;
          const showCorrect = solved && isTarget;
          return (
            <button
              key={word}
              onClick={() => void handleTap(word)}
              disabled={solved}
              className={`min-h-16 rounded-2xl border-2 px-6 py-4 text-3xl font-bold transition-colors ${
                showCorrect
                  ? "tile-pop border-green-400 bg-green-50 text-green-700"
                  : "border-purple-200 bg-white text-gray-800 hover:bg-purple-50"
              } ${shakeWord === word ? "animate-shake" : ""}`}
            >
              {word}
            </button>
          );
        })}
      </div>

      {solved && (
        <p className="text-2xl font-extrabold text-green-600">⭐ Yes!</p>
      )}
    </div>
  );
}
