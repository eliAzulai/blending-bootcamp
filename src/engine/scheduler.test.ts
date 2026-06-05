import { describe, it, expect } from "vitest";
import { SimpleScheduler } from "./scheduler";
import { blankState } from "./types";

const DAY = 24 * 60 * 60 * 1000;

describe("SimpleScheduler", () => {
  const sched = new SimpleScheduler();

  it("sets a 1-day interval on first correct review", () => {
    const next = sched.schedule(blankState("at"), true, 0);
    expect(next.intervalMs).toBe(DAY);
    expect(next.due).toBe(DAY);
    expect(next.lastReview).toBe(0);
  });

  it("doubles the interval on subsequent correct reviews", () => {
    const first = sched.schedule(blankState("at"), true, 0);
    const second = sched.schedule(first, true, first.due!);
    expect(second.intervalMs).toBe(2 * DAY);
    expect(second.due).toBe(first.due! + 2 * DAY);
  });

  it("resets the interval to 1 day on an incorrect review", () => {
    const grown = { ...blankState("at"), intervalMs: 8 * DAY, due: 8 * DAY };
    const next = sched.schedule(grown, false, 8 * DAY);
    expect(next.intervalMs).toBe(DAY);
    expect(next.due).toBe(9 * DAY);
  });
});
