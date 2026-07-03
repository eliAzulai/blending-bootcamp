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
  parseSessionExport,
  wordsFromSessions,
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
