# WordPets Pet Reward System — Design Spec

**Date:** 2026-07-13
**Status:** Approved by 3-lens adversarial panel (pedagogy/rules, child-engagement, engineering) — all `approve_with_changes`, changes incorporated below
**Project:** `/Users/eliHome/projects/wordpets`
**Related:** `2026-04-14-wordpets-companion-app-design.md` (Phase 1a anchor), `2026-05-12-wordpets-active-learning-loop-reward-world-design.md` (philosophy), `docs/mini-games/2026-07-06-letter-sound-mini-games.md` (Letter Hunt source), `docs/non-negotiable-rules.md` (R13, R19, R24, R25, R26 amended here, R27), `docs/research/2026-07-18-word-pets-reward-spec.md` (neuroscience/SDT research grounding — added 2026-07-18)

---

## The question this answers

Eli asked: *should WordPets have a separate game world where kids interact with their pets, spend rewards earned from learning, and play mini-games that reinforce learning — or is there a better way?*

**Decision: no separate world. The pet's home IS the reward world.** All three panel judges independently confirmed this is genuinely right for this app, not rationalization:

- The Phase 1a metric is practice consistency (4+ days/week) in 7-10 minute parent-mediated sessions. A separate world's strengths (session length, voluntary opens) target the wrong behavior; the gating behavior is the child asking for the iPad, driven by the emotional beat in the 30 seconds after practice.
- A separate world is the highest-content-hunger option available. Toca Boca ships dozens of hand-crafted interactions per app with a full studio; a solo-dev world launches with five objects and reads as dead by session three. A dead world is worse than no world.
- It maximizes the 2026-05-12 spec's own named Risk #2 (kids rushing practice to reach the reward) and Risk #4 (content bottleneck).
- R27 forbids store screens and inventory; the companion spec's directive was to invest in "making the pet feel alive," not in owning things. Care (relational) beats acquisition (accumulative) for the overjustification-sensitive 6-8 band.
- The one real, evidenced gap in the shipped app: coins are earned (~30/session) with **zero sink**. "Feed pet with coins" was spec'd Phase 1a scope and never built.

**Honesty caveat (recorded per panel):** Letter Hunt is not a "reward" — it is a fourth (formative) learning activity delivered as post-practice play. It is held to activity-grade pedagogy standards (R13 sound rigor, teacher-signal integrity), not reward-grade standards.

What we deliberately steal from the separate-world idea instead of building it: **persistence traces** (daily pet want + pet memory line) substitute for room-decoration attachment at ~1% of the cost.

---

## Research grounding (added 2026-07-18)

`docs/research/2026-07-18-word-pets-reward-spec.md` (RPE neuroscience, SDT, behavioral incentive design) was adopted as the reward layer's reference. Its governing principle — **"learning is the only currency; the words are the food"** with the test *"can the child advance this without learning? If yes, cut it or re-route it through a word"* — holds structurally in this design:

- Coins are minted **only** by practice; there is no other faucet.
- Pet mood is driven **only** by practice recency; care can never substitute (panel-mandated precedence, unit-tested).
- Care verbs are expression/flavor, not progression — nothing advances through them.
- The mood engine is the research's **Tamagotchi inversion** verbatim: away → sleepy (rests, safe, fine), never sickness/decay; return → warmth, never guilt. All seven §6 hard lines hold (no suffering/death, no guilt streaks, no gacha, no leaderboards, no learning bypass, no decay timers, no dark notifications — v1 ships zero notifications).

Two mechanics were **added** from the research:

1. **Pet learns your word (§0 + §7.6):** the practice completion screen shows "{pet} learned your word!" with the day's first practiced word and a tap-to-hear button (existing `speakWord` TTS). The pet visibly *consumes the learning* at the moment of highest emotion — care and learning fused so they can't be pulled apart.
2. **Bloom-on-return surprise (§3):** arriving before practicing shows a deterministic daily surprise line ("{pet} learned a silly dance!") — variable *good* reward (Fiorillo, detoxified: content varies, valence never), zero absence references (R25-tested), anticipation-of-reunion replacing dread-of-loss.

§7 open decisions, answered for v1: one currency (coins), earned by learning, spent on care; age band 6-8 (Ilana's actual students; research's 7-9 center noted for 1b); one pet (single deep bond); no social layer; no notifications; pet vocalizes words via TTS (cheap — §7.6 resolved).

**§5 fade path (designed in, not yet built):** Letter Hunt is built to be fun as a game (survives the pet); when the `src/engine/` adaptive engine goes live, reward density thins as competence grows; the comics pipeline's pet characters (`comics/characters/`) are the pet-matures-into-story-companion path. Phase 1b's room/decor becomes the research §1 **enrichment/autonomy layer** — the world earns its way into existence room by room as a consequence of learning, never as a store.

## System overview

Three parts, all integrated into existing surfaces:

```
Practice (existing)  ──earns──▶  Coins  ──care verbs──▶  Pet reactions + mood
Practice done today  ──unlocks──▶  Letter Hunt (pet-hosted, formative learning)
Practice recency     ──drives──▶  Pet mood (care adds warmth, never substitutes)
```

