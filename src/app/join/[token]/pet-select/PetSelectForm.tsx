"use client";

import { useState, useTransition } from "react";
import { PET_EMOJI, type PetType } from "@/types/database";
import { selectPetAction } from "./actions";

const PETS: { type: PetType; label: string }[] = [
  { type: "cat", label: "Cat" },
  { type: "dog", label: "Dog" },
  { type: "guinea_pig", label: "Guinea Pig" },
  { type: "bird", label: "Bird" },
  { type: "bunny", label: "Bunny" },
];

export default function PetSelectForm({ studentId }: { studentId: string }) {
  const [selected, setSelected] = useState<PetType | null>(null);
  const [petName, setPetName] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    if (!selected) {
      setError("Pick a pet first!");
      return;
    }
    formData.set("petType", selected);
    setError("");
    startTransition(async () => {
      const result = await selectPetAction(studentId, formData);
      if (result?.error) setError(result.error);
    });
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

        <div className="mb-6 grid grid-cols-5 gap-2">
          {PETS.map((pet) => (
            <button
              key={pet.type}
              type="button"
              onClick={() => setSelected(pet.type)}
              className={`flex flex-col items-center rounded-xl p-3 transition-all ${
                selected === pet.type
                  ? "bg-purple-100 ring-2 ring-purple-500 scale-110"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <span className="text-3xl">{PET_EMOJI[pet.type]}</span>
              <span className="mt-1 text-[10px] font-medium text-gray-600">
                {pet.label}
              </span>
            </button>
          ))}
        </div>

        {selected && (
          <form action={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="petName"
              placeholder="Name your pet!"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              maxLength={20}
              required
              className="w-full rounded-xl border-2 border-purple-200 px-4 py-3 text-center text-lg font-bold outline-none focus:border-purple-400"
            />
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={!petName.trim() || pending}
              className="w-full rounded-xl bg-purple-600 px-6 py-3 text-lg font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-50"
            >
              {pending ? "Saving..." : `Let's Go with ${petName || "..."}!`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
