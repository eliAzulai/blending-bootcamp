import type { ConceptGraph, KnowledgeState } from "./types";

/**
 * The frontier = concepts not yet mastered whose every prerequisite IS mastered.
 * Order follows graph.nodes order for determinism.
 */
export function computeFrontier(
  graph: ConceptGraph,
  states: KnowledgeState[],
): string[] {
  const statusOf = new Map(states.map((s) => [s.conceptId, s.status]));
  const isMastered = (id: string) => statusOf.get(id) === "mastered";

  const prereqs = new Map<string, string[]>();
  for (const node of graph.nodes) prereqs.set(node.id, []);
  for (const edge of graph.edges) {
    prereqs.get(edge.conceptId)?.push(edge.requiresId);
  }

  return graph.nodes
    .map((n) => n.id)
    .filter((id) => !isMastered(id))
    .filter((id) => (prereqs.get(id) ?? []).every(isMastered));
}
