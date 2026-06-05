import type { ConceptGraph } from "./types";

/**
 * Validate a concept graph before the engine drives it. Throws on structural
 * problems that would otherwise cause silent deadlock (frontier never advances):
 *   (a) an edge naming a concept/prereq id that is not a node, or
 *   (b) a cycle in the prerequisite graph.
 */
export function validateGraph(graph: ConceptGraph): void {
  const ids = new Set(graph.nodes.map((n) => n.id));

  // (a) Dangling edges.
  for (const edge of graph.edges) {
    if (!ids.has(edge.conceptId)) {
      throw new Error(
        `Invalid graph: edge references unknown conceptId "${edge.conceptId}"`,
      );
    }
    if (!ids.has(edge.requiresId)) {
      throw new Error(
        `Invalid graph: edge references unknown requiresId "${edge.requiresId}"`,
      );
    }
  }

  // (b) Cycle detection over concept -> prerequisites adjacency.
  const prereqs = new Map<string, string[]>();
  for (const node of graph.nodes) prereqs.set(node.id, []);
  for (const edge of graph.edges) {
    prereqs.get(edge.conceptId)?.push(edge.requiresId);
  }

  const visiting = new Set<string>();
  const done = new Set<string>();

  const visit = (id: string): void => {
    if (done.has(id)) return;
    if (visiting.has(id)) {
      throw new Error(`Invalid graph: prerequisite cycle through concept "${id}"`);
    }
    visiting.add(id);
    for (const next of prereqs.get(id) ?? []) visit(next);
    visiting.delete(id);
    done.add(id);
  };

  for (const node of graph.nodes) visit(node.id);
}
