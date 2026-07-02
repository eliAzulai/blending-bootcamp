import { describe, it, expect } from "vitest";
import { matchWordStrict } from "./strict-match";

describe("matchWordStrict", () => {
  it("passes an exact token match with score 1.0", () => {
    expect(matchWordStrict("cat", [], ["cat"])).toEqual({ matched: true, score: 1.0 });
    expect(matchWordStrict("cat", [], ["the cat"])).toEqual({ matched: true, score: 1.0 });
  });

  it("normalizes case and punctuation", () => {
    expect(matchWordStrict("cat", [], ["Cat!"])).toEqual({ matched: true, score: 1.0 });
  });

  it("passes an accept-list entry with score 0.9", () => {
    expect(matchWordStrict("sun", ["son"], ["son"])).toEqual({ matched: true, score: 0.9 });
  });

  it("REJECTS near-misses that lenient matchWord would pass", () => {
    expect(matchWordStrict("cat", [], ["bat"]).matched).toBe(false);
    expect(matchWordStrict("at", [], ["that"]).matched).toBe(false);
    expect(matchWordStrict("red", [], ["wed"]).matched).toBe(false);
  });

  it("rejects empty and non-matching transcripts with score 0", () => {
    expect(matchWordStrict("cat", [], [])).toEqual({ matched: false, score: 0 });
    expect(matchWordStrict("cat", [], ["dog"])).toEqual({ matched: false, score: 0 });
  });
});
