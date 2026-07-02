# WordPets Reading Cartridge + Activity Layer — Design Spec

**Date:** 2026-07-02
**Status:** APPROVED 2026-07-02 — spec-review change incorporated (builder feedback capture, §2.7); user said "go"
**Parent spec:** `2026-06-05-wordpets-adaptive-reading-engine-design.md` (engine v0, merged)
**Piece:** 1 of 3 (this piece: cartridge + activities; piece 2: Supabase KnowledgeStore; piece 3: parent progress screen)
**Branch:** `spec/reading-cartridge`

---

## 1. System overview

The reading cartridge is the first subject plugged into the merged subject-agnostic engine
(`src/engine/`). It supplies a short-vowel CVC concept graph, an item bank of decodable words,
and three pluggable activities — blending practice (formative, reused), build-the-word
(formative, new), and a word-level read-aloud check (authoritative) — wired into a new
`/student/adaptive` practice loop for one child on an iPad.

This is a **development prototype that doubles as its own requirements instrument**: a gated
builder feedback recorder lets Eli/Ilana speak voice notes while using the app; notes are
transcribed and context-stamped (which concept/activity/result was live) so a later Claude
session can distill them into modification and feature tasks. Curriculum grows from live use,
not upfront authoring — the strand below is a seed, deliberately small, mostly derived from
existing fixtures.

## 2. Behavioral contract

All statements are testable observations. "Session" = one continuous visit to `/student/adaptive`
(state resets on page reload in this piece; persistence is piece 2).

### 2.1 Concept graph and item bank

- **C1.** The strand contains exactly 17 word-family concepts in five vowel groups, in this
  teaching order: short a (`-at -an -ap -ag`), short i (`-it -in -ig -ip`), short o
  (`-op -ot -og`), short u (`-ug -un -ut`), short e (`-et -en -ed`). All concept ids carry
  `subject: "reading"`.
- **C2.** Prerequisite edges: every family in vowel group N+1 requires every family in vowel
  group N. Families within a group have no edges between them (siblings — this keeps the
  frontier 3-4 concepts wide so a child is never stuck on one parked concept).
- **C3.** Each concept has 4-6 item-bank words. Every word is a 3-letter CVC word ending in its
  family rime (e.g. `-at` words all end "at"), decodable at beginner difficulty per rule R2
  (no digraphs, blends, magic-e, or vowel teams). Words are authored during implementation
  using the WordPets KB skills; a test validates the structural rules mechanically.
- **C4.** When the graph data is loaded, `validateGraph` passes (no cycles, no dangling edges).

### 2.2 Sequencer skip-rule (small subject-agnostic engine change)

- **S1.** When a concept is `learning` with a future due date ("parked"), the sequencer's
  learn-phase skips it and picks the next unparked frontier concept.
- **S2.** When reviews are due, they still take priority over learning (unchanged).
- **S3.** When every frontier concept is parked and no review is due, `selectNext` returns
  `null` (the session is over for today).
- **S4.** The engine's math-proof boundary test still passes unchanged: the engine never
  references anything reading-specific.

### 2.3 Activity selection policy (cartridge-owned)

- **P1.** In `review` mode the cartridge always builds the authoritative read-aloud check.
- **P2.** In `learn` mode the cartridge cycles per concept using a session-local rep counter:
  rep 1 = blending practice, rep 2 = build-the-word, rep 3 = read-aloud check (the daily
  checkpoint). The counter increments only when an activity produces a result.
- **P3.** After a checkpoint result (correct or not), the concept becomes parked (S1), so at
  most one authoritative checkpoint fires per concept per day via learn mode; all further
  authoritative exposures arrive through spaced reviews. Mastery therefore requires exposures
  on at least 3 distinct days (threshold 3, intervals 1d/2d/4d).
- **P4.** When the read-aloud check cannot run because TTS or the microphone is unavailable
  (see 2.6), the cartridge substitutes blending practice and emits only formative results.
- **P5.** When a checkpoint is abandoned because transcription failed (not because the child
  read wrong — see 2.5), the concept's rep counter resets to 0: the child gets two more
  formative reps before the next checkpoint attempt.
- **P6.** Word picks within a concept are deterministic given the session rep history (no
  `Math.random()` in render paths — rule R24). A blending rep uses 2 item-bank words chosen
  by rotation; build-the-word and read-aloud use 1 word chosen by rotation.

