# WordPets Phase 1a — Measurement Plan

**Status:** Draft for review (2026-05-12). Implementation deferred until plan is approved.
**Owner:** Eli. Stakeholder: Ilana (teacher).
**Origin:** Deferred from courtroom objection #14 on the visual redesign PR. We shipped the redesign narrow on the agreement that we'd build the measurement story separately, here.
**Companion docs:** `docs/phase-1a-program.md` (what the program shape is) and `docs/teacher-protocol.md` (how Ilana operates it). This doc is downstream of both — metrics are only meaningful once the program and protocol are specified.

---

## 1. What we're trying to answer

Three classes of question, in order of business importance:

1. **Are we hitting the north-star metric?** ≥60% of Ilana's students practicing on ≥4 distinct days in a 7-day window, sustained for 4 consecutive weeks. (From `CLAUDE.md`.)
2. **Where does the practice loop leak?** A student lands in the app — what fraction of that opens results in a completed session? Per-activity drop-off?
3. **Does a redesign actually help?** When we ship a visual or mechanical change, can we tell whether it moved any of (1) or (2) within 2 weeks?

Everything below is in service of those three questions. If a metric doesn't feed one of them, it doesn't go on the dashboard.

---

## 2. Metrics

Grouped by which question they answer. **Layer A** = computable from data we already store. **Layer B** = needs new instrumentation (see §3).

### 2.1 North-star (question 1)

| # | Metric | Definition | Layer | Notes |
|---|---|---|---|---|
| N1 | **Weekly active practice rate** | % of active students who practiced on ≥4 distinct dates in the trailing 7d | A | "Active student" = invited and onboarded (has at least one `practice_sessions` row ever). The Phase 1a success metric. |
| N2 | **4-week sustained rate** | % of active students who hit N1 in 4 consecutive 7-day windows | A | The actual Phase 1a success criterion. Can only be computed once a student has been active ≥28 days. |
| N3 | **Practice days per student per week** | Distinct `date` values in `practice_sessions` per student in trailing 7d | A | Cohort distribution, not just mean. Report median + p25/p75. |

### 2.2 Practice-loop health (question 2)

| # | Metric | Definition | Layer | Notes |
|---|---|---|---|---|
| L1 | **Session completion rate** | `count(completed=true) / count(*)` over `practice_sessions` in window | A | Today this is `count(completed=true) / count(completed=true)` because we only insert on completion — see gap §3.1. |
| L2 | **Time-to-first-activity** | Median seconds from session start → first `activity_attempts` row | **B** | Needs `practice_sessions.started_at`. Today only `created_at` exists and is set at completion or start depending on call site (verify). |
| L3 | **Activity drop-off by type** | For each `activity_type`: started / abandoned / completed counts. | **B** | Needs an `outcome` enum on attempts OR a separate `activity_started_at` row. |
| L4 | **Activity median duration** | Median `duration_seconds` per `activity_type` per difficulty | A | Proxy for engagement depth. Read-aloud duration is meaningful here even though scoring isn't (R7). |
| L5 | **Repeat-session rate (24h)** | % of sessions where the student returns within 24h | A | Computable from `practice_sessions.date` deltas per student. |
| L6 | **Repeat-session rate (7d)** | % of sessions where the student returns within 7d | A | Same. |
| L7 | **Coins-earned distribution** | Median coins per completed session | A | Proxy for "how much of the session content did they actually do." |
| L8 | **Phonics/Spelling score trend** | Median `score` per student over time, **phonics + spelling only** | A | **R7-compliant:** read_aloud `score` is null by design; this metric must exclude `activity_type='read_aloud'`. |

### 2.3 Adoption / onboarding funnel (question 3 baseline)

| # | Metric | Definition | Layer | Notes |
|---|---|---|---|---|
| F1 | **Invite → signup** | Count of `invite_tokens.used=true` / total issued | A | Already in schema. |
| F2 | **Signup → first session** | % of students with ≥1 `practice_sessions` row, computed over students created ≥48h ago | A | The "did they ever come back" funnel step. |
| F3 | **First session → second session** | % of students with ≥2 `practice_sessions` rows | A | Activation in the classic sense. |

