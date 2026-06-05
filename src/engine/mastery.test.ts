import { describe, it, expect } from "vitest";
import { applyResult, MASTERY_THRESHOLD } from "./mastery";
import { SimpleScheduler } from "./scheduler";
import { blankState, type ActivityResult } from "./types";

const sched = new SimpleScheduler();

function authoritative(correct: boolean): ActivityResult {
  return { conceptId: "at", correct, score: correct ? 1 : 0, authoritative: true };
}

describe("applyResult", () => {
  it("ignores formative results entirely", () => {
    const before = blankState("at");
    const after = applyResult(before, { ...authoritative(true), authoritative: false }, 0, sched);
    expect(after).toEqual(before);
  });

  it("moves unseen -> learning on first authoritative attempt", () => {
    const after = applyResult(blankState("at"), authoritative(true), 0, sched);
    expect(after.status).toBe("learning");
    expect(after.authoritativeAttempts).toBe(1);
    expect(after.authoritativeCorrect).toBe(1);
    expect(after.due).not.toBeNull();
  });

  it("masters after THRESHOLD correct authoritative reviews", () => {
    let s = blankState("at");
    let now = 0;
    for (let i = 0; i < MASTERY_THRESHOLD; i++) {
      s = applyResult(s, authoritative(true), now, sched);
      now = s.due!;
    }
    expect(s.status).toBe("mastered");
    expect(s.authoritativeCorrect).toBe(MASTERY_THRESHOLD);
  });

  it("does not count incorrect attempts toward mastery", () => {
    let s = applyResult(blankState("at"), authoritative(true), 0, sched);
    s = applyResult(s, authoritative(false), s.due!, sched);
    expect(s.authoritativeCorrect).toBe(1);
    expect(s.authoritativeAttempts).toBe(2);
    expect(s.status).toBe("learning");
  });
});
