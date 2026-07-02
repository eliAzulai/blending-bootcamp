import { describe, it, expect } from "vitest";
import { createEngine } from "@/engine/engine";
import { MemoryStore } from "@/engine/memory-store";
import { SimpleScheduler } from "@/engine/scheduler";
import type { ActivityRequest, ActivityResult } from "@/engine/types";
import { createReadingCartridge } from "./cartridge";
import { SessionPolicy } from "./policy";
import type { ReadingPayload } from "./types";

const DAY = 24 * 60 * 60 * 1000;

function autoPresenter(): (req: ActivityRequest) => Promise<ActivityResult> {
  // Fake UI: always succeeds — formative games solved first try,
  // read-aloud checks read correctly.
  return async (req) => {
    const p = req.payload as ReadingPayload;
    if (p.kind === "read_aloud_check") {
      return {
        conceptId: req.conceptId, correct: true, score: 1.0, authoritative: true,
      };
    }
    return { conceptId: req.conceptId, correct: true, score: 1.0, authoritative: false };
  };
}

describe("reading cartridge — full loop", () => {
  it("day 1: serves blending, build_word, then checkpoint per family, then parks it", async () => {
    const now = 0;
    const policy = new SessionPolicy({ ttsAvailable: true, micAvailable: true });
    const cartridge = createReadingCartridge(policy, autoPresenter());
    const engine = createEngine(cartridge, new MemoryStore(), new SimpleScheduler(), () => now);

    const served: string[] = [];
    for (let i = 0; i < 12; i++) {
      const req = await engine.nextActivity("kid", "reading");
      if (!req) break;
      served.push(`${req.conceptId}:${req.activityType}`);
      const result = await cartridge.runActivity(req);
      await engine.recordResult("kid", result);
    }

    expect(served).toEqual([
      "at:blending", "at:build_word", "at:read_aloud_check",
      "an:blending", "an:build_word", "an:read_aloud_check",
      "ap:blending", "ap:build_word", "ap:read_aloud_check",
      "ag:blending", "ag:build_word", "ag:read_aloud_check",
    ]);
    expect(await engine.nextActivity("kid", "reading")).toBeNull();
  });

  it("day 2+: reviews come back authoritative-only and mastery lands on day 3", async () => {
    let now = 0;
    const policy = new SessionPolicy({ ttsAvailable: true, micAvailable: true });
    const cartridge = createReadingCartridge(policy, autoPresenter());
    const engine = createEngine(cartridge, new MemoryStore(), new SimpleScheduler(), () => now);

    for (let i = 0; i < 12; i++) {
      const req = await engine.nextActivity("kid", "reading");
      const result = await cartridge.runActivity(req!);
      await engine.recordResult("kid", result);
    }
    now = 25 * 60 * 60 * 1000;
    const review = await engine.nextActivity("kid", "reading");
    expect(review!.activityType).toBe("read_aloud_check");
    for (let i = 0; i < 4; i++) {
      const req = i === 0 ? review : await engine.nextActivity("kid", "reading");
      await engine.recordResult("kid", await cartridge.runActivity(req!));
    }
    now = 4 * DAY;
    for (let i = 0; i < 4; i++) {
      const req = await engine.nextActivity("kid", "reading");
      expect(req!.activityType).toBe("read_aloud_check");
      await engine.recordResult("kid", await cartridge.runActivity(req!));
    }
    const view = await engine.masteryState("kid", "reading");
    expect(view.mastered.sort()).toEqual(["ag", "an", "ap", "at"]);
    const next = await engine.nextActivity("kid", "reading");
    expect(["it", "in", "ig", "ip"]).toContain(next!.conceptId);
  });

  it("payloads carry what each activity needs", async () => {
    const policy = new SessionPolicy({ ttsAvailable: true, micAvailable: true });
    const cartridge = createReadingCartridge(policy, autoPresenter());
    const blending = cartridge.buildActivity("at", "learn");
    const bp = blending.payload as ReadingPayload;
    expect(bp.kind).toBe("blending");
    if (bp.kind === "blending") expect(bp.words).toHaveLength(2); // P6: 2 words per rep
    expect(bp.mode).toBe("learn"); // F3: payload carries true learn/review mode
    policy.recordCompleted("at");
    const bw = cartridge.buildActivity("at", "learn").payload as ReadingPayload;
    expect(bw.kind).toBe("build_word");
    if (bw.kind === "build_word") expect(bw.tiles).toHaveLength(5);
    expect(bw.mode).toBe("learn");
    policy.recordCompleted("at");
    const ra = cartridge.buildActivity("at", "learn").payload as ReadingPayload;
    expect(ra.kind).toBe("read_aloud_check");
    if (ra.kind === "read_aloud_check") expect(typeof ra.word).toBe("string");
    expect(ra.mode).toBe("learn");
  });
});
