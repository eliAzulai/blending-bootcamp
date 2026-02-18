/**
 * Helpers for reading and writing learner progress to localStorage.
 *
 * Data shape stored under the key "blending-bootcamp-progress":
 * {
 *   daysCompleted: number[];   // e.g. [1, 2, 3]
 *   wordsBlended: number;      // running total across all sessions
 * }
 */

const STORAGE_KEY = "blending-bootcamp-progress";

export interface Progress {
  daysCompleted: number[];
  wordsBlended: number;
}

function defaultProgress(): Progress {
  return { daysCompleted: [], wordsBlended: 0 };
}

/** Read the full progress object from localStorage. */
export function getProgress(): Progress {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Progress;
    // Basic validation
    if (!Array.isArray(parsed.daysCompleted)) return defaultProgress();
    if (typeof parsed.wordsBlended !== "number") parsed.wordsBlended = 0;
    return parsed;
  } catch {
    return defaultProgress();
  }
}

/** Persist a progress object to localStorage. */
function saveProgress(progress: Progress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage full or unavailable -- fail silently.
  }
}

/** Mark a day as complete and add the word count. */
export function markDayComplete(day: number, wordCount: number): void {
  const p = getProgress();
  if (!p.daysCompleted.includes(day)) {
    p.daysCompleted.push(day);
    p.daysCompleted.sort((a, b) => a - b);
  }
  p.wordsBlended += wordCount;
  saveProgress(p);
}

/** Return the sorted array of completed day numbers. */
export function getDaysCompleted(): number[] {
  return getProgress().daysCompleted;
}

/** Return the total number of words blended across all sessions. */
export function getWordsBlended(): number {
  return getProgress().wordsBlended;
}

/** Return the next day the learner should attempt (1-14). */
export function getCurrentDay(): number {
  const completed = getDaysCompleted();
  if (completed.length === 0) return 1;
  const max = Math.max(...completed);
  return Math.min(max + 1, 14);
}

/** Check if a day is unlocked (day 1 always unlocked, others require previous day complete). */
export function isDayUnlocked(day: number): boolean {
  if (day === 1) return true;
  return getProgress().daysCompleted.includes(day - 1);
}

/** Reset all progress — use with caution. */
export function resetProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
