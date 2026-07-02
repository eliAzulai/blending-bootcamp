import type { ActivityResult } from "@/engine/types";

/** Deterministic tile generation (B2). No Math.random — rule R24. */
const DISTRACTOR_PREFERENCE = "srmpbtnlgdhcfwkjv".split("");

export function makeTiles(word: string): string[] {
  const letters = word.split("");
  const distractors = DISTRACTOR_PREFERENCE.filter((l) => !word.includes(l)).slice(0, 2);
  const all = [...letters, ...distractors];
  // Deterministic shuffle seeded by the word (simple LCG).
  let seed = 0;
  for (const ch of word) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  for (let i = all.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const j = seed % (i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

export interface TrayTile { id: number; letter: string; used: boolean }
export interface SlotFill { tileId: number; letter: string }
export interface BuildWordState {
  word: string;
  slots: (SlotFill | null)[];
  tray: TrayTile[];
  checks: number;
  scaffold: boolean;
}

export function initBuildWord(word: string): BuildWordState {
  return {
    word,
    slots: word.split("").map(() => null),
    tray: makeTiles(word).map((letter, id) => ({ id, letter, used: false })),
    checks: 0,
    scaffold: false,
  };
}

/** Tap a tray tile: fills the leftmost empty slot (B3). */
export function placeTile(state: BuildWordState, tileId: number): BuildWordState {
  const tile = state.tray.find((t) => t.id === tileId);
  const slotIndex = state.slots.findIndex((s) => s === null);
  if (!tile || tile.used || slotIndex === -1) return state;
  const slots = [...state.slots];
  slots[slotIndex] = { tileId, letter: tile.letter };
  const tray = state.tray.map((t) => (t.id === tileId ? { ...t, used: true } : t));
  return { ...state, slots, tray };
}

/** Tap a filled slot: returns its tile to the tray (B3). */
export function clearSlot(state: BuildWordState, slotIndex: number): BuildWordState {
  const fill = state.slots[slotIndex];
  if (!fill) return state;
  const slots = [...state.slots];
  slots[slotIndex] = null;
  const tray = state.tray.map((t) => (t.id === fill.tileId ? { ...t, used: false } : t));
  return { ...state, slots, tray };
}

export function checkWord(
  state: BuildWordState,
): { state: BuildWordState; outcome: "solved" | "wrong" | "incomplete" } {
  if (state.slots.some((s) => s === null)) return { state, outcome: "incomplete" };
  const spelled = state.slots.map((s) => s!.letter).join("");
  const checks = state.checks + 1;
  if (spelled === state.word) {
    return { state: { ...state, checks }, outcome: "solved" };
  }
  // Wrong: return all tiles; scaffold from the 2nd wrong check (B4, B5).
  const cleared: BuildWordState = {
    ...state,
    checks,
    scaffold: checks >= 2,
    slots: state.slots.map(() => null),
    tray: state.tray.map((t) => ({ ...t, used: false })),
  };
  return { state: cleared, outcome: "wrong" };
}

/** B6. `checks` = number of check presses used when finally solved. */
export function buildWordResult(
  conceptId: string,
  checks: number,
  scaffold: boolean,
): ActivityResult {
  const score = scaffold ? 0.4 : checks <= 1 ? 1.0 : 0.7;
  return { conceptId, correct: !scaffold, score, authoritative: false };
}
