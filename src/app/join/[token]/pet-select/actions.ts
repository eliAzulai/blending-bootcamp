"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_FOCUS_AREAS, type PetType } from "@/types/database";

const VALID_PETS: PetType[] = ["cat", "dog", "guinea_pig", "bird", "bunny"];

export interface PetSelectResult {
  error?: string;
}

export async function selectPetAction(
  studentId: string,
  formData: FormData,
): Promise<PetSelectResult> {
  const petType = String(formData.get("petType") ?? "") as PetType;
  const petName = String(formData.get("petName") ?? "").trim();

  if (!VALID_PETS.includes(petType)) {
    return { error: "Pick a pet first!" };
  }
  if (!petName) {
    return { error: "Give your pet a name!" };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  // Verify student belongs to this parent (RLS would block anyway, but explicit is clearer)
  const { data: student } = await supabase
    .from("students")
    .select("id, parent_id")
    .eq("id", studentId)
    .single();

  if (!student || (student as { parent_id: string }).parent_id !== user.id) {
    return { error: "Student not found." };
  }

  const { error: petError } = await supabase
    .from("students")
    .update({ pet_type: petType, pet_name: petName })
    .eq("id", studentId);

  if (petError) {
    return { error: petError.message };
  }

  const focusRows = DEFAULT_FOCUS_AREAS.map((area) => ({
    student_id: studentId,
    area,
    difficulty: "beginner" as const,
    active: true,
  }));

  // Best-effort — duplicates are blocked by unique(student_id, area) and that's fine
  await supabase.from("focus_areas").insert(focusRows);

  redirect("/join/success");
}
