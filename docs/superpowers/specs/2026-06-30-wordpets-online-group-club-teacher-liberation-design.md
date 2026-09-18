# WordPets — Online Group Club & Teacher Liberation (Strategy Re-prioritization)

**Date:** 2026-06-30
**Status:** Draft for review (revised after adversarial review — 5 codebase-verified critics + synthesis; see review run `wf_7df4b8bf-561`)
**Project:** ~/projects/wordpets
**Supersedes priority of:** `docs/superpowers/plans/2026-06-22-wordpets-comics-pilot-refinement.md` (comics → dormant supporting asset, not top priority)
**Primary user / domain expert:** Ilana (teacher). Co-author / operator: Eli.
**Approval gate:** Eli sign-off. Until approved, no rebuilds; comics work pauses.

---

## Why this document exists

A new problem statement outranks current work. WordPets has been focused on **comics/content production**. That work is good but targets the wrong drain. This spec re-anchors the plan around the problem that actually matters, and de-scopes everything that doesn't serve it.

This is a **strategy/operating-model spec**, not a code plan. The implementation plan (concrete launch tasks) follows separately.

---

## The Problem Statement (Ilana's words, synthesized)

Ilana's teaching job pulls her in too many directions and drains her **physically and mentally**:

- She **physically runs between two schools**, hunts for students in un-air-conditioned hallways, cleans up after class, races to pick up her own kids — with a ~10-minute window to eat/breathe/use the bathroom.
- She threads **private lessons** through the week and teaches **online twice a week**. **There is no central location.**
- **Her mind is as scattered as her body** — two schools + threaded privates + online + kids at different levels means she never holds one thing in her head. The context-switching is its own exhaustion.

What she has already concluded herself:

- **She enjoys making materials** — a strength to protect, not a cost to cut.
- **Billing is minor.**
- The scheduling nightmare is **structural**: it revolves around *each student's individual availability*. The scheduling tax is **per-relationship, not per-hour** — one private student costs nearly a whole group's worth of coordination.
- She has **already dropped the Ahava after-school Zoom** — she only wants to run **her own** classes.
- She is **leaning toward dropping private lessons** despite good pay/easier teaching, because they fragment her.
- Her **teaching strength is grades 3-6** — but she is **open to younger grades on Zoom** (her past in-person K-1 difficulty was a *classroom-readiness* artifact — little kids not yet used to being students — which may **not** transfer to a 1-on-screen-with-parent online format).
- Kids sort by **reading ability, not age** (her words: "good point about age vs reading ability").
- After-school English demand *probably* exists → **launch and see who signs up** rather than pre-building a full curriculum.

---

## The Reframe (Priority #1) — *do not dilute*

> **WordPets is Ilana's off-ramp from the fragmenting in-person patchwork into her own online, consistent-group classes — with the app as the between-session engagement layer.**

The drain is fixed at the **operating-model** level, not the software level:

- The scheduling nightmare's root cause is one variable — *each student's personal calendar*. Publish **fixed group cohorts at set times** and have parents **choose a cohort**, and the jigsaw collapses into a few stable, repeating blocks. No booking/reminder/billing software dissolves it as cleanly as *removing the variable* does.
- **Consistent groups + set times + online = one location (home), a schedule she owns, no school-to-school running, no hot hallways, no cleanup, afternoon blocks built around her own kids' pickup.** It addresses the physical *and* the mental scatter.

### What this is explicitly NOT (rejected frames)

- **Not** an admin/automation product (booking/reminders/billing). Consistent cohorts dissolve scheduling structurally; billing is minor.
- **Not** a from-scratch **Teacher Studio** build.
- **Not** gated on a full **K-6 curriculum**.
- **Not** folding the in-person school work *into* WordPets. WordPets stays the clean online model; school classes are separate, shrinking runway.

---

## Band Decision — the resolved blocker (READ THIS)

**Asset reality (codebase-verified):** every existing asset is built for **early readers, ages ~6-8**:
- `src/lib/fixtures/student.ts` → `age: 7`, 16 beginner CVC items (cat/hat/pig/dog).
- KB (`kb/`) → Letterbooks / early-CVC readers.
- `comics/` → early decodable.
- `marketing/zoom-classes/index.html` → says "Ages 6-8" in six places.

**The contradiction this kills:** "lead with grades 3-6" + "near-zero curriculum cost" + "app is the wedge" cannot all be true — 3-6 is the band with the *highest* authoring cost and the *worst* asset fit.

