# FABLE 5 PROMPT REWRITE — WordPets grades-3-6 launch

**Date:** 2026-06-30
**Source spec:** `docs/superpowers/specs/2026-06-30-wordpets-online-group-club-teacher-liberation-design.md`
**Purpose:** Convert the piecemeal launch task list into whole-job handoffs a large model (Fable 5) can own end-to-end, with a few human rulings.

---

## Verdict

**Split.** The *curriculum authoring* and the *enrollment-funnel stand-up* are genuinely Fable-sized (long, multi-source, grounded runs). The *wean-math calc* and the *warm-family script* are not — they're minutes of cheap work; do not spend Fable money on them. Rescoping "up" here means **consolidating four fragments into two whole jobs**, not inflating small asks.

---

## Small-model tells found (in the current task framing)

- **"Term-1 *outline*."** Asking for a skeleton to be filled in later encodes the small-model assumption that the model can't hold a whole curriculum in one run. Fable can author the *finished, teach-ready term*, not an outline.
- **Chunked launch: "re-copy the page, add a form, write a script, draft an outline."** Four hand-offable steps is a whole job ("make the grades-3-6 club start capturing committed demand") sliced into pieces a small model would need fed one at a time.
- **"Build week 1, then stay ~2 weeks ahead."** A rolling, per-week cadence is scaffolding for limited context. A capable model builds all 8-10 weeks up front (the spec already prefers this — "front-load, execute-only"); the cadence language is a leftover.
- **Per-step "confirm with Ilana" sprinkled through the work.** Some are genuine human rulings (band, price, income). Others are hand-holding — a trained instinct to check every move. Collapse them into a *small set of named gates*, not a running approval drip.
- **Implicit "a person assembles this."** The tasks assume Eli/Ilana manually stitch page + form + KB + content. A whole-job handoff lets the model do the stitching and hand back a reviewable result.

---

## The rebuilt handoffs (paste-ready)

### HANDOFF A — Stand up the grades-3-6 enrollment funnel + demand probe

> **Outcome.** The existing, deployed marketing page (`marketing/zoom-classes/index.html`) is recast for **grades 3-6** and captures *structured, committed* demand: a parent can state their child's **reading level** (a plain proxy question, not jargon), pick from **candidate weekly time-slots**, and leave contact + a commitment step (paid trial or deposit). Submissions land in one place, already tagged by band+slot so they **cluster automatically**. Ship it live (or as a deploy-ready PR — see human gate).
>
> **Source pack.** The spec (§Launch-and-Learn, §Wean Math, §Sales); the current `index.html` (~345 lines: hero, features, how-it-works, Meet Ilana, FAQ; today's CTA is a bare `mailto:ilanahecht@gmail.com` + WhatsApp `054-747-1256`, and "Ages 6-8" appears in six places); the business playbook (`docs/ideation/business-plan-launch-playbook.md`) for pricing tiers.
>
> **Boundaries.** Edit copy + add the capture instrument — **do not rebuild the page** or restyle it. Don't touch the WordPets app auth/DB. **No billing software** — the commitment step routes to a manual payment (Bit/bank transfer) or a single payment link. Remove every "Ages 6-8" trace; nothing young-framed left.
>
> **Review standard.** A real parent can complete: reading-level → time-slot → contact → commit, in under two minutes on mobile; every response is machine-clusterable to a band+slot; copy reads grades-3-6 throughout; the go/no-go rule is encoded ("first band+slot to reach the minimum-to-run headcount → cohort #1").
>
> **Proof trail.** The diff; a screenshot or live URL; one real test submission showing the clustered output; a note of every file touched.
>
> **Human gate.** Ilana rules on: the reading-level question wording, the candidate time-slots (from her real availability), and the price shown. Eli approves the copy and whether the run **deploys** or stops at a PR.

### HANDOFF B — Author the full grades-3-6 developing-reader Term 1 (teach-ready)

> **Outcome.** A complete **~8-10 week** literacy term for **grades 3-6 developing readers** (kids who speak English but can't yet read/write): week-by-week lesson plans + the actual materials + between-session practice, **age-appropriate** (emphatically *not* cat/hat CVC), grounded in Ilana's own pedagogy. Ready to teach week 1 with no further authoring.
>
> **Source pack.** The teaching KB (`kb/` — curriculum, activities, and the 10 principles; query via `/curriculum-lookup`, `/teaching-principles`, `/activity-ideas`); the `/wordpets-content` skill (generates practice grounded in Ilana's principles); `docs/non-negotiable-rules.md` (R1 literacy font, R2-R3 decodability + difficulty progression); the spec (§Band Decision, §Curriculum Strategy).
>
> **Boundaries.** Grades 3-6 developing readers **only** — do not build K-6, do not build the deferred early-reader (6-9) band. Reuse the KB's *skill sequence* but re-author the *materials* age-appropriately. Invent no pedagogy outside Ilana's principles; where a real pedagogical judgment is needed, **flag it for her ruling** rather than guessing.
>
> **Review standard.** Ilana can teach week 1 as-is and recognizes it as her approach; each week states its target skill + how it builds on the last; materials pass the R2-R3 decodability/difficulty rules and read as age-appropriate for 8-12s, not babyish.
>
> **Proof trail.** Per-week: plan + material list + which KB sources/principles each draws on + a decodability check. A one-page term arc up front. A list of every point flagged for Ilana's ruling.
>
> **Human gate.** Ilana reviews the term arc and signs off **week 1** before the first class; the rest can be reviewed while the term runs.

---

## What changed and why

- **Term-1 *outline* → the finished, teach-ready term.** A capable model produces the artifact, not a skeleton someone else fills in.
- **Four launch fragments → one "enrollment funnel" whole job.** The model stitches page + form + clustering instead of being fed each step.
- **"Week 1 then stay ahead" → build the whole term front-loaded.** Removes the rolling-cadence scaffolding the spec already wanted gone.
- **Approval drip → two named human gates.** Genuine rulings (reading-level wording, slots, price / term arc + week 1) are collected; per-step check-ins are dropped.
- **Wean-math + warm-family script pulled *out* of the Fable scope.** Named as cheap/inline work so no Fable money is spent on minutes-long tasks.
- **"Ages 6-8" everything → grades-3-6 throughout, young assets parked.** Matches the band decision; comics/CVC content explicitly out of scope for this launch.

---

## Still under-specified — against the nine Whole-Job Spec fields

- **Tool access** — *Can the Fable run write to the repo, deploy to Netlify, and run the KB's Python env + skills? Name the permissions, or it stalls at "prepared a PR."*
- **Cost route** — *Confirm: Handoffs A + B on Fable; wean-math and warm-family script on a cheap model or done inline. Agree?*
- **Human gate (data)** — *Ilana's current private-lesson monthly income (+ per-school) — the number the wean math needs. Still blank.*
- **Human gate (rulings)** — *The price to display, the candidate time-slots (from Ilana's real availability), and the reading-level question wording. Provide these or mark them as the run's first flagged questions.*
- **Work plan (sequence)** — *A before it matters for filling, but B (the term) must exist before the first class; confirm B can run in parallel with the enrollment window.*
- **Proof trail (delivery)** — *Where does the output land — a branch/PR, a shared doc? Name it.*

*Everything above is drawn from the conversation and the spec; nothing here invents source material, boundaries, or a review standard Ilana didn't describe. Proposed slots/price/wording are placeholders for her to set.*
