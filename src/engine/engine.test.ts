import { describe, it, expect } from "vitest";
import { createEngine } from "./engine";
import { MemoryStore } from "./memory-store";
import { SimpleScheduler } from "./scheduler";
import { FakeCartridge, linearGraph } from "./test-helpers";
import { MASTERY_THRESHOLD } from "./mastery";

function mutableClock(start = 0) {
  let t = start;
  return { now: () => t, set: (v: number) => (t = v) };
}

describe("createEngine (boundary / math-proof)", () => {
  it("hands out the first frontier concept as a learn activity", async () => {
    const clock = mutableClock();
    const cart = new FakeCartridge();
    const engine = createEngine(cart, new MemoryStore(), new SimpleScheduler(), clock.now);

    const req = await engine.nextActivity("child1", "reading");
    expect(req?.conceptId).toBe("at");
    // Engine asked the cartridge to build it; engine never built a payload itself.
    expect(cart.built).toHaveLength(1);
  });

  it("records authoritative results and advances mastery without reading payloads", async () => {
    const clock = mutableClock();
    const store = new MemoryStore();
    const cart = new FakeCartridge(); // default: authoritative correct
    const engine = createEngine(cart, store, new SimpleScheduler(), clock.now);

    // Master 'at' by completing THRESHOLD authoritative-correct activities.
    for (let i = 0; i < MASTERY_THRESHOLD; i++) {
      const req = await engine.nextActivity("child1", "reading");
      const result = await cart.runActivity(req!);
      await engine.recordResult("child1", result);
      clock.set(clock.now() + 100 * 24 * 60 * 60 * 1000); // jump past any due date
    }

    const mastery = await engine.masteryState("child1", "reading");
    expect(mastery.mastered).toContain("at");
  });

  it("never advances mastery from formative-only results", async () => {
    const clock = mutableClock();
    const store = new MemoryStore();
    const cart = new FakeCartridge(linearGraph, { authoritative: false });
    const engine = createEngine(cart, store, new SimpleScheduler(), clock.now);

    for (let i = 0; i < 10; i++) {
      const req = await engine.nextActivity("child1", "reading");
      const result = await cart.runActivity(req!);
      await engine.recordResult("child1", result);
    }
    const mastery = await engine.masteryState("child1", "reading");
    expect(mastery.mastered).toEqual([]);
  });
});