### 2.4 Explicitly NOT measured (Phase 1a)

- **Read-aloud "accuracy" / Whisper-based correctness** — banned by R7/R17. We record `transcript` and `audio_url` for teacher review only; we don't compute or display a derived score for kids.
- **Streaks** — banned by R25. We can compute consecutive-day counts internally for the north-star, but no streak number is displayed to the child or used in a "you missed N days" surface.
- **Per-letter / per-grapheme accuracy** — too noisy at N=1–10 students; defer until phonics has ≥1000 attempts.
- **Pet-feeding engagement counts** — pet system is intentionally thin in 1a; instrument later if 1b lands.

---

## 3. Instrumentation gaps

Today's schema (`supabase/schema-v2.sql`) captures **completed outcomes**, not **the journey to them**. That's fine for north-star metrics (N1–N3 work today) but insufficient for loop-health metrics (L2, L3) and for any "where do they drop off" question. We have two options.

### 3.1 Minimum viable: add lifecycle columns to existing tables

**No new tables.** Two migrations:

```sql
alter table practice_sessions
  add column started_at  timestamptz not null default now(),
  add column completed_at timestamptz;
-- backfill: update set completed_at = created_at where completed = true;
-- new contract: insert with started_at=now(), completed=false on session start;
--              update with completed=true, completed_at=now() on completion.

alter table activity_attempts
  add column started_at  timestamptz not null default now(),
  add column completed_at timestamptz,
  add column outcome text check (outcome in ('completed', 'abandoned', 'skipped'));
-- new contract: insert row when activity opens; update on completion/skip;
--              outcome stays null while in-progress; sweep job marks stale rows abandoned.
```

Call-site changes (small):

- `src/lib/practice/start-session.ts` (or equivalent) inserts a row at the moment the student taps "Start practice", not at completion.
- Activity components insert their `activity_attempts` row at mount/open, update on done/skip/back-out.
- A nightly cron (or on-read) marks any `activity_attempts` row with `completed_at IS NULL` and `started_at < now() - interval '1 hour'` as `outcome='abandoned'`. (Reason for 1 hour: longer than any plausible session, shorter than next-day return.)

This buys us L2 (time-to-first-activity), L3 (drop-off), and a real L1 (completion rate ≠ 100%).

**Privacy note (COPPA-adjacent):** all of this stays in Supabase under existing RLS. No new PII fields. No new third-party processors.

### 3.2 Stretch: lightweight `events` table

Only if §3.1 turns out to be insufficient (e.g., we want to know "how often does a kid tap the pet vs. tap a practice button on the home screen"):

```sql
create table events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade not null,
  event_type text not null,    -- 'home_open', 'pet_tap', 'practice_tap', 'activity_open', ...
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);
-- RLS: student's parent and assigned teacher only.
```

**Decision: defer until §3.1 is in and we've spent a week looking at the data.** Adding a generic event log is the kind of move that feels productive but rots into a write-only dump if there's no question driving it. We should only add it when a specific question fails to be answerable from the lifecycle columns.

### 3.3 Third-party analytics — explicit *no* for Phase 1a

PostHog / Mixpanel / Amplitude would be faster than rolling our own dashboard. Reasons we're not doing it:

- **Children's data + COPPA-adjacent risk.** Even hashed student IDs in a US-EU pipeline is a conversation we don't want to have with Ilana's parents until we have to.
- **N≈1–10 doesn't need a real-time funnel tool.** SQL over Supabase is sufficient for this scale.
- **Lock-in cost.** Once events go through PostHog, "switch off PostHog" becomes a backend project.

Revisit at Phase 1b if we cross ~50 students or a second teacher.

---

## 4. Dashboard / view: phased

### 4.1 Phase v0 (week 1) — runbook

Deliverable: `docs/measurement-runbook.md` with named queries, runnable via `scripts/db.sh`. One per metric in §2. Each query takes a window (default trailing 7d) and prints a table.

