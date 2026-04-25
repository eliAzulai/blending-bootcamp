"use client";

import type { PetMood, PetType } from "@/types/database";
import { PET_EMOJI } from "@/types/database";

const MOOD_LABEL: Record<PetMood, string> = {
  happy: "is happy to see you!",
  hungry: "is hungry — practice to feed!",
  sleepy: "is sleepy. Wake them up with practice!",
  excited: "is excited!",
};

const MOOD_BG: Record<PetMood, string> = {
  happy: "bg-amber-50",
  hungry: "bg-orange-50",
  sleepy: "bg-slate-50",
  excited: "bg-pink-50",
};

interface PetDisplayProps {
  petType: PetType;
  petName: string;
  mood: PetMood;
  coins: number;
  size?: "sm" | "lg";
}

export default function PetDisplay({
  petType,
  petName,
  mood,
  coins,
  size = "lg",
}: PetDisplayProps) {
  const emoji = PET_EMOJI[petType];
  const isLarge = size === "lg";

  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-3xl px-6 py-5 shadow-sm ${MOOD_BG[mood]}`}
    >
      <span
        className={isLarge ? "text-8xl animate-bounce-subtle" : "text-4xl"}
        aria-label={`${petName} the ${petType}`}
      >
        {emoji}
      </span>
      <div className="text-center">
        <p className={`font-extrabold text-gray-800 ${isLarge ? "text-2xl" : "text-base"}`}>
          {petName}
        </p>
        {isLarge && (
          <p className="text-base text-gray-600">{MOOD_LABEL[mood]}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1">
        <span className="text-lg">🪙</span>
        <span className="text-sm font-bold text-amber-700">{coins}</span>
      </div>
    </div>
  );
}
