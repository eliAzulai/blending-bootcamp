# Content Gap Audit — Phase 1a

**Date:** 2026-08-04
**Status:** Complete. Verdict: the readiness gate is much further away than `teacher-protocol.md §1` assumed. See §4 for the reframing this forces.
**DECISION (2026-08-04):** Phase 1a-min adopted — **phonics only** for the first cohort. Rationale in §5. This is a reversible sequencing decision, not a permanent scope cut: spelling and read-aloud are deferred until the retention thesis is validated, not cancelled. Companion docs patched to match.
**Method:** Direct filesystem grep of `src/`, read of activity components, attempted query of the Supabase `content` table (failed — see §3).

---

## 1. Headline

Phase 1a is not "shabby + empty content." It is **1 of 3 activities built, 0 of 3 activities wired to a `/student/*` route, backend down, content fixtures at ~5% of the readiness threshold.** The teacher protocol's readiness gate cannot be met in the timeframe it implied without either (a) months of build, or (b) descoping Phase 1a to a single activity.

Recommended path: **descope to Phonics-only for the first cohort.** Rationale in §5.

---

## 2. Content inventory vs. readiness threshold

Threshold from `docs/teacher-protocol.md §1.1`:

| Activity | Beginner target | Beginner actual | Intermediate target | Intermediate actual | Advanced target | Advanced actual | Gap |
|---|---|---|---|---|---|---|---|
| Phonics | 12 sets | **2** (in fixtures) | 8 sets | **0** | 4 sets | **0** | **22 sets missing** |
| Spelling | 12 sets | **0** | 8 sets | **0** | 4 sets | **0** | **24 sets missing** |
| Read-aloud | 8 passages | **0** | 6 passages | **0** | 3 passages | **0** | **17 passages missing** |
| **Total** | **32** | **2** | **22** | **0** | **11** | **0** | **63 items missing of 65 target** |

We have **~3% of the content the gate requires.** But this metric is misleading because content isn't the primary blocker — see §3.

## 3. Structural gaps beneath the content gap

Ordered by severity. These are the actual blockers; the content gap is downstream of them.

### 3.1 Only 1 of 3 activity components exists

- ✅ `src/components/activities/PhonicsActivity.tsx` — exists, wraps the Phase 0 `BlendingExercise`.
- ❌ **No `SpellingActivity.tsx`.** Zero code for spelling as a Phase 1a activity.
- ❌ **No `ReadAloudActivity.tsx`.** Zero code for read-aloud as a Phase 1a activity.

Adding an activity is not a small task — it needs a component, an interaction model, content shape, tracker integration, and R-rule compliance (R7 for read-aloud non-scoring; R17 for transcripts never on student surfaces). Each is a substantial engineering effort, likely 1–2 weeks of build + polish.

### 3.2 No `/student/*` route exists

`src/app/student/` does not exist. Every rule in `docs/non-negotiable-rules.md` that scopes to `/student/*` (R1, R4, R9, R12, R17, R19, R21) prescribes behavior for a surface **that has not been built**. Phase 0's `/lesson/[day]/page.tsx` is where the phonics activity currently lives, which is bootcamp-shaped, not companion-shaped.

The daily-recipe home screen from `phase-1a-program.md` Decision 1 has no code either. The kid's entry point today, if they somehow got to the app, would be the Phase 0 14-day timeline.

### 3.3 Content architecture doesn't exist yet

- ❌ **No `src/lib/content.ts`.** This file is referenced in `docs/non-negotiable-rules.md` R24 as the deterministic content picker for teacher preview / student delivery. It doesn't exist.
- ❌ **No `src/lib/program/recipe.ts`.** Referenced in `phase-1a-program.md` Decision 1 for daily-recipe generation. Doesn't exist.
- ⚠️ **Content lives in fixtures**, not the database. `src/lib/fixtures/student.ts` has 2 beginner phonics sets (9 words total). The `content` table exists in the schema but is unqueryable (§3.4).
- ⚠️ **No seed SQL for `content`.** `supabase/schema-v2.sql` defines the table but nothing populates it.

### 3.4 Supabase is paused

