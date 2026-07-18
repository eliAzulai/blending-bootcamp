import { describe, expect, it } from "vitest";
import {
  BANNED_ONSET_SPELLINGS,
  HUNT_ROUNDS,
  ROUNDS_PER_DAY,
  pickDailyRounds,
} from "./letter-hunt";

/**
 * R13 curation audit — the content IS the contract. Every rule here traces to
 * the 2026-07-13 reward-system spec's Letter Hunt curation section.
 */
describe("Letter Hunt content curation (R13)", () => {
  it("has rounds and unique ids", () => {
    expect(HUNT_ROUNDS.length).toBeGreaterThanOrEqual(ROUNDS_PER_DAY);
    const ids = HUNT_ROUNDS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const round of HUNT_ROUNDS) {
    describe(`round ${round.id} (target /${round.letter}/)`, () => {
      it("target is a v1-safe unambiguous onset letter", () => {
        expect("mstbpdfhlnrw").toContain(round.letter);
      });

      it("every item's onset annotation equals its first letter (curation invariant)", () => {
        for (const i of round.items) expect(i.onset).toBe(i.word[0]);
      });

      it("words are lowercase a-z only, with one unambiguous name", () => {
        for (const i of round.items) expect(i.word).toMatch(/^[a-z]+$/);
      });

      it("no banned digraph/blend onset spellings anywhere in the field", () => {
        for (const i of round.items) {
          for (const banned of BANNED_ONSET_SPELLINGS) {
            expect(i.word.startsWith(banned)).toBe(false);
          }
        }
      });

      it("declared matchCount equals actual matches, and field has 8 items", () => {
        const matches = round.items.filter((i) => i.onset === round.letter);
        expect(matches.length).toBe(round.matchCount);
        expect(round.items.length).toBe(8);
      });

      it("distractors never share the target letter (nor, by invariant, its sound)", () => {
        const distractors = round.items.filter((i) => i.onset !== round.letter);
        for (const d of distractors) {
          expect(d.word.startsWith(round.letter)).toBe(false);
        }
      });

      it("no duplicate pictures within a round", () => {
        const words = round.items.map((i) => i.word);
        expect(new Set(words).size).toBe(words.length);
        const emoji = round.items.map((i) => i.emoji);
        expect(new Set(emoji).size).toBe(emoji.length);
      });
    });
  }
});

describe("pickDailyRounds — deterministic per UTC date (R24)", () => {
  it("same date always gives the same rounds", () => {
    const a = pickDailyRounds("2026-07-13").map((r) => r.id);
    const b = pickDailyRounds("2026-07-13").map((r) => r.id);
    expect(a).toEqual(b);
  });

  it(`returns exactly ${ROUNDS_PER_DAY} rounds with distinct letters`, () => {
    const rounds = pickDailyRounds("2026-07-13");
    expect(rounds.length).toBe(ROUNDS_PER_DAY);
    expect(new Set(rounds.map((r) => r.letter)).size).toBe(ROUNDS_PER_DAY);
  });

  it("consecutive days see different round sets before the cycle repeats", () => {
    const day1 = pickDailyRounds("2026-07-13").map((r) => r.id).join(",");
    const day2 = pickDailyRounds("2026-07-14").map((r) => r.id).join(",");
    expect(day1).not.toBe(day2);
  });
});
