# Phase 1a — Program Plan (forced choices)

**Status:** Draft for review (2026-05-12). Upstream of `docs/measurement-plan.md`.
**Scope:** This doc specifies *app behavior* — what the program looks like in code and content. For how the teacher operates the app with her students (cohort rollout, weekly rhythm, validation questions), see `docs/teacher-protocol.md`. Both docs should be read together; neither stands on its own.
**Why this exists:** Phase 1a inherited Phase 0's vocabulary ("session", "daily practice", "completed") without redefining it for a companion app. The measurement plan can't be built on undefined terms, and product decisions keep drifting back toward bootcamp shape (linear 14-day program) when the actual model is open-ended teacher-assigned practice. This doc forces five decisions so the rest of Phase 1a stops being ambiguous.

For each decision: the question, the options, the trade-off, and a recommended pick. Recommendations are opinions, not commitments — overrule any of them and the rest of the doc still works.

---

## Decision 1 — What is a "daily practice"?

**The question.** A kid opens the app today. What is the screen they're supposed to act on?

| Option | What the kid sees | Pros | Cons |
|---|---|---|---|
| **A. Free-pick** | Home screen with three activity tiles (Phonics / Spelling / Read Aloud). Kid taps whichever they want. | Simplest to build. Maximum autonomy. | No finish line. Kid does one activity and leaves. Easy to skip the hard one (likely Spelling) every day. |
| **B. Daily recipe** *(recommended)* | "Today's practice: 🔤 Phonics, ✏️ Spelling, 📖 Read Aloud" — three tiles in a row, each with a checkmark on completion. Recipe is teacher-tunable per student (e.g. drop Read Aloud, or do 2× Phonics). | Defines what "done for today" means. Forces balance across focus areas. Matches Ilana's classroom rhythm. | More to build. Risk of feeling like homework if recipe is too long. |
| **C. Teacher-queued items** | Teacher pre-loads specific content into a queue; kid works through queue items in order. | Strongest teacher control. Maps cleanly to a tutoring relationship. | Massive operational load on Ilana — she'd need to queue content per student per day for 10+ kids. Defeats the "companion between live sessions" goal. |

**Recommendation: B (Daily recipe).** Recipe = ordered list of activities for today, default `[phonics, spelling, read_aloud]` filtered by the student's active `focus_areas`. Teacher can set per-student recipe length (1–3 items) and order in the dashboard.

> **Scope note (2026-08-04, Phase 1a-min).** The first cohort runs **phonics only** — a recipe of length **1**. Spelling and read-aloud components don't exist yet (`docs/content-gap-audit.md §3.1`) and are deferred until the retention thesis is validated. A single-item recipe is a **valid production configuration**, not a degenerate case: the recipe generator must handle length 1 cleanly (one tile, "All done for today!" on completion), and the home screen must not look broken with a single activity. When spelling/read-aloud ship, the same generator extends to length 2–3 with no rework.

**Implication for schema:** Recipes are deterministic per student per day from existing inputs (`focus_areas.active`, optional teacher override). No new table needed for v0 — derive in `src/lib/program/recipe.ts`. Add a `daily_recipe_overrides` table later if teachers want per-day tuning.

---

## Decision 2 — When does a session start and end?

**The question.** Today the schema has `practice_sessions.completed boolean` but no spec for what flips it. We can't measure drop-off if we can't say what "started" or "ended" mean.

| Option | Session start | Session end | Trade-off |
|---|---|---|---|
| **A. Per-activity** | First tap on an activity tile | That activity finishes / abandons | Many short sessions per day. Inflates session count. Easy to log. |
| **B. Per-day, per-app-open** *(recommended)* | First activity tile tap of the calendar day | Recipe complete, OR 15 min idle, OR app closed and not reopened within 15 min | One session = one practice sitting. Matches how Ilana thinks about it. Needs an idle timeout job. |
| **C. Per-recipe** | Tap "Start today's practice" CTA | Recipe checkmarks all green | Cleanest. Requires an explicit "start practice" CTA the kid taps; doesn't handle the kid who taps a tile directly. |

**Recommendation: B (per-day, per-app-open with idle timeout).** A new session row is inserted when a student starts an activity and no open session row exists for today. The session is marked complete when either (i) the daily recipe finishes or (ii) a sweep job marks it complete-by-timeout after 15 min of inactivity. The 15 min number is a guess — revisit after we have 2 weeks of real data.

**Implication for schema:** Reuses the lifecycle columns from measurement-plan §3.1 (`started_at`, `completed_at`). Adds one sweep job: every 5 min, mark any session with no activity in 15 min as `completed=true, completed_at=last_attempt_completed_at`. Sessions that never had a completed attempt get `completed=false` and count as abandoned.

---

## Decision 3 — What does "practiced today" mean?

**The question.** The Phase 1a north star is "≥4 days/week." Days of *what*?

| Option | "Practiced today" = | Pros | Cons |
|---|---|---|---|
| **A. Opened the app** | Any session row created | Cheapest. | Rewards lurking. A kid who taps a tile and bails counts the same as one who finishes the recipe. |
| **B. ≥1 activity completed** | At least one `activity_attempts` row with `outcome='completed'` | Honest floor — they did *something*. | Lets a kid skate by on one easy phonics set. |
| **C. Recipe completed** *(recommended)* | All recipe items for today completed | Aligns the metric with the program. Strong signal. | Strictest. May tank the north-star number early, especially for younger kids. |

