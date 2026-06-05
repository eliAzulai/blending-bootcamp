import { describe, it, expect } from "vitest";
import { validateGraph } from "./validate";
import { linearGraph } from "./test-helpers";
import type { ConceptGraph } from "./types";

describe("validateGraph", () => {
  it("accepts a valid linear graph", () => {
    expect(() => validateGraph(linearGraph)).not.toThrow();
  });

  it("throws when an edge references a node that does not exist", () => {
    const graph: ConceptGraph = {
      nodes: [{ id: "at", subject: "reading", title: "-at family" }],
      edges: [{ conceptId: "at", requiresId: "ghost" }],
    };
    expect(() => validateGraph(graph)).toThrow(/ghost/);
  });

  it("throws when the prerequisite graph contains a cycle", () => {
    const graph: ConceptGraph = {
      nodes: [
        { id: "a", subject: "reading", title: "A" },
        { id: "b", subject: "reading", title: "B" },
      ],
      edges: [
        { conceptId: "a", requiresId: "b" },
        { conceptId: "b", requiresId: "a" },
      ],
    };
    expect(() => validateGraph(graph)).toThrow(/cycle/i);
  });
});
