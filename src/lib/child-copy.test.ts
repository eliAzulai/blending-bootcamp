import { describe, expect, it } from "vitest";
import { ALL_CHILD_COPY, fillPetName } from "./child-copy";

/**
 * R25 ban regex from docs/non-negotiable-rules.md (streak shaming / guilt copy)
 * plus an R27 economy-language ban. Runs over the manifest of EVERY child-facing
 * string the reward system introduces — R25 enforcement was previously
 * review-only; this change introduces enough new child copy to warrant a gate.
 */
const R25_BAN = /missed|broken|lost|haven't|been a while|where have you|come back|tomorrow/i;
const R27_BAN = /wealth|income|spend|earning|shop|store|buy|price|afford|pay/i;

describe("child copy manifest (R25 + R27)", () => {
  it("has copy to audit", () => {
    expect(ALL_CHILD_COPY.length).toBeGreaterThan(10);
  });

  for (const line of ALL_CHILD_COPY) {
    it(`"${line}" passes the R25 streak-shame ban`, () => {
      expect(line).not.toMatch(R25_BAN);
    });

    it(`"${line}" passes the R27 economy-language ban`, () => {
      expect(line).not.toMatch(R27_BAN);
    });
  }
});

describe("fillPetName", () => {
  it("replaces every {pet} placeholder", () => {
    expect(fillPetName("{pet} loves it! {pet} is happy.", "Whiskers")).toBe(
      "Whiskers loves it! Whiskers is happy.",
    );
  });
});
