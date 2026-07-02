import { describe, it, expect } from "vitest";
import { ITEM_BANK } from "./words";
import { readingGraph } from "./graph";

describe("reading item bank", () => {
  const conceptIds = readingGraph.nodes.map((n) => n.id);

  it("covers every concept with 4-6 words (C3)", () => {
    expect(Object.keys(ITEM_BANK).sort()).toEqual([...conceptIds].sort());
    for (const id of conceptIds) {
      expect(ITEM_BANK[id].length).toBeGreaterThanOrEqual(4);
      expect(ITEM_BANK[id].length).toBeLessThanOrEqual(6);
    }
  });

  it("every word is a 3-letter word ending in its family rime (C3)", () => {
    for (const id of conceptIds) {
      for (const { word } of ITEM_BANK[id]) {
        expect(word).toMatch(/^[a-z]{3}$/);
        expect(word.endsWith(id)).toBe(true);
      }
    }
  });

  it("every word is beginner-decodable: single letters only, no digraph phonemes (R2)", () => {
    for (const id of conceptIds) {
      for (const { word, phonemes } of ITEM_BANK[id]) {
        expect(phonemes).toHaveLength(3);
        expect(phonemes.join("")).toBe(word);
        for (const p of phonemes) expect(p).toHaveLength(1);
      }
    }
  });

  it("has no duplicate words across the bank", () => {
    const all = Object.values(ITEM_BANK).flat().map((w) => w.word);
    expect(new Set(all).size).toBe(all.length);
  });

  it("accept lists never contain the word itself", () => {
    for (const words of Object.values(ITEM_BANK)) {
      for (const { word, accept } of words) expect(accept).not.toContain(word);
    }
  });
});
