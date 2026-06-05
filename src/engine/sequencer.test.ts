import { describe, it, expect } from "vitest";
import { selectNext } from "./sequencer";
import { linearGraph } from "./test-helpers";
import { blankState, type KnowledgeState } from "./types";

const DAY = 24 * 60 * 60 * 1000;

describe("selectNext", () => {
  it("picks the first frontier concept to learn when nothing is due", () => {
    const pick = selectNext(linearGraph, [], 0);
    expect(pick).toEqual({ conceptId: "at", mode: "learn" });
  });

  it("prefers a due review over learning something new", () => {
    const learningAt: KnowledgeState = {
      ...blankState("at"),
      status: "learning",
      due: 1 * DAY,
    };
    const pick = selectNext(linearGraph, [learningAt], 2 * DAY);
    expect(pick).toEqual({ conceptId: "at", mode: "review" });
  });

  it("returns the earliest-due review when several are due", () => {
    const a: KnowledgeState = { ...blankState("at"), status: "learning", due: 3 * DAY };
    const b: KnowledgeState = { ...blankState("it"), status: "learning", due: 1 * DAY };
    const pick = selectNext(linearGraph, [a, b], 5 * DAY);
    expect(pick).toEqual({ conceptId: "it", mode: "review" });
  });

  it("returns null when nothing is due and all concepts are mastered", () => {
    const mastered = ["at", "it", "op"].map((id) => ({
      ...blankState(id),
      status: "mastered" as const,
    }));
    expect(selectNext(linearGraph, mastered, 99 * DAY)).toBeNull();
  });

  it("re-offers a not-yet-due learning concept as a learn activity (never a review)", () => {
    const notDue: KnowledgeState = { ...blankState("at"), status: "learning", due: 10 * DAY };
    // 'at' is learning but not yet due, so it is NOT a review. It is still on the
    // frontier (not mastered, no unmet prereqs), so the child keeps practising it.
    // 'it'/'op' stay blocked because 'at' isn't mastered.
    const pick = selectNext(linearGraph, [notDue], 1 * DAY);
    expect(pick).toEqual({ conceptId: "at", mode: "learn" });
  });
});
