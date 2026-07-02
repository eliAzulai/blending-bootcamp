import type { ActivityMode, ConceptGraph, KnowledgeState } from "./types";
import { computeFrontier } from "./frontier";

export interface NextPick {
  conceptId: string;
  mode: ActivityMode;
}

export function selectNext(
  graph: ConceptGraph,
  states: KnowledgeState[],
  now: number,
): NextPick | null {
  // 1. Reviews owed: learning + due.
  const due = states
    .filter((s) => s.status === "learning" && s.due !== null && s.due <= now)
    .sort((a, b) => (a.due! - b.due!) || a.conceptId.localeCompare(b.conceptId));
  if (due.length > 0) {
    return { conceptId: due[0].conceptId, mode: "review" };
  }

  // 2. Otherwise learn the next frontier concept — skipping "parked" concepts
  // (learning with a future due date): their next exposure is the spaced
  // review, not more same-day checkpoints. Subject-agnostic scheduling logic.
  const parked = new Set(
    states
      .filter((s) => s.status === "learning" && s.due !== null && s.due > now)
      .map((s) => s.conceptId),
  );
  const frontier = computeFrontier(graph, states).filter((id) => !parked.has(id));
  if (frontier.length > 0) {
    return { conceptId: frontier[0], mode: "learn" };
  }

  // 3. Nothing owed, nothing new: today's session is complete.
  return null;
}
