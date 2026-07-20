import { describe, expect, it } from "vitest";
import {
  computeMetrics,
  evaluateGate,
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

describe("evaluateGate", () => {
  /** n graded words with the given verdicts, distinct word labels */
  const graded = (
    n: number,
    asrVerdict: GradedWord["asrVerdict"],
    adultVerdict: GradedWord["adultVerdict"],
  ): GradedWord[] =>
    Array.from({ length: n }, (_, i) => ({
      word: `w${asrVerdict}-${adultVerdict}-${i}`,
      asrVerdict,
      adultVerdict,
    }));

  it("GREEN exactly at the 70% detection / 10% false-alarm boundary", () => {
    // 10 adult errors: 7 flagged (detected), 3 read (missed) → detection 7/10
    // 10 adult correct: 1 flagged (false alarm), 9 read → false alarms 1/10
    const m = computeMetrics([
      ...graded(7, "misread", "error"),
      ...graded(3, "read", "error"),
      ...graded(1, "misread", "correct"),
      ...graded(9, "read", "correct"),
    ]);
    expect(m.detectionRate).toBeCloseTo(0.7);
    expect(m.falseAlarmRate).toBeCloseTo(0.1);
    expect(evaluateGate(m)).toBe("GREEN");
  });

  it("YELLOW when detection is below 70% but false alarms stay low", () => {
    // detection 1/2 = 50%, false alarms 0/8 = 0%
    const m = computeMetrics([
      ...graded(1, "skipped", "error"),
      ...graded(1, "read", "error"),
      ...graded(8, "read", "correct"),
    ]);
    expect(evaluateGate(m)).toBe("YELLOW");
  });

  it("RED when false alarms exceed 10%, even with perfect detection", () => {
    // detection 2/2 = 100%, false alarms 2/10 = 20%
    const m = computeMetrics([
      ...graded(2, "misread", "error"),
      ...graded(2, "misread", "correct"),
      ...graded(8, "read", "correct"),
    ]);
    expect(evaluateGate(m)).toBe("RED");
  });

  it("INSUFFICIENT when a rate has no denominator yet", () => {
    expect(evaluateGate(computeMetrics([]))).toBe("INSUFFICIENT");
    // graded words but no adult-marked errors → detectionRate null
    expect(evaluateGate(computeMetrics(graded(5, "read", "correct")))).toBe(
      "INSUFFICIENT",
    );
  });
});