### 2.4 Build-the-word (new formative activity)

- **B1.** On start, TTS speaks the target word once; a replay button (🔊) re-speaks it on tap.
  The word is never displayed before the child solves it.
- **B2.** The child sees empty letter slots (one per letter) and a shuffled tile row containing
  the word's letters plus exactly 2 distractor letters not in the word. Tile order and
  distractor choice are deterministic given the word.
- **B3.** Tapping a tile places it in the leftmost empty slot; tapping a filled slot returns
  its tile to the row. Wrong letters are placeable — there is no per-tile rejection.
- **B4.** When all slots are filled: a correct spelling celebrates and completes the activity;
  a wrong spelling gives a gentle shake, returns all tiles, and lets the child retry.
- **B5.** After 2 wrong checks, the target letters appear ghosted (faint) in the slots as a
  scaffold and the child matches tiles onto them (scaffold, not failure — the activity always
  ends in success).
- **B6.** Result: `authoritative: false`; `correct: true` and `score: 1.0` when solved on the
  first check; `score: 0.7` on the second check; `correct: false`, `score: 0.4` when the
  scaffold was shown. (Formative scores never affect mastery; they exist for future analytics.)
- **B7.** Interaction is tap-to-place only (no drag) in this piece. Tiles and slots are at
  least 56×56 CSS px with 8 px gaps (R19).

### 2.5 Read-aloud check (authoritative)

- **A1.** The activity shows the single target word large, in the literacy font, with a
  microphone button. Pressing it records and transcribes via the existing pipeline
  (`listenForSpeech` → `/api/transcribe` Whisper).
- **A2.** Matching is strict: the transcript is normalized (lowercased, non-letters stripped)
  and must contain the target word as an exact whitespace-delimited token, OR match an entry
  in that word's curated accept-list (homophones/spelling variants stored in the item bank,
  e.g. "son" for "sun"). No edit-distance, no child-substitution variants, no accept-any tier.
- **A3.** A no-match on attempt 1 offers one retry with encouraging copy. A no-match on
  attempt 2 completes the activity with `{ correct: false, score: 0, authoritative: true }`.
- **A4.** A match completes immediately: `correct: true`, `score: 1.0` (exact) or `0.9`
  (accept-list), `authoritative: true`. Raw transcripts go in `signals` for future teacher
  surfaces and are never rendered to the child (R17).
- **A5.** A transcription *failure* (network error, non-2xx from `/api/transcribe`, timeout)
  is not an attempt: the child sees a friendly "let's try that again" state. After 2
  consecutive failures the activity aborts WITHOUT producing any `ActivityResult` — a
  technical failure must never record an authoritative miss (P5 governs what happens next).
- **A6.** Feedback on a wrong read is warm and forward-looking; the copy never shows the
  transcript, never says "wrong", and obeys the R25 ban regex.

### 2.6 Runner and session flow (`/student/adaptive`)

- **R1.** The route requires the same auth as `/student/practice` (signed-in parent with a
  student row); unauthenticated visitors are redirected to `/login`.
- **R2.** On session start the runner asks for mic permission (reusing the existing
  permission flow). If denied or unsupported, a calm banner explains that reading checks
  need the microphone, and the session runs formative-only (P4) capped at 10 activities.
- **R3.** The loop: `engine.nextActivity` → render the activity component for the request's
  `activityType` → on result, `engine.recordResult` → next. State lives in a `MemoryStore`
  instance scoped to the page (piece 2 swaps in Supabase behind the same interface).
- **R4.** When `nextActivity` returns `null`, the runner shows a positive completion screen
  ("You did it! All done!") with a single calm celebration animation (R6/R26); the copy obeys
  the R25 ban regex (in particular: no "come back tomorrow").
- **R5.** All child-facing surfaces obey the non-negotiable rules: literacy font (R1),
  `dir="ltr"` (R4), no italics (R5), light mode (R12), touch targets (R19), no idle
  animations during activities (R26), no game-economy framing (R27).

### 2.7 Builder feedback capture (dev-prototype affordance)

- **F1.** Visiting `/student/adaptive?builder=1` sets a session flag; only then does a small
  floating note button (🎙️) appear, in every state of the loop. Without the flag the button
  does not render — real students never see it.