**DECISION (Ilana, 2026-06-30): launch band = GRADES 3-6 — lead with strength (Option B).** Rationale:
- **Her best teaching** is grades 3-6, and it's the **easier Zoom sell** — older kids self-regulate on screen, so the young-on-Zoom objection we worried about largely disappears at this age.
- The extra authoring this requires is **work Ilana enjoys and is expert at, for the band she knows best** — so the "authoring cost" is aligned with her strength and enjoyment, not a chore. This is the key reason Option B is coherent despite the asset gap.

**Accepted costs of Option B (must be honored, not hand-waved):**
- **Fresh Term-1 authoring.** The existing assets (fixtures = age-7 CVC cat/hat, KB Letterbooks, comics = early decodable) are **young-framed and do NOT transfer** — same early-reading *skills*, but in babyish materials a grade-3-6 struggler would reject. Cohort #1's term is **built fresh**, front-loaded and execute-only (see Curriculum). The "near-zero curriculum" claim is **retired** for this launch.
- **Reskin the live page.** `marketing/zoom-classes/index.html` says "Ages 6-8" in six places — **re-copy it to the grade-3-6 framing before it goes to any parent.**
- **Age-appropriate app content (open decision).** The app's practice content is age-7 CVC — babyish for this band. Either age-up the word lists/passages (via `/wordpets-content` + fixtures + reseed) before relying on it, or run cohort #1 with **light/optional** app use and age-up later. See App section.

**Deferred:** the early-reader band (~6-9), where the current assets fit, becomes a *later* cohort once the grade-3-6 format is proven.

**Reading-stage still governs the group's coherence:** "grades 3-6" spans a fluent 11-yo to a non-reading 8-yo. The probe must capture a **reading-stage proxy** so cohort #1 is level-coherent enough to teach as one group — otherwise the differentiation jigsaw re-forms inside the live hour (itself a named drain).

**In-group coherence guardrail:** fixed cohorts collapse the *scheduling* jigsaw, but a mixed-reading-level group re-creates the *differentiation* jigsaw inside the live hour (teaching "different levels" is itself a named drain). So the probe must capture a **reading-stage proxy** (e.g. "can your child read simple sentences yet?"), and a cohort must be level-coherent enough for Ilana to teach as one group. Define the in-group tolerance with Ilana before filling.

---

## Operating Model

- **Delivery:** Live online (Zoom — muscle exists), **small consistent groups at fixed weekly times.**
- **Band:** grades 3-6, developing readers (banded by **reading stage** for in-group coherence — see Band Decision).
- **Between sessions:** the WordPets app provides daily practice + the pet. **Status-honest framing:** the app is a **between-session engagement layer**, *not* "the thing parents are buying," until (i) ≥1 real kid is verified opening it unprompted across a week, and (ii) it fits the chosen band. The Phase 1a retention metric (≥60% practicing 4+ days/week) is **still unmet** (per `CLAUDE.md`). **For grades 3-6 its practice content (age-7 CVC) is too young** — age it up before relying on it, or use it lightly for cohort #1 (open decision).
- **Materials:** Ilana authors the live-class plan (she enjoys this), drawing on the asset library **only when convenient** — assets are a convenience, not a launch dependency.

### App group-readiness gap + the manual workaround (honesty)

Verified in `src/types/database.ts`: the data model is **teacher → individual student** (Profile, Student, per-student FocusArea, per-student InviteToken via `student_id`, PracticeSession, ActivityAttempt). **There is no cohort / group / term / enrollment entity.** "No major new build" is therefore *false* for a true group model.

**Cohort #1 workaround (no build):** invite each of the ~4-6 kids as an individual student with the *same* focus-area + difficulty. **Confirm with Ilana that hand-managing 4-6 individual records weekly is acceptable.** "Minimal cohort grouping" may become a *small* later line-item — it must **not** balloon into Teacher Studio.

---

## Curriculum Strategy (de-scoped + bandwidth-protected)

Decouple two decisions:
- **How to BUILD:** methodically, foundation-first, eventually K-6. *(Ilana is right.)*
- **Whether to FINISH before launching:** **No.**

