"use client";

import { useEffect, useState } from "react";

interface CelebrationScreenProps {
  wordsBlended: number;
  elapsedSeconds: number;
  onContinue: () => void;
}

/**
 * Confetti-style celebration shown after the learner finishes a lesson.
 * Uses pure-CSS animated circles that float and fade.
 */
export default function CelebrationScreen({
  wordsBlended,
  elapsedSeconds,
  onContinue,
}: CelebrationScreenProps) {
  const [visible, setVisible] = useState(false);

  // Trigger entrance animation on mount.
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(id);
  }, []);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeLabel =
    minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds} seconds`;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-purple-200 via-[#FFF8E1] to-teal-100 px-6 py-12">
      {/* Confetti dots */}
      <ConfettiLayer />

      <div
        className={[
          "z-10 flex flex-col items-center gap-6 transition-all duration-700",
          visible ? "scale-100 opacity-100" : "scale-50 opacity-0",
        ].join(" ")}
      >
        {/* Star burst emoji (system font, universally supported) */}
        <span className="text-8xl" role="img" aria-label="star">
          &#11088;
        </span>

        <h1 className="text-center text-5xl font-extrabold text-purple-700">
          You did it!
        </h1>

        <p className="text-center text-2xl font-semibold text-purple-800">
          Amazing job blending sounds today!
        </p>

        <div className="mt-2 flex flex-col items-center gap-2 rounded-3xl bg-white/70 px-8 py-6 shadow-lg backdrop-blur-sm">
          <Stat label="Words blended" value={String(wordsBlended)} />
          <Stat label="Time" value={timeLabel} />
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-4 rounded-full bg-green-500 px-10 py-4 text-2xl font-bold text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg font-medium text-gray-600">{label}:</span>
      <span className="text-2xl font-bold text-purple-600">{value}</span>
    </div>
  );
}

/* ----- Confetti ----- */

const CONFETTI_COLOURS = [
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#ec4899",
  "#f97316",
  "#14b8a6",
];

function ConfettiLayer() {
  // Generate a fixed set of confetti dots with random positions and delays.
  // useMemo-style: produce once via state to avoid hydration mismatch.
  const [dots] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      size: 8 + Math.random() * 14,
      colour: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
    })),
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d) => (
        <span
          key={d.id}
          className="absolute rounded-full"
          style={{
            left: `${d.left}%`,
            top: "-5%",
            width: d.size,
            height: d.size,
            backgroundColor: d.colour,
            opacity: 0.8,
            animation: `confettiFall ${d.duration}s ease-in ${d.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
