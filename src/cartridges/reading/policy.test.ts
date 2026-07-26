import { describe, it, expect } from "vitest";
import { SessionPolicy, shouldEndSession } from "./policy";

describe("SessionPolicy", () => {
  it("cycles blending → build_word → read_aloud_check in learn mode (P2)", () => {
    const p = new SessionPolicy({ ttsAvailable: true, micAvailable: true });
    expect(p.activityFor("at", "learn")).toBe("blending");
    p.recordCompleted("at");
    expect(p.activityFor("at", "learn")).toBe("build_word");
    p.recordCompleted("at");
    expect(p.activityFor("at", "learn")).toBe("read_aloud_check");
  });

  it("counts reps per concept independently", () => {
    const p = new SessionPolicy({ ttsAvailable: true, micAvailable: true });
    p.recordCompleted("at");
    expect(p.activityFor("at", "learn")).toBe("build_word");
    expect(p.activityFor("an", "learn")).toBe("blending");
  });

  it("always picks the authoritative check in review mode (P1)", () => {
    const p = new SessionPolicy({ ttsAvailable: true, micAvailable: true });
    expect(p.activityFor("at", "review")).toBe("read_aloud_check");
  });

  it("does not advance the cycle until an activity completes (P2)", () => {
    const p = new SessionPolicy({ ttsAvailable: true, micAvailable: true });
    expect(p.activityFor("at", "learn")).toBe("blending");
    expect(p.activityFor("at", "learn")).toBe("blending"); // buildActivity may be re-called
  });

  it("substitutes blending when TTS is unavailable (P4: no build_word)", () => {
    const p = new SessionPolicy({ ttsAvailable: false, micAvailable: true });
    p.recordCompleted("at");
    expect(p.activityFor("at", "learn")).toBe("blending");
  });

  it("substitutes blending for checks when the mic is unavailable (P4)", () => {
    const p = new SessionPolicy({ ttsAvailable: true, micAvailable: false });
    p.recordCompleted("at");
    p.recordCompleted("at");
    expect(p.activityFor("at", "learn")).toBe("blending");
    expect(p.activityFor("at", "review")).toBe("blending");
  });

  it("resets the cycle after an abandoned checkpoint (P5)", () => {
    const p = new SessionPolicy({ ttsAvailable: true, micAvailable: true });
    p.recordCompleted("at");
    p.recordCompleted("at");
    expect(p.activityFor("at", "learn")).toBe("read_aloud_check");
    p.resetCycle("at");
    expect(p.activityFor("at", "learn")).toBe("blending");
  });

  it("picks words deterministically by rotation (P6)", () => {
    const p = new SessionPolicy({ ttsAvailable: true, micAvailable: true });
    const bank = ["cat", "hat", "mat", "bat"];
    expect(p.wordIndexFor("at", bank.length)).toBe(0);
    p.recordCompleted("at");
    expect(p.wordIndexFor("at", bank.length)).toBe(1);
  });

  it("reports completed reps per concept for context stamping (F3)", () => {
    const p = new SessionPolicy({ ttsAvailable: true, micAvailable: true });
    expect(p.repsFor("at")).toBe(0);
    p.recordCompleted("at");
    expect(p.repsFor("at")).toBe(1);
    p.recordCompleted("at");
    expect(p.repsFor("at")).toBe(2);
    expect(p.repsFor("an")).toBe(0);
  });
});

describe("shouldEndSession (session abort budget)", () => {
  it("keeps the session alive under the budget", () => {
    expect(shouldEndSession(0)).toBe(false);
    expect(shouldEndSession(1)).toBe(false);
    expect(shouldEndSession(2)).toBe(false);
  });

  it("ends the session at 3 aborts — a dead transcribe endpoint must degrade to ending, not looping", () => {
    expect(shouldEndSession(3)).toBe(true);
    expect(shouldEndSession(4)).toBe(true);
  });
});
