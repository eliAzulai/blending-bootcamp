# WordPets Cohort 1 — Launch Plan (private Zoom reading group)

**Date:** 2026-09-18 (Thu)
**Status:** ACTIVE. Decisions D1-D10 answered by Eli 2026-09-18 (§3). Funnel built same day (§4 steps 3-4 done, deploy pending).
**Strategy source of record:** `docs/superpowers/specs/2026-06-30-wordpets-online-group-club-teacher-liberation-design.md` (band = grades 3-6, fixed-time group, Eli triages intake, no app rebuild).
**Operating-spec brief (never executed):** `handoff.md` / `docs/superpowers/specs/2026-07-02-wordpets-cohort-launch-os-handoff.md`. This plan replaces that 12-section spec with a dated execution plan; the section list there is still the checklist of what must exist.

---

## 1. Where we are (audited 2026-09-18)

- The strategy was decided 2026-06-30 and re-confirmed by the 2026-07-13 Pareto audit. **Since then: zero cohort execution.** All effort went to app (reading cartridge, pet reward, Supabase restore 2026-08-10) and songs/video (last touched 2026-08-11).
- `marketing/zoom-classes/index.html` still says "Ages 6-8" in 5 places and its only CTA is `mailto:` + WhatsApp. Unmodified since 2026-06-21. Deployed on Netlify (site `9fcda0ea…`, live URL not recorded anywhere in the repo).
- Todoist: "Warm-family cohort probe + get Ilana's launch numbers" (p1, due 2026-07-15) and "Preservation sweep" (p2, due 2026-07-16) are both still open and overdue.
- Nothing cohort-related in Google Calendar.
- No "Cohort Launch OS" document exists anywhere on disk. `project-room/` (both copies) documents the app, not the cohort.
- App: live at app.wordpets.xyz, Supabase restored, 3 students / 20 sessions in DB. Content is age-7 CVC. Usable only as light/optional support for grades 3-6.

**Calendar reality for "a couple of weeks":** Yom Kippur is Mon 2026-09-21; Sukkot runs Sat 09-26 through Sat 10-03 (Israeli schools closed roughly 09-24 to 10-04). A first class cannot realistically land inside the chag. The natural start is the **week of Sun 2026-10-04** (or 10-11 with slack). The chag week is the enrollment window and Ilana's authoring window.

---

## 2. The offer (draft, for Ilana to edit)

- **Who:** English-speaking kids in Israel, grades 3-6, who speak English fluently but read/write below grade level. Grouped by reading stage, not age.
- **Format:** live Zoom, 2-6 kids, one fixed 60-minute slot per week (Wednesday or Thursday afternoon), one 8-week term. Warm list first, then named channels (§5b).
- **What parents buy:** a consistent small group with Ilana every week, a term-long reading/spelling/writing plan, a short WhatsApp note after each class. **No app in the offer** (D6).
- **Excluded:** homework help, private 1:1 slots, make-up lessons, per-family scheduling, the app.
- **Price:** **500₪ per month** (D1). First week paid up front, refundable (D5).

---

## 3. Decisions (answered by Eli 2026-09-18)

| # | Decision | Answer |
|---|---|---|
| D1 | Price and billing unit | **500₪ per month** |
| D2 | Term length | 8 weeks (default kept: Oct 4 → Nov 26, ends before Hanukkah 12-04) |
| D3 | Candidate slots | **Wednesday and Thursday afternoons** "for now". Exact clock time set with the group. |
| D4 | Minimum-to-run `[N]` paid + cap | **2 paid per Zoom group** ("2 per zoom"). Cap kept at 6. *Fork noted: "2 per zoom" could also mean two sessions a week per group; read as minimum headcount because it answered the N question. Page says once a week. Ilana to confirm.* |
| D5 | Trial | **First week paid, refundable** |
| D6 | App for cohort 1 | **None** in the offer. Eli prefers we build an aged-up version later; not a launch item. |
| D7 | Reading-stage question wording | **Placeholder shipped**, Ilana rewrites. Marked `ILANA:` in the HTML. Keep the values `yes / sort_of / not_yet`. |
| D8 | Private + per-school monthly income | Unknown offhand. Left blank; wean math waits. |
| D9 | Reach | **Warm list + non-warm lists + named channels** (§5b) |
| D10 | Payment rail | Bit / bank transfer, Eli collects (default kept) |

---

## 4. Timeline

**Week 0 — Thu 09-18 → Wed 09-23 (decide + build the funnel)**
1. Ilana answers D1-D10 (one sitting, 30 min). Eli records answers in this file.
2. Warm-family probe: WhatsApp 6-10 families (scripts in §5). Goal: 3+ "yes, at slot X" before the page goes to anyone else.
3. ✅ 2026-09-18 Landing page recopied to grades 3-6 with the structured Netlify form (`marketing/zoom-classes/index.html`, success page `thanks.html`). Guarded by `src/lib/cohort/landing-page.test.ts`. **Still owed: deploy + record the live URL here:** `[URL]`.
4. ✅ 2026-09-18 Clustering tool: `npx tsx scripts/cluster-cohort.ts <netlify-export.csv> --min 2` groups responses by slot + reading stage and names the first viable cohort (`src/lib/cohort/cluster.ts`, tested). Export the Netlify form CSV, add a `paid` column (yes/no) by hand as Bit transfers land, re-run. Ilana never sees raw replies.
5. Preservation sweep (finally): commit `handoff.md`, both launch specs, this plan, `marketing/`; push local-only branches. Half a day; protects the plan of record.

