import type { KnowledgeState, Scheduler } from "./types";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Deterministic v0 scheduler: interval doubles on success, resets to 1 day on
 * failure. Swappable for FSRS (ts-fsrs) later via the Scheduler interface.
 */
export class SimpleScheduler implements Scheduler {
  schedule(state: KnowledgeState, correct: boolean, now: number): KnowledgeState {
    const nextInterval = correct
      ? state.intervalMs === 0
        ? DAY
        : state.intervalMs * 2
      : DAY;
    return {
      ...state,
      intervalMs: nextInterval,
      due: now + nextInterval,
      lastReview: now,
    };
  }
}
