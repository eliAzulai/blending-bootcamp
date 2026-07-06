# Mini-Activities Wave 1 — Design Spec

**Date:** 2026-07-06
**Status:** Approved (interview + design review with Eli, this session)
**Depends on:** `docs/superpowers/specs/2026-04-14-wordpets-companion-app-design.md`, `docs/non-negotiable-rules.md` (R1–R27)

## Goal

Make daily practice feel varied and game-like without changing what practice *is*. Three new activity formats rotate into the existing 3-slot session (Phonics → Spelling → Read Aloud). Traditional literacy exercises — match the word, build the word, missing word in a sentence — made tactile and fun on iPad.

The teacher's focus areas + difficulty still decide **what** is practiced. Server rotation now also decides **which format** practices it. The kid makes zero new choices; the session simply feels different each day.

## Decisions from the design interview

| Question | Decision |
|---|---|
| Session shape | Keep the 3-slot skeleton; each slot draws from a format pool |
| Formats wave 1 | Match/tap, drag-and-drop, listen-&-pick. Tracing deferred (grading is unsolved) |
| Content source | Extend the existing fixtures → seed → `content` table pipeline; `/wordpets-content` skill generates candidates |
| Format selection | Deterministic server rotation (`rotation % pool.length`), no new teacher UI |
| Wrong answers | Retry till right; gentle feedback; every item ends in success (R25) |
| Wave 1 size | 3 games, one per format, each polished |
| Polish bar | Tactile + calm: snap physics, soft synthesized SFX, word always spoken on success, no per-item confetti |
| Rollout | Straight into rotation after build/lint + iPad-viewport verification; Eli's own kids are the field test |

## The three games

### 1. Sound Hunt (phonics slot)

Rotates with the existing blending exercise in the `phonics` slot.

- TTS speaks a prompt: either **"tap the word I say"** (word recognition) or **"tap the word that starts with /X/"** (sound isolation). Prompt kind comes from content, not code.
- 3–4 large word cards (Andika, ≥56px touch targets). One round per word in the set (5–8 rounds).
- **Correct:** card pulses once, word spoken, soft pop, next round.
- **Wrong:** the tapped word is *spoken aloud* (instructive — the kid hears what they actually picked), gentle shake, retry until right. Attempts logged.
- Replay button re-speaks the prompt at any time.

### 2. Word Builder (spelling slot)

Rotates with the existing typing-based SpellingActivity in the `spelling` slot.

- Kid hears the word (TTS + always-visible replay button). Scrambled letter tiles in a tray; empty slots above (one per letter).
- Drag tiles into slots. **Pointer events, not HTML5 drag-and-drop** (broken on iOS Safari touch). Tiles snap into the nearest empty slot on release; a tile dropped nowhere drifts back to the tray.
- Wrong letter in a slot: on word-check, wrong tiles shake and return to the tray; correct ones stay (scaffold by elimination). Retry until the word is complete.
- `advanced` difficulty adds 1–2 distractor letters to the tray; `beginner`/`intermediate` have exactly the word's letters.
- **Content: reuses existing spelling word lists.** No new content type; tiles are derived from the word string.

### 3. Missing Word (joins both the phonics and spelling pools)

Cloze sentences. Registered in both slots' pools so it appears without needing its own slot.

- A decodable sentence with one gap, rendered in passage typography (R21: ≤32ch, line-height 1.6, ragged-left). 3 word choices as tiles below.
- Drag the word into the gap (tap-to-place also works — accessibility fallback and faster for some kids).
- **Correct:** the completed sentence is read aloud in full — the kid hears the sentence *they* built. That's the reward.
- **Wrong:** the tried word is spoken, gentle shake, tile returns. Retry until right.
- 4–6 sentences per activity run.

## Architecture

### Components (new, in `src/components/activities/`)

- `SoundHuntActivity.tsx`
- `WordBuilderActivity.tsx`
- `MissingWordActivity.tsx`

