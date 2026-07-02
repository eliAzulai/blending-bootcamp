"use client";

import { useState } from "react";
import BlendingExercise from "@/components/BlendingExercise";
import type { ActivityResult } from "@/engine/types";
import type { BlendingPayload } from "@/cartridges/reading/types";

interface Props {
  conceptId: string;
  payload: BlendingPayload;
  onResult: (result: ActivityResult) => void;
}

export default function BlendingRep({ conceptId, payload, onResult }: Props) {
  const [index, setIndex] = useState(0);

  function handleComplete() {
    if (index + 1 < payload.words.length) {
      setIndex(index + 1);
    } else {
      // Formative: participation is the signal (existing mechanic is lenient
      // by design); the engine ignores formative results for mastery.
      onResult({ conceptId, correct: true, score: 1.0, authoritative: false });
    }
  }

  const item = payload.words[index];
  return (
    <BlendingExercise
      key={item.word}
      word={item.word}
      phonemes={item.phonemes}
      onComplete={handleComplete}
      speechEnabled
    />
  );
}
