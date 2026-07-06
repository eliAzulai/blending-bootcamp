/**
 * DB-backed content pickers.
 *
 * Replaces the fixture pickers (pickPhonicsContent, pickSpellingContent,
 * pickReadAloudPassage). Same return shape so activity components don't
 * need changes.
 *
 * Source of truth is the `content` table (seeded from
 * src/lib/fixtures/student.ts via scripts/seed-content.ts). Teachers
 * can later add their own content via source='teacher' rows; the picker
 * will pick those up automatically alongside library rows.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DifficultyLevel } from "@/types/database";
import {
  getDefaultPhonicsContent,
  getDefaultSpellingContent,
  getDefaultReadAloudPassage,
  getDefaultWordMatchContent,
  getDefaultClozeContent,
  type PhonicsContent,
  type PhonicsWord,
  type SpellingContent,
  type SpellingWord,
  type ReadAloudPassage,
  type WordMatchContent,
  type WordMatchRound,
  type ClozeContent,
  type ClozeSentence,
} from "./fixtures/student";

interface ContentRow {
  id: string;
  type: "wordlist" | "passage" | "word_match_set" | "cloze_sentence";
  title: string;
  body: string;
  difficulty: DifficultyLevel;
  metadata: {
    legacy_id?: string;
    intended_for?: "phonics" | "spelling";
    words?: Array<{ word: string; phonemes?: string[]; audioHint?: string }>;
    prompt_kind?: string;
    rounds?: unknown;
    sentences?: unknown;
    [k: string]: unknown;
  };
}

async function fetchWordlists(
  supabase: SupabaseClient,
  intendedFor: "phonics" | "spelling",
  difficulty: DifficultyLevel,
): Promise<ContentRow[]> {
  const { data, error } = await supabase
    .from("content")
    .select("id, type, title, body, difficulty, metadata")
    .eq("type", "wordlist")
    .eq("difficulty", difficulty)
    .filter("metadata->>intended_for", "eq", intendedFor)
    .order("created_at");
  if (error) {
    console.warn("[content] fetchWordlists failed", error);
    return [];
  }
  return (data ?? []) as ContentRow[];
}

async function fetchPassages(
  supabase: SupabaseClient,
  difficulty: DifficultyLevel,
): Promise<ContentRow[]> {
  const { data, error } = await supabase
    .from("content")
    .select("id, type, title, body, difficulty, metadata")
    .eq("type", "passage")
    .eq("difficulty", difficulty)
    .order("created_at");
  if (error) {
    console.warn("[content] fetchPassages failed", error);
    return [];
  }
  return (data ?? []) as ContentRow[];
}

export async function getPhonicsContent(
  supabase: SupabaseClient,
  difficulty: DifficultyLevel,
  rotation: number,
): Promise<PhonicsContent> {
  const rows = await fetchWordlists(supabase, "phonics", difficulty);
  if (rows.length === 0) return getDefaultPhonicsContent();
  const row = rows[rotation % rows.length];
  return {
    id: (row.metadata.legacy_id as string) ?? row.id,
    title: row.title,
    difficulty: row.difficulty,
    words: (row.metadata.words ?? []) as PhonicsWord[],
  };
}

export async function getSpellingContent(
  supabase: SupabaseClient,
  difficulty: DifficultyLevel,
  rotation: number,
): Promise<SpellingContent> {
  const rows = await fetchWordlists(supabase, "spelling", difficulty);
  if (rows.length === 0) return getDefaultSpellingContent();
  const row = rows[rotation % rows.length];
  return {
    id: (row.metadata.legacy_id as string) ?? row.id,
    title: row.title,
    difficulty: row.difficulty,
    words: (row.metadata.words ?? []) as SpellingWord[],
  };
}

export async function getReadAloudPassage(
  supabase: SupabaseClient,
  difficulty: DifficultyLevel,
  rotation: number,
): Promise<ReadAloudPassage> {
  const rows = await fetchPassages(supabase, difficulty);
  if (rows.length === 0) return getDefaultReadAloudPassage();
  const row = rows[rotation % rows.length];
  return {
    id: (row.metadata.legacy_id as string) ?? row.id,
    title: row.title,
    difficulty: row.difficulty,
    text: row.body,
  };
}

async function fetchByType(
  supabase: SupabaseClient,
  type: "word_match_set" | "cloze_sentence",
  difficulty: DifficultyLevel,
): Promise<ContentRow[]> {
  const { data, error } = await supabase
    .from("content")
    .select("id, type, title, body, difficulty, metadata")
    .eq("type", type)
    .eq("difficulty", difficulty)
    .order("created_at");
  if (error) {
    console.warn(`[content] fetch ${type} failed`, error);
    return [];
  }
  return (data ?? []) as ContentRow[];
}

export async function getWordMatchContent(
  supabase: SupabaseClient,
  difficulty: DifficultyLevel,
  rotation: number,
): Promise<WordMatchContent> {
  const rows = await fetchByType(supabase, "word_match_set", difficulty);
  if (rows.length === 0) return getDefaultWordMatchContent();
  const row = rows[rotation % rows.length];
  return {
    id: (row.metadata.legacy_id as string) ?? row.id,
    title: row.title,
    difficulty: row.difficulty,
    promptKind:
      (row.metadata.prompt_kind as WordMatchContent["promptKind"]) ?? "hear_word",
    rounds: (row.metadata.rounds ?? []) as WordMatchRound[],
  };
}

// Wave 1 deliberately ignores metadata.intended_for: all cloze sets form one
// pool regardless of which slot (phonics/spelling) the format fills.
export async function getClozeContent(
  supabase: SupabaseClient,
  difficulty: DifficultyLevel,
  rotation: number,
): Promise<ClozeContent> {
  const rows = await fetchByType(supabase, "cloze_sentence", difficulty);
  if (rows.length === 0) return getDefaultClozeContent();
  const row = rows[rotation % rows.length];
  return {
    id: (row.metadata.legacy_id as string) ?? row.id,
    title: row.title,
    difficulty: row.difficulty,
    intendedFor:
      (row.metadata.intended_for as ClozeContent["intendedFor"]) ?? "phonics",
    sentences: (row.metadata.sentences ?? []) as ClozeSentence[],
  };
}
