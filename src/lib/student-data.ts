import { supabaseIsConfigured } from "@/lib/supabase/client";
import {
  fixtureStudent,
  fixturePhonicsContent,
  getDefaultPhonicsContent,
  type PhonicsContent,
} from "@/lib/fixtures/student";
import type { Student } from "@/types/database";

// Read the access token straight from the Supabase cookie.
// We bypass the supabase JS client for data queries because its `_useSession`
// can hang when a previous page's auth request was aborted by navigation.
function readAccessTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const projectRef = url.match(/https:\/\/([^.]+)\./)?.[1];
  if (!projectRef) return null;
  const cookieName = `sb-${projectRef}-auth-token`;
  const cookies = document.cookie.split(";").map((c) => c.trim());
  // The cookie value can be split across base64 chunks (sb-...-auth-token.0, .1, etc.)
  const chunks: string[] = [];
  for (const c of cookies) {
    const [name, ...rest] = c.split("=");
    if (name === cookieName || /^sb-[^=]+-auth-token\.\d+$/.test(name)) {
      chunks.push(rest.join("="));
    }
  }
  if (chunks.length === 0) return null;
  let raw = decodeURIComponent(chunks.join(""));
  if (raw.startsWith("base64-")) {
    try {
      raw = atob(raw.slice("base64-".length));
    } catch {
      return null;
    }
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed?.access_token ?? null;
  } catch {
    return null;
  }
}

async function restQuery<T>(path: string): Promise<T | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  if (!url || !key) return null;
  const token = readAccessTokenFromCookie() ?? key;
  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      if (res.status !== 406 && res.status !== 404) {
        console.warn(`[student-data] REST ${path} → ${res.status}`);
      }
      return null;
    }
    const json = await res.json();
    if (Array.isArray(json) && json.length === 0) return null;
    if (Array.isArray(json)) return json[0] as T;
    return json as T;
  } catch (err) {
    console.warn(`[student-data] REST ${path} failed`, err);
    return null;
  }
}

export async function getStudent(id: string): Promise<Student | null> {
  // Fixture path always wins for the known demo ID, even with Supabase configured.
  if (id === fixtureStudent.id) return fixtureStudent;
  if (!supabaseIsConfigured()) return null;
  return restQuery<Student>(`students?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
}

interface ContentRow {
  id: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  metadata: {
    slug?: string;
    activity?: string;
    words?: { word: string; phonemes: string[] }[];
  } | null;
}

export async function getPhonicsContent(studentId?: string): Promise<PhonicsContent> {
  if (studentId === fixtureStudent.id) return getDefaultPhonicsContent();
  if (!supabaseIsConfigured()) return getDefaultPhonicsContent();
  const row = await restQuery<ContentRow>(
    `content?source=eq.library&type=eq.wordlist&metadata->>activity=eq.phonics&select=id,title,difficulty,metadata&order=title&limit=1`,
  );
  const words = row?.metadata?.words ?? [];
  if (!row || words.length === 0) return getDefaultPhonicsContent();
  return {
    id: row.metadata?.slug ?? row.id,
    title: row.title,
    difficulty: row.difficulty,
    words,
  };
}

// Spelling reuses the same phonics word lists for Phase 1a — per spec
// "Spelling word lists: same words used in phonics + Dolch sight words".
// Dolch sight words come later. Same shape; the SpellingActivity ignores
// the per-word `phonemes` field and only uses `word`.
export async function getSpellingContent(studentId?: string): Promise<PhonicsContent> {
  return getPhonicsContent(studentId);
}

export function listFixturePhonicsContent(): PhonicsContent[] {
  return fixturePhonicsContent;
}
