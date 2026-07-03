#!/usr/bin/env npx tsx
/**
 * Aggregate graded buddy-session JSON exports into spike metrics.
 * Usage: npx tsx scripts/buddy-metrics.ts [dir-of-session-jsons]
 * Default dir: ./spike-data
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  computeMetrics,
  evaluateGate,
  parseSessionExport,
  wordsFromSessions,
  type GateResult,
  type SessionExport,
} from "../src/lib/buddy/metrics";

const dir = process.argv[2] ?? "spike-data";
let files: string[];
try {
  files = readdirSync(dir).filter((f) => f.endsWith(".json"));
} catch {
  console.error(`Cannot read directory ${dir}/ — create it and drop session JSONs inside.`);
  process.exit(1);
}
if (files.length === 0) {
  console.error(`No .json session files found in ${dir}/`);
  process.exit(1);
}

const sessions: SessionExport[] = files.map((f) => {
  const path = join(dir, f);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    console.error(`${path}: not valid JSON (${err instanceof Error ? err.message : err})`);
    process.exit(1);
  }
  try {
    return parseSessionExport(raw);
  } catch (err) {
    console.error(`${path}: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
});

// Per-file breakdown + zero-word and duplicate warnings (warn, don't exit —
// duplicates may be legitimate re-reads; the human decides).
const seenFingerprints = new Map<string, string>();
for (const [idx, session] of sessions.entries()) {
  const path = join(dir, files[idx]);
  const sessionWords = wordsFromSessions([session]);
  const errorCount = sessionWords.filter((w) => w.adultVerdict === "error").length;
  console.log(`  ${files[idx]}: ${sessionWords.length} words, ${errorCount} adult-marked errors`);
  if (sessionWords.length === 0) {
    console.warn(`WARNING: ${path}: 0 words — check this export`);
  }
  const fingerprint = JSON.stringify(session);
  const firstFile = seenFingerprints.get(fingerprint);
  if (firstFile !== undefined) {
    console.warn(
      `WARNING: ${firstFile} and ${files[idx]} contain identical session data — double-counted?`,
    );
  } else {
    seenFingerprints.set(fingerprint, files[idx]);
  }
}
console.log("");

const words = wordsFromSessions(sessions);
const m = computeMetrics(words);
const pct = (x: number | null) =>
  x === null ? "n/a" : `${(x * 100).toFixed(1)}%`;

console.log(`Sessions: ${sessions.length}`);
console.log(`Words graded: ${m.totalWords}`);
console.log(`Actual errors (adult-marked): ${m.adultErrors}`);
console.log(`  detected by ASR: ${m.detected} (detection rate ${pct(m.detectionRate)})`);
console.log(`  missed by ASR:   ${m.missed}`);
console.log(`False alarms: ${m.falseAlarms} (${pct(m.falseAlarmRate)} of correctly-read words)`);
console.log("");
console.log("Decision gates (docs/spikes/2026-07-voice-buddy-rung1.md):");
console.log("  GREEN:  detection >= 70% AND false alarms <= 10%");
console.log("  YELLOW: detection <  70% AND false alarms <= 10%");
console.log("  RED:    false alarms > 10%");

const gate = evaluateGate(m);
const GATE_NOTE: Record<GateResult, string> = {
  GREEN: "ASR good enough for gentle in-session correction — green-light rung 1.5",
  YELLOW: "flags are trustworthy but detection is weak — teacher-facing flags only",
  RED: "too many false alarms — keep buddy praise-only (R7 stands)",
  INSUFFICIENT: "not enough graded data yet — need adult-marked errors and graded words",
};
console.log("");
console.log(`RESULT: ${gate} — ${GATE_NOTE[gate]}`);
