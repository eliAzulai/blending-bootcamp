"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FocusAreaType, DifficultyLevel } from "@/types/database";

async function requireTeacher() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

export async function toggleFocusAreaAction(
  studentId: string,
  area: FocusAreaType,
) {
  const { supabase } = await requireTeacher();

  const { data: existing } = await supabase
    .from("focus_areas")
    .select("id, active")
    .eq("student_id", studentId)
    .eq("area", area)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("focus_areas")
      .update({ active: !(existing as { active: boolean }).active })
      .eq("id", (existing as { id: string }).id);
  } else {
    await supabase.from("focus_areas").insert({
      student_id: studentId,
      area,
      difficulty: "beginner",
      active: true,
    });
  }

  revalidatePath(`/teacher/students/${studentId}`);
}

export async function setDifficultyAction(
  studentId: string,
  area: FocusAreaType,
  difficulty: DifficultyLevel,
) {
  const { supabase } = await requireTeacher();

  await supabase
    .from("focus_areas")
    .update({ difficulty })
    .eq("student_id", studentId)
    .eq("area", area);

  revalidatePath(`/teacher/students/${studentId}`);
}

export async function addTagAction(studentId: string, tagId: string) {
  const { supabase } = await requireTeacher();
  await supabase
    .from("student_tags")
    .insert({ student_id: studentId, tag_id: tagId });
  revalidatePath(`/teacher/students/${studentId}`);
}

export async function removeTagAction(studentId: string, tagId: string) {
  const { supabase } = await requireTeacher();
  await supabase
    .from("student_tags")
    .delete()
    .eq("student_id", studentId)
    .eq("tag_id", tagId);
  revalidatePath(`/teacher/students/${studentId}`);
}

export async function createAndAddTagAction(
  studentId: string,
  tagName: string,
): Promise<{ error?: string }> {
  const trimmed = tagName.trim();
  if (!trimmed) return { error: "Tag name is required." };

  const { supabase, user } = await requireTeacher();

  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .eq("teacher_id", user.id)
    .eq("name", trimmed)
    .maybeSingle();

  let tagId: string;
  if (existing) {
    tagId = (existing as { id: string }).id;
  } else {
    const { data: created, error: createError } = await supabase
      .from("tags")
      .insert({ teacher_id: user.id, name: trimmed })
      .select("id")
      .single();
    if (createError || !created) {
      return { error: createError?.message ?? "Could not create tag." };
    }
    tagId = (created as { id: string }).id;
  }

  await supabase
    .from("student_tags")
    .insert({ student_id: studentId, tag_id: tagId });

  revalidatePath(`/teacher/students/${studentId}`);
  return {};
}