Example:

```bash
./scripts/db.sh "$(cat <<'SQL'
-- N1: weekly active practice rate, trailing 7 days
with active_students as (
  select id from students
  where exists (select 1 from practice_sessions ps where ps.student_id = students.id)
),
practice_days as (
  select s.id as student_id,
         count(distinct ps.date) as days_practiced
  from active_students s
  left join practice_sessions ps
    on ps.student_id = s.id
   and ps.date >= current_date - interval '7 days'
   and ps.completed = true
  group by s.id
)
select count(*) filter (where days_practiced >= 4)::float / nullif(count(*), 0) as wap_rate,
       count(*) as n_students
from practice_days;
SQL
)"
```

Cost: ~half a day. Output: a runnable book of ~10 queries. Ilana doesn't see this; Eli runs it weekly.

### 4.2 Phase v1 (when N ≥ ~10 students) — `/teacher/metrics`

Deliverable: a single server-rendered page at `/teacher/metrics` (teacher-only, gated by `profiles.role='teacher'`). Renders the same queries as v0 against the requesting teacher's students only.

Layout:

- Top card: N1 (weekly active rate) with a "since 4 weeks ago" sparkline if we have the history.
- Per-student table: name, days-this-week, completion rate, last seen.
- Per-activity table: phonics / spelling / read_aloud — drop-off rate, median duration, median score (phonics+spelling only).
- One footer line that says "metrics computed at HH:MM from N sessions; transcripts are machine-generated and may be inaccurate" — R17 reminder for any drill-down view.

Implementation:

- Wrap queries in Supabase SQL views, prefix `metrics_`. RLS-aware via `auth.uid() = teacher_id` patterns matching existing policies.
- Page is `app/teacher/metrics/page.tsx`, server component, no client JS for v1.
- No charting library — HTML tables and bare CSS bars. Adding Recharts is a Phase 1b decision.

Estimated cost: 1 day after the schema migrations land.

### 4.3 Phase v2 — Slack/email digest (only if Ilana asks)

A weekly cron that posts N1, N3, top-2 struggling students to a Slack channel or email Ilana. Cheap to add (Supabase cron + webhook), but only worth it once Ilana has logged into `/teacher/metrics` and confirmed which numbers she actually checks.

---

## 5. Before/after comparison protocol

This is the hard part. Two failure modes to avoid:

- **Eyeballing N=1.** "It feels faster to start practice now" is not evidence.
- **Cohort drift.** Comparing "students who practiced in April" to "students who practiced in May" confounds the redesign with seasonality, classroom changes, and Ilana's own teaching shifts.

### 5.1 Baseline-first discipline

Before shipping a redesign of *any* user-visible flow, write down the current value of the metric(s) the redesign is supposed to move. Store as a row in a new `releases` table:

```sql
create table releases (
  id uuid primary key default gen_random_uuid(),
  shipped_at timestamptz not null default now(),
  label text not null,                      -- e.g. 'visual-redesign-v1'
  description text not null,
  hypothesis text not null,                 -- "expect L1 to rise from 0.X to 0.Y"
  affected_metrics text[] not null,         -- ['L1', 'L2']
  baseline_snapshot jsonb not null          -- {n_students, window, metric values}
);
```

The hypothesis field is what stops scope creep — if you can't predict which metric should move, the redesign is decorative and doesn't need before/after.

### 5.2 Within-subject pre/post (the realistic protocol for N<20)

For each release row:

1. **Pre-window:** 14 days immediately before `shipped_at`. Only include students who were active in this window.
2. **Post-window:** 14 days starting `shipped_at + 24h` (skip the first day to avoid push-notification / "new app" novelty noise).
3. Compute the affected metrics on the **same students** in both windows. Difference is the read.
4. Required N for the read to count: **≥5 students × 10 sessions each in both windows.** Below that, write "directional only, N too small" in the post-mortem.

