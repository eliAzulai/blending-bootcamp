import type { PetMood } from "@/types/database";

/**
 * Pet reward system — pure logic. No IO, no Date.now() defaults; callers pass
 * dates in so every function is deterministic and testable (R24 spirit).
 *
 * Spec: docs/superpowers/specs/2026-07-13-wordpets-pet-reward-system-design.md
 *
 * "Today" is UTC everywhere, matching practice_sessions.date (server
 * current_date) and the /student home practicedToday check. Local-midnight
 * drift for Israel (UTC+2/3) is an accepted Phase 1a limitation.
 */

export type CareVerb = "snack" | "ball" | "treat";

export const CARE_VERBS: CareVerb[] = ["snack", "ball", "treat"];

/** Costs sum to ~one session's earnings: one day of practice funds one full day of care. */
export const CARE_COST: Record<CareVerb, number> = {
  snack: 5,
  ball: 10,
  treat: 15,
};

export const CARE_EMOJI: Record<CareVerb, string> = {
  snack: "🍎",
  ball: "⚽",
  treat: "🎁",
};

export const CARE_LABEL: Record<CareVerb, string> = {
  snack: "Give a snack",
  ball: "Toss the ball",
  treat: "Special treat",
};

/** After this many care events in a day the pet is happily full (anti tap-spam). */
export const SATIATION_LIMIT = 3;

export interface PetMoodInputs {
  /** Completed a practice session today (UTC date match). */
  practicedToday: boolean;
  /**
   * Whole days since the most recent completed practice session, in UTC.
   * 0 = today, 1 = yesterday. null = never practiced.
   */
  daysSinceLastPractice: number | null;
  /** At least one care event today (UTC date match). */
  caredToday: boolean;
}

/**
 * Mood precedence — practice drives mood, care is flavor (panel-mandated):
 * care alone can never lift mood, so a snack cannot mask a week of absence
 * and pet affection is not purchasable without practice.
 */
export function derivePetMood(inputs: PetMoodInputs): PetMood {
  const { practicedToday, daysSinceLastPractice, caredToday } = inputs;
  if (practicedToday && caredToday) return "excited";
  if (practicedToday || daysSinceLastPractice === 1) return "happy";
  // Never practiced: welcoming prompt toward the first practice, not "resting".
  if (daysSinceLastPractice === null || daysSinceLastPractice === 2) return "hungry";
  return "sleepy";
}

/** UTC calendar-day difference between two ISO date strings (YYYY-MM-DD). */
export function daysBetweenUTC(fromDate: string, toDate: string): number {
  const from = Date.UTC(
    Number(fromDate.slice(0, 4)),
    Number(fromDate.slice(5, 7)) - 1,
    Number(fromDate.slice(8, 10)),
  );
  const to = Date.UTC(
    Number(toDate.slice(0, 4)),
    Number(toDate.slice(5, 7)) - 1,
    Number(toDate.slice(8, 10)),
  );
  return Math.round((to - from) / 86_400_000);
}

/** Small deterministic string hash (FNV-1a); stable across sessions and platforms. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * The pet's daily want. Deterministic per (student, UTC date) — same child,
 * same day, same want on every render (R24: no Math.random in child paths).
 */
export function pickDailyWant(studentId: string, dateStr: string): CareVerb {
  return CARE_VERBS[hashString(`${studentId}:${dateStr}`) % CARE_VERBS.length];
}

/**
 * Deterministic pick from a list — the detoxified variable reward (research
 * spec §3): WHICH good thing varies day to day, WHETHER it is good never does.
 */
export function pickFromList<T>(seed: string, list: T[]): T {
  return list[hashString(seed) % list.length];
}
