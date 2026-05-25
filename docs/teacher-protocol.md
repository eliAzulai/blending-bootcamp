# Teacher Protocol — Phase 1a

**Status:** Draft for review (2026-05-12). Upstream of any cohort invite.
**Audience:** Primary — Ilana (teacher, in-the-field operator). Secondary — Eli (product/engineering, has to keep his hands off until readiness is met).
**Purpose:** Specify what has to be true before students are invited, what Ilana does each week once they are, and how we know whether the next 4–8 weeks produced learning or just produced log entries.

---

## 0. Where we actually are (2026-05-12)

Two blockers, named honestly:

1. **Content library is effectively empty.** Phase 1a's "manual starter library" hasn't been populated to the volume needed to sustain a kid practicing 4 days/week without repeating identical content within a week. Rotation can't save us if there's nothing to rotate.
2. **Polish is below the floor for a 6-year-old's first impression.** "Looks shabby" is the operator's read. A 6-year-old's tolerance for a janky interface is roughly zero — the app is competing with iPad games that had $10M of polish budget, and the kid doesn't know or care about Phase 1a scope.

These are not "we'll fix them in week 1." They are **pre-launch blockers**. The protocol below is gated on them being resolved. We cannot start the cohort clock until then.

> **The hardest discipline in this doc:** when an engineer or stakeholder asks "when does Ilana invite the first students?" the answer is *"when the readiness gate is met, not when the calendar reaches a particular date."* Resist the pressure to launch on a date.

---

## 1. The readiness gate

Before *any* student gets an invite token, all of the following must be true. This is the floor, not the aspiration.

### 1.1 Content thresholds

| Activity | Beginner | Intermediate | Advanced |
|---|---|---|---|
| Phonics | ≥ 12 sets | ≥ 8 sets | ≥ 4 sets |
| Spelling | ≥ 12 sets | ≥ 8 sets | ≥ 4 sets |
| Read-aloud | ≥ 8 passages | ≥ 6 passages | ≥ 3 passages |

**Reasoning for the numbers.** A kid practicing 4×/week at recipe length 3 (per `phase-1a-program.md` Decision 1) consumes 12 activity items per week. Rotation needs to surface non-identical content for at least 2 weeks before any repeat. 12 beginner sets gets us there with margin; the smaller intermediate/advanced numbers reflect that fewer kids are there at any moment.

Every item must pass the non-negotiable rules — specifically R2 (decodable at stated difficulty), R3 (no new spelling rule inside a band), R11 (punctuation budget), R13 (sounds vs. names distinguished). The `/wordpets-content` skill generates them; Ilana spot-checks 10% before any of them ship to a kid.

### 1.2 Polish bar

Four specific bars, not "looks good." Each is checkable in 10 minutes:

- **Home screen renders the daily recipe cleanly** on an iPad in portrait at 768×1024. Three tiles, names readable in Andika, no overflow, no Inter/system-ui leakage anywhere on a `/student/*` route.
- **Each activity opens, runs, and closes without a console error** for a happy-path 6-year-old flow (tap, speak/type, get acknowledgment, return home).
- **One coherent visual language** across home, all three activities, and the pet display. Not "matching pixel for pixel" — but no mix of pre-redesign and post-redesign surfaces visible to the kid in a single session.
- **No empty states** that look like errors. If a kid finishes the recipe, the home screen says so explicitly ("All done for today! 🌟"), not just shows three greyed-out tiles.

### 1.3 Infrastructure

- **Invite-token flow tested end-to-end** with at least one non-Ilana human (Eli's own kid, a friend's kid, anyone). Parent signs up via the link, child onboards, completes one activity, data lands in `practice_sessions` and `activity_attempts`.
- **Lifecycle columns from `measurement-plan.md §3.1`** (`started_at`, `completed_at`, `outcome`) deployed to the live Supabase. Without these, we collect data but can't answer drop-off questions later.
- **`scripts/db.sh` runbook** (measurement plan §4.1) has at least the N1, N3, L1, L4 queries written down, so Ilana or Eli can pull "did anyone practice this week" from day 1.

### 1.4 Parent brief

A one-page document exists at `docs/parent-onboarding.md` covering:
- What the app is and what it isn't (companion practice between Ilana's live sessions, not a teacher replacement).
- Realistic time commitment (5–15 min, 4 days/week, child-driven).
- Login flow with screenshots.
- What "today's practice" looks like (the recipe).
- What feedback is helpful and how to send it.
- Who to email if it breaks (Ilana for content/teaching questions, Eli for technical bugs).

Without this, parents will fill in the gaps with their own assumptions — usually wrong ones, usually in the direction of over-expecting.

### 1.5 Ilana's own walk-through

