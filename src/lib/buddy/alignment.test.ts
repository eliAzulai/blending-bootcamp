import { describe, expect, it } from "vitest";
import { alignWords, normalizeWord, tokenize } from "./alignment";

describe("normalizeWord", () => {
  it("lowercases and strips punctuation, keeping apostrophes", () => {
    expect(normalizeWord("Cat!")).toBe("cat");
    expect(normalizeWord("don't")).toBe("don't");
    expect(normalizeWord("mat.")).toBe("mat");
  });
});

describe("tokenize", () => {
  it("splits on whitespace and drops empty tokens", () => {
    expect(tokenize("The cat sat.  ")).toEqual(["the", "cat", "sat"]);
  });
});

describe("alignWords", () => {
  it("marks every word read when transcript matches exactly", () => {
    const result = alignWords("The cat sat on the mat.", "the cat sat on the mat");
    expect(result).toHaveLength(6);
    expect(result.every((w) => w.verdict === "read")).toBe(true);
  });

  it("marks a substituted word as misread with the heard token", () => {
    const result = alignWords("I see a ship.", "i see a sip");
    expect(result[3]).toEqual({ word: "ship", verdict: "misread", heard: "sip" });
    expect(result[0].verdict).toBe("read");
  });

  it("marks a missing word as skipped", () => {
    const result = alignWords("The big red hat.", "the red hat");
    expect(result[1]).toEqual({ word: "big", verdict: "skipped", heard: null });
    expect(result[2].verdict).toBe("read");
  });

  it("ignores extra inserted words in the transcript", () => {
    const result = alignWords("The cat sat.", "um the cat sat");
    expect(result.map((w) => w.verdict)).toEqual(["read", "read", "read"]);
  });

  it("handles an empty transcript as all skipped", () => {
    const result = alignWords("Run fox run.", "");
    expect(result.every((w) => w.verdict === "skipped")).toBe(true);
  });
});
