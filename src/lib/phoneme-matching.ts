/**
 * Fuzzy matching for phoneme and word recognition results.
 *
 * Phonemes are matched very leniently (kids age 5-7, recogniser struggles
 * with isolated sounds). Words are matched more strictly.
 */

/* ---------- Types ---------- */

export interface MatchResult {
  matched: boolean;
  confidence: "high" | "medium" | "low";
  bestTranscript: string;
}

/* ---------- Phoneme accept map ---------- */

/**
 * For each phoneme the app teaches, a list of strings the Web Speech API
 * is likely to produce when a child says that sound in isolation.
 */
const PHONEME_ACCEPT_MAP: Record<string, string[]> = {
  // Single consonants
  c: ["see", "sea", "c", "k", "key", "ski", "cee", "si", "seek"],
  s: ["s", "es", "yes", "us", "ss", "ass", "ace"],
  m: ["m", "am", "um", "em", "him", "mm", "hmm", "me"],
  h: ["h", "age", "ha", "hey", "hay", "ach", "huh"],
  b: ["b", "be", "bee", "beat", "bead", "v", "bee's"],
  f: ["f", "if", "off", "of", "eff", "enough"],
  d: ["d", "dee", "the", "de", "did", "do"],
  l: ["l", "el", "ill", "all", "elle", "hell", "al"],
  p: ["p", "pee", "pe", "pea", "pp"],
  j: ["j", "jay", "je", "day", "g", "gee"],
  r: ["r", "are", "our", "er", "or", "ah"],
  n: ["n", "in", "an", "en", "and", "end", "hen"],
  g: ["g", "gee", "ge", "ji", "key", "ghee"],
  t: ["t", "tea", "tee", "to", "too", "it", "t's"],
  w: ["w", "we", "wee", "double", "you"],
  z: ["z", "zee", "is", "zed", "z's"],
  k: ["k", "key", "okay", "k's", "cake"],
  x: ["x", "ex", "eggs", "x's"],

  // Short vowels
  a: ["a", "ah", "uh", "ha", "ay", "hey", "aah", "i"],
  i: ["i", "e", "ee", "it", "ih", "eye", "aye"],
  o: ["o", "oh", "owe", "or", "all", "awe", "ooh"],
  u: ["u", "uh", "up", "a", "ugh", "huh", "oo"],
  e: ["e", "eh", "a", "air", "yeah", "ed", "head"],

  // Digraphs — easier because they sound more like real words
  sh: ["sh", "she", "shh", "show", "shush", "ship", "shah", "shoe"],
  ch: ["ch", "chew", "chi", "check", "church", "cheese", "choose"],
  th: ["th", "the", "they", "that", "this", "thee", "think", "though"],

  // Common blends (when they appear as standalone phoneme cards)
  st: ["st", "stay", "stop", "still", "start", "east"],
  cl: ["cl", "clear", "clean", "class", "clay"],
  fr: ["fr", "free", "from", "fry", "for"],
  fl: ["fl", "fly", "flow", "floor", "flat", "flo"],
  sp: ["sp", "spy", "spin", "spot", "spa"],
  mp: ["mp", "imp", "amp", "um"],
  nd: ["nd", "and", "end", "hand"],
  lk: ["lk", "elk", "ilk", "milk", "walk"],
  ng: ["ng", "ring", "sing", "in"],
  ck: ["ck", "k", "key", "check"],
};

/* ---------- Phoneme matching ---------- */

/**
 * Match a child's spoken phoneme against expected values.
 * Three-tier approach: accept-map → first-letter → accept-any (lenient).
 */