Ilana completes one full kid flow per activity type, on an iPad, in the morning (when kids will use it). This is the last check before invite tokens go out. She is allowed — and expected — to veto launch if anything is below her clinical bar. Half hour total.

**Exit criterion for the readiness gate:** all five sections above pass, signed off by Ilana in a one-line message ("ready to invite — IG").

---

## 2. Cohort plan (status-gated)

Once the gate is met, the cohort rolls out in tiers, not all at once. This protects us from a bug we shipped to all 10 kids on day 1.

| Tier | Size | Who | Goal | Move to next tier when |
|---|---|---|---|---|
| **Tier 1: Soft launch** | 2–3 students | Ilana's most-engaged parents, who'll tolerate roughness and send feedback | Catch the obvious bugs and UX failures only real kids reveal | 7 days elapsed AND no P0 bugs outstanding AND ≥2 of 3 kids practiced ≥3 times in week 1 |
| **Tier 2: Full cohort** | All remaining students Ilana wants to include | Whoever she'd normally invite | The actual data-collection period for the Phase 1a success metric | This is the steady state — runs for 4 weeks minimum before any "did Phase 1a work" decision |
| **Tier 3: Sustained** | Same | Same | Validate the 4-consecutive-weeks form of the north star (N2) | Reached at week 4 of tier 2 |

**On cohort size:** the doc deliberately doesn't put a number on tier 2. The right size is "whoever Ilana would invite if the app were ready" — typically estimated at 8–12 based on her active student roster, but she's the source of truth, and the number depends on how many parents are willing to commit to 4×/week for a month. **Ask her for the number once tier 1 is healthy, not before.**

---

## 3. Weekly rhythm (once tier 1 begins)

Total Ilana load: target ≤ 45 min/week. If we're asking for more, the protocol is too heavy.

### Monday — 15 min
1. Open `/teacher/metrics` (or run the runbook queries if the page isn't built yet).
2. Note for each active student: did they practice ≥4 days last week? Yes / No / Partial.
3. Pick **one** student to focus attention on this week — the one whose pattern most surprises you (positive or negative).

### Mid-week (during her live sessions) — 0 extra min
During the live session each student already has with Ilana, she asks one question: **"What was your practice like this week?"** Writes the one-line answer into the journal (§4). This is qualitative signal, the most valuable channel at small N.

### Friday — 15 min
Three bullets in the journal:
- **What worked** — one observation, specific (not "kids liked it").
- **What didn't** — one observation, specific.
- **What surprised me** — anything that broke a prediction, either direction.

### As-needed — ≤ 5 min per event
- **Level-up candidates** (per `phase-1a-program.md` Decision 4): dashboard surfaces them, Ilana confirms or snoozes within 48h.
- **P0 bug reports from parents:** forward to Eli, note the kid + date in the journal.
- **A kid hasn't practiced in 5 days:** Ilana sends the parent a low-pressure ping, notes the response.

### Total weekly budget
- Monday dashboard: 15 min
- Mid-week qualitative: 0 (folded into existing teaching time)
- Friday journal: 15 min
- As-needed: 5–15 min depending on the week
- **Target ceiling: 45 min/week.** If three consecutive weeks blow past 60 min, the protocol is wrong — flag and rework.

---

## 4. What Ilana logs (and where)

Three artifacts, each with a clear home. Resist creating a fourth.

### 4.1 The journal — `docs/teacher-journal.md`
Append-only. Markdown. One H2 per week (`## Week N (YYYY-MM-DD → YYYY-MM-DD)`). Under each week:
- **Per-student one-liners** from the mid-week live-session question.
- **Friday's three bullets** (worked / didn't / surprised).
- **Anything else worth remembering**, including parent quotes verbatim ("she asked to do it again" / "she cried when it crashed" — both go in).

No structure beyond that. The journal is for Ilana's clinical observations; over-structuring kills it.