`./scripts/db.sh` fails with `FATAL: tenant/user postgres.ukqjnqyaddieyoofhany not found`. This matches the memory note "Supabase paused (twice; still down 2026-07-13)." Live student data cannot flow anywhere until this is restored — no `practice_sessions`, no `activity_attempts`, no dashboard, no cohort at all.

### 3.5 Scoring is not real

`PhonicsActivity.tsx` line 41: `score: 100` — hardcoded. Every phonics word attempt scores 100 regardless of speech match, tap correctness, or time-to-complete. This has three downstream consequences:

- **Level-up mechanic breaks silently.** `phase-1a-program.md` Decision 4 says "median score >= 80" is a promotion criterion. With hardcoded 100s, every kid becomes promotion-eligible on day 14. Ilana's teacher-confirm gate saves us from actual auto-promotion, but the dashboard candidate list becomes noise.
- **Score-trend metrics (L8) are meaningless** — they'll be flat at 100 forever, telling us nothing about kid progress.
- **The speech matching in `BlendingExercise`** apparently isn't being turned into a score at all, even though the pipeline exists (`phoneme-matching.ts`, `speech-recognition.ts`). Somewhere the signal is being discarded.

## 4. What the readiness gate actually looks like now

Rewritten honestly. If we hold Phase 1a's full 3-activity scope, the gate requires:

1. **~4–6 weeks of build:** SpellingActivity component + ReadAloudActivity component + `/student/*` route tree + home screen with daily recipe + `src/lib/content.ts` deterministic picker + `src/lib/program/recipe.ts` recipe generator.
2. **~1 week of content authoring:** 63 content items via the `/wordpets-content` skill + Ilana QA pass.
3. **~1 week of infrastructure work:** Supabase restore + seed loader + lifecycle columns from measurement plan §3.1.
4. **~1 week of polish:** the four bars in `teacher-protocol.md §1.2`.
5. **Real scoring in PhonicsActivity** (partial rebuild — not just deleting the `100`).

Total: **~7–9 weeks of engineering** before tier 1 can start, at a solo pace with no parallelism. This does not match "invite students in the next few weeks."

## 5. Recommended reframing: Phase 1a-min = Phonics only

The honest move is to descope Phase 1a to a single activity for the first cohort. Rationale:

- **Phonics is the only activity with working code today.** Every day spent building spelling or read-aloud is a day spent NOT validating the companion-app thesis with real kids.
- **The companion-app thesis is bigger than any single activity.** Does teacher-assigned daily practice with a pet actually retain 6–8 year olds 4×/week? That's the Phase 1a question. It can be answered with one well-executed activity as well as with three half-executed activities.
- **Real scoring matters more than more activities.** A phonics activity with real speech-based scoring produces meaningful data. Three activities with hardcoded 100s produce noise.
- **Content authoring collapses.** 22 phonics sets (12 beginner + 8 intermediate + 4 advanced with margin — the actual gate for one activity) is 1–2 days of `/wordpets-content` generation + QA. 63 items across three activity types is a week+.

**Phase 1a-min scope:**

1. `/student/*` route tree with a home screen showing a recipe of length 1 (phonics only).
2. `SpellingActivity` and `ReadAloudActivity`: not built. Recipe is single-item.
3. Content: 22 phonics sets across all three difficulty bands.
4. Real phonics scoring (delete the hardcoded 100, wire in the phoneme-match signal).
5. Supabase restored + lifecycle columns deployed.
6. Polish bar met per `teacher-protocol.md §1.2`.

Revised readiness estimate: **~2–3 weeks of engineering** rather than 7–9. Same validation of the core thesis.

**What we sacrifice:** we can't test the "practice recipe balance across 3 activities" hypothesis. We can't test read-aloud engagement at all. We can't test spelling. Level-up mechanic tests only on phonics.

**What we gain:** we actually launch. In 2–3 weeks, not 2+ months. With a real scoring signal instead of noise. On the activity that already works.

## 6. Immediate patches this audit forces

Three docs need updates to stay honest:

