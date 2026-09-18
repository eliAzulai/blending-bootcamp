import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Guards the cohort-1 launch page against regressing to the retired
// "Ages 6-8 / free trial / mailto" framing. Source of record:
// docs/superpowers/plans/2026-09-18-wordpets-cohort-1-launch-plan.md
const html = readFileSync(
  resolve(__dirname, "../../../marketing/zoom-classes/index.html"),
  "utf8",
);
const text = html.toLowerCase();

describe("cohort-1 landing page copy", () => {
  it("has no early-reader age framing left", () => {
    expect(text).not.toMatch(/ages?\s*6\s*[–-]\s*8/);
    expect(text).not.toMatch(/young children/);
  });

  it("leads with grades 3-6", () => {
    expect(text).toMatch(/grades\s*3\s*[–-]\s*6/);
  });

  it("does not promise a free trial; first week is paid and refundable", () => {
    expect(text).not.toMatch(/free trial/);
    expect(text).toMatch(/refundable/);
  });

  it("states the price and the slots", () => {
    expect(text).toMatch(/500\s*₪|₪\s*500/);
    expect(text).toMatch(/wednesday/);
    expect(text).toMatch(/thursday/);
  });

  it("does not sell the app or the pet as part of the offer", () => {
    expect(text).not.toMatch(/their pet gets happier/);
    expect(text).not.toMatch(/between-class motivation/);
  });
});

describe("cohort-1 structured sign-up form", () => {
  const formMatch = html.match(/<form[\s\S]*?<\/form>/i);
  const form = (formMatch?.[0] ?? "").toLowerCase();

  it("exists and is wired to Netlify Forms", () => {
    expect(form).not.toBe("");
    expect(form).toMatch(/data-netlify="true"/);
    expect(form).toMatch(/name="cohort-signup"/);
    expect(form).toMatch(/name="form-name"/);
  });

  it("captures every probe field the plan requires", () => {
    for (const field of [
      "parent_name",
      "contact",
      "child_grade",
      "reading_stage",
      "slot",
      "commit",
    ]) {
      expect(form, `missing field ${field}`).toMatch(
        new RegExp(`name="${field}"`),
      );
    }
  });

  it("offers Wednesday and Thursday as slot choices plus either", () => {
    expect(form).toMatch(/value="wed"/);
    expect(form).toMatch(/value="thu"/);
    expect(form).toMatch(/value="either"/);
  });

  it("offers the three reading-stage answers", () => {
    expect(form).toMatch(/value="yes"/);
    expect(form).toMatch(/value="sort_of"/);
    expect(form).toMatch(/value="not_yet"/);
  });

  it("is the primary CTA: no mailto link remains as a call to action", () => {
    expect(html).not.toMatch(/class="btn[^"]*"\s+href="mailto:/i);
  });

  it("keeps WhatsApp as a secondary contact", () => {
    expect(html).toMatch(/wa\.me\/972547471256/);
  });
});
