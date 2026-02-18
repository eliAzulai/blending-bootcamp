"use client";

import { useCallback } from "react";

export type PhonemeState =
  | "idle"
  | "active"
  | "listening"
  | "correct"
  | "incorrect"
  | "skipped"
  | "blended";

interface PhonemeCardProps {
  /** The phoneme text to display (e.g. "c", "sh", "igh"). */
  text: string;
  /** Visual state of the card. */
  state: PhonemeState;
  /** Called when the child taps this card (tap mode). */
  onTap: () => void;
  /** Index used for staggered animation delays. */
  index: number;
  /** Total number of phoneme cards in this word (used for slide offset). */
  total: number;
}

/**
 * Colours are assigned based on index so each phoneme in a word looks distinct.
 */
const IDLE_COLOURS = [
  { bg: "bg-yellow-300", border: "border-yellow-500", text: "text-yellow-900" },
  { bg: "bg-sky-300", border: "border-sky-500", text: "text-sky-900" },
  { bg: "bg-green-300", border: "border-green-500", text: "text-green-900" },
  {
    bg: "bg-orange-300",
    border: "border-orange-500",
    text: "text-orange-900",
  },
  {
    bg: "bg-purple-300",
    border: "border-purple-500",
    text: "text-purple-900",
  },
  { bg: "bg-pink-300", border: "border-pink-500", text: "text-pink-900" },
];

const ACTIVE_COLOURS = [
  { bg: "bg-yellow-400", border: "border-yellow-600", text: "text-yellow-950" },
  { bg: "bg-sky-400", border: "border-sky-600", text: "text-sky-950" },
  { bg: "bg-green-400", border: "border-green-600", text: "text-green-950" },
  {
    bg: "bg-orange-400",
    border: "border-orange-600",
    text: "text-orange-950",
  },
  {
    bg: "bg-purple-400",
    border: "border-purple-600",
    text: "text-purple-950",
  },
  { bg: "bg-pink-400", border: "border-pink-600", text: "text-pink-950" },
];

function getColours(state: PhonemeState, index: number) {
  const idx = index % IDLE_COLOURS.length;

  switch (state) {
    case "listening":
      return {
        bg: "bg-teal-200",
        border: "border-teal-400",
        text: "text-teal-900",
      };
    case "correct":
      return {
        bg: "bg-green-300",
        border: "border-green-500",
        text: "text-green-900",
      };
    case "incorrect":
      return {
        bg: "bg-amber-200",
        border: "border-amber-400",
        text: "text-amber-900",
      };
    case "idle":
      return IDLE_COLOURS[idx];
    default:
      // active, blended, skipped all use active colours
      return ACTIVE_COLOURS[idx];
  }
}

export default function PhonemeCard({
  text,
  state,
  onTap,
  index,
  total,
}: PhonemeCardProps) {
  const colours = getColours(state, index);

  const handleClick = useCallback(() => {
    if (state === "idle") onTap();
  }, [state, onTap]);

  // When blending, cards slide toward the centre.
  const blendOffset = (() => {
    if (state !== "blended") return "translateX(0)";
    const centre = (total - 1) / 2;
    const delta = centre - index;
    return `translateX(${delta * 40}px)`;
  })();

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Phoneme ${text}`}
      className={[
        // Base
        "relative flex items-center justify-center rounded-3xl border-4 font-bold select-none",
        // Size -- large touch target
        "h-20 min-w-20 px-5",
        // Font
        "text-4xl",
        // Colour
        colours.bg,
        colours.border,
        colours.text,
        // Cursor
        state === "idle" ? "cursor-pointer" : "cursor-default",
        // State-specific animations
        state === "active" ? "scale-110" : "",
        state === "listening" ? "animate-card-listen" : "",
        state === "correct" ? "animate-card-correct" : "",
        state === "incorrect" ? "animate-card-wobble" : "",
        // Transitions
        "transition-all duration-300 ease-out",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        transform:
          state === "blended"
            ? `${blendOffset} scale(1)`
            : state === "active" || state === "correct"
              ? "scale(1.15)"
              : state === "listening"
                ? "scale(1.08)"
                : "scale(1)",
        transitionProperty: "transform, background-color, border-color",
        transitionDuration: "400ms",
        transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)",
      }}
    >
      {text}
      {/* Subtle shadow ring when active */}
      {state === "active" && (
        <span className="pointer-events-none absolute inset-0 animate-ping rounded-3xl border-4 border-white opacity-40" />
      )}
      {/* Mic indicator when listening */}
      {state === "listening" && (
        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
            <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V21h-2a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.07A7 7 0 0 0 19 11Z" />
          </svg>
        </span>
      )}
      {/* Checkmark overlay when correct */}
      {state === "correct" && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-3xl bg-green-400/40">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-10 w-10 drop-shadow">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17Z" />
          </svg>
        </span>
      )}
    </button>
  );
}
