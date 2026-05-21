"use client";

import Image from "next/image";
import Link from "next/link";
import { petStickerFor } from "@/lib/pet-assets";
import { PET_EMOJI, type PetType, type Tag } from "@/types/database";

interface StudentCardProps {
  id: string;
  name: string;
  age: number;
  petType: PetType;
  petName: string;
  coins: number;
  tags: Tag[];
  practiceThisWeek: number;
  lastActive: string | null;
  isInactive: boolean;
}

export default function StudentCard({
  id,
  name,
  age,
  petType,
  petName,
  coins,
  tags,
  practiceThisWeek,
  lastActive,
  isInactive,
}: StudentCardProps) {
  const bgClass = isInactive
    ? "bg-red-50 border-red-200"
    : "bg-white border-gray-200";
  const stickerSrc = petStickerFor(petType);

  return (
    <Link
      href={`/teacher/students/${id}`}
      className={`flex items-center gap-3 rounded-xl border p-4 transition-shadow hover:shadow-md ${bgClass}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
        {stickerSrc ? (
          <Image
            src={stickerSrc}
            alt={`${petName} the ${petType}`}
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
        ) : (
          <span className="text-[10px] font-bold text-purple-700">
            {PET_EMOJI[petType] ?? "Pet"}
          </span>
        )}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-gray-900">{name}</div>
        <div className="text-xs text-gray-500">
          Age {age} · {petName} · {coins} coins
        </div>
        {tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {tags.map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
              >
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-right">
        {isInactive ? (
          <div className="text-xs font-medium text-red-600">Inactive</div>
        ) : (
          <div className="text-xs font-medium text-green-600">
            {practiceThisWeek}/5 days
          </div>
        )}
        <div className="text-[10px] text-gray-400">
          {lastActive ? `Last: ${lastActive}` : "No activity"}
        </div>
      </div>
    </Link>
  );
}
