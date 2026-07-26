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
  //
  // HOSTING CONSTRAINT (global engine behavior, not cartridge-tunable): any
  // cartridge whose activities are ALL authoritative gets at most one attempt
  // per concept per rolling 24h — the first result parks the concept until
  // its due date. On a narrow linear concept graph this can drain the
  // frontier after a single activity and yield null (session over). The
  // engine is therefore intended to host cartridges with wide-enough
  // frontiers AND formative (non-authoritative) activities between
  // checkpoints, so a session always has non-parked work to serve. Revisit
  // with day-granular due dates when a persistent store lands.
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
