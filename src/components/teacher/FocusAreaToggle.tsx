"use client";

import { useTransition } from "react";
import {
  toggleFocusAreaAction,
  setDifficultyAction,
} from "@/app/teacher/students/[id]/actions";
import {
  ALL_FOCUS_AREAS,
  FOCUS_AREA_LABELS,
  type FocusArea,
  type FocusAreaType,
  type DifficultyLevel,
} from "@/types/database";

const DIFFICULTIES: DifficultyLevel[] = ["beginner", "intermediate", "advanced"];

interface FocusAreaToggleProps {
  studentId: string;
  focusAreas: FocusArea[];
}

export default function FocusAreaToggle({
  studentId,
  focusAreas,
}: FocusAreaToggleProps) {
  const [pending, startTransition] = useTransition();

  const areaMap = new Map(focusAreas.map((fa) => [fa.area, fa]));

  function toggleArea(area: FocusAreaType) {
    startTransition(() => toggleFocusAreaAction(studentId, area));
  }

  function changeDifficulty(area: FocusAreaType, difficulty: DifficultyLevel) {
    startTransition(() => setDifficultyAction(studentId, area, difficulty));
  }

  return (
    <div className={`space-y-3 ${pending ? "opacity-60" : ""}`}>
      <h3 className="text-sm font-semibold text-gray-700">Focus Areas</h3>
      <div className="flex flex-wrap gap-2">
        {ALL_FOCUS_AREAS.map((area) => {
          const fa = areaMap.get(area);
          const isActive = fa?.active ?? false;

          return (
            <button
              key={area}
              onClick={() => toggleArea(area)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {FOCUS_AREA_LABELS[area]}
            </button>
          );
        })}
      </div>

      {focusAreas
        .filter((fa) => fa.active)
        .map((fa) => (
          <div key={fa.area} className="flex items-center gap-2 text-xs">
            <span className="w-24 text-gray-600">{FOCUS_AREA_LABELS[fa.area]}:</span>
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => changeDifficulty(fa.area, d)}
                className={`rounded px-2 py-0.5 ${
                  fa.difficulty === d
                    ? "bg-purple-100 font-medium text-purple-700"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        ))}
    </div>
  );
}
