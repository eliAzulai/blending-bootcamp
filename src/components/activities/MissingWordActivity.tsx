"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClozeContent } from "@/lib/fixtures/student";
import type { SessionTracker } from "@/lib/tracker";
import { speakWord, speakSentence } from "@/lib/speech";
import { useTileDrag } from "@/hooks/useTileDrag";
import { playChime, playClick } from "@/lib/sfx";
import { shuffle } from "@/lib/shuffle";

interface MissingWordActivityProps {
  content: ClozeContent;
  /** Which focus-area slot this game is filling (phonics or spelling). */
  area: "phonics" | "spelling";
  tracker: SessionTracker;
  onComplete: (result: { coinsEarned: number; durationSeconds: number }) => void;
}

const COINS_PER_SENTENCE = 3;

export default function MissingWordActivity({
  content,
  area,
  tracker,
  onComplete,
}: MissingWordActivityProps) {
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [wrongTries, setWrongTries] = useState(0);
  const [shakeTile, setShakeTile] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const startedAtRef = useRef<number>(0);
  const sentenceStartRef = useRef<number>(0);

  const sentence = content.sentences[sentenceIndex];
  const [before, after] = useMemo(
    () => sentence.text.split("___"),
    [sentence],
  );
  const choices = useMemo(
    () => shuffle([sentence.answer, ...sentence.distractors]),
    [sentence],
  );

  useEffect(() => {
    const now = Date.now();
    if (startedAtRef.current === 0) startedAtRef.current = now;
    sentenceStartRef.current = now;
  }, [sentenceIndex]);

  const tryWord = useCallback(
    async (word: string) => {
      if (solved) return;
      if (word === sentence.answer) {
        setSolved(true);
        playChime();
        // The reward: hear the sentence you built, read back in full.
        void speakSentence(sentence.text.replace("___", sentence.answer));
        const duration = Math.round(
          (Date.now() - sentenceStartRef.current) / 1000,
        );
        await tracker.recordAttempt({
          activityType: area,
          format: "missing_word",
          contentRef: `${content.id}:${sentence.answer}`,
          score: Math.max(0, 100 - 40 * wrongTries),
          durationSeconds: duration,
        });
        setTimeout(() => {
          const next = sentenceIndex + 1;
          if (next >= content.sentences.length) {
            onComplete({
              coinsEarned: content.sentences.length * COINS_PER_SENTENCE,
              durationSeconds: Math.round(
                (Date.now() - startedAtRef.current) / 1000,
              ),
            });
          } else {
            setWrongTries(0);
            setSolved(false);
            setSentenceIndex(next);
          }
        }, 2400);
      } else {
        playClick();
        setWrongTries((n) => n + 1);
        setShakeTile(word);
        setTimeout(() => setShakeTile(null), 450);
        void speakWord(word);
      }
    },
    [solved, sentence, sentenceIndex, wrongTries, area, content, tracker, onComplete],
  );

  const handleDrop = useCallback(
    (tileId: string, zoneId: string | null, moved: boolean) => {
      // Drag to the gap, or plain tap — both count as trying the word.
      if (!moved || zoneId === "gap") void tryWord(tileId);
    },
    [tryWord],
  );

  const { tileProps, zoneRef } = useTileDrag({ onDrop: handleDrop });

  return (
    <div className="flex flex-col items-center gap-8 px-4 py-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Sentence {sentenceIndex + 1} of {content.sentences.length}
        </p>
        <p className="mt-1 text-lg font-bold text-gray-700">{content.title}</p>
      </div>

      {/* Sentence with the gap (R21 passage typography via .passage) */}
      <p className="passage text-2xl font-bold leading-relaxed text-gray-800">
        {before}
        <span
          ref={zoneRef("gap")}
          className={`mx-1 inline-flex h-12 min-w-24 items-center justify-center rounded-xl border-2 px-3 align-middle ${
            solved
              ? "tile-pop border-green-400 bg-green-50 text-green-700"
              : "border-dashed border-purple-300 bg-purple-50/50"
          }`}
        >
          {solved ? sentence.answer : " "}
        </span>
        {after}
      </p>

      {solved && (
        <p className="text-2xl font-extrabold text-green-600">⭐ Yes!</p>
      )}

      {/* Word choices — tile ids are the words themselves (unique per round) */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {choices.map((word) => {
          const hidden = solved && word === sentence.answer;
          return (
            <button
              key={word}
              {...tileProps(word)}
              disabled={solved}
              className={`min-h-14 rounded-2xl border-2 border-purple-200 bg-white px-6 py-3 text-2xl font-bold text-gray-800 shadow-sm ${
                hidden ? "invisible" : ""
              } ${shakeTile === word ? "animate-shake" : ""}`}
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
}
