"use client";

import type { PetMood, PetType } from "@/types/database";
import { PET_EMOJI } from "@/types/database";

/**
 * Pet display — emoji face on a soft body disc with one calm idle breathe.
 *
 * Design decisions (see courtroom verdict 2026-05-11):
 * - Emoji stays as the face. Replacing with character art is Phase 1b.
 * - One idle animation (pet-breathe) only. Pauses on prefers-reduced-motion.
 * - Mood drives body tint + slight rotation. No mood-specific motion.
 * - Copy is positive readiness only (R25): no "feed", "wake them up", "neglected".
 * - When the `bouncing` prop flips true, a one-shot bounce plays — used by the
 *   practice completion screen to react to the child's effort.
 */

const MOOD_LABEL: Record<PetMood, string> = {
  happy: "is happy to see you!",
  excited: "is excited!",
  hungry: "wants to play!",
  sleepy: "is resting.",
};

// Subtle body-disc tint per mood. Strong enough to read at a glance,
// soft enough to never compete with the emoji face.
const MOOD_DISC: Record<PetMood, string> = {
  happy: "bg-amber-200",
  excited: "bg-pink-200",
  hungry: "bg-orange-200",
  sleepy: "bg-slate-200",
};

// Background card tint. Mirrors disc tint at lower opacity.
const MOOD_CARD: Record<PetMood, string> = {
  happy: "bg-amber-50",
  excited: "bg-pink-50",
  hungry: "bg-orange-50",
  sleepy: "bg-slate-50",
};

// Tiny rotation gives mood a posture without animating.
const MOOD_ROTATION: Record<PetMood, string> = {
  happy: "rotate-0",
  excited: "-rotate-3",
  hungry: "rotate-0",
  sleepy: "rotate-3",
};

interface PetDisplayProps {
  petType: PetType;
  petName: string;
  mood: PetMood;
  size?: "sm" | "lg";
  /** When true, plays a single bounce animation. Used by completion screen. */
  bouncing?: boolean;
}

export default function PetDisplay({
  petType,
  petName,
  mood,
  size = "lg",
  bouncing = false,
}: PetDisplayProps) {
  const emoji = PET_EMOJI[petType];
  const isLarge = size === "lg";

  // Sizes scale together: disc, emoji, shadow.
  const discSize = isLarge ? "h-44 w-44" : "h-20 w-20";
  const emojiSize = isLarge ? "text-7xl" : "text-3xl";
  const shadowSize = isLarge ? "h-3 w-32" : "h-1.5 w-14";

  return (
    <div
      className={`flex flex-col items-center gap-4 rounded-3xl px-6 py-6 ${MOOD_CARD[mood]}`}
    >
      {/* Pet stage: disc + shadow + emoji */}
      <div className="relative flex flex-col items-center">
        {/* Body disc with idle breathe and mood rotation */}
        <div
          className={`relative flex items-center justify-center rounded-full ${discSize} ${MOOD_DISC[mood]} ${MOOD_ROTATION[mood]} ${bouncing ? "pet-bounce-once" : "pet-breathe"}`}
          aria-label={`${petName} the ${petType}`}
        >
          <span className={emojiSize} aria-hidden="true">
            {emoji}
          </span>
        </div>
        {/* Drop shadow ellipse */}
        <div
          className={`mt-2 rounded-full bg-black/15 blur-sm ${shadowSize}`}
          aria-hidden="true"
        />
      </div>

      {/* Name + mood line */}
      <div className="text-center">
        <p
          className={`font-extrabold text-gray-800 ${isLarge ? "text-2xl" : "text-base"}`}
        >
          {petName}
        </p>
        {isLarge && (
          <p className="mt-1 text-base text-gray-600">{MOOD_LABEL[mood]}</p>
        )}
      </div>
    </div>
  );
}
