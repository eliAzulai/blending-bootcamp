import { describe, it, expect } from "vitest";
import {
  parseSignupCsv,
  clusterResponses,
  firstViableCohort,
  type SignupResponse,
} from "./cluster";

const r = (over: Partial<SignupResponse>): SignupResponse => ({
  parentName: "P",
  contact: "050",
  childName: "C",
  childGrade: "4",
  readingStage: "sort_of",
  slot: "wed",
  commit: "yes",
  paid: false,
  ...over,
});

describe("parseSignupCsv", () => {
  it("reads a Netlify Forms CSV export into typed responses", () => {
    const csv = [
      "parent_name,contact,child_name,child_grade,reading_stage,slot,commit,paid",
      "Dana,0501234567,Noa,4,sort_of,wed,yes,yes",
      'Yossi,"050-999",Tal,6,yes,either,not_yet,',
    ].join("\n");
    const rows = parseSignupCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      parentName: "Dana",
      childGrade: "4",
      readingStage: "sort_of",
      slot: "wed",
      commit: "yes",
      paid: true,
    });
    expect(rows[1]).toMatchObject({ contact: "050-999", slot: "either", paid: false });
  });
});

describe("clusterResponses", () => {
  it("groups by slot and reading stage, counting paid and interested", () => {
    const rows = [
      r({ readingStage: "sort_of", slot: "wed", paid: true }),
      r({ readingStage: "sort_of", slot: "wed", paid: false }),
      r({ readingStage: "yes", slot: "thu", paid: true }),
    ];
    const clusters = clusterResponses(rows);
    const wedSortOf = clusters.find(
      (c) => c.slot === "wed" && c.stages.join(",") === "sort_of",
    );
    expect(wedSortOf).toMatchObject({ paid: 1, interested: 2 });
    const thuYes = clusters.find(
      (c) => c.slot === "thu" && c.stages.join(",") === "yes",
    );
    expect(thuYes).toMatchObject({ paid: 1, interested: 1 });
  });

  it("counts an 'either' slot toward both Wednesday and Thursday", () => {
    const rows = [r({ slot: "either", paid: true })];
    const clusters = clusterResponses(rows);
    expect(clusters.find((c) => c.slot === "wed")?.paid).toBe(1);
    expect(clusters.find((c) => c.slot === "thu")?.paid).toBe(1);
  });

  it("also offers adjacent-stage pairs, never the full spread", () => {
    const rows = [
      r({ readingStage: "not_yet", paid: true }),
      r({ readingStage: "sort_of", paid: true }),
      r({ readingStage: "yes", paid: true }),
    ];
    const keys = clusterResponses(rows).map((c) => c.stages.join("+"));
    expect(keys).toContain("not_yet+sort_of");
    expect(keys).toContain("sort_of+yes");
    expect(keys).not.toContain("not_yet+yes");
    expect(keys).not.toContain("not_yet+sort_of+yes");
  });

  it("ranks a single stage above an adjacent pair with the same paid count, even if the pair has more unpaid interest", () => {
    const rows = [
      r({ readingStage: "sort_of", slot: "wed", paid: true }),
      r({ readingStage: "sort_of", slot: "wed", paid: true }),
      r({ readingStage: "not_yet", slot: "wed", paid: false }),
    ];
    const [top, second] = clusterResponses(rows);
    expect(top).toMatchObject({ stages: ["sort_of"], paid: 2, interested: 2 });
    expect(second).toMatchObject({ stages: ["not_yet", "sort_of"], paid: 2, interested: 3 });
  });

  it("sorts clusters by paid, then interested, preferring a single stage on ties", () => {
    const rows = [
      r({ readingStage: "sort_of", slot: "wed", paid: true }),
      r({ readingStage: "sort_of", slot: "wed", paid: true }),
      r({ readingStage: "yes", slot: "thu", paid: true }),
    ];
    const [top] = clusterResponses(rows);
    expect(top).toMatchObject({ slot: "wed", stages: ["sort_of"], paid: 2 });
  });
});

describe("firstViableCohort", () => {
  it("returns the first cluster meeting the paid minimum", () => {
    const rows = [
      r({ readingStage: "sort_of", slot: "wed", paid: true, childName: "A" }),
      r({ readingStage: "sort_of", slot: "wed", paid: true, childName: "B" }),
      r({ readingStage: "yes", slot: "thu", paid: true, childName: "C" }),
    ];
    const cohort = firstViableCohort(clusterResponses(rows), 2);
    expect(cohort?.slot).toBe("wed");
    expect(cohort?.members.map((m) => m.childName).sort()).toEqual(["A", "B"]);
  });

  it("returns null when nothing reaches the minimum", () => {
    const rows = [r({ paid: true })];
    expect(firstViableCohort(clusterResponses(rows), 2)).toBeNull();
  });
});
