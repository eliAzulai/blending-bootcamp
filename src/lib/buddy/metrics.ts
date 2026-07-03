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

/**
 * Runtime validation for session JSONs read from disk (untrusted: files are
 * hand-movable and editable). Throws with a specific reason on any shape
 * violation — a loud failure beats a silently wrong detection rate.
 */
export function parseSessionExport(json: unknown): SessionExport {
  const fail = (reason: string): never => {
    throw new Error(`invalid session export: ${reason}`);
  };
  if (typeof json !== "object" || json === null) fail("not an object");
  const s = json as Record<string, unknown>;
  if (typeof s.childAlias !== "string") fail("childAlias missing");
  if (typeof s.passageId !== "string") fail("passageId missing");
  if (typeof s.date !== "string") fail("date missing");
  if (!Array.isArray(s.sentences)) fail("sentences missing");
  for (const [i, sen] of (s.sentences as unknown[]).entries()) {
    if (typeof sen !== "object" || sen === null) fail(`sentence ${i} not an object`);
    const t = sen as Record<string, unknown>;
    if (typeof t.sentenceIndex !== "number") fail(`sentence ${i} sentenceIndex missing`);
    if (typeof t.target !== "string") fail(`sentence ${i} target missing`);
    if (typeof t.transcript !== "string") fail(`sentence ${i} transcript missing`);
    if (!Array.isArray(t.words)) fail(`sentence ${i} words missing`);
    for (const [j, word] of (t.words as unknown[]).entries()) {
      if (typeof word !== "object" || word === null) fail(`sentence ${i} word ${j} not an object`);
      const w = word as Record<string, unknown>;
      if (typeof w.word !== "string") fail(`sentence ${i} word ${j} word missing`);
      if (w.heard !== null && typeof w.heard !== "string") fail(`sentence ${i} word ${j} heard invalid`);
      if (w.asrVerdict !== "read" && w.asrVerdict !== "misread" && w.asrVerdict !== "skipped")
        fail(`sentence ${i} word ${j} asrVerdict invalid: ${String(w.asrVerdict)}`);
      if (w.adultVerdict !== "correct" && w.adultVerdict !== "error")
        fail(`sentence ${i} word ${j} adultVerdict invalid: ${String(w.adultVerdict)}`);
    }
  }
  return json as SessionExport;
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

export type GateResult = "GREEN" | "YELLOW" | "RED" | "INSUFFICIENT";

/**
 * The spike's go/no-go gate. RED outranks everything (false alarms punish
 * correct reading); INSUFFICIENT when a rate has no denominator yet.
 */
export function evaluateGate(m: SpikeMetrics): GateResult {
  if (m.detectionRate === null || m.falseAlarmRate === null) return "INSUFFICIENT";
  if (m.falseAlarmRate > 0.10) return "RED";
  return m.detectionRate >= 0.70 ? "GREEN" : "YELLOW";
}
