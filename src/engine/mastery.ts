import type { ActivityResult, KnowledgeState, Scheduler } from "./types";

export const MASTERY_THRESHOLD = 3;

/**
 * Apply an activity result to a concept's state.
 * - Formative results (authoritative === false) are ignored: returns state unchanged.
 * - Authoritative results update counters, scheduling, and mastery status.
 */
export function applyResult(
  state: KnowledgeState,
  result: ActivityResult,
  now: number,
  scheduler: Scheduler,
): KnowledgeState {
  if (!result.authoritative) return state;

  const attempts = state.authoritativeAttempts + 1;
  const correct = state.authoritativeCorrect + (result.correct ? 1 : 0);

  const scheduled = scheduler.schedule(state, result.correct, now);

  const status =
    correct >= MASTERY_THRESHOLD ? "mastered" : "learning";

  return {
    ...scheduled,
    authoritativeAttempts: attempts,
    authoritativeCorrect: correct,
    status,
  };
}
