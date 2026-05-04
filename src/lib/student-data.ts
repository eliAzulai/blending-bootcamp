import { createClient, supabaseIsConfigured } from "@/lib/supabase/client";
import {
  fixtureStudent,
  fixturePhonicsContent,
  getDefaultPhonicsContent,
  type PhonicsContent,
} from "@/lib/fixtures/student";
import type { Student } from "@/types/database";

export async function getStudent(id: string): Promise<Student | null> {
  if (!supabaseIsConfigured()) {
    return id === fixtureStudent.id ? fixtureStudent : null;
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .single();
  return (data as Student | null) ?? null;
}

export async function getPhonicsContent(): Promise<PhonicsContent> {
  // Phase 1a: live content table query goes here once `content` is seeded.
  // Until then, fixture is the only source whether Supabase is configured or not.
  return getDefaultPhonicsContent();
}

export function listFixturePhonicsContent(): PhonicsContent[] {
  return fixturePhonicsContent;
}
