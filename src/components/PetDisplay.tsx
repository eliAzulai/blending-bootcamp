"use client";

import Image from "next/image";
import { CoinMark } from "@/components/ui/StickerMarks";
import type { PetKitchenPetState } from "@/lib/pet-kitchen";
import { petStickerFor } from "@/lib/pet-assets";
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

const KITCHEN_LABEL: Record<PetKitchenPetState, string> = {
  watching: "is watching the donut tray.",
  sniffing: "smells a fresh donut!",
  cheering: "liked that spelling!",
  encouraging: "is helping you try again.",
  eating: "is eating a donut!",
  full: "is full and happy!",
};

const KITCHEN_ANIMATION: Record<PetKitchenPetState, string> = {
  watching: "",
  sniffing: "animate-pulse",
  cheering: "animate-bounce-subtle",
  encouraging: "animate-pulse",
  eating: "animate-bounce-subtle",
  full: "animate-bounce-subtle",
};

interface PetDisplayProps {
  petType: PetType;
  petName: string;
  mood: PetMood;
  coins: number;
  size?: "sm" | "lg";
  kitchenState?: PetKitchenPetState;
}

export default function PetDisplay({
  petType,
  petName,
  mood,
  coins,
  size = "lg",
  kitchenState,
}: PetDisplayProps) {
  const emoji = PET_EMOJI[petType];
  const stickerSrc = petStickerFor(petType, kitchenState);
  const isLarge = size === "lg";
  const kitchenAnimation = kitchenState ? KITCHEN_ANIMATION[kitchenState] : "";
  const petAnimation = isLarge
    ? `animate-bounce-subtle ${kitchenAnimation}`
    : kitchenAnimation;
  const stickerSize = isLarge ? 192 : 144;
  const stickerClass = isLarge ? "h-48 w-48" : "h-36 w-36";
  const shouldPrioritizeSticker = isLarge || Boolean(kitchenState);

  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-3xl px-6 py-5 shadow-sm ${MOOD_BG[mood]}`}
    >
      {stickerSrc ? (
        <Image
          src={stickerSrc}
          alt={`${petName} the ${petType}`}
          width={stickerSize}
          height={stickerSize}
          priority={shouldPrioritizeSticker}
          className={`${stickerClass} object-contain drop-shadow-sm ${petAnimation}`}
        />
      ) : (
        <span
          className={isLarge ? `text-8xl ${petAnimation}` : `text-4xl ${petAnimation}`}
          aria-label={`${petName} the ${petType}`}
        >
          {emoji}
        </span>
      )}
      <div className="text-center">
        <p className={`font-extrabold text-gray-800 ${isLarge ? "text-2xl" : "text-base"}`}>
          {petName}
        </p>
        {isLarge && (
          <p className="text-base text-gray-600">{MOOD_LABEL[mood]}</p>
        )}
        {kitchenState && (
          <p className="text-sm font-bold text-purple-600 animate-fade-up">
            {petName} {KITCHEN_LABEL[kitchenState]}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1">
        <CoinMark />
        <span className="text-sm font-bold text-amber-700">{coins}</span>
      </div>
    </div>
  );
}
