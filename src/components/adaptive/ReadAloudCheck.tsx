"use client";

import { useEffect, useRef, useState } from "react";
import { listenForSpeech } from "@/lib/speech-recognition";
import type { ActivityResult } from "@/engine/types";
import type { ReadAloudPayload } from "@/cartridges/reading/types";
import {
  initReadAloud,
  applyListen,
  type ReadAloudState,
} from "@/cartridges/reading/read-aloud-logic";

/** Celebration pause before reporting the result to the runner. */
const RESULT_DELAY_MS = 900;

interface Props {
  conceptId: string;
  payload: ReadAloudPayload;
  onResult: (result: ActivityResult) => void;
  /** A5: two transcription failures — abort WITHOUT a result. */
  onAbort: () => void;
}

type Phase = "ready" | "listening" | "retry" | "tech-retry" | "done";

export default function ReadAloudCheck({ conceptId, payload, onResult, onAbort }: Props) {
  const [machine, setMachine] = useState<ReadAloudState>(() =>
    initReadAloud(conceptId, payload.word, payload.accept),
  );
  const [phase, setPhase] = useState<Phase>("ready");
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A delayed onResult must never fire after unmount — it would double-count
  // in the runner's bookkeeping (servedCount / policy reps).
  useEffect(() => {
    return () => {
      if (resultTimerRef.current !== null) clearTimeout(resultTimerRef.current);
    };
  }, []);

  async function listen() {
    setPhase("listening");
    const heard = await listenForSpeech({ timeoutMs: 3000 });
    const step = applyListen(machine, heard);
    if (step.kind === "done") {
      setPhase("done");
      // R17: never show the transcript; generic positive acknowledgment only.
      resultTimerRef.current = setTimeout(() => onResult(step.result), RESULT_DELAY_MS);
    } else if (step.kind === "aborted") {
      onAbort();
    } else {
      setMachine(step.state);
      setPhase(step.kind); // "retry" | "tech-retry"
    }
  }

  const prompt =
    phase === "retry"
      ? "Good try! Say it nice and loud!"
      : phase === "tech-retry"
        ? "Hmm, my ears glitched. One more time!"
        : "Read this word out loud";

  return (
    <div className="flex flex-col items-center gap-8 p-6">
      <p className="text-xl text-purple-900">{prompt}</p>
      <p className="text-7xl font-bold lowercase text-gray-900">{payload.word}</p>
      {phase === "done" ? (
        <p className="text-2xl font-bold text-green-600">Great reading!</p>
      ) : (
        <button
          onClick={listen}
          disabled={phase === "listening"}
          className="min-h-16 min-w-16 rounded-full bg-orange-500 px-8 py-4 text-2xl font-bold text-white"
        >
          {phase === "listening" ? "Listening…" : "🎤 Read it!"}
        </button>
      )}
    </div>
  );
}
