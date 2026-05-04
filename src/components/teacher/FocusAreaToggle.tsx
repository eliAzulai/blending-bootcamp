"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  onUpdate: () => void;
}

export default function FocusAreaToggle({
  studentId,
  focusAreas,
  onUpdate,
}: FocusAreaToggleProps) {
  const [saving, setSaving] = useState(false);

  const areaMap = new Map(focusAreas.map((fa) => [fa.area, fa]));

  async function toggleArea(area: FocusAreaType) {
    setSaving(true);
    const supabase = createClient();
    const existing = areaMap.get(area);

    if (existing) {
      await supabase
        .from("focus_areas")
        .update({ active: !existing.active })
        .eq("id", existing.id);
    } else {
      await supabase.from("focus_areas").insert({
        student_id: studentId,
        area,
        difficulty: "beginner",
        active: true,
      });
    }

    setSaving(false);
    onUpdate();
  }

  async function changeDifficulty(area: FocusAreaType, difficulty: DifficultyLevel) {
    const existing = areaMap.get(area);
    if (!existing) return;

    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("focus_areas")
      .update({ difficulty })
      .eq("id", existing.id);
    setSaving(false);
    onUpdate();
  }

  return (
    <div className={`space-y-3 ${saving ? "opacity-60" : ""}`}>
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
