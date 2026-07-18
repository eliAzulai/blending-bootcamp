import { describe, expect, it } from "vitest";
import {
  CARE_COST,
  CARE_VERBS,
  SATIATION_LIMIT,
  daysBetweenUTC,
  derivePetMood,
  pickDailyWant,
  pickFromList,
} from "./pet";

describe("derivePetMood — practice drives mood, care is flavor", () => {
  it("excited only when practiced today AND cared today", () => {
    expect(
      derivePetMood({ practicedToday: true, daysSinceLastPractice: 0, caredToday: true }),
    ).toBe("excited");
  });

  it("practiced today without care is happy (care adds warmth, is not required)", () => {
    expect(
      derivePetMood({ practicedToday: true, daysSinceLastPractice: 0, caredToday: false }),
    ).toBe("happy");
  });

  it("practiced yesterday is happy", () => {
    expect(
      derivePetMood({ practicedToday: false, daysSinceLastPractice: 1, caredToday: false }),
    ).toBe("happy");
  });

  it("care alone NEVER lifts mood — a snack cannot mask absence", () => {
    // Cared today, but last practice was 4 days ago: still sleepy.
    expect(
      derivePetMood({ practicedToday: false, daysSinceLastPractice: 4, caredToday: true }),
    ).toBe("sleepy");
    // Cared today, practiced 2 days ago: still hungry (practice-directed prompt).
    expect(
      derivePetMood({ practicedToday: false, daysSinceLastPractice: 2, caredToday: true }),
    ).toBe("hungry");
  });

  it("never practiced is hungry (welcoming prompt toward first practice)", () => {
    expect(
      derivePetMood({ practicedToday: false, daysSinceLastPractice: null, caredToday: false }),
    ).toBe("hungry");
  });

  it("3+ days without practice is sleepy", () => {
    expect(
      derivePetMood({ practicedToday: false, daysSinceLastPractice: 3, caredToday: false }),
    ).toBe("sleepy");
    expect(
      derivePetMood({ practicedToday: false, daysSinceLastPractice: 30, caredToday: false }),
    ).toBe("sleepy");
  });
});

describe("care economy constants", () => {
  it("one day of practice (~30 coins) funds one full day of care", () => {
    const total = CARE_VERBS.reduce((sum, v) => sum + CARE_COST[v], 0);
    expect(total).toBe(30);
  });

  it("all costs positive; satiation bounds daily care", () => {
    for (const v of CARE_VERBS) expect(CARE_COST[v]).toBeGreaterThan(0);
    expect(SATIATION_LIMIT).toBe(CARE_VERBS.length);
  });
});

describe("pickDailyWant — deterministic per (student, date)", () => {
  it("same inputs always give the same want", () => {
    const a = pickDailyWant("student-abc", "2026-07-13");
    for (let i = 0; i < 5; i++) {
      expect(pickDailyWant("student-abc", "2026-07-13")).toBe(a);
    }
  });

  it("varies across days and students (not constant)", () => {
    const wants = new Set<string>();
    for (let d = 1; d <= 20; d++) {
      wants.add(pickDailyWant("student-abc", `2026-07-${String(d).padStart(2, "0")}`));
    }
    expect(wants.size).toBeGreaterThan(1);
  });

  it("always returns a valid verb", () => {
    for (let d = 1; d <= 28; d++) {
      const want = pickDailyWant("s1", `2026-02-${String(d).padStart(2, "0")}`);
      expect(CARE_VERBS).toContain(want);
    }
  });
});

describe("pickFromList — deterministic variable reward", () => {
  const list = ["a", "b", "c", "d", "e"];

  it("same seed always gives the same item", () => {
    expect(pickFromList("s1:2026-07-18:surprise", list)).toBe(
      pickFromList("s1:2026-07-18:surprise", list),
    );
  });

  it("varies across seeds (content varies, valence never)", () => {
    const picks = new Set<string>();
    for (let d = 1; d <= 20; d++) {
      picks.add(pickFromList(`s1:2026-07-${String(d).padStart(2, "0")}`, list));
    }
    expect(picks.size).toBeGreaterThan(1);
  });
});

describe("daysBetweenUTC", () => {
  it("computes calendar-day differences", () => {
    expect(daysBetweenUTC("2026-07-13", "2026-07-13")).toBe(0);
    expect(daysBetweenUTC("2026-07-12", "2026-07-13")).toBe(1);
    expect(daysBetweenUTC("2026-06-30", "2026-07-13")).toBe(13);
  });
});
