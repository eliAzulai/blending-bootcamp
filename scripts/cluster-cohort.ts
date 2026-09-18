/**
 * Cluster cohort-1 sign-up responses into slot + reading-stage groups and
 * name the first viable cohort.
 *
 *   npx tsx scripts/cluster-cohort.ts <responses.csv> [--min 2]
 *
 * Input: the Netlify Forms CSV export of form "cohort-signup", or the
 * hand-kept sheet, with an optional `paid` column (yes/no).
 * Plan: docs/superpowers/plans/2026-09-18-wordpets-cohort-1-launch-plan.md §6
 */
import { readFileSync } from "node:fs";
import {
  parseSignupCsv,
  clusterResponses,
  firstViableCohort,
  STAGE_LABEL,
  SLOT_LABEL,
} from "../src/lib/cohort/cluster";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const minIdx = args.indexOf("--min");
const minPaid = minIdx >= 0 ? Number(args[minIdx + 1]) : 2;

if (!file) {
  console.error("usage: npx tsx scripts/cluster-cohort.ts <responses.csv> [--min N]");
  process.exit(1);
}

const rows = parseSignupCsv(readFileSync(file, "utf8"));
const clusters = clusterResponses(rows);

console.log(`${rows.length} responses, ${rows.filter((r) => r.paid).length} paid, minimum-to-run ${minPaid}\n`);
console.log("paid  interested  slot                 stage window");
for (const c of clusters) {
  const stages = c.stages.map((s) => STAGE_LABEL[s]).join(" + ");
  console.log(
    `${String(c.paid).padStart(4)}  ${String(c.interested).padStart(10)}  ${SLOT_LABEL[c.slot].padEnd(20)} ${stages}`,
  );
}

const cohort = firstViableCohort(clusters, minPaid);
console.log("");
if (!cohort) {
  console.log(`NO-GO so far: no slot + stage window has ${minPaid} paid.`);
  process.exit(0);
}
console.log(`COHORT 1 → ${SLOT_LABEL[cohort.slot]} · ${cohort.stages.map((s) => STAGE_LABEL[s]).join(" + ")}`);
console.log("Hand Ilana this list and this one time. Nothing else.\n");
for (const m of cohort.members) {
  console.log(`  ${m.childName || "(child)"}  grade ${m.childGrade}  ${STAGE_LABEL[m.readingStage]}  parent ${m.parentName} ${m.contact}`);
}