1. **`docs/teacher-protocol.md §1.1`** — content thresholds table should be footnoted with "targets assume Phase 1a full scope (3 activities). Under Phase 1a-min (phonics only), the target is 12+8+4=24 phonics sets and no spelling/read-aloud content."
2. **`docs/phase-1a-program.md`** — Decision 1 (daily recipe) should note that recipes may be length 1 (single activity) as a valid starting configuration, not just an override.
3. **`docs/measurement-plan.md`** — the "activity drop-off by type" metric (L3) becomes trivial (only one type) under Phase 1a-min; add a note that L3 becomes meaningful only after ≥2 activity types are shipped.

Small patches, ~10 min. Should follow the descope decision, not precede it.

## 7. Build sequence (Phase 1a-min, decided 2026-08-04)

Ordered by dependency. Target: readiness gate met in ~2–3 weeks of solo work.

| # | Task | Est. | Blocks | Notes |
|---|---|---|---|---|
| 1 | **Restore Supabase** (project `ukqjnqyaddieyoofhany`) | 1h | everything downstream | Unpause; verify `./scripts/db.sh` works; run the §2 audit query to confirm what's actually in `content`. |
| 2 | **Real phonics scoring** — remove hardcoded `score: 100` in `PhonicsActivity.tsx:41`, wire in the `phoneme-matching.ts` signal | 0.5d | level-up mechanic, L8 metric | Right thing to do under any scope. Score should reflect phoneme match rate + attempts-per-word, not a constant. |
| 3 | **Content seed** — 24 phonics sets (12 beginner / 8 intermediate / 4 advanced) via `/wordpets-content`, loaded into the `content` table with a seed SQL file | 1–2d | content gate | Ilana QA-checks 10% before any ship to a kid. Must pass R2, R3, R11, R13. |
| 4 | **`src/lib/content.ts`** — deterministic picker `(studentId, rotationCount, difficulty) → PhonicsContent` | 0.5d | R24 compliance, recipe | Contract is already specified in `non-negotiable-rules.md` R24. No `Math.random()` in child render paths. |
| 5 | **`src/lib/program/recipe.ts`** — daily recipe generator, length 1 for Phase 1a-min but written to extend to 2–3 | 0.5d | home screen | Per `phase-1a-program.md` Decision 1. Single-item is a production config, not a special case. |
| 6 | **`/student/*` route tree** — home screen with recipe tile, pet display, activity host route | 3–4d | everything kid-facing | The biggest single chunk. All R-rules scoped to `/student/*` apply here for the first time (R1, R4, R9, R12, R17, R19, R21). |
| 7 | **Lifecycle columns** — `started_at`, `completed_at`, `outcome` per `measurement-plan.md §3.1` + session-boundary logic per `phase-1a-program.md` Decision 2 | 1d | all drop-off metrics | Must land *before* tier 1 or week-1 data is lost forever. |
| 8 | **Polish pass** — the four bars in `teacher-protocol.md §1.2` | 2d | readiness gate | Time-boxed. Not "until it feels right." |
| 9 | **`docs/parent-onboarding.md`** | 0.5d | tier 1 invites | Plain language, screenshots, expectation-setting. |
| 10 | **Ilana walk-through + sign-off** | 0.5h | tier 1 invites | She can veto. |

**Critical path:** 1 → 3 → 4 → 5 → 6 → 7 → 8 → 10. Items 2 and 9 are parallelizable.

**Not in this sequence (deferred):** SpellingActivity, ReadAloudActivity, teacher metrics page (`measurement-plan.md §4.2` — runbook queries suffice for tier 1), level-up mechanic UI (`phase-1a-program.md` Decision 4 — no kid will be eligible for 14+ days after launch), physical rewards.

## 8. Open questions remaining

- **What does the `content` table actually hold?** Unverifiable with Supabase paused. Re-run the §2 query as step 1 of the build sequence — this filesystem-only audit may have missed seeded rows.
- **Does Ilana agree phonics-only validates the model?** The decision is made and is reversible, but her read matters for how she frames it to parents. Worth a conversation, not a blocker.
- **What should a real phonics score actually be?** Item 2 says "wire in the phoneme-match signal" but the formula is undefined. Options: % of phonemes matched first-try, or a composite with attempt count. Needs a decision before item 2 ships — it feeds the level-up threshold in Decision 4.
