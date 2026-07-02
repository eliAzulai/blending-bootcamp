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

  it("breaks ties deterministically by conceptId when reviews share a due time", () => {
    // Both due at the same instant, inserted in reverse-alphabetical order.
    const it_: KnowledgeState = { ...blankState("it"), status: "learning", due: 1 * DAY };
    const at_: KnowledgeState = { ...blankState("at"), status: "learning", due: 1 * DAY };
    const pick = selectNext(linearGraph, [it_, at_], 2 * DAY);
    expect(pick).toEqual({ conceptId: "at", mode: "review" });
  });

  it("skips a parked concept (learning, not due) and returns null when nothing else is eligible", () => {
    // S1/S3: after today's checkpoint the concept is parked; with a linear
    // graph nothing else is unlocked, so the session is over for today.
    const notDue: KnowledgeState = { ...blankState("at"), status: "learning", due: 10 * DAY };
    expect(selectNext(linearGraph, [notDue], 1 * DAY)).toBeNull();
  });

  it("skips a parked concept and learns an unparked sibling instead", () => {
    // Sibling graph: 'at' and 'an' have no prereqs.
    const siblings = {
      nodes: [
        { id: "at", subject: "reading", title: "-at" },
        { id: "an", subject: "reading", title: "-an" },
      ],
      edges: [],
    };
    const parkedAt: KnowledgeState = { ...blankState("at"), status: "learning", due: 10 * DAY };
    const pick = selectNext(siblings, [parkedAt], 1 * DAY);
    expect(pick).toEqual({ conceptId: "an", mode: "learn" });
  });

  it("still reviews a parked concept once it comes due", () => {
    const parked: KnowledgeState = { ...blankState("at"), status: "learning", due: 2 * DAY };
    expect(selectNext(linearGraph, [parked], 3 * DAY)).toEqual({ conceptId: "at", mode: "review" });
  });
});