**Recommendation: C (recipe completed).** With a caveat: track A and B as secondary metrics so we can see the funnel between "opened" and "finished recipe." If C is too punishing in practice (e.g. <30% of opens turn into finished recipes after 4 weeks), revisit by either shortening the default recipe or relaxing the definition to B. **Do not move the goalposts retroactively** — if we relax the definition, the release in `releases` table needs a new baseline.

**Implication for measurement plan:** This is the missing operational definition behind N1. Patch `docs/measurement-plan.md §2.1` once this is settled.

---

## Decision 4 — How does a kid level up?

**The question.** A kid is on `beginner` phonics. After two weeks they've nailed it. What moves them to `intermediate`? This is the largest single lever on the 4-week sustained metric — without progression, content fatigue is the default churn driver.

| Option | Trigger | Trade-off |
|---|---|---|
| **A. Teacher-only (manual)** | Ilana flips a switch in the dashboard | Maximum control, zero risk of bad auto-promote. Maximum operational load on Ilana. Easy to forget; kid stagnates. |
| **B. Mastery-based (auto)** | ≥3 consecutive phonics sets at score ≥80, on different days | Self-driving. Risk: Whisper/scoring noise produces false mastery, kid jumps too soon. |
| **C. Time-gated, teacher-confirmed** *(recommended)* | After 14 days of active practice in a band, dashboard nudges Ilana with "Consider moving Maya to intermediate — she's at 84% avg." Ilana confirms with one tap. | Combines auto-detection with human gate. Low operational load; Ilana sees a single nudge, not a list of decisions. |

**Recommendation: C (time-gated, teacher-confirmed).** This is also the place where Phase 1a most resembles a real tutoring relationship — Ilana is the one who *knows* when Maya is ready, the app just surfaces the candidate moment.

**Implication for schema:** Add `focus_areas.last_promoted_at timestamptz`. Add a derived view `promotion_candidates` (student × focus_area pairs where active ≥14d + median score ≥80 + no promotion in 14d). Surface in the teacher dashboard as a card on the metrics page.

**Implication for read_aloud:** Read aloud has `score=null` by R7. Progression there is **time + teacher only** — no mastery signal available. State this explicitly so we don't accidentally read a 0 score as "failed."

---

## Decision 5 — Does Phase 1a have an end?

**The question.** Phase 0 ended at day 14 ("you graduated"). Does a kid in Phase 1a ever finish, or is it open-ended until Phase 1b lands?

| Option | What "done" means | Trade-off |
|---|---|---|
| **A. Open-ended** *(recommended for now)* | No end-state. Kid practices indefinitely; teacher decides when to retire/move on. | Honest about Phase 1a's scope: it's a companion, not a course. Risk: kids on `advanced` for 3 months with no horizon. |
| **B. Soft milestone** | "You finished the WordPets starter set!" event at, e.g., 50 completed recipes. Celebratory, no functional change after. | Cheap morale boost. Needs explicit ceremony in the UI so it doesn't read as "you're done, leave." |
| **C. Hard graduation** | Kid completes a final assessment and exits the app. | Cleanest narrative. But requires Phase 1b to receive them — we don't have that. |

**Recommendation: A now, B as a fast-follow.** Phase 1a is a companion, not a finite course; pretending otherwise creates a graduation cliff with nothing on the other side. A soft milestone at 50 recipes (≈ 12 weeks at 4/week) is a cheap addition once we have a kid approaching it. Hard graduation (C) is a Phase 1b decision.

---

## Summary — the five picks

1. **Daily practice = a teacher-tunable recipe** of 1–3 activities (default: all three).
2. **A session = one practice sitting** per day, started by first tile tap, ended by recipe complete or 15 min idle.
3. **"Practiced today" = recipe completed**, with "opened" and "≥1 activity" tracked as secondary funnel steps.
4. **Level-up = 14d in band + median score ≥80 → teacher confirms with one tap.** Read-aloud progression is time + teacher only.
5. **No hard end-state.** Soft 50-recipe milestone as a fast-follow.

---

## Sequencing

If these picks survive review:

1. **Week 1:** Write `src/lib/program/recipe.ts` (Decision 1). Add lifecycle columns to sessions/attempts (already in measurement plan §3.1). Wire the session-boundary rule (Decision 2) into start/end call-sites.
2. **Week 2:** Patch the home screen to show the daily recipe as the primary CTA. Ship the idle-timeout sweep job.
3. **Week 3:** Add the `promotion_candidates` view (Decision 4) and surface it on the teacher dashboard.
4. **Later:** 50-recipe milestone (Decision 5b), recipe overrides table, real A/B infrastructure.

After step 1 lands, `docs/measurement-plan.md` gets one patch: replace the L1 / N1 definitions with the recipe-completion forms from Decision 3, and add the *recipe-completion rate* metric explicitly.

---

## Open questions for review

- Does Ilana want recipe authority (set order + length per student), or is "all three in default order" enough for the first cohort? Adding the override UI is a half-day; skipping it is fine if not needed.
- Decision 4's promote nudge: dashboard card, email, or both? Dashboard is enough if Ilana checks weekly; email if she doesn't.
- Decision 5b: is 50 recipes the right number, or should it scale with the student's recipe length (kids with 1-item recipes hit it 3× faster)? Probably scale, but worth confirming.
