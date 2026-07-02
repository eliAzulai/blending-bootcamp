import { describe, it, expect } from "vitest";
import {
  makeTiles,
  initBuildWord,
  placeTile,
  clearSlot,
  checkWord,
  buildWordResult,
} from "./build-word-logic";

describe("makeTiles (B2)", () => {
  it("returns the word letters plus exactly 2 distractors, deterministically", () => {
    const tiles = makeTiles("cat");
    expect(tiles).toHaveLength(5);
    expect(makeTiles("cat")).toEqual(tiles); // deterministic
    for (const l of ["c", "a", "t"]) expect(tiles).toContain(l);
    const distractors = tiles.filter((l) => !"cat".includes(l));
    expect(distractors).toHaveLength(2);
  });

  it("never picks a distractor already in the word", () => {
    for (const word of ["sun", "bed", "pig"]) {
      const distractors = makeTiles(word).filter((l) => !word.includes(l));
      expect(distractors).toHaveLength(2);
    }
  });
});

describe("build-word state machine (B3-B5)", () => {
  it("places a tapped tile in the leftmost empty slot and can return it", () => {
    let s = initBuildWord("cat");
    const tileId = s.tray.find((t) => t.letter === "t")!.id;
    s = placeTile(s, tileId);
    expect(s.slots[0]).toEqual({ tileId, letter: "t" });
    s = clearSlot(s, 0);
    expect(s.slots[0]).toBeNull();
    expect(s.tray.find((t) => t.id === tileId)!.used).toBe(false);
  });

  it("solves on a correct check", () => {
    let s = initBuildWord("cat");
    for (const letter of ["c", "a", "t"]) {
      s = placeTile(s, s.tray.find((t) => t.letter === letter && !t.used)!.id);
    }
    const r = checkWord(s);
    expect(r.outcome).toBe("solved");
  });

  it("returns all tiles on a wrong check and scaffolds after the 2nd (B4, B5)", () => {
    const s = initBuildWord("cat");
    const fillWrong = (st: typeof s) => {
      let x = st;
      for (const letter of ["t", "a", "c"]) {
        x = placeTile(x, x.tray.find((t) => t.letter === letter && !t.used)!.id);
      }
      return x;
    };
    let r = checkWord(fillWrong(s));
    expect(r.outcome).toBe("wrong");
    expect(r.state.slots.every((slot) => slot === null)).toBe(true);
    expect(r.state.scaffold).toBe(false);
    r = checkWord(fillWrong(r.state));
    expect(r.state.scaffold).toBe(true); // ghost letters now shown
  });
});

describe("buildWordResult (B6)", () => {
  it("scores 1.0 / 0.7 / 0.4 by first-check / second-check / scaffold", () => {
    expect(buildWordResult("at", 1, false)).toEqual({
      conceptId: "at", correct: true, score: 1.0, authoritative: false,
    });
    expect(buildWordResult("at", 2, false)).toEqual({
      conceptId: "at", correct: true, score: 0.7, authoritative: false,
    });
    expect(buildWordResult("at", 3, true)).toEqual({
      conceptId: "at", correct: false, score: 0.4, authoritative: false,
    });
  });
});