### 4.2 The bug + content list — Linear or a simple `docs/issues.md`
Anything that needs to be fixed or added. Two columns of priority: **blocker** (a kid can't use the app) vs. **annoyance** (a kid can use the app but the experience is degraded). Eli works the list; Ilana adds to it.

### 4.3 The dashboard data
Lives in Supabase, surfaced via `/teacher/metrics` once built, otherwise via the runbook queries. No journaling on top of it — the data *is* the artifact.

---

## 5. What Ilana is looking for (validation questions)

These are the questions the dashboard cannot answer. They live in the journal. Ilana should have them in mind during her live sessions.

1. **Is content matched to ability?** When she sees the kid live, can she tell whether the app's difficulty band matches what they can actually do? Mis-calibration is the most common cause of disengagement that *looks* like "kid lost interest" but is actually "content was wrong."
2. **Is practice changing live-session behavior?** Do kids who practiced 4 days/week read measurably better in her Friday session than kids who didn't? She is the only person in the loop who can answer this.
3. **Are there content errors she would never have shipped?** Mis-spelled words, wrong phoneme splits, R2 (non-decodable beginner words), R11 (forbidden punctuation), R13 (sound vs. name confusion). She is the QA layer for the content library.
4. **What do kids say about the pet?** The pet system is intentionally thin in 1a — but the engagement assumption rests on it. Does the kid mention it unprompted? Does it pull them back?
5. **What do parents say without prompting?** Spontaneous parent quotes are the highest-signal data we have at this N. They go in the journal verbatim — no paraphrase.

---

## 6. Decision points

Three explicit checkpoints. Each has a defined question and a defined action.

### End of tier 1 (≈ day 7)
- **Question:** is the app shippable to a wider cohort?
- **Green:** no P0 bugs, ≥2 of 3 kids practiced ≥3 times → invite tier 2.
- **Yellow:** 1 P0 bug or 1 of 3 kids didn't practice at all → fix and extend tier 1 by 1 week.
- **Red:** multiple P0s or all 3 kids bounced → stop. Reopen `phase-1a-program.md` Decisions 1 and 3 before any further launch. This is the cheapest possible failure — only 3 families saw it.

### End of week 4 of tier 2
- **Question:** is the program shape working?
- **Green:** N1 (weekly active practice rate) ≥ 40%, journal contains specific unprompted positives, no systemic content issues → continue to week 8.
- **Yellow:** N1 between 20–40%, mixed journal signal → iterate on content + recipe length, hold off on any visual redesign. Re-evaluate in 2 weeks.
- **Red:** N1 < 20% or journal full of "kid lost interest" patterns → program shape is wrong, not the polish. Reopen `phase-1a-program.md` Decisions 1, 3, 4 before further building.

### End of week 8 of tier 2
- **Question:** did Phase 1a hit its success metric?
- **Pass:** N2 (4-week sustained rate of ≥4 days/week) ≥ 60% → Phase 1a validated, plan Phase 1b.
- **Near miss:** 40–60% → continue to week 12 with one targeted intervention (likely level-up mechanic or pet richness). Re-evaluate.
- **Fail:** < 40% → Phase 1a thesis is in doubt. Hard conversation about whether the companion-app model fits Ilana's students at all, or whether the audience needs to shift (e.g. older kids, group classroom use, parent-led model).

---

## 7. The honest scope of this protocol

Three things this doc deliberately does **not** do.

- **It does not promise a specific launch date.** §1's gate is the gate. If it takes 1 week to clear, tier 1 starts in a week. If it takes 6, tier 1 starts in 6.
- **It does not pretend the dashboard is the primary instrument at small N.** It is supporting evidence. The journal is the primary artifact for weeks 1–4. The dashboard becomes co-primary at week 4+ once attempts and sessions are numerous enough to escape noise (per `measurement-plan.md §6`).
- **It does not bind Ilana to a research-grade protocol.** She is a teacher, not a research subject. The 45 min/week budget exists because anything heavier will be silently dropped, and a dropped protocol produces worse data than no protocol. If the budget pressure conflicts with this doc, the doc loses, and we revise.

---

## 8. What to do this week (action items)

Concrete, in order. None of these involve inviting a single student.

1. **Audit the content library.** Count what exists per activity per difficulty band. Compare to §1.1. Produce a gap list.
2. **Burn down the gap list.** Use `/wordpets-content` to generate; Ilana spot-checks 10% per band.
3. **Polish pass on the four §1.2 bars.** Pixel/font/empty-state/error-state. Time-boxed — 2 days, not "until it feels right."
4. **Deploy lifecycle columns** (measurement plan §3.1) so we don't lose week-1 drop-off data.
5. **Write `docs/parent-onboarding.md`.** Short. Plain language. Screenshots.
6. **Ilana's walk-through** when 1–5 are done. She signs off, or she vetoes.
7. **Only then:** invite tier 1.

The temptation will be to do (7) earlier "to start learning." Resist. Tier 1 is the cheapest possible failure mode (~3 families) but it's still the only first impression those families get.

---

## 9. Open questions for review

- Cohort size at tier 2 — Ilana's answer, gathered after tier 1 is healthy. Don't pre-commit.
- Where the journal physically lives. Markdown in this repo is easiest for Eli to read but hardest for Ilana to write into on her phone. A shared Google Doc might be a better surface for her, with weekly copy-paste into the repo. Decide before tier 1.
- Whether Ilana wants Eli to attend any of her live sessions during the pilot weeks to see kid behavior directly. High-signal for product, possible imposition on her teaching. Her call.
- Whether the parent brief should also include a "what we're NOT promising" section (decodes faster, replaces tutoring, etc.) to manage expectations down. I'd argue yes; over-promising at intake produces the worst kind of churn (disappointed customers, not just lost ones).
