/**
 * Spike measurement: how well does ASR verdict agree with adult ground truth?
 * detectionRate  = of the words the adult marked as real errors, how many did ASR flag?
 * falseAlarmRate = of the words the adult marked correctly read, how many did ASR wrongly flag?
 */
import type { WordVerdict } from "./alignment";

export interface GradedWord {
  word: string;
  asrVerdict: WordVerdict;
  /** Ground truth from the adult grader */
  adultVerdict: "correct" | "error";
}

export interface ExportedWord extends GradedWord {
  heard: string | null;
}

export interface SessionExport {
  /** Initials only — never a full name (privacy) */
  childAlias: string;
  passageId: string;
  date: string;
  sentences: {
    sentenceIndex: number;
    target: string;
    transcript: string;
    words: ExportedWord[];
  }[];
}

export interface SpikeMetrics {
  totalWords: number;
  adultErrors: number;
  detected: number;
  missed: number;
  falseAlarms: number;
  detectionRate: number | null;
  falseAlarmRate: number | null;
}

export function wordsFromSessions(sessions: SessionExport[]): GradedWord[] {
  return sessions.flatMap((s) => s.sentences.flatMap((sen) => sen.words));
}

export function computeMetrics(words: GradedWord[]): SpikeMetrics {
  const totalWords = words.length;
  const flagged = (w: GradedWord) => w.asrVerdict !== "read";
  const adultErrors = words.filter((w) => w.adultVerdict === "error").length;
  const adultCorrect = totalWords - adultErrors;
  const detected = words.filter(
    (w) => w.adultVerdict === "error" && flagged(w),
  ).length;
  const falseAlarms = words.filter(
    (w) => w.adultVerdict === "correct" && flagged(w),
  ).length;
  return {
    totalWords,
    adultErrors,
    detected,
    missed: adultErrors - detected,
    falseAlarms,
    detectionRate: adultErrors > 0 ? detected / adultErrors : null,
    falseAlarmRate: adultCorrect > 0 ? falseAlarms / adultCorrect : null,
  };
}
