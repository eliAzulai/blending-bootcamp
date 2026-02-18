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
  text: string;
  state: PhonemeState;
  onTap: () => void;
  index: number;
  total: number;
}

const IDLE_COLOURS = [
  { bg: "bg-yellow-300", border: "border-yellow-500", text: "text-yellow-900" },
  { bg: "bg-sky-300", border: "border-sky-500", text: "text-sky-900" },
  { bg: "bg-green-300", border: "border-green-500", text: "text-green-900" },
  { bg: "bg-orange-300", border: "border-orange-500", text: "text-orange-900" },
  { bg: "bg-purple-300", border: "border-purple-500", text: "text-purple-900" },
  { bg: "bg-pink-300", border: "border-pink-500", text: "text-pink-900" },
];

const ACTIVE_COLOURS = [
  { bg: "bg-yellow-400", border: "border-yellow-600", text: "text-yellow-950" },
  { bg: "bg-sky-400", border: "border-sky-600", text: "text-sky-950" },
  { bg: "bg-green-400", border: "border-green-600", text: "text-green-950" },
  { bg: "bg-orange-400", border: "border-orange-600", text: "text-orange-950" },
  { bg: "bg-purple-400", border: "border-purple-600", text: "text-purple-950" },
  { bg: "bg-pink-400", border: "border-pink-600", text: "text-pink-950" },
];

function getColours(state: PhonemeState, index: number) {
  const idx = index % IDLE_COLOURS.length;

  switch (state) {
    case "listening":
      return { bg: "bg-teal-100", border: "border-teal-400", text: "text-teal-900" };
    case "correct":
      return { bg: "bg-emerald-300", border: "border-emerald-500", text: "text-emerald-900" };
    case "incorrect":
      return { bg: "bg-amber-200", border: "border-amber-400", text: "text-amber-900" };
    case "idle":
      return IDLE_COLOURS[idx];
    default:
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

  const blendOffset = (() => {
    if (state !== "blended") return "translateX(0)";
    const centre = (total - 1) / 2;
    const delta = centre - index;
    return `translateX(${delta * 40}px)`;
  })();

  // Determine scale based on state
  const scale = (() => {
    switch (state) {
      case "listening": return 1.12;
      case "active":
      case "correct": return 1.15;
      case "idle": return 1;
      case "blended": return 1;
      default: return 1;
    }
  })();

  // Animation class based on state
  const animClass = (() => {
    switch (state) {
      case "listening": return "animate-card-listen";
      case "correct": return "animate-card-correct";
      case "incorrect": return "animate-card-wobble";
      default: return "";
    }
  })();

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Phoneme ${text}`}
      className={[
        "relative flex items-center justify-center rounded-3xl border-4 font-bold select-none",
        "h-20 min-w-20 px-5",
        "text-4xl",
        colours.bg,
        colours.border,
        colours.text,
        state === "idle" ? "cursor-pointer" : "cursor-default",
        animClass,
        "transition-all duration-500 ease-[cubic-bezier(.34,1.56,.64,1)]",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        transform: state === "blended"
          ? `${blendOffset} scale(1)`
          : `scale(${scale})`,
        opacity: state === "idle" ? 0.7 : 1,
      }}
    >
      {text}

      {/* Listening: pulsing glow ring */}
      {state === "listening" && (
        <>
          <span className="pointer-events-none absolute inset-0 rounded-3xl animate-card-glow-ring" />
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-teal-500 text-white shadow-lg animate-bounce-subtle">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
              <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V21h-2a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.07A7 7 0 0 0 19 11Z" />
            </svg>
          </span>
        </>
      )}

      {/* Correct: checkmark with pop */}
      {state === "correct" && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-3xl bg-emerald-400/30 animate-check-pop">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-10 w-10 drop-shadow-lg">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17Z" />
          </svg>
        </span>
      )}

      {/* Active: subtle shine sweep */}
      {state === "active" && (
        <span className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden">
          <span className="absolute inset-0 animate-shine bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </span>
      )}
    </button>
  );
}