- **F2.** Tap starts recording a voice note (existing MediaRecorder pipeline); tap again stops,
  transcribes via `/api/transcribe`, and saves a row to a standalone `feedback_notes` table:
  `{ created_at, user_id, transcript, context }`.
- **F3.** `context` is stamped automatically at note start: route, active conceptId,
  activityType, mode (learn/review), the concept's session rep count, and the last up-to-5
  activity results of the session `{ conceptId, activityType, correct, score, authoritative }`.
- **F4.** When transcription or the table write fails, the note's audio-transcript payload is
  queued in localStorage and retried on the next note or next page load — a note is never
  silently lost.
- **F5.** Recording during an active read-aloud capture is blocked (one mic consumer at a
  time): the button is disabled while an activity is recording the child.
- **F6.** Distillation is out-of-app: a Claude session reads recent `feedback_notes` and
  produces `docs/feedback/YYYY-MM-DD-dogfood.md` (modifications / new features / to-dos /
  open questions) as the input to the next brainstorm round. Until the button ships, the
  interim path is an external voice recording + the existing `/transcribe` skill.

## 3. Explicit non-behaviors

- The system must not write practice or knowledge state to Supabase in this piece (no
  practice_sessions, no activity_attempts, no coins, no knowledge tables) — persistence is
  piece 2, rewards tie-in is piece 3. Wiring them early would couple this piece to schema
  decisions piece 2 owns. The standalone `feedback_notes` table (F2) is the single allowed
  write path; it references no practice schema.
- The feedback recorder must not store audio — transcript text plus context only. The notes
  are the observing adult's voice; still, no recordings of a child's session are retained
  (COPPA posture: keep the dev-feedback surface free of child data).
- The system must not modify the live `/student/practice` flow, its components' behavior, or
  the `content` table pipeline — Ilana's students are mid-pilot on it.
- The engine must not gain any reading-specific knowledge (no word/payload inspection); the
  ONLY engine change allowed is the sequencer skip-rule (S1-S4).
- The read-aloud check must not fall back to the lenient `matchWord` tiers (Levenshtein,
  substitutions, accept-any) — on 3-letter words those pass wrong readings ("bat" for "cat"),
  which poisons the mastery signal.
- The existing lenient `matchWord`/`matchPhoneme` behavior used by Phase 1a activities must
  not change.
- Build-the-word must not display the target word before it is solved (it would become a
  copying task, not sound-to-letter mapping).
- The runner must not show streaks, missed-day copy, coin totals, or any game-economy HUD
  (R25/R27).

## 4. Integration boundaries

| System | In / out | Contract | When unavailable | Twin vs real |
|---|---|---|---|---|
| Engine (`src/engine/`) | Cartridge implements `Cartridge`; runner calls `nextActivity`/`recordResult` | `src/engine/types.ts` — engine consumes only `{conceptId, correct, score, authoritative}` | n/a (in-process) | Real (pure logic). Cartridge unit tests may also drive a fake engine loop. |
| `/api/transcribe` (Whisper) | audio blob out → `{ text }` in | Existing route; requires `OPENAI_API_KEY` | A5: failure ≠ attempt; 2 consecutive failures abort without a result | **Twin for all tests**: strict matcher and activity logic are tested against fixture transcripts; no live Whisper calls in CI. Live path exercised only in manual browser verification. |
| Web Speech TTS (`src/lib/speech.ts`) | word string out → audio | Locked single voice (R10) | P4: build-the-word unavailable → substitute blending | Twin in tests (interface stub); real in browser. |
| MediaRecorder / mic | permission + audio | Existing `speech-recognition.ts` flow | R2: formative-only session, capped at 10 activities | Twin in tests; real in browser. |
| Supabase auth | session in | Same server-component gate as `/student/practice` | Redirect to `/login` | Real (existing pattern), no new queries. |
| Supabase `feedback_notes` | note row out | `{ created_at, user_id, transcript, context jsonb }`, RLS: owner-only | F4: localStorage queue + retry | Twin in tests (store stub); real in browser. |

## 5. Behavioral scenarios

Holdout scenarios (3 happy, 2 error, 2 edge) are stored outside this repo in the darkFactory
holdout store per factory policy. Implementing agents must not read them; they are the
evaluation layer applied after implementation.

## 6. Ambiguity warnings — all resolved

Decisions confirmed by Eli 2026-07-02 (AskUserQuestion):