**Week 1 — Thu 09-24 → Sat 10-03 (enrollment window = chag)**
6. Send the page link to the warm list + referrals. Eli clusters replies daily; nudges once mid-week.
7. Ilana authors Term 1 (she is off school): one-page term arc + weeks 1-2 fully built, weeks 3-8 outlined. KB skills (`/curriculum-lookup`, `/teaching-principles`, `/activity-ideas`) for structure; materials must be age-appropriate, not CVC/cat-hat.
8. Collect first-week payments as commitments land.

**Go / no-go — Sun 10-04**
- **Go:** ≥ 2 paid for one slot + stage window, weeks 1-2 ready → confirm class, send Zoom link + calendar invite, class 1 that week (10-05 to 10-08) or 10-11 if Ilana wants a week of slack.
- **No-go:** fewer than 2 paid → do not run. Rotate slot or band (early-reader 6-9 band is the fallback where assets already fit), extend window one week, or conclude the fixed-time group does not sell. Write the conclusion here with a date.

**Term 1 — 10-04 → 11-26 (8 weeks)**
9. Ilana teaches; stays ≥2 weeks ahead on materials (fallback cadence, not the plan). Eli sends the weekly parent note template and handles any payment/scheduling. Mid-term check at week 4: retention, level coherence, Ilana's load.

---

## 5. Warm-family WhatsApp scripts (Eli or Ilana sends; edit tone)

**A — current private families**
> Hi [name], Ilana is starting a small fixed-time Zoom reading group for grades 3-6 after Sukkot — 4-6 kids, same [day] [time] every week, 8 weeks. Would [child] be a fit for that instead of the 1:1? Slots we're looking at: [slot A] / [slot B]. No pressure, just checking who's interested before we open it.

**B — warm families, not current students**
> Hi [name], Ilana's opening one small online reading group this term for grades 3-6 kids who speak English well but struggle to read or write it. Fixed [day] [time], 4-6 kids, 8 weeks, [price]. Is that something you'd consider for [child]? Which afternoon works: [slot A] or [slot B]?

**C — follow-up to a "maybe"**
> Thanks! To hold a spot the first week is paid and refundable if it's not a fit. Link with details + the sign-up form: [URL]. Ilana will run it as soon as two kids fit the same afternoon.

Fill-ins for A and B: price = 500₪/month, slots = Wednesday or Thursday afternoon, N = 2.

## 5b. Named channels beyond the warm list (D9)

Post once each, after the warm list has had 48 hours. Same link, same two-sentence pitch. Track the channel in the sheet's `source` column.

1. Ilana's current and past private families and their referrals (warm).
2. Parents at the two schools who are not Ahava students (Ilana draws the line).
3. Anglo/olim parent WhatsApp groups in the local area (Eli lists the 3-5 groups he is actually in).
4. Janglo (Jerusalem Anglo list) classifieds / education section.
5. Facebook: "Anglo parents in Israel"-type groups and the local-town English-speakers group. One post, no boosting.
6. Homeschool / after-school English chug Facebook groups for the wider region.

Gate from the June spec still applies: before betting on online breadth, prove that at least one family from a cold channel converts.

---

## 6. Response clustering (Eli's workflow)

1. Every reply (form or WhatsApp) goes into the sheet the same day.
2. Group by reading stage (Yes / Sort of / Not yet). A cohort must be one adjacent pair at most.
3. Within a stage, group by slot. First stage+slot with `[N]` paid = cohort 1.
4. Hand Ilana: one list (names, grades, stage, parent contact) + one class time. Nothing else.
5. Ilana does not: read the inbox, do one-off demos, negotiate times with individual families, or see unclustered replies.

---

## 7. Wean math (Ilana's inputs blank)

```
monthly cohort revenue      = monthly price × paid students
cohorts to replace privates = private monthly income / monthly cohort revenue
cohorts to replace school X = school-X monthly income / monthly cohort revenue
```
At 500₪: 2 kids = 1,000₪/mo (minimum-to-run), 4 kids = 2,000₪/mo, 6 kids = 3,000₪/mo per cohort. Fill in D8 to see how many cohorts clear each rung.

---

## 8. Risks and kill criteria

| Risk | Mitigation / kill |
|---|---|
| No paid cluster forms | warm probe first; dated no-go 10-04; rotate slot/band once, then conclude |
| Families want 1:1 flexibility, not a group | probe script A tests this before the page goes out |
| Grade spread → level spread inside the hour | reading-stage question; max one adjacent stage pair per cohort |
| Term 1 authoring too large | weeks 1-2 built before class 1 or the start date moves; not the prep |
| App confuses parents | app is "optional practice," never in the headline offer |
| Ilana pulled into admin | Eli owns sheet, payments, WhatsApp intake; Ilana gets one list |
| Chag timing kills momentum | enrollment during chag is fine for WhatsApp; class 1 is post-chag |

---

## 9. Out of scope for this launch

App rebuild, cohort/booking/billing software, Teacher Studio, comics, songs/video, K-6 curriculum, public promotion beyond one named channel. Any of these before class 1 runs is sprawl.

---

## 10. Log

- 2026-09-18 — plan written; Eli answered D1-D10 same day (§3). Landing page recopied + form + clustering tool built and tested (294 vitest green). Deploy and live URL pending. Ilana still owes: D7 wording, confirmation of "2 per zoom" reading, exact Wed/Thu times, D8 income numbers.
