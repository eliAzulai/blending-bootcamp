import { describe, expect, it } from "vitest";
import { buildRoutine, pickWarmupSounds, splitSentences } from "./routine";

const PASSAGE =
  "The cat sat on the mat. The cat had a big hat. The hat was red and fat. The cat likes the hat a lot!";

describe("splitSentences", () => {
  it("splits a fixture passage into its sentences", () => {
    const s = splitSentences(PASSAGE);
    expect(s).toHaveLength(4);
    expect(s[0]).toBe("The cat sat on the mat.");
    expect(s[3]).toBe("The cat likes the hat a lot!");
  });

  it("handles a single sentence without trailing whitespace", () => {
    expect(splitSentences("Run fox run.")).toEqual(["Run fox run."]);
  });

  it("does not split after common abbreviations", () => {
    expect(splitSentences("Mr. Smith went home. He was tired.")).toEqual([
      "Mr. Smith went home.",
      "He was tired.",
    ]);
  });

  it("handles an abbreviation mid-sentence", () => {
    expect(splitSentences("He saw Dr. Lee. Then he ran.")).toEqual([
      "He saw Dr. Lee.",
      "Then he ran.",
    ]);
  });
});

describe("pickWarmupSounds", () => {
  it("picks the first three distinct starting letters", () => {
    expect(pickWarmupSounds(PASSAGE)).toEqual(["t", "c", "s"]);
  });
});

describe("buildRoutine", () => {
  const routine = buildRoutine({
    childName: "Maya",
    passageText: PASSAGE,
    warmupSounds: ["t", "c", "s"],
  });

  it("queues greeting, warmups, one step per sentence, and finish", () => {
    expect(routine.map((s) => s.type)).toEqual([
      "greeting",
      "warmup_sound",
      "warmup_sound",
      "warmup_sound",
      "read_sentence",
      "read_sentence",
      "read_sentence",
      "read_sentence",
      "finish",
    ]);
  });

  it("only read_sentence steps record", () => {
    for (const step of routine) {
      expect(step.records).toBe(step.type === "read_sentence");
    }
  });

  it("read_sentence steps carry the sentence text and index", () => {
    const reads = routine.filter((s) => s.type === "read_sentence");
    expect(reads[0].target).toBe("The cat sat on the mat.");
    expect(reads[0].sentenceIndex).toBe(0);
    expect(reads[3].sentenceIndex).toBe(3);
  });

  it("greets and praises the child by name", () => {
    expect(routine[0].buddyLine).toContain("Maya");
    expect(routine[routine.length - 1].buddyLine).toContain("Maya");
  });

  it("throws on a passage with no sentences", () => {
    expect(() =>
      buildRoutine({ childName: "X", passageText: "   ", warmupSounds: [] }),
    ).toThrow(/no sentences/);
  });
});
