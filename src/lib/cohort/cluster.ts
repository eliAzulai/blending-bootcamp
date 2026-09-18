// Cohort-1 response clustering. Plan of record:
// docs/superpowers/plans/2026-09-18-wordpets-cohort-1-launch-plan.md §6
//
// Rule: a cohort is one slot + one reading stage, or at most one ADJACENT
// stage pair. The first slot+stage window to reach the paid minimum is
// cohort 1. "either" slot answers count toward both Wednesday and Thursday.

export type ReadingStage = "yes" | "sort_of" | "not_yet";
export type SlotChoice = "wed" | "thu" | "either";
export type Slot = Exclude<SlotChoice, "either">;

export interface SignupResponse {
  parentName: string;
  contact: string;
  childName: string;
  childGrade: string;
  readingStage: ReadingStage;
  slot: SlotChoice;
  commit: string;
  paid: boolean;
}

export interface Cluster {
  slot: Slot;
  stages: ReadingStage[];
  paid: number;
  interested: number;
  members: SignupResponse[];
}

const SLOTS: Slot[] = ["wed", "thu"];
const STAGE_WINDOWS: ReadingStage[][] = [
  ["not_yet"],
  ["sort_of"],
  ["yes"],
  ["not_yet", "sort_of"],
  ["sort_of", "yes"],
];

const TRUTHY = new Set(["yes", "true", "1", "y", "paid"]);

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

/** Minimal RFC-4180-ish CSV reader (quotes, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function asStage(v: string): ReadingStage {
  const s = v.trim().toLowerCase();
  if (s === "yes" || s === "sort_of" || s === "not_yet") return s;
  throw new Error(`unknown reading_stage: "${v}"`);
}

function asSlot(v: string): SlotChoice {
  const s = v.trim().toLowerCase();
  if (s === "wed" || s === "thu" || s === "either") return s;
  throw new Error(`unknown slot: "${v}"`);
}

/**
 * Parse a Netlify Forms CSV export (or the hand-kept clustering sheet).
 * Extra columns (Submitted At, Referrer, ...) are ignored. A `paid` column
 * is optional; Eli marks it by hand as Bit transfers land.
 */
export function parseSignupCsv(text: string): SignupResponse[] {
  const [header, ...body] = parseCsv(text);
  if (!header) return [];
  const idx = new Map(header.map((h, i) => [normalizeHeader(h), i]));
  const get = (row: string[], key: string) => {
    const i = idx.get(key);
    return i === undefined ? "" : (row[i] ?? "").trim();
  };
  return body.map((row) => ({
    parentName: get(row, "parent_name"),
    contact: get(row, "contact"),
    childName: get(row, "child_name"),
    childGrade: get(row, "child_grade"),
    readingStage: asStage(get(row, "reading_stage")),
    slot: asSlot(get(row, "slot")),
    commit: get(row, "commit"),
    paid: TRUTHY.has(get(row, "paid").toLowerCase()),
  }));
}

export function clusterResponses(rows: SignupResponse[]): Cluster[] {
  const clusters: Cluster[] = [];
  for (const slot of SLOTS) {
    for (const stages of STAGE_WINDOWS) {
      const members = rows.filter(
        (r) =>
          (r.slot === slot || r.slot === "either") &&
          stages.includes(r.readingStage),
      );
      if (members.length === 0) continue;
      clusters.push({
        slot,
        stages,
        paid: members.filter((m) => m.paid).length,
        interested: members.length,
        members,
      });
    }
  }
  // Paid commitments decide the cohort; a narrower stage window is more
  // teachable than a wider one, so it outranks extra unpaid interest.
  return clusters.sort(
    (a, b) =>
      b.paid - a.paid ||
      a.stages.length - b.stages.length ||
      b.interested - a.interested,
  );
}

/** First cluster (in ranked order) with at least `minPaid` paid members. */
export function firstViableCohort(
  clusters: Cluster[],
  minPaid: number,
): Cluster | null {
  const hit = clusters.find((c) => c.paid >= minPaid);
  if (!hit) return null;
  return { ...hit, members: hit.members.filter((m) => m.paid) };
}

export const STAGE_LABEL: Record<ReadingStage, string> = {
  not_yet: "Not yet reading on their own",
  sort_of: "Reads a little, with help",
  yes: "Reads on their own, but below grade",
};

export const SLOT_LABEL: Record<Slot, string> = {
  wed: "Wednesday afternoon",
  thu: "Thursday afternoon",
};
