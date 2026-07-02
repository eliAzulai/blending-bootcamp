/**
 * Authoritative word matcher (spec A2). Deliberately strict: exact token or
 * curated accept-list ONLY. No edit distance, no child substitutions, no
 * accept-any tier — on 3-letter words those pass wrong readings ("bat" for
 * "cat") and poison the mastery signal. The lenient matcher in
 * src/lib/phoneme-matching.ts stays untouched for Phase 1a activities.
 */

export interface StrictMatch {
  matched: boolean;
  /** 1.0 exact, 0.9 accept-list, 0 otherwise. */
  score: number;
}

export function matchWordStrict(
  expected: string,
  accept: string[],
  transcripts: string[],
): StrictMatch {
  const target = expected.toLowerCase().trim();
  const acceptSet = new Set(accept.map((a) => a.toLowerCase().trim()));

  for (const raw of transcripts) {
    const tokens = raw
      .toLowerCase()
      .replace(/[^a-z' ]/g, "")
      .split(/\s+/)
      .filter(Boolean);
    if (tokens.includes(target)) return { matched: true, score: 1.0 };
    if (tokens.some((t) => acceptSet.has(t))) return { matched: true, score: 0.9 };
  }
  return { matched: false, score: 0 };
}