Rules:
- **Launch unit = one band, one term (~8-10 weeks).**
- **Front-load Term 1, execute-only.** Build the full term **in the gap between the enrollment probe and the first class** (when there's no live-teaching pressure on this strand). The term is then *delivered*, not *authored-while-teaching*. "Stay ~2 weeks ahead" is a **Term 2+ fallback**, not the launch model — if a term can't be pre-built, **the start date moves, not the prep**.
- **Cap net-new authoring** against Ilana's real available weekly hours; name the cap before committing.
- **K-6 is DORMANT** (zero bandwidth) until cohort #1 runs a full term *and* its income replaces a draining piece. The "parallel K-6 track" is removed — it was the over-scoped frame in disguise.
- **Build only for cohorts that fill.**

Asset library (convenience, not dependency): `kb/`, `src/lib/fixtures/student.ts`, `comics/`, `/wordpets-content`. (These fit the early-reader band; they do ~zero work for a 3-6 band.)

---

## The Launch-and-Learn First Move (the real deltas)

The enrollment page **already exists and is deployed on Netlify** (`marketing/zoom-classes/index.html` — hero, features, how-it-works, Meet Ilana, FAQ). **Do not rebuild it.** The only true launch deltas:

1. **Add a capture instrument.** Its only CTA today is a free-text `mailto` + WhatsApp link — **no grade selector, no time-slot picker** — so "demand reveals the band" cannot run. Replace with a **3-field structured probe**: (a) child's reading-stage proxy [+ grade], (b) pick from candidate time-slots, (c) contact. Responses then **cluster automatically** instead of generating per-relationship admin.
2. **Reconcile band copy.** Launch band = grades 3-6, so the page's "Ages 6-8" copy (six places) must be **re-copied to the grade-3-6 framing** before it goes to any parent.
3. **Clustering rule:** *first band+slot to reach the minimum-to-run headcount → cohort #1.*
4. **Intake is triaged by Eli, not Ilana.** Eli reads replies and hands Ilana a clean cohort list + one scheduled group event. Ilana does **not** field an open inbox (that's a silent per-relationship drain).

**First milestone:** one cohort cleared to the minimum-to-run headcount + Term 1 pre-built → first class runs.

---

## Wean Math Worksheet (close the trigger)

The wean trigger — *drop a piece when online income replaces its income* — is uncheckable without numbers. The project's own playbook (`docs/ideation/business-plan-launch-playbook.md`) already has them: **600₪/student/6 weeks** (8 kids = 4,800₪; two groups ≈ 9,600₪/6wk) and **monthly subscription tiers 280-480₪/mo** (recommended model for an IL school-year program).

**Inputs needed from Ilana (the only blocking unknowns):**
- Current **private-lesson monthly income** = `[NEEDED]` (the number to beat for rung 2).
- Current **per-school monthly income** = `[NEEDED]` ×2 (numbers to beat for rung 3, school-by-school).

**Formula:** `per-cohort revenue = group size × price × fill-rate`. `cohorts to replace income X = X ÷ per-cohort revenue`.

**Illustrative (monthly model — replace with real private income to finalize):**

| Price/mo | Group size | Revenue/cohort/mo | Cohorts to clear 3,000₪ | to clear 5,000₪ |
|---|---|---|---|---|
| 300₪ | 5 | 1,500₪ | 2 | ~4 |
| 350₪ | 5 | 1,750₪ | ~2 | ~3 |
| 400₪ | 6 | 2,400₪ | ~2 | ~3 |

Set price so a **filled cohort meaningfully out-earns the per-hour of private work** (groups out-earn privates *per teaching hour* once filled). Frame this as **"how many students cross the bar,"** never as billing infrastructure.

---

## Sales / Market Motion

- **Warm local rapport is the *match*, not the *fire*.** Cohort #1 = a *selective slice* of warm families (no acquisition cost; proves the **format**). Protect Ahava: don't recruit their students; serve families outside Ahava or needing the specialized online literacy Ahava doesn't offer (Ilana draws the line).
- **A *program* reduces neighbor-friction** vs. ad-hoc privates: set times, clear terms, fixed price depersonalize the money.
- **Warm→cold acquisition cliff (named, sequenced).** End-state income must come from beyond <10 warm local students, but Ilana's personal reputation doesn't travel to strangers. So: **cohort #1 = warm list; cohort #2+ = referral incentive for cohort-1 families + 1-2 named channels** (Anglo/olim Facebook groups e.g. Janglo, parent WhatsApp groups, one simple SEO target). **Gate:** prove **≥1 cold-acquired family converts** before betting the income-replacement endgame on online breadth.
- **Bounded trial (not a per-family drain).** "Proof-first" = **one scheduled group open-house at the fixed cohort time**, run once a slot has enough interest — **never** ad-hoc per-family demos (those recreate the exact scheduling tax + unpaid labor this spec exists to kill). Or offer "**first paid week, refundable**." Assume ~50% trial→paid so the interest count needed to fill is explicit.
- **Warm-family sanity check (do this first, costs nothing):** ask 2-3 current private families *"would you move from your private slot to a fixed [day] [time] group of 4-6 at [price]?"* Warm families self-selected into bespoke flexibility — a fixed group at lower per-child attention can read as a downgrade. Their answer de-risks the whole bet before any build.

---

## Launch Clock / Falsification Gate

The launch-and-learn loop must be able to **conclude "this format doesn't sell"** — otherwise Ilana stays in the draining patchwork while perpetually "about to launch."

- **Enrollment window:** 2-3 weeks.
- **Go/no-go (dated):** if fewer than **`[N]` PAID commitments** (deposit or paid-trial booked — *not* interest clicks) for a single band+slot by `[date]`, **do not build the cohort** — rotate band/time, or reassess the format.
- Distinguish **interest** (form fill) from **commitment** (money down).

---

## Success Metrics (falsifiable + dated)

1. **Launch:** one cohort reaches **≥`[N]` paying kids** (the minimum-to-run = definition of "filled") and runs a full term. Review by `[date]`.
2. **Wean rung 2:** online group income **≥ current private-lesson monthly income** → drop private lessons.
3. **Wean rung 3 (symmetric):** drop **school N** when online income replaces **school-N's** income (or explicitly: schools dropped last/opportunistically). Schools are the main *physical* drain — don't leave this rung trigger-less.
4. **Human metric (proxy):** distinct in-person teaching locations drop from *2 schools + private threads* → **≤1**; weekly distinct time-blocks held in her head materially reduced. Review at end of cohort-1 term.

---

## De-prioritized (explicitly)

- **Comics pilot refinement** (`2026-06-22-...`): **no active effort until a cohort actually needs it.** Comics (early decodable) only help if cohort #1 is an early-reader band; they do nothing for a 3-6 band. Not a launch input.
- **Billing automation:** one line only — **collect manually (Bit / bank transfer); no billing software until volume is painful.** (No Greeninvoice/Grow setup now — that was the rejected billing frame creeping back.)
- **Heavy scheduling tooling / Teacher Studio:** unnecessary once cohorts are fixed.
- **Full K-6 curriculum up front / parallel K-6 track:** dormant.

---

## Open Decisions

**Decide NOW (these gate launch or the wean math):**
| Decision | Recommended default |
|---|---|
| Launch band | **Grades 3-6 — DECIDED 2026-06-30 (lead with strength)** |
| App content for cohort #1 | Age-up practice content first, *or* run cohort #1 with light/optional app use — *pick one* |
| Price + model | Monthly subscription (per playbook); set so filled cohort out-earns private per hour |
| Group size floor + minimum-to-run headcount | e.g. ≥4 paying kids = "filled" |
| Term length | ~8-10 weeks |
| Current private (and per-school) monthly income | `[NEEDED from Ilana]` — closes the wean math |

**Resolve FROM cohort #1 (do not pre-decide):**
- Exact time slot(s) — afternoon fitting her kids' pickup; **risk:** if her only viable slot doesn't overlap family availability, there may be no common time (acknowledged failure path).
- Marketing breadth — warm beachhead → named online channels.
- Payment rails — manual until painful.

---

## Risks & Mitigations

- **Cohort won't fill** → warm-family sanity check first; warm beachhead for cohort #1; structured probe + dated go/no-go.
- **Demand doesn't transfer to online set-time groups** → it's a hypothesis-under-test, not a premise; the launch clock forces a conclusion.
- **Band/asset mismatch** → launch the band the assets fit (early readers); 3-6 is funded expansion.
- **Income gap during wean** → keep school runway; never drop a piece until online replaces its income.
- **In-group level scatter recreates the cognitive drain** → reading-stage proxy in probe + defined in-group tolerance.
- **Curriculum/trial/inbox quietly become new drains** → front-loaded execute-only term; bounded group trial; Eli triages intake. **WordPets must not become another draining direction** — this is the spec's own failure condition.

---

## Roadmap reprioritization

1. **Now:** warm-family sanity check → add probe instrument to the live page → enrollment window → cohort #1.
2. **Comics/content:** dormant until a cohort needs it.
3. **Phase 1a app:** stays live as the engagement layer; manual workaround for groups; no major build to launch.
4. **Heavy ops/billing/Teacher Studio/K-6:** deferred until volume or proven format demands.
