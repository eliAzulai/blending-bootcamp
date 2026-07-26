// src/types/database.ts
// TypeScript types matching the Supabase schema in supabase/schema-v2.sql

export type Role = "teacher" | "parent";

export interface Profile {
  id: string;
  role: Role;
  name: string;
  created_at: string;
}

export type PetType = "cat" | "dog" | "guinea_pig" | "bird" | "bunny";
export type PetMood = "happy" | "hungry" | "sleepy" | "excited";

export interface Student {
  id: string;
  parent_id: string;
  teacher_id: string | null;
  name: string;
  age: number;
  pet_type: PetType;
  pet_name: string;
  pet_mood: PetMood;
  coins: number;
  created_at: string;
}

export interface Tag {
  id: string;
  teacher_id: string;
  name: string;
  created_at: string;
}

export type FocusAreaType = "phonics" | "spelling" | "read_aloud";
/**
 * Everything an activity_attempts row can be. letter_hunt is an attempt type
 * but NOT a focus area — teachers assign the three focus areas; Letter Hunt is
 * post-practice play recorded under its own label so its recognition scores
 * never blend into the phonics (blending-production) signal.
 */
export type AttemptType = FocusAreaType | "letter_hunt";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface FocusArea {
  id: string;
  student_id: string;
  area: FocusAreaType;
  difficulty: DifficultyLevel;
  active: boolean;
}

export interface InviteToken {
  id: string;
  teacher_id: string;
  token: string;
  student_name: string | null;
  student_age: number | null;
  used: boolean;
  used_by: string | null;
  created_at: string;
}

export interface PracticeSession {
  id: string;
  student_id: string;
  date: string;
  duration_seconds: number;
  coins_earned: number;
  completed: boolean;
  created_at: string;
}

export type CareVerbDb = "snack" | "ball" | "treat";

export interface PetCareEvent {
  id: string;
  student_id: string;
  verb: CareVerbDb;
  coins_spent: number;
  created_at: string;
}

export interface ActivityAttempt {
  id: string;
  session_id: string;
  activity_type: AttemptType;
  content_ref: string | null;
  score: number | null;
  duration_seconds: number;
  transcript: string | null;
  audio_url: string | null;
  created_at: string;
}

export const ALL_FOCUS_AREAS: FocusAreaType[] = ["phonics", "spelling", "read_aloud"];
export const DEFAULT_FOCUS_AREAS: FocusAreaType[] = ["phonics", "spelling", "read_aloud"];

export const FOCUS_AREA_LABELS: Record<FocusAreaType, string> = {
  phonics: "Phonics",
  spelling: "Spelling",
  read_aloud: "Read Aloud",
};

/** Labels for everything an attempt row can be (teacher surfaces). */
export const ATTEMPT_LABELS: Record<AttemptType, string> = {
  ...FOCUS_AREA_LABELS,
  letter_hunt: "Letter Hunt",
};

export const PET_EMOJI: Record<PetType, string> = {
  cat: "🐱",
  dog: "🐕",
  guinea_pig: "🐹",
  bird: "🐦",
  bunny: "🐰",
};
