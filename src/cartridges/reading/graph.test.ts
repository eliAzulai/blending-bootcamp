import { describe, it, expect } from "vitest";
import { readingGraph, VOWEL_GROUPS } from "./graph";
import { validateGraph } from "@/engine/validate";

describe("reading concept graph", () => {
  it("has exactly 17 reading concepts in the specced teaching order (C1)", () => {
    expect(readingGraph.nodes.map((n) => n.id)).toEqual([
      "at", "an", "ap", "ag",
      "it", "in", "ig", "ip",
      "op", "ot", "og",
      "ug", "un", "ut",
      "et", "en", "ed",
    ]);
    expect(readingGraph.nodes.every((n) => n.subject === "reading")).toBe(true);
  });

  it("gates every family on every family of the previous vowel group (C2)", () => {
    const requiresOf = (id: string) =>
      readingGraph.edges.filter((e) => e.conceptId === id).map((e) => e.requiresId).sort();
    expect(requiresOf("at")).toEqual([]);
    expect(requiresOf("it")).toEqual(["ag", "an", "ap", "at"]);
    expect(requiresOf("et")).toEqual(["ug", "un", "ut"]);
    expect(requiresOf("an")).toEqual([]);
    // Edge count: 4*4 + 4*3 + 3*3 + 3*3 = 46
    expect(readingGraph.edges).toHaveLength(46);
  });

  it("passes engine validation — no cycles, no dangling edges (C4)", () => {
    expect(() => validateGraph(readingGraph)).not.toThrow();
  });

  it("exposes the vowel grouping used to build the edges", () => {
    expect(VOWEL_GROUPS.flat()).toHaveLength(17);
  });
});
