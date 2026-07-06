"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SpellingContent } from "@/lib/fixtures/student";
import type { SessionTracker } from "@/lib/tracker";
import { speakWord } from "@/lib/speech";
import { useTileDrag } from "@/hooks/useTileDrag";
import { playChime, playClick, playPop } from "@/lib/sfx";
import { shuffle } from "@/lib/shuffle";

interface WordBuilderActivityProps {
  content: SpellingContent;
  /** SpellingContent.difficulty passed through; "advanced" adds distractor letters. */
  difficulty?: string;
  tracker: SessionTracker;
  onComplete: (result: { coinsEarned: number; durationSeconds: number }) => void;
}

const COINS_PER_WORD = 3;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

interface Tile {
  id: string;
  letter: string;
}

function makeTiles(word: string, withDistractors: boolean): Tile[] {
  const letters = word.toLowerCase().split("");
  if (withDistractors) {
    const pool = ALPHABET.filter((l) => !letters.includes(l));
    letters.push(...shuffle(pool).slice(0, 2));
  }
  return shuffle(letters.map((letter, i) => ({ id: `t${i}-${letter}`, letter })));
}

export default function WordBuilderActivity({
  content,
  difficulty,
  tracker,
  onComplete,
}: WordBuilderActivityProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const currentWord = content.words[wordIndex];
  const word = currentWord.word.toLowerCase();

  const tiles = useMemo(
    () => makeTiles(word, difficulty === "advanced"),
    [word, difficulty],
  );

  // placed[i] = tile id occupying slot i (or null); locked[i] = confirmed correct.
  const [placed, setPlaced] = useState<(string | null)[]>(() =>
    Array(word.length).fill(null),
  );
  const [locked, setLocked] = useState<boolean[]>(() =>
    Array(word.length).fill(false),
  );
  const [shakeSlots, setShakeSlots] = useState<number[]>([]);
  const [wrongChecks, setWrongChecks] = useState(0);
  const [done, setDone] = useState(false);
  const startedAtRef = useRef<number>(0);
  const wordStartRef = useRef<number>(0);

  useEffect(() => {
    setPlaced(Array(word.length).fill(null));
    setLocked(Array(word.length).fill(false));
    setShakeSlots([]);
    setWrongChecks(0);
    setDone(false);
    const now = Date.now();
    if (startedAtRef.current === 0) startedAtRef.current = now;
    wordStartRef.current = now;
    void speakWord(currentWord.audioHint ?? currentWord.word);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordIndex]);

  const tileById = useCallback(
    (id: string) => tiles.find((t) => t.id === id),
    [tiles],
  );

  const placeTile = useCallback(
    (tileId: string, slotIdx: number) => {
      setPlaced((prev) => {
        if (prev[slotIdx] !== null || locked[slotIdx]) return prev;
        const next = prev.map((p) => (p === tileId ? null : p));
        next[slotIdx] = tileId;
        playPop();
        return next;
      });
    },
    [locked],
  );

  const returnTile = useCallback(
    (tileId: string) => {
      setPlaced((prev) => {
        const idx = prev.indexOf(tileId);
        if (idx === -1 || locked[idx]) return prev;
        const next = [...prev];
        next[idx] = null;
        return next;
      });
    },
    [locked],
  );

  const handleDrop = useCallback(
    (tileId: string, zoneId: string | null, moved: boolean) => {
      if (done) return;
      const isPlaced = placed.includes(tileId);
      if (!moved) {
        // Tap: placed tile goes back to the tray; tray tile fills first empty slot.
        if (isPlaced) {
          returnTile(tileId);
        } else {
          const firstEmpty = placed.findIndex((p, i) => p === null && !locked[i]);
          if (firstEmpty !== -1) placeTile(tileId, firstEmpty);
        }
        return;
      }
      if (zoneId?.startsWith("slot-")) {
        placeTile(tileId, Number(zoneId.slice(5)));
      } else if (isPlaced) {
        returnTile(tileId);
      }
    },
    [done, placed, locked, placeTile, returnTile],
  );

  const { tileProps, zoneRef } = useTileDrag({ onDrop: handleDrop });

  // Auto-check when every slot is filled.
  useEffect(() => {
    if (done || placed.some((p) => p === null)) return;
    const built = placed.map((id) => tileById(id!)?.letter ?? "");
    if (built.join("") === word) {
      setDone(true);
      setLocked(Array(word.length).fill(true));
      playChime();
      void speakWord(currentWord.audioHint ?? currentWord.word);
      const duration = Math.round((Date.now() - wordStartRef.current) / 1000);
      void tracker.recordAttempt({
        activityType: "spelling",
        format: "word_builder",
        contentRef: `${content.id}:${currentWord.word}`,
        score: Math.max(0, 100 - 40 * wrongChecks),
        durationSeconds: duration,
      });
      setTimeout(() => {
        const next = wordIndex + 1;
        if (next >= content.words.length) {
          onComplete({
            coinsEarned: content.words.length * COINS_PER_WORD,
            durationSeconds: Math.round(
              (Date.now() - startedAtRef.current) / 1000,
            ),
          });
        } else {
          setWordIndex(next);
        }
      }, 1300);
    } else {
      // Lock correct positions, bounce the wrong ones back to the tray.
      setWrongChecks((n) => n + 1);
      playClick();
      const wrongIdx = placed
        .map((id, i) => (tileById(id!)?.letter === word[i] ? -1 : i))
        .filter((i) => i !== -1);
      setShakeSlots(wrongIdx);
      setLocked((prev) => prev.map((l, i) => l || !wrongIdx.includes(i)));
      setTimeout(() => {
        setShakeSlots([]);
        setPlaced((prev) =>
          prev.map((id, i) => (wrongIdx.includes(i) ? null : id)),
        );
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed, done]);

  const trayTiles = tiles.filter((t) => !placed.includes(t.id));

  return (
    <div className="flex flex-col items-center gap-8 px-4 py-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Word {wordIndex + 1} of {content.words.length}
        </p>
        <p className="mt-1 text-lg font-bold text-gray-700">{content.title}</p>
      </div>

      <button
        onClick={() => void speakWord(currentWord.audioHint ?? currentWord.word)}
        className="flex min-h-12 items-center gap-2 rounded-2xl bg-purple-100 px-6 py-4 text-xl font-bold text-purple-700 shadow-sm hover:bg-purple-200 active:scale-95 transition-transform"
        aria-label="Hear the word again"
      >
        🔊 Hear the word
      </button>

      {/* Slots */}
      <div className="flex gap-2">
        {placed.map((tileId, i) => {
          const tile = tileId ? tileById(tileId) : null;
          return (
            <div
              key={i}
              ref={zoneRef(`slot-${i}`)}
              className={`flex h-16 w-14 items-center justify-center rounded-xl border-2 text-3xl font-bold ${
                done
                  ? "tile-pop border-green-400 bg-green-50 text-green-700"
                  : locked[i]
                    ? "border-green-400 bg-green-50 text-green-700"
                    : tile
                      ? "border-purple-400 bg-purple-50 text-purple-800"
                      : "border-dashed border-gray-300 bg-white"
              } ${shakeSlots.includes(i) ? "animate-shake" : ""}`}
            >
              {tile ? (
                locked[i] || done ? (
                  <span>{tile.letter}</span>
                ) : (
                  <button {...tileProps(tile.id)} className="h-full w-full">
                    {tile.letter}
                  </button>
                )
              ) : null}
            </div>
          );
        })}
      </div>

      {done && (
        <p className="text-2xl font-extrabold text-green-600">⭐ You built it!</p>
      )}

      {/* Tray */}
      <div
        ref={zoneRef("tray")}
        className="flex min-h-20 flex-wrap items-center justify-center gap-3 rounded-3xl bg-amber-100/60 px-6 py-4"
      >
        {trayTiles.map((tile) => (
          <button
            key={tile.id}
            {...tileProps(tile.id)}
            className="flex h-16 w-14 items-center justify-center rounded-xl border-2 border-amber-300 bg-white text-3xl font-bold text-gray-800 shadow-sm"
          >
            {tile.letter}
          </button>
        ))}
      </div>
    </div>
  );
}
