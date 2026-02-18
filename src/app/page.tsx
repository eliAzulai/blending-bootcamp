"use client";

import { useEffect, useState } from "react";
import { curriculum } from "@/data/curriculum";
import { getDaysCompleted, getWordsBlended } from "@/lib/progress";

/**
 * Colour palette per phase.
 */
const PHASE_COLOURS: Record<
  number,
  { bg: string; border: string; text: string; badge: string; glow: string }
> = {
  1: {
    bg: "bg-yellow-400",
    border: "border-yellow-500",
    text: "text-yellow-900",
    badge: "bg-yellow-100 text-yellow-800",
    glow: "shadow-yellow-300/60",
  },
  2: {
    bg: "bg-sky-400",
    border: "border-sky-500",
    text: "text-sky-900",
    badge: "bg-sky-100 text-sky-800",
    glow: "shadow-sky-300/60",
  },
  3: {
    bg: "bg-green-400",
    border: "border-green-500",
    text: "text-green-900",
    badge: "bg-green-100 text-green-800",
    glow: "shadow-green-300/60",
  },
};

const PHASE_LABELS: Record<number, string> = {
  1: "Sound Glue",
  2: "Automatic Blending",
  3: "Transfer to Reading",
};

export default function HomePage() {
  const [completed, setCompleted] = useState<number[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Read progress from localStorage after hydration.
  useEffect(() => {
    setCompleted(getDaysCompleted());
    setTotalWords(getWordsBlended());
    setMounted(true);
  }, []);

  const currentDay = (() => {
    if (completed.length === 0) return 1;
    return Math.min(Math.max(...completed) + 1, 14);
  })();

  // Group lessons by phase for section headers.
  let lastPhase = 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-yellow-50 to-sky-50">
      {/* Hero */}
      <header className="flex flex-col items-center gap-2 px-4 pt-10 pb-4 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-orange-600">
          Blending Bootcamp
        </h1>
        <p className="max-w-xs text-xl font-medium text-orange-800/80">
          Learn to blend sounds into words in 14 days!
        </p>
        {mounted && totalWords > 0 && (
          <span className="mt-2 rounded-full bg-orange-100 px-4 py-1 text-base font-bold text-orange-700">
            {totalWords} words blended so far
          </span>
        )}
      </header>

      {/* Timeline */}
      <main className="mx-auto max-w-md px-6 pb-16 pt-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 h-full w-1 rounded-full bg-orange-200" />

          <ul className="relative flex flex-col gap-0">
            {curriculum.map((lesson) => {
              const isCompleted = completed.includes(lesson.day);
              const isCurrent = lesson.day === currentDay;
              const isLocked =
                !isCompleted && !isCurrent && lesson.day > currentDay;
              const colours = PHASE_COLOURS[lesson.phase];

              // Phase section header
              const showPhaseHeader = lesson.phase !== lastPhase;
              lastPhase = lesson.phase;

              return (
                <li key={lesson.day}>
                  {showPhaseHeader && (
                    <div className="relative mb-3 mt-6 flex items-center gap-3 pl-[4.5rem]">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-bold ${colours.badge}`}
                      >
                        Phase {lesson.phase}
                      </span>
                      <span className="text-sm font-semibold text-gray-500">
                        {PHASE_LABELS[lesson.phase]}
                      </span>
                    </div>
                  )}

                  <div className="relative flex items-start gap-4 py-3">
                    {/* Day circle on the timeline */}
                    <div className="relative z-10 flex-shrink-0">
                      <div
                        className={[
                          "flex h-16 w-16 items-center justify-center rounded-full border-4 text-2xl font-extrabold transition-all duration-300",
                          isCompleted
                            ? `${colours.bg} ${colours.border} text-white shadow-lg ${colours.glow}`
                            : isCurrent
                              ? `bg-white ${colours.border} ${colours.text} shadow-lg ring-4 ring-orange-200 animate-pulse`
                              : "border-gray-300 bg-gray-100 text-gray-400",
                        ].join(" ")}
                      >
                        {isCompleted ? (
                          <span aria-label="completed">&#10003;</span>
                        ) : (
                          lesson.day
                        )}
                      </div>
                    </div>

                    {/* Card */}
                    {isLocked ? (
                      <div className="flex flex-1 flex-col rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3 opacity-60">
                        <span className="text-lg font-bold text-gray-400">
                          Day {lesson.day} &mdash; {lesson.title}
                        </span>
                        <span className="mt-1 text-sm text-gray-400">
                          {lesson.description}
                        </span>
                        <span className="mt-2 text-xs font-semibold text-gray-400">
                          Locked
                        </span>
                      </div>
                    ) : (
                      <a
                        href={`/lesson/${lesson.day}`}
                        className={[
                          "flex flex-1 flex-col rounded-2xl border-2 px-4 py-3 transition-all duration-200",
                          isCompleted
                            ? `${colours.border} bg-white shadow hover:shadow-md`
                            : isCurrent
                              ? `${colours.border} bg-white shadow-md hover:shadow-lg ring-2 ring-orange-100`
                              : `${colours.border} bg-white shadow hover:shadow-md`,
                          "hover:scale-[1.02] active:scale-[0.98]",
                        ].join(" ")}
                      >
                        <span
                          className={`text-lg font-bold ${isCompleted ? "text-gray-700" : colours.text}`}
                        >
                          Day {lesson.day} &mdash; {lesson.title}
                        </span>
                        <span className="mt-1 text-sm text-gray-500">
                          {lesson.description}
                        </span>
                        <span className="mt-2 text-xs font-semibold">
                          {isCompleted ? (
                            <span className="text-green-600">
                              Completed &#10003;
                            </span>
                          ) : isCurrent ? (
                            <span className="text-orange-600">
                              Start lesson &#8594;
                            </span>
                          ) : (
                            <span className="text-gray-500">
                              Ready to play
                            </span>
                          )}
                        </span>
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-8 text-center text-sm text-gray-400">
        Blending Bootcamp &mdash; 14 days to reading
      </footer>
    </div>
  );
}
