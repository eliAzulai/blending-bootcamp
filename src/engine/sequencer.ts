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
    .sort((a, b) => (a.due! - b.due!));
  if (due.length > 0) {
    return { conceptId: due[0].conceptId, mode: "review" };
  }

  // 2. Otherwise learn the next frontier concept.
  const frontier = computeFrontier(graph, states);
  if (frontier.length > 0) {
    return { conceptId: frontier[0], mode: "learn" };
  }

  // 3. Nothing owed, nothing new.
  return null;
}
