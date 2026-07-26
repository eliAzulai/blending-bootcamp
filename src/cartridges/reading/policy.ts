import type { ActivityMode } from "@/engine/types";
import type { ReadingActivityType } from "./types";

/**
 * Session abort budget: after this many aborted checkpoints (A5 transcription
 * failures) the session ENDS instead of re-advancing. Without it, a due review
 * always rebuilds the same read_aloud_check (activityFor ignores reps in
 * review mode), so a dead transcribe endpoint would trap the child on an
 * identical screen forever. Degrading to "all done" is the safe failure mode.
 */
export const SESSION_ABORT_BUDGET = 3;

export function shouldEndSession(abortCount: number): boolean {
  return abortCount >= SESSION_ABORT_BUDGET;
}

export interface DeviceCaps {
  ttsAvailable: boolean;
  micAvailable: boolean;
}

/**
 * Session-scoped activity selection (spec P1-P6). Counters live in memory for
 * one page visit; cross-day pacing comes from the engine's parked/review
 * scheduling, not from here.
 */
export class SessionPolicy {
  private reps = new Map<string, number>();

  constructor(private caps: DeviceCaps) {}

  activityFor(conceptId: string, mode: ActivityMode): ReadingActivityType {
    if (mode === "review") {
      return this.caps.micAvailable ? "read_aloud_check" : "blending";
    }
    const rep = this.reps.get(conceptId) ?? 0;
    if (rep % 3 === 2) {
      return this.caps.micAvailable ? "read_aloud_check" : "blending";
    }
    if (rep % 3 === 1) {
      return this.caps.ttsAvailable ? "build_word" : "blending";
    }
    return "blending";
  }

  /** Call once per produced ActivityResult (P2). */
  recordCompleted(conceptId: string): void {
    this.reps.set(conceptId, (this.reps.get(conceptId) ?? 0) + 1);
  }

  /** Abandoned checkpoint (transcription failure, A5/P5): two more games first. */
  resetCycle(conceptId: string): void {
    this.reps.set(conceptId, 0);
  }

  /** Deterministic word rotation within a concept (P6). */
  wordIndexFor(conceptId: string, bankSize: number): number {
    return (this.reps.get(conceptId) ?? 0) % bankSize;
  }

  /** Completed session reps for a concept (F3 context stamping). */
  repsFor(conceptId: string): number {
    return this.reps.get(conceptId) ?? 0;
  }
}