1. **Checkpoint policy** → one authoritative checkpoint per concept per day via learn mode +
  spaced reviews; sequencer skip-rule added (P1-P3, S1-S4).
2. **Strict matcher** → exact token + curated accept-list only (A2).
3. **Mini-game** → build-the-word confirmed; tap-to-place, not drag (B7).
4. **Placement** → new parallel `/student/adaptive` route; live flow untouched (R1, §3).

Resolved by spec author (defensible defaults, veto at spec review):

5. **R7 conflict** — `docs/non-negotiable-rules.md` R7 declares read-aloud speech
  non-authoritative (Phase 1a). This spec's word-level authoritative check is a deliberate,
  scoped exception carried by the approved 2026-06-05 engine spec (mastery signal = word-level
  oral reading; passage reading stays non-authoritative). **Amend R7** in this branch to state:
  "Passage read-aloud remains non-authoritative. The adaptive engine's single-word read-aloud
  check (2026-07-02 spec) is authoritative by design — word-level matching against a strict
  accept-list is reliable in a way passage transcription is not."
6. **Session end** → when everything is parked, the session ends with a positive completion
  screen (R4). No free-play mode in this piece; a bounded daily session is the desired habit
  shape.
7. **No pet/coins in this piece** → rewards integration arrives with piece 3; adding it here
  would duplicate work piece 3 owns.
8. **Build-the-word scaffold** → after 2 wrong checks the activity scaffolds and always ends
  in success (B5) — matches Ilana's scaffold-don't-fail principle for formative work.
9. **Abandoned checkpoint** → resets the concept's rep cycle (P5) so a network hiccup costs
  two games, never a mastery mark.
10. **Formative-only cap** → 10 activities (R2 in §2.6), preventing an unbounded session when
  no checkpoint can ever park a concept.
11. **Blending rep size** → 2 words per rep (P6): quick reps keep the loop moving; the
  existing 6-word Phase 1a set is a full activity, not a loop rep.
12. **Distractor count** → exactly 2 distractors for 3-letter words (B2): 5 tiles total is
  within ages-6-8 working-memory comfort and fits 56 px tiles on iPad portrait.

Added from Eli's spec-review feedback (voice note, 2026-07-02): the prototype must double as
its own requirements instrument — "record voice notes as the user does it, distill into
modifications and new feature tasks". Of his two options (in-app capture vs external
recording), the spec takes a thin hybrid:

13. **In-app capture chosen for context-stamping** — an external recording can't know which
  concept/activity/result was on screen when a note was spoken; the app can (F3). It also
  works when Ilana dogfoods solo on the iPad. External recording + `/transcribe` remains the
  interim path until the button ships (F6).
14. **Storage** → a standalone Supabase `feedback_notes` table (owner-scoped RLS), because
  notes recorded on the iPad must reach Eli's Mac without cables; it deliberately references
  no practice schema so the piece-2 boundary holds. Transcript only, never audio (§3).
15. **Distillation lives outside the app** (F6) — turning transcripts into task docs is a
  Claude-session job, not app code; building an in-app distiller would be premature.
16. **Curriculum de-risking** — the strand words are seeded from the existing
  `fixturePhonicsContent` lists and mechanically validated (C3); KB skills are used to
  spot-check, not to author from scratch. Content evolution then flows from feedback notes.

## 7. Implementation constraints

- TypeScript, Next.js App Router conventions as in the existing codebase; cartridge code in
  `src/cartridges/reading/` importing types from `src/engine/types` only.
- TDD with Vitest for all pure logic (policy, strict matcher, tile generation, graph data
  validation, sequencer skip-rule). No jsdom/RTL setup in this piece: keep components thin and
  extract decision logic into tested pure modules.
- Reuse, do not fork: `BlendingExercise`, `speech-recognition.ts`, `speech.ts`,
  `useSpeechRecognition` (its lenient behavior unchanged; the strict matcher is a new module).
- Word lists and accept-lists seeded from `src/lib/fixtures/student.ts`, spot-checked with
  `/wordpets-content` + `/curriculum-lookup`; rules R1-R27 apply to every child-facing surface.
- `feedback_notes` migration as raw SQL alongside the existing `supabase/schema-v2.sql`
  pattern, with owner-only RLS (`user_id = auth.uid()`).
- Branch discipline: work on `feat/…` off `main`; never commit to `main`; commit trailer
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
