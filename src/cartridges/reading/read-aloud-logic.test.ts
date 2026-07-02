import { describe, it, expect } from "vitest";
import { initReadAloud, applyListen } from "./read-aloud-logic";

const ok = (t: string) => ({ transcripts: [t], confidence: 1 });
const silence = { transcripts: [], confidence: 0 };
const apiError = { transcripts: [], confidence: 0, error: true };

describe("read-aloud attempt machine", () => {
  it("completes immediately on a match (A4)", () => {
    const r = applyListen(initReadAloud("at", "cat", []), ok("cat"));
    expect(r.kind).toBe("done");
    if (r.kind === "done") {
      expect(r.result).toEqual({
        conceptId: "at", correct: true, score: 1.0, authoritative: true,
        signals: { transcript: "cat" },
      });
    }
  });

  it("scores 0.9 for an accept-list match (A4)", () => {
    const r = applyListen(initReadAloud("un", "sun", ["son"]), ok("son"));
    expect(r.kind).toBe("done");
    if (r.kind === "done") expect(r.result.score).toBe(0.9);
  });

  it("offers one retry on a first no-match, fails authoritatively on the second (A3)", () => {
    const s0 = initReadAloud("at", "cat", []);
    const r1 = applyListen(s0, ok("bat"));
    expect(r1.kind).toBe("retry");
    if (r1.kind !== "retry") throw new Error("expected retry");
    const r2 = applyListen(r1.state, ok("bat"));
    expect(r2.kind).toBe("done");
    if (r2.kind === "done") {
      expect(r2.result).toEqual({
        conceptId: "at", correct: false, score: 0, authoritative: true,
        signals: { transcript: "bat" },
      });
    }
  });

  it("treats silence as a no-match attempt, not a failure", () => {
    const r = applyListen(initReadAloud("at", "cat", []), silence);
    expect(r.kind).toBe("retry");
  });

  it("a transcription failure is NOT an attempt; two aborts the activity (A5)", () => {
    const s0 = initReadAloud("at", "cat", []);
    const r1 = applyListen(s0, apiError);
    expect(r1.kind).toBe("tech-retry");
    if (r1.kind !== "tech-retry") throw new Error("expected tech-retry");
    const r2 = applyListen(r1.state, apiError);
    expect(r2.kind).toBe("aborted");
    // A failure doesn't consume a read attempt: after ONE failure, a wrong
    // read still gets its normal retry.
    const r3 = applyListen(r1.state, ok("bat"));
    expect(r3.kind).toBe("retry");
  });
});
