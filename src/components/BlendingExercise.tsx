"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { speakPhoneme, speakWord } from "@/lib/speech";
import PhonemeCard, { type PhonemeState } from "./PhonemeCard";

interface BlendingExerciseProps {
  /** The complete word (e.g. "cat"). */
  word: string;
  /** Ordered phonemes for this word (e.g. ["c","a","t"]). */
  phonemes: string[];
  /** Called once the child finishes this word. */
  onComplete: () => void;
}

/**
 * Core exercise component implementing the Tap -> Listen -> Slide -> Say -> Confirm flow.
 *
 * 1. Phoneme cards are spread out.  The child taps each one in order.
 * 2. Each tap highlights the card and speaks the phoneme sound.
 * 3. Once all phonemes are tapped the cards slide together and the blended word is spoken.
 * 4. The full word appears and the child confirms by tapping "I can say it!".
 */
export default function BlendingExercise({
  word,
  phonemes,
  onComplete,
}: BlendingExerciseProps) {
  // Track the state of each phoneme card.
  const [states, setStates] = useState<PhonemeState[]>(
    () => phonemes.map(() => "idle") as PhonemeState[],
  );
  // Which phoneme should be tapped next (index).
  const [nextIndex, setNextIndex] = useState(0);
  // Flow stage.
  const [stage, setStage] = useState<
    "tapping" | "blending" | "reveal" | "done"
  >("tapping");

  // Ref to prevent double-fire of the blending sequence.
  const blendingRef = useRef(false);

  // Reset when the word changes (next exercise).
  useEffect(() => {
    setStates(phonemes.map(() => "idle"));
    setNextIndex(0);
    setStage("tapping");
    blendingRef.current = false;
  }, [word, phonemes]);

  /** Called when a phoneme card is tapped. */
  const handleTap = useCallback(
    async (index: number) => {
      if (stage !== "tapping") return;
      if (index !== nextIndex) return; // must tap in order

      // Mark this card active.
      setStates((prev) => {
        const next = [...prev];
        next[index] = "active";
        return next;
      });

      // Speak the phoneme sound.
      await speakPhoneme(phonemes[index]);

      const newNextIndex = index + 1;
      setNextIndex(newNextIndex);

      // If all phonemes tapped, start the blending sequence.
      if (newNextIndex === phonemes.length && !blendingRef.current) {
        blendingRef.current = true;
        // Short pause before blending.
        setTimeout(async () => {
          // Slide cards together.
          setStage("blending");
          setStates(phonemes.map(() => "blended"));

          // Wait for slide animation then speak the full word.
          await new Promise((r) => setTimeout(r, 600));
          await speakWord(word);

          // Reveal the word text.
          setStage("reveal");
        }, 400);
      }
    },
    [stage, nextIndex, phonemes, word],
  );

  const handleConfirm = useCallback(() => {
    setStage("done");
    onComplete();
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center gap-8 px-4">
      {/* Instruction text */}
      <p className="text-center text-2xl font-semibold text-gray-700">
        {stage === "tapping" && "Tap each sound!"}
        {stage === "blending" && "Slide them together..."}
        {stage === "reveal" && "Can you say it?"}
      </p>

      {/* Phoneme cards */}
      <div
        className="flex items-center justify-center"
        style={{ gap: stage === "blending" || stage === "reveal" ? 4 : 20 }}
      >
        {phonemes.map((p, i) => (
          <PhonemeCard
            key={`${word}-${i}`}
            text={p}
            state={states[i]}
            onTap={() => handleTap(i)}
            index={i}
            total={phonemes.length}
          />
        ))}
      </div>

      {/* Tap-order hint: subtle indicator for which card to tap next */}
      {stage === "tapping" && (
        <p className="text-lg text-gray-400">
          {nextIndex < phonemes.length ? (
            <>
              Tap{" "}
              <span className="font-bold text-orange-400">
                {phonemes[nextIndex]}
              </span>
            </>
          ) : (
            "Great!"
          )}
        </p>
      )}

      {/* Revealed full word and confirm button */}
      {stage === "reveal" && (
        <div className="flex flex-col items-center gap-5 animate-in fade-in">
          <span
            className="text-6xl font-extrabold text-green-600"
            style={{
              animation: "popIn 0.4s cubic-bezier(.34,1.56,.64,1) forwards",
            }}
          >
            {word}
          </span>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-full bg-green-500 px-10 py-4 text-2xl font-bold text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            I can say it!
          </button>
        </div>
      )}

      {/* Inline keyframes for the pop-in effect */}
      <style>{`
        @keyframes popIn {
          0%   { transform: scale(0); opacity: 0; }
          80%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