This is not statistical significance — at N≈10 nothing is "significant" without an effect size of >40 percentage points. It's a sanity check that the change didn't make things *worse*, plus a directional read.

### 5.3 A/B (deferred until N ≥ 20 students per teacher)

We don't have the volume. When we do:

- Assignment by hashing `student_id` into two buckets at the redesign boundary.
- Persist assignment in `students.experiment_assignments jsonb`.
- Required N for a 10pp lift detection at α=0.05 on a binomial proportion centered near 0.5: ~390 per arm. We will never have this. Practical floor: 30 per arm for an obvious effect.
- Until then: §5.2 pre/post is the protocol.

### 5.4 What to do with the redesign that already shipped

The visual redesign that triggered this plan shipped without a baseline snapshot. Two options, neither great:

- **Reconstruct baseline retroactively** from `practice_sessions` rows in the 14 days before the redesign merged. Possible for N1/N3/L1/L4/L5–L7. Impossible for L2/L3 because the instrumentation didn't exist.
- **Treat this redesign as a freebie**, accept we won't know if it helped, and apply the protocol starting with the *next* visible change.

Recommendation: do the retroactive read for the metrics we can compute, document it as `releases.label='visual-redesign-v1'` with a `hypothesis='retroactive — no pre-registered prediction'`, and don't draw strong conclusions. Then enforce §5.1 for everything after.

---

## 6. Honest scope of certainty

With Ilana's one student today, the data layer described above will produce numbers, but those numbers are anecdote dressed as metrics until the cohort grows. Concrete thresholds:

| Metric class | Minimum N to take seriously |
|---|---|
| Per-student qualitative trends (one student's score trajectory) | 1 student × 20 sessions |
| Cohort completion / drop-off rates (L1, L3) | 10 students × 14 days |
| North-star sustained rate (N2) | 10 students × 28 days |
| Before/after redesign read (§5.2) | 5 students × 10 sessions per window |
| A/B reads (§5.3) | 30 students per arm minimum, 390 for real power |

Below those thresholds, the right behavior is to **read the numbers and ask Ilana what she's seeing in the live sessions**. Quantitative signal at small N is for trend confirmation, not decision-making.

**Corollary — primary instrument for weeks 1–4.** During the first 4 weeks of tier 2 of the rollout (see `docs/teacher-protocol.md §2`), the teacher journal is the *primary* data artifact and the dashboard is supporting evidence. This inverts the common assumption that a metrics dashboard is the primary instrument from day 1. It is not — at N=5–10 students × 14 days, Ilana's clinical observations from her live sessions carry more signal than any number this dashboard can produce. After week 4 of tier 2 the two channels become co-primary; the dashboard becomes primary at scale (≥30 students sustained).

---

## 7. Sequencing — what to build in what order

If this plan is approved:

1. **Week 1**: Add lifecycle columns (§3.1). Update session/activity insert call-sites. Write the v0 runbook (§4.1). Reconstruct a retroactive baseline for the already-shipped redesign (§5.4).
2. **Week 2**: Build `releases` table and pre-register the next redesign with a baseline snapshot. Continue weekly runbook reads.
3. **Week 3–4**: As soon as N ≥ ~5 students sustained, build `/teacher/metrics` (§4.2). Get Ilana to look at it and tell us what's confusing.
4. **Later (gated on N or pain)**: events table (§3.2), Slack digest (§4.3), serious A/B (§5.3).

Total upfront effort to get from "no metrics" to "we know if a redesign helped": ~2 days of work spread over 2 weeks.

---

## 8. Open questions for review

- Is the §5.2 pre/post protocol acceptable to Ilana as the standard, or does she want a stricter "hold the change for a control group" approach? (Stricter = slower learning at this N.)
- Should `releases` rows be authored by hand at deploy time, or auto-created by a CI hook on merges that touch `src/app/student/**`? Auto-creation reduces forgetting; manual authorship forces the hypothesis-writing discipline.
- The retroactive baseline for the shipped redesign (§5.4) — worth the half-day, or skip it and start fresh from the next change?
