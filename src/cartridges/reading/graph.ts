import type { ConceptGraph, ConceptNode, PrereqEdge } from "@/engine/types";

/** Teaching order per spec C1: short a → i → o → u → e. */
export const VOWEL_GROUPS: string[][] = [
  ["at", "an", "ap", "ag"],
  ["it", "in", "ig", "ip"],
  ["op", "ot", "og"],
  ["ug", "un", "ut"],
  ["et", "en", "ed"],
];

const nodes: ConceptNode[] = VOWEL_GROUPS.flat().map((rime) => ({
  id: rime,
  subject: "reading",
  title: `-${rime} family`,
}));

// C2: every family in group N+1 requires every family in group N. Siblings
// share no edges, keeping the frontier 3-4 wide.
const edges: PrereqEdge[] = [];
for (let g = 1; g < VOWEL_GROUPS.length; g++) {
  for (const conceptId of VOWEL_GROUPS[g]) {
    for (const requiresId of VOWEL_GROUPS[g - 1]) {
      edges.push({ conceptId, requiresId });
    }
  }
}

export const readingGraph: ConceptGraph = { nodes, edges };
