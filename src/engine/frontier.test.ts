import { describe, it, expect } from "vitest";
import { computeFrontier } from "./frontier";
import { linearGraph } from "./test-helpers";
import { blankState, type KnowledgeState } from "./types";

function states(map: Record<string, KnowledgeState["status"]>): KnowledgeState[] {
  return Object.entries(map).map(([conceptId, status]) => ({
    ...blankState(conceptId),
    status,
  }));
}

describe("computeFrontier", () => {
  it("returns only roots when nothing is mastered", () => {
    const frontier = computeFrontier(linearGraph, states({}));
    expect(frontier).toEqual(["at"]); // 'it' and 'op' have unmet prereqs
  });

  it("advances the frontier as prereqs are mastered", () => {
    const frontier = computeFrontier(linearGraph, states({ at: "mastered" }));
    expect(frontier).toEqual(["it"]);
  });

  it("excludes already-mastered concepts", () => {
    const frontier = computeFrontier(
      linearGraph,
      states({ at: "mastered", it: "mastered" }),
    );
    expect(frontier).toEqual(["op"]);
  });

  it("is empty when everything is mastered", () => {
    const frontier = computeFrontier(
      linearGraph,
      states({ at: "mastered", it: "mastered", op: "mastered" }),
    );
    expect(frontier).toEqual([]);
  });
});