export function matchPhoneme(
  phoneme: string,
  transcripts: string[],
  lenient = false,
): MatchResult {
  const p = phoneme.toLowerCase().trim();
  const empty: MatchResult = { matched: false, confidence: "low", bestTranscript: "" };

  if (transcripts.length === 0) return empty;

  const normalized = transcripts.map((t) =>
    t.toLowerCase().replace(/[^a-z' ]/g, "").trim(),
  );

  // Tier 1: Accept map lookup
  const acceptList = PHONEME_ACCEPT_MAP[p];
  if (acceptList) {
    for (const t of normalized) {
      // Check if any word in the transcript matches the accept list
      const words = t.split(/\s+/);
      for (const word of words) {
        if (acceptList.includes(word)) {
          return { matched: true, confidence: "high", bestTranscript: t };
        }
      }
      // Also check if the full transcript is in the accept list
      if (acceptList.includes(t)) {
        return { matched: true, confidence: "high", bestTranscript: t };
      }
    }
  }

  // Tier 2: First-letter heuristic (single-letter phonemes only)
  if (p.length === 1) {
    for (const t of normalized) {
      if (t.length > 0 && t[0] === p) {
        return { matched: true, confidence: "medium", bestTranscript: t };
      }
    }
  }

  // Tier 2b: For digraphs, check if transcript starts with the digraph
  if (p.length === 2) {
    for (const t of normalized) {
      if (t.startsWith(p)) {
        return { matched: true, confidence: "medium", bestTranscript: t };
      }
    }
  }

  // Tier 3: If lenient mode (2nd attempt), accept ANY sound
  if (lenient && normalized.some((t) => t.length > 0)) {
    return {
      matched: true,
      confidence: "low",
      bestTranscript: normalized[0],
    };
  }

  return { ...empty, bestTranscript: normalized[0] ?? "" };
}

/* ---------- Word matching ---------- */

/**
 * Match a child's spoken word against the expected word.
 * Stricter than phoneme matching but still forgiving.
 */
export function matchWord(
  expectedWord: string,
  transcripts: string[],
  lenient = false,
): MatchResult {
  const expected = expectedWord.toLowerCase().trim();
  const empty: MatchResult = { matched: false, confidence: "low", bestTranscript: "" };

  if (transcripts.length === 0) return empty;

  const normalized = transcripts.map((t) =>
    t.toLowerCase().replace(/[^a-z' ]/g, "").trim(),
  );

  // Tier 1: Exact match
  for (const t of normalized) {
    const words = t.split(/\s+/);
    if (words.includes(expected) || t === expected) {
      return { matched: true, confidence: "high", bestTranscript: t };
    }
  }

  // Tier 2: Contains match (child might say filler words)
  for (const t of normalized) {
    if (t.includes(expected)) {
      return { matched: true, confidence: "medium", bestTranscript: t };
    }
  }

  // Tier 3: Common child substitutions
  const variants = generateChildVariants(expected);
  for (const t of normalized) {
    const words = t.split(/\s+/);
    for (const variant of variants) {
      if (words.includes(variant) || t.includes(variant)) {
        return { matched: true, confidence: "medium", bestTranscript: t };
      }
    }
  }

  // Tier 4: Edit distance
  for (const t of normalized) {
    const words = t.split(/\s+/);
    for (const word of words) {
      const dist = levenshtein(expected, word);
      const maxDist = expected.length <= 3 ? 1 : 2;
      if (dist <= maxDist) {
        return { matched: true, confidence: "medium", bestTranscript: t };
      }
    }
  }

  // Tier 5: Lenient mode — accept any sound
  if (lenient && normalized.some((t) => t.length > 0)) {
    return { matched: true, confidence: "low", bestTranscript: normalized[0] };
  }

  return { ...empty, bestTranscript: normalized[0] ?? "" };
}

/* ---------- Helpers ---------- */

/** Common phonological substitutions in young children's speech. */
const SUBSTITUTIONS: [RegExp, string][] = [
  [/th/g, "f"],  // "thin" → "fin"
  [/th/g, "d"],  // "the" → "de"
  [/r/g, "w"],   // "red" → "wed"
  [/l/g, "w"],   // "leg" → "weg"
];

function generateChildVariants(word: string): string[] {
  const variants: string[] = [];
  for (const [pattern, replacement] of SUBSTITUTIONS) {
    const v = word.replace(pattern, replacement);
    if (v !== word) variants.push(v);
  }
  return variants;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
