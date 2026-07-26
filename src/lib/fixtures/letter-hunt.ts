/**
 * Letter Hunt content — hand-curated rounds for the onset-sound hunt game.
 * Source design: docs/mini-games/2026-07-06-letter-sound-mini-games.md (Game A)
 * Spec: docs/superpowers/specs/2026-07-13-wordpets-pet-reward-system-design.md
 *
 * R13-critical curation rules (enforced by letter-hunt.test.ts):
 * - v1 targets are unambiguous 1:1 sound-letter onsets only.
 * - Every item's `onset` is its first sound written as its letter; for every
 *   word in this file the onset sound IS the first letter (that is the
 *   curation invariant — no soft-c, no digraphs, no blends, no silent letters).
 * - A round's matches all have onset === target; distractors never share the
 *   target's letter (which, under the invariant, also means never its sound).
 * - Item order is fixed in data (pre-mixed by hand) — no runtime shuffle (R24).
 */

export interface HuntItem {
  emoji: string;
  /** The picture's one unambiguous common name, lowercase a-z. */
  word: string;
  /** First sound, written as a single letter. Curation invariant: === word[0]. */
  onset: string;
}

export interface HuntRound {
  id: string;
  /** Target letter (lowercase). The child hunts for this letter's SOUND. */
  letter: string;
  /** Exactly 8 items; matchCount of them have onset === letter. */
  items: HuntItem[];
  matchCount: number;
}

/** Digraph/blend/trap onsets banned from ALL v1 items (matches and distractors). */
export const BANNED_ONSET_SPELLINGS = [
  "sh", "ch", "th", "ph", "wh", "kn", "wr", "qu",
  "st", "sp", "sn", "sl", "sk", "sw", "sm", "sc",
  "bl", "br", "cl", "cr", "dr", "fl", "fr", "gl", "gr",
  "pl", "pr", "tr", "tw",
];

const item = (emoji: string, word: string): HuntItem => ({
  emoji,
  word,
  onset: word[0],
});

export const HUNT_ROUNDS: HuntRound[] = [
  {
    id: "hunt-m",
    letter: "m",
    matchCount: 3,
    items: [
      item("🌙", "moon"),
      item("🐟", "fish"),
      item("🥛", "milk"),
      item("🎩", "hat"),
      item("🐵", "monkey"),
      item("🍌", "banana"),
      item("🦁", "lion"),
      item("🚪", "door"),
    ],
  },
  {
    id: "hunt-s",
    letter: "s",
    matchCount: 3,
    items: [
      item("🧦", "sock"),
      item("🐴", "horse"),
      item("🌞", "sun"),
      item("🍋", "lemon"),
      item("🐷", "pig"),
      item("🧼", "soap"),
      item("🌈", "rainbow"),
      item("🦆", "duck"),
    ],
  },
  {
    id: "hunt-t",
    letter: "t",
    matchCount: 3,
    items: [
      item("🐢", "turtle"),
      item("🍩", "donut"),
      item("🦷", "tooth"),
      item("🥜", "nut"),
      item("⛺", "tent"),
      item("🌹", "rose"),
      item("🍉", "watermelon"),
      item("🏠", "house"),
    ],
  },
  {
    id: "hunt-b",
    letter: "b",
    matchCount: 3,
    items: [
      item("🐻", "bear"),
      item("🍕", "pizza"),
      item("⚽", "ball"),
      item("🤖", "robot"),
      item("🛏️", "bed"),
      item("🍅", "tomato"),
      item("👃", "nose"),
      item("🍃", "leaf"),
    ],
  },
  {
    id: "hunt-p",
    letter: "p",
    matchCount: 3,
    items: [
      item("🐧", "penguin"),
      item("🌙", "moon"),
      item("🎃", "pumpkin"),
      item("🦊", "fox"),
      item("🍑", "peach"),
      item("🚀", "rocket"),
      item("🐢", "turtle"),
      item("🔨", "hammer"),
    ],
  },
  {
    id: "hunt-d",
    letter: "d",
    matchCount: 3,
    items: [
      item("🐶", "dog"),
      item("🍌", "banana"),
      item("🦆", "duck"),
      item("🌞", "sun"),
      item("🍩", "donut"),
      item("🪟", "window"),
      item("🦵", "leg"),
      item("🥛", "milk"),
    ],
  },
  {
    id: "hunt-f",
    letter: "f",
    matchCount: 3,
    items: [
      item("🐟", "fish"),
      item("🎩", "hat"),
      item("🦊", "fox"),
      item("🍋", "lemon"),
      item("🔥", "fire"),
      item("🐢", "turtle"),
      item("🌹", "rose"),
      item("🛏️", "bed"),
    ],
  },
  {
    id: "hunt-h",
    letter: "h",
    matchCount: 3,
    items: [
      item("🎩", "hat"),
      item("🥜", "nut"),
      item("🐴", "horse"),
      item("🍑", "peach"),
      item("🏠", "house"),
      item("🌈", "rainbow"),
      item("🐵", "monkey"),
      item("⚽", "ball"),
    ],
  },
  {
    id: "hunt-l",
    letter: "l",
    matchCount: 3,
    items: [
      item("🦁", "lion"),
      item("🍩", "donut"),
      item("🍋", "lemon"),
      item("🐻", "bear"),
      item("🍃", "leaf"),
      item("🌞", "sun"),
      item("🔨", "hammer"),
      item("🐧", "penguin"),
    ],
  },
  {
    id: "hunt-n",
    letter: "n",
    matchCount: 3,
    items: [
      item("👃", "nose"),
      item("🥛", "milk"),
      item("🥜", "nut"),
      item("🔥", "fire"),
      item("🪺", "nest"),
      item("🎃", "pumpkin"),
      item("🚪", "door"),
      item("🦁", "lion"),
    ],
  },
  {
    id: "hunt-r",
    letter: "r",
    matchCount: 3,
    items: [
      item("🌈", "rainbow"),
      item("🧦", "sock"),
      item("🤖", "robot"),
      item("🍌", "banana"),
      item("🚀", "rocket"),
      item("🐶", "dog"),
      item("🍉", "watermelon"),
      item("🦷", "tooth"),
    ],
  },
  {
    id: "hunt-w",
    letter: "w",
    matchCount: 3,
    items: [
      item("🍉", "watermelon"),
      item("🐻", "bear"),
      item("🪟", "window"),
      item("🌙", "moon"),
      item("🪱", "worm"),
      item("🍕", "pizza"),
      item("🧼", "soap"),
      item("🎩", "hat"),
    ],
  },
];

export const ROUNDS_PER_DAY = 3;

/** UTC day number for an ISO date string (YYYY-MM-DD). */
function epochDayUTC(dateStr: string): number {
  return Math.floor(
    Date.UTC(
      Number(dateStr.slice(0, 4)),
      Number(dateStr.slice(5, 7)) - 1,
      Number(dateStr.slice(8, 10)),
    ) / 86_400_000,
  );
}

/**
 * The day's rounds — deterministic per UTC date (R24: same date, same rounds,
 * for every render and every child). Strides by ROUNDS_PER_DAY so consecutive
 * days see fresh letters before the cycle repeats.
 */
export function pickDailyRounds(dateStr: string): HuntRound[] {
  const start = (epochDayUTC(dateStr) * ROUNDS_PER_DAY) % HUNT_ROUNDS.length;
  return Array.from(
    { length: ROUNDS_PER_DAY },
    (_, i) => HUNT_ROUNDS[(start + i) % HUNT_ROUNDS.length],
  );
}
