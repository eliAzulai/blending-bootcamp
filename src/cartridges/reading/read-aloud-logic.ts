import type { ActivityResult } from "@/engine/types";
import type { SpeechResult } from "@/lib/speech-recognition";
import { matchWordStrict } from "./strict-match";

export interface ReadAloudState {
  conceptId: string;
  word: string;
  accept: string[];
  attempts: number;            // completed read attempts (max 2, A3)
  consecutiveFailures: number; // transcription failures in a row (max 2, A5)
}

export type ReadAloudStep =
  | { kind: "done"; result: ActivityResult }
  | { kind: "retry"; state: ReadAloudState }       // wrong read, attempt 2 available
  | { kind: "tech-retry"; state: ReadAloudState }  // transcription failed, try again
  | { kind: "aborted" };                           // 2 failures: NO result recorded

export function initReadAloud(
  conceptId: string,
  word: string,
  accept: string[],
): ReadAloudState {
  return { conceptId, word, accept, attempts: 0, consecutiveFailures: 0 };
}

export function applyListen(state: ReadAloudState, heard: SpeechResult): ReadAloudStep {
  if (heard.error) {
    const failures = state.consecutiveFailures + 1;
    if (failures >= 2) return { kind: "aborted" };
    return { kind: "tech-retry", state: { ...state, consecutiveFailures: failures } };
  }

  const match = matchWordStrict(state.word, state.accept, heard.transcripts);
  const transcript = heard.transcripts[0] ?? "";
  if (match.matched) {
    return {
      kind: "done",
      result: {
        conceptId: state.conceptId, correct: true, score: match.score,
        authoritative: true, signals: { transcript },
      },
    };
  }

  const attempts = state.attempts + 1;
  if (attempts >= 2) {
    return {
      kind: "done",
      result: {
        conceptId: state.conceptId, correct: false, score: 0,
        authoritative: true, signals: { transcript },
      },
    };
  }
  return { kind: "retry", state: { ...state, attempts, consecutiveFailures: 0 } };
}