### 1. Care verbs (coin sink) — on `/student` home

Three care actions on the pet card, each a one-tap spend with a distinct flavored reaction of **equal warmth** (per pedagogy judge: differences are cosmetic flavor, never pay-for-affection):

| Verb | Emoji | Cost | Reaction |
|---|---|---|---|
| snack | 🍎 | 5 | bounce + food overlay + "Yum yum!" |
| ball | ⚽ | 10 | bounce + ball overlay + "So fun!" |
| treat | 🎁 | 15 | bounce + hearts overlay + "{pet} loves it!" |

Costs sum to 30 ≈ one session's earnings: **one day of practice funds one full day of care.** No hoarding math, no intertemporal optimization puzzle for a 7-year-old.

Rules:
- **Unaffordable verbs are hidden, not disabled** (no aspiration/deficit display, no price-list feel). Zero affordable verbs → the care row is simply absent (matches today's home).
- **Satiation:** after 3 care events in a day, care buttons are replaced by "{pet} is happily full." Prevents slot-machine tapping and coin devaluation.
- **No coin animation** — balance updates by plain value swap (R26/R27).
- **Never an error state a child can read.** Failed care action = silent no-op.
- **Free pet tap:** tapping the pet itself always gives a no-coin one-shot wiggle + a short line (cheapest aliveness win — the first thing every 6-year-old does is poke the character). Debounced like all reactions.

### 2. Pet mood engine — practice drives mood, care is flavor

`derivePetMood()` pure function, explicit precedence (panel-mandated; encoded in vitest):

1. `excited` — practiced today AND cared today (care adds warmth on top of practice)
2. `happy` — practiced today or yesterday
3. `hungry` ("wants to play!") — last practice 2 days ago, or never practiced (welcoming prompt toward first practice). Copy stays **practice-directed**, never spend-directed (R25: hunger is a soft prompt to play).
4. `sleepy` ("is resting.") — last practice 3+ days ago

Care alone can never lift mood — a snack cannot mask a week of absence, and pet affection is not purchasable without practice. DB `pet_mood` is **not** written by care actions (no teacher surface reads it; render-side derivation is the single source of truth).

### 3. Daily want + memory line (persistence traces)

- **Want:** deterministic pick `hash(studentId + dateUTC) % 3` → "{pet} would love a snack today." Shown **only when practiced today** and not satiated (care is a post-practice ritual, not an alternative to practice). Fulfilling the wanted verb gives a special line ("Just what {pet} wanted!") + hearts.
- **Memory:** if the most recent care event is from a previous day: "{pet} loved the 🍎!" — the pet remembers. Passes the R25 ban regex.

### 4. Letter Hunt — pet-hosted formative activity, gated on practice done

Game A from `docs/mini-games/2026-07-06`, promoted honestly as a learning activity:

- **Gate:** entry button appears on `/student` home **only after today's practice is complete**. Before that the entry point *does not exist* — absence, never a padlock/locked state (no toll-gate UI). `/student/play` redirects to `/student` if not practiced today. Playing costs **no coins** (coins are for care; the unlock is completed practice).
- **Mechanic:** 3 rounds/day. Each round: target letter card showing the glyph + the sound in R13 slash-and-teal notation (e.g. **M** `/m/`), spoken via `speakPhoneme` (says "mmm", never "em"). A static field of 8 emoji pictures; child taps every picture whose name **starts with that sound**; target count shown up front ("Find 3") to prevent brute-force tapping. Correct tap → cheer animation; wrong tap → gentle wobble + soft ✗. Opt-in 🔊 hint per picture speaks the picture's word (never a letter name). Hint usage recorded.
- **Content curation (R13-critical):** v1 targets restricted to unambiguous 1:1 sound-letter onsets (m, s, t, b, p, d, f, h, l, n, r, w). Every item is annotated with its onset; banned everywhere: digraph onsets (sh/ch/th/ph/wh/kn/wr/qu), blend onsets (st/fr/…), soft-c/g, silent letters, and any distractor sharing the target's letter OR sound. Rounds are fully hand-curated static data — no runtime shuffle (R24). A table-driven vitest audits every round against these rules.
- **Rounds exhausted copy:** "{pet} found everything! Time for a nap. 💤" — completion/rest framing; the R25 regex (`come back|tomorrow|…`) is enforced by test over a manifest of ALL new child-facing copy.
- **Data:** recorded as first-class `activity_type='letter_hunt'` (constraint extended in this migration) — **never** as `phonics` (would pollute the teacher's blending-production signal with recognition scores). Attempts attach to today's **already-completed** practice session (no new `practice_sessions` rows → no phantom "incomplete session" struggle signals, no inflated day counts). Recording is fire-and-forget (never blocks the child's interaction; avoids 4s timeout stalls while Supabase is paused). `content_ref='letter-hunt:<letter>:hints=<n>'`. Teacher `PracticeHistory` renders it as its own labelled chip type.
- **Formative:** does not move any mastery (the `src/engine/` adaptive engine is not yet wired into the app; when it is, Letter Hunt becomes an activity-layer cartridge per the 2026-07-06 doc).

---

## Data & persistence

### Migration `supabase/migrations/20260713_pet_reward_system.sql`

1. `pet_care_events` table: `id, student_id (fk cascade), verb check in ('snack','ball','treat'), coins_spent check (> 0), created_at` + index `(student_id, created_at desc)`. RLS: parents SELECT own child's events; teachers SELECT their students' events. **No direct INSERT policy** — writes go through the RPC only.
2. `care_for_pet(p_student_id, p_verb)` — SECURITY DEFINER RPC (follows the `claim_invite_token` convention: revoke public/anon, grant authenticated, `set search_path = public`). One transaction: verify `auth.uid()` is the student's parent → verify satiation (< 3 events today) → **atomic conditional decrement** `update students set coins = coins - cost where id = … and coins >= cost` → insert event → return new balance. Cost is derived from the verb **inside the RPC** (client cannot lie). Any guard failing → returns null, zero partial writes.
3. `alter table students add check (coins >= 0)` — backstop against the legacy client-REST read-modify-write in `tracker.ts`.
4. `activity_attempts` check constraint extended with `'letter_hunt'`.

### Failure-mode contract (Supabase paused / restored-but-unmigrated / migrated)

- `careForPet` server action **never throws** — returns `{ok:true, coins} | {ok:false}`; UI treats failure as silent no-op.
- Home page treats a `pet_care_events` query error (missing table = restored-but-unmigrated) as **care system unavailable** → care UI simply not rendered. Fail-closed, no partial writes possible (the RPC doesn't exist either).
- Letter Hunt tracking degrades exactly like existing activities (NoopTracker / warn-and-continue).
- Migration added to the Supabase-restore runbook (this file + PR description).

### Known accepted risk (pre-existing, now documented)

`tracker.ts finish()` does a client-REST read-modify-write on `students.coins` ("acceptable for Phase 1a single-tab"). The care RPC is atomic on its side, and `coins >= 0` bounds the damage, but a care action racing a session-finish can still lose one delta. Follow-up (not blocking Phase 1a): move the earn-side bump behind an RPC too.

### Timezone

"Today" is **UTC everywhere**, matching the existing `practice_sessions.date` (server `current_date`) and `/student` home (`toISOString().slice(0,10)`). Local-midnight drift for Israel (UTC+2/3) affects 00:00–02:59 local — accepted for Phase 1a and documented here + in `src/lib/pet.ts`.

---

## R26 amendment (shipped in this change)

R26's home-surface text ("No bouncing pet") is amended with an explicit carve-out — **user-triggered one-shot feedback ≤1s** is permitted on `/student` home, provided it replaces (never stacks on) the idle breathe, never auto-repeats, is debounced so repeated taps cannot chain into continuous motion, and is `prefers-reduced-motion` gated.

**Pedagogical justification (required by the rules doc preamble):** R26's mischief is ambient/continuous motion competing with *decoding attention*; the home surface has no decoding task, and R26 itself blesses "triggered feedback" on practice surfaces where the attention stakes are higher. The companion spec's Phase 1a pet section explicitly requires reaction animations ("eating, playing, celebrating") as the "feels alive" investment. Idle bounce, coin animation, and streak flicker remain banned. All three panel judges ruled the bounce may ship **only** with this amendment; interpretation alone was rejected to protect the rules file's authority.

---

## Testing

Existing vitest harness (`npm test` — note: the "no JS/TS test framework" line in CLAUDE.md was stale and is fixed in this change). New suites, all pure logic:

1. `src/lib/pet.test.ts` — mood precedence table (incl. care-never-substitutes cases), want determinism, satiation boundary, care costs.
2. `src/lib/fixtures/letter-hunt.test.ts` — per-round curation audit (onset annotations consistent, matches all = target, distractors never share target letter/sound, banned digraph/blend onsets absent, exactly-N matches equals declared count), round-picker determinism (same date → same rounds).
3. `src/lib/child-copy.test.ts` — every new child-facing string in the copy manifest passes the R25 ban regex (`missed|broken|lost|haven't|been a while|where have you|come back|tomorrow`) and an R27 economy-language ban (`wealth|income|spend|earning|shop|store|buy|price`).

Browser verification via dev-only harness `/dev/pet` (404s in production) exercising: care reactions, satiation, hidden-unaffordable verbs, mood states, Letter Hunt rounds — all with fixture data, no Supabase needed.

---

## Out of scope (unchanged deferrals)

Pet room, outfits, inventory, evolution, multiple pets, leaderboards, streaks, coin dashboards, separate world routes, sound effects on care reactions (follow-up candidate), pet presence inside `PracticeRunner` (panel-flagged as the next highest-value slice per the 2026-05-12 "pet reacts during learning" directive — deliberately not smuggled into this change).

## Success signals (from 2026-05-12 metrics)

- Child spends earned coins without being prompted; asks to unlock a specific thing.
- Reward interaction does not prevent returning to practice — **watch main-session per-word accuracy before vs. after Letter Hunt ships** (the practice-gate creates a rush-through incentive; if per-word scores drop while completion holds, the gate is doing damage).
- Phase 1a headline metric unchanged: ≥60% practicing 4+ days/week.
