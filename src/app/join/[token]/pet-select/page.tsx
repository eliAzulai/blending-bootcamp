"use client";

import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { petStickerFor } from "@/lib/pet-assets";
import { PET_EMOJI, DEFAULT_FOCUS_AREAS, type PetType } from "@/types/database";

const PETS: { type: PetType; label: string }[] = [
  { type: "cat", label: "Cat" },
  { type: "dog", label: "Dog" },
  { type: "guinea_pig", label: "Hamster" },
  { type: "bird", label: "Bird" },
  { type: "bunny", label: "Bunny" },
  { type: "penguin", label: "Penguin" },
];

export default function PetSelectPage() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("student");
  const router = useRouter();

  const [selected, setSelected] = useState<PetType | null>(null);
  const [petName, setPetName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!selected || !petName.trim() || !studentId) return;
    setSaving(true);
    setError("");

    const supabase = createClient();

    const { error: petError } = await supabase
      .from("students")
      .update({ pet_type: selected, pet_name: petName.trim() })
      .eq("id", studentId);

    if (petError) {
      setError(petError.message);
      setSaving(false);
      return;
    }

    const focusRows = DEFAULT_FOCUS_AREAS.map((area) => ({
      student_id: studentId,
      area,
      difficulty: "beginner" as const,
      active: true,
    }));

    await supabase.from("focus_areas").insert(focusRows);

    router.push("/join/success");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-3xl font-extrabold text-purple-700">
          Pick Your Pet!
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          This pet will be your learning buddy
        </p>

        <div className="mb-6 grid grid-cols-3 gap-2">
          {PETS.map((pet) => {
            const stickerSrc = petStickerFor(pet.type);

            return (
              <button
                key={pet.type}
                onClick={() => setSelected(pet.type)}
                className={`flex flex-col items-center rounded-xl p-3 transition-all ${
                  selected === pet.type
                    ? "bg-purple-100 ring-2 ring-purple-500 scale-110"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                {stickerSrc ? (
                  <Image
                    src={stickerSrc}
                    alt={pet.label}
                    width={56}
                    height={56}
                    className="h-12 w-12 object-contain"
                  />
                ) : (
                  <span className="text-3xl">{PET_EMOJI[pet.type]}</span>
                )}
                <span className="mt-1 text-[10px] font-medium text-gray-600">
                  {pet.label}
                </span>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Name your pet!"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              maxLength={20}
              className="w-full rounded-xl border-2 border-purple-200 px-4 py-3 text-center text-lg font-bold outline-none focus:border-purple-400"
            />
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <button
              onClick={handleSave}
              disabled={!petName.trim() || saving}
              className="w-full rounded-xl bg-purple-600 px-6 py-3 text-lg font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : `Let's Go with ${petName}!`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
