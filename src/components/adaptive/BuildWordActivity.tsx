"use client";

import { useEffect, useState } from "react";
import { speakWord } from "@/lib/speech";
import type { ActivityResult } from "@/engine/types";
import type { BuildWordPayload } from "@/cartridges/reading/types";
import {
  initBuildWord,
  placeTile,
  clearSlot,
  checkWord,
  buildWordResult,
  type BuildWordState,
} from "@/cartridges/reading/build-word-logic";

interface Props {
  conceptId: string;
  payload: BuildWordPayload;
  onResult: (result: ActivityResult) => void;
}

export default function BuildWordActivity({ conceptId, payload, onResult }: Props) {
  const [state, setState] = useState<BuildWordState>(() => initBuildWord(payload.word));
  const [shake, setShake] = useState(false);
  const [solved, setSolved] = useState(false);

  // B1: speak the word once on start.
  useEffect(() => {
    speakWord(payload.word).catch(() => {});
  }, [payload.word]);

  const allFilled = state.slots.every((s) => s !== null);

  function handleCheck() {
    const { state: next, outcome } = checkWord(state);
    if (outcome === "solved") {
      setState(next);
      setSolved(true);
      setTimeout(() => onResult(buildWordResult(conceptId, next.checks, next.scaffold)), 900);
    } else {
      setState(next);
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <button
        onClick={() => speakWord(payload.word).catch(() => {})}
        className="min-h-14 min-w-14 rounded-full bg-purple-100 text-3xl"
        aria-label="Hear the word again"
      >
        🔊
      </button>
      <p className="text-xl text-purple-900">Tap the letters to build the word</p>

      <div className={`flex gap-2 ${shake ? "animate-shake" : ""}`}>
        {state.slots.map((fill, i) => (
          <button
            key={i}
            onClick={() => fill && setState(clearSlot(state, i))}
            className="relative flex h-16 w-16 items-center justify-center rounded-xl border-4 border-purple-300 bg-white text-4xl font-bold lowercase"
          >
            {!fill && state.scaffold && (
              <span className="absolute text-purple-200">{payload.word[i]}</span>
            )}
            {fill?.letter}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {state.tray.map((tile) => (
          <button
            key={tile.id}
            disabled={tile.used || solved}
            onClick={() => setState(placeTile(state, tile.id))}
            className={`h-16 w-16 rounded-xl text-4xl font-bold lowercase shadow ${
              tile.used ? "invisible" : "bg-amber-100"
            }`}
          >
            {tile.letter}
          </button>
        ))}
      </div>

      {solved ? (
        <p className="text-2xl font-bold text-green-600">You built it! 🎉</p>
      ) : (
        <button
          onClick={handleCheck}
          disabled={!allFilled}
          className="min-h-14 rounded-full bg-purple-600 px-8 text-xl font-bold text-white disabled:opacity-40"
        >
          Check
        </button>
      )}
    </div>
  );
}
