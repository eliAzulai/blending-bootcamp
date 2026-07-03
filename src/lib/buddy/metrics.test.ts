import { describe, expect, it } from "vitest";
import {
  computeMetrics,
  parseSessionExport,
  wordsFromSessions,
  type GradedWord,
  type SessionExport,
} from "./metrics";

const words: GradedWord[] = [
  // adult says error, ASR flagged → detected
  { word: "ship", asrVerdict: "misread", adultVerdict: "error" },
  { word: "big", asrVerdict: "skipped", adultVerdict: "error" },
  // adult says error, ASR said read → missed
  { word: "was", asrVerdict: "read", adultVerdict: "error" },
  // adult says correct, ASR flagged → false alarm
  { word: "the", asrVerdict: "misread", adultVerdict: "correct" },
  // adult says correct, ASR agrees → true negative
  { word: "cat", asrVerdict: "read", adultVerdict: "correct" },
  { word: "sat", asrVerdict: "read", adultVerdict: "correct" },
];

describe("computeMetrics", () => {
  const m = computeMetrics(words);

  it("counts totals and adult-marked errors", () => {
    expect(m.totalWords).toBe(6);
    expect(m.adultErrors).toBe(3);
  });

  it("computes detection: detected, missed, detectionRate", () => {
    expect(m.detected).toBe(2);
    expect(m.missed).toBe(1);
    expect(m.detectionRate).toBeCloseTo(2 / 3);
  });

  it("computes false alarms against correctly-read words", () => {
    expect(m.falseAlarms).toBe(1);
    expect(m.falseAlarmRate).toBeCloseTo(1 / 3);
  });

  it("returns null rates when denominators are zero", () => {
    const empty = computeMetrics([]);
    expect(empty.detectionRate).toBeNull();
    expect(empty.falseAlarmRate).toBeNull();
  });
});

describe("wordsFromSessions", () => {
  it("flattens all sentences from all sessions", () => {
    const session: SessionExport = {
      childAlias: "M",
      passageId: "read-aloud-cat-hat",
      date: "2026-07-06",
      sentences: [
        {
          sentenceIndex: 0,
          target: "The cat sat.",
          transcript: "the cat sat",
          words: [
            { word: "the", heard: "the", asrVerdict: "read", adultVerdict: "correct" },
            { word: "cat", heard: "cat", asrVerdict: "read", adultVerdict: "correct" },
            { word: "sat", heard: "sat", asrVerdict: "read", adultVerdict: "correct" },
          ],
        },
      ],
    };
    expect(wordsFromSessions([session, session])).toHaveLength(6);
  });
});

describe("parseSessionExport", () => {
  const valid = {
    childAlias: "M",
    passageId: "p",
    date: "2026-07-06",
    sentences: [
      {
        sentenceIndex: 0,
        target: "The cat sat.",
        transcript: "the cat sat",
        words: [
          { word: "the", heard: "the", asrVerdict: "read", adultVerdict: "correct" },
        ],
      },
    ],
  };

  it("accepts a valid export and returns it typed", () => {
    expect(parseSessionExport(valid).childAlias).toBe("M");
  });

  it("rejects a typo'd adultVerdict with a specific reason", () => {
    const bad = structuredClone(valid);
    (bad.sentences[0].words[0] as { adultVerdict: string }).adultVerdict = "eror";
    expect(() => parseSessionExport(bad)).toThrow(/adultVerdict invalid: eror/);
  });

  it("rejects a missing words array", () => {
    const bad = structuredClone(valid) as Record<string, unknown>;
    delete (bad.sentences as Record<string, unknown>[])[0].words;
    expect(() => parseSessionExport(bad)).toThrow(/words missing/);
  });

  it("rejects non-object input", () => {
    expect(() => parseSessionExport("[]")).toThrow(/not an object/);
  });
});