Each follows the existing standalone-activity contract (Key Design Decision #1 of the companion-app spec): props are `content` + `tracker` + `onComplete({coinsEarned, durationSeconds})`. `PracticeRunner.tsx` renders whichever component the server-chosen format dictates — it gains a `format` per slot but its sequencing logic is untouched.

### Shared primitives (new, built once)

- `src/hooks/useTileDrag.ts` — pointer-events drag for touch + mouse: pick up, follow pointer, snap-to-target or spring-back. No library. Honors `prefers-reduced-motion` (snap becomes instant placement, no spring animation).
- `src/lib/sfx.ts` — WebAudio-synthesized click/pop/chime. Zero audio asset files. Silent-fail if AudioContext is unavailable.
- Existing `src/lib/speech.ts` TTS for all spoken prompts/words.

### Format selection (server-side)

`src/app/student/practice/page.tsx` already computes `rotation = count(completed sessions) % N`. Extend with per-slot format pools:

```ts
const FORMAT_POOLS: Record<FocusAreaType, ActivityFormat[]> = {
  phonics: ["blending", "sound_hunt", "missing_word"],
  spelling: ["typing", "word_builder", "missing_word"],
  read_aloud: ["read_aloud"],
};
// format for a slot = FORMAT_POOLS[slot][rotation % FORMAT_POOLS[slot].length]
```

Deterministic, testable, no stored state. The page then fetches the right content for that format and passes `{format, content}` to PracticeRunner.

### Content model

Two new `content.type` values (requires migration, see below):

- **`word_match_set`** (Sound Hunt): `metadata = { intended_for: "phonics", prompt_kind: "hear_word" | "starts_with", rounds: [{ target: string, sound?: string, distractors: string[] }] }`
- **`cloze_sentence`** (Missing Word): one row per sentence set: `metadata = { intended_for: "phonics" | "spelling", sentences: [{ text: "The cat sat on the ___.", answer: "mat", distractors: ["map", "man"] }] }`

Pipeline unchanged: typed fixtures in `src/lib/fixtures/student.ts` → `scripts/seed-content.ts` emits idempotent SQL → `scripts/db.sh` applies → new pickers in `src/lib/content.ts` (`getWordMatchContent`, `getClozeContent`) follow the exact pattern of the existing three (difficulty filter + rotation modulo + fixture fallback).

Starter library: ≥3 word_match_sets and ≥3 cloze_sentence sets **per difficulty band**, authored under R2 (decodability) and R3 (no new spelling rules inside a band). Distractors must be plausible (same word family or same initial sound) but unambiguous. `/wordpets-content` skill gains both types.

### Database migration

`supabase/migration-2026-07-06-mini-activities.sql` (idempotent, applied via `scripts/db.sh -f`), and `schema-v2.sql` updated to match:

1. Widen `content.type` CHECK: `('wordlist', 'passage', 'word_match_set', 'cloze_sentence')`.
2. Add `activity_attempts.format text null` — **`activity_type` keeps meaning the slot** (`phonics`/`spelling`/`read_aloud`), so the teacher dashboard and all existing queries keep working unchanged. `format` records which game produced the attempt (`sound_hunt`, `word_builder`, `missing_word`; null = legacy blending/typing/read-aloud).

### Tracking

Same `SupabaseTracker` writes. `score` = percentage of items solved on the first try (0–100, fits the existing CHECK), so "needed 3 tries on half the words" is visible as a low score; `format` distinguishes which game produced it. Ilana's student detail view needs no changes for wave 1; format-level breakdowns are a later dashboard addition.

## Rules compliance (spot-checks, not exhaustive)

- **R1/R8/R9:** Andika on all tiles and cards; no ligatures; tracking inherited from globals.
- **R19:** all tiles/cards ≥56×56px (above the 48px floor — drag targets need more).
- **R21:** cloze sentences use `.passage` typography.
- **R25:** no fail states, no shaming; retry-till-right; positive copy only.
- **R2/R3:** content authoring constraint — enforced at fixture-review time and inside `/wordpets-content`.
- **Motion:** one pulse/shake per feedback event, snap physics only, all gated by `prefers-reduced-motion` (consistent with the Phase A courtroom verdict).

## Verification & rollout

1. `npm run build` + `npm run lint` green.
2. Preview-browser pass at iPad viewport (768×1024): play all three games start to finish, verify drag on touch-emulated pointer events, verify TTS prompts fire, verify attempts + session rows land in the DB (`scripts/db.sh`).
3. Merge to `main` → VPS cron auto-deploys → games enter rotation for all students.
4. Field test: Eli's kids play on a real iPad. Findings feed wave 1.1 polish.

## Out of scope (wave 2+)

- Letter/word tracing (grading unsolved)
- Recorded songs or any audio asset pipeline
- Picture-image assets (emoji only if ever needed)
- Teacher assigns/toggles formats per student
- Kid picks format; per-student feature flags
- Format-level teacher dashboard breakdowns
