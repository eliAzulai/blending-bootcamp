"use client";

import { useCallback } from "react";

export type PhonemeState = "idle" | "active" | "blended";

interface PhonemeCardProps {
  /** The phoneme text to display (e.g. "c", "sh", "igh"). */
  text: string;
  /** Visual state of the card. */
  state: PhonemeState;
  /** Called when the child taps this card. */
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

export default function PhonemeCard({
  text,
  state,
  onTap,
  index,
  total,
}: PhonemeCardProps) {
  const colourIdx = index % IDLE_COLOURS.length;
  const colours = state === "idle" ? IDLE_COLOURS[colourIdx] : ACTIVE_COLOURS[colourIdx];

  const handleClick = useCallback(() => {
    if (state === "idle") onTap();
  }, [state, onTap]);

  // When blending, cards slide toward the centre.  We calculate a
  // translateX that pulls them together.  The middle card stays put;
  // cards to the left move right, cards to the right move left.
  const blendOffset = (() => {
    if (state !== "blended") return "translateX(0)";
    const centre = (total - 1) / 2;
    const delta = centre - index;
    // Each unit of delta moves the card ~40px toward centre.
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
        // Scale pop on active
        state === "active" ? "scale-110" : "",
        // Transitions
        "transition-all duration-300 ease-out",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        transform:
          state === "blended"
            ? `${blendOffset} scale(1)`
            : state === "active"
              ? "scale(1.15)"
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
    </button>
  );
}
