# WordPets Adaptive Reading — Engine v0 + Reading Cartridge (Thin Adaptive Loop)

**Date:** 2026-06-05
**Status:** Design approved (brainstorm complete) — pending spec review before implementation plan
**Repo:** `~/projects/wordpets` (this product) — builds on the existing Phase 1a Companion App
**Research origin:** `~/projects/aleph-schools/` (Alpha School research → engine/cartridge boundary design, validated against this codebase 2026-06-01)

---

## 1. Purpose & one-line thesis

Turn WordPets into the first **subject cartridge** behind a small, subject-agnostic **adaptive
engine**: the app decides what a child should practise next, judges mastery from reading whole
words aloud, brings words back for spaced review, and shows a parent simple progress — all while
keeping the engine ignorant of "reading" so **math can slot in later as a sibling cartridge with
zero engine changes.**

**Prove:** a child using the adaptive loop measurably progresses along a reading strand, and the
architecture admits a second subject without a rewrite.

## 2. Background & decisions already made

From the brainstorm (see `aleph-schools/00-admin/decisions-log.md` and `05-synthesis/strategic-bet.md`):

- **Expand WordPets first** (reading), but **reading and math are independent, non-gated** product
  lines sharing ONE engine. Neither blocks the other in build sequence or in the customer funnel.
- **Target user: direct-to-parent**, self-serve, kid practises at home. Ilana/teachers use the
  *parent* flow themselves for now; a dedicated teacher dashboard is **deferred**.
- **Demand treated as real** — customer discovery is not a build blocker.
- **Mastery signal = word-level oral reading** (whole words aloud), because phoneme-level speech
  checking is unreliable for ages 5-7. Phoneme practice stays formative.
- **Build inside the WordPets repo**; the engine is a clearly-bounded `src/engine/` module.
- **open-brain is NOT in v1.** It's a candidate for the *future* interest-personalization layer
  only, and even then must be a separate store from children's PII (COPPA/FERPA).

## 3. Architecture — three concerns, three homes

```
            PARENT SHELL  (reuse WordPets signup + ONE new progress screen)
                     │
        ┌────────────▼─────────────────────────────┐
        │  ENGINE  (src/engine/, subject-AGNOSTIC)  │
        │   • concept-graph store                   │
        │   • per-child knowledge state (+ FSRS)    │
        │   • sequencer: nextActivity()             │
        │   • mastery model: recordResult()         │
        └────────────┬─────────────────────────────┘
       nextActivity(childId, "reading") → ActivityRequest
       recordResult(childId, result)    ← ActivityResult
        ┌────────────▼─────────────────────────────┐
        │  READING CARTRIDGE  (subject-SPECIFIC)    │
        │                                           │
        │   CONCEPT GRAPH DATA  (1 small strand)    │
        │   ITEM BANK           (words ↔ concepts)  │
        │                                           │
        │   ACTIVITY LAYER (the fun — pluggable):   │
        │    ├─ blending practice  (formative, exists)
        │    ├─ build-the-word     (formative, NEW v1)
        │    └─ read-aloud check   (AUTHORITATIVE, v1)
        │                                           │
        │   each Activity → ActivityResult          │
        │     { correct, score, authoritative }     │
        └───────────────────────────────────────────┘
```

**Three concerns kept separate:**
| Concern | Question | Home |
|---|---|---|
| Engine | *What* to teach next / mastered yet? | `src/engine/` (subject-agnostic) |
| Activity layer | *How* it's taught / made fun | reading cartridge, pluggable activities |
| Evaluator | Did they get it *right*? | inside each activity (e.g. `matchWord`) |

**The golden rule (boundary invariant):** the engine only ever receives `{ concept_id, correct,
score, authoritative }`. It MUST NOT inspect item payloads, words, audio, or activity internals.
The day it does, a subject has leaked and "not gated" is broken.

## 4. The contract (the seam)

```
type ActivityRequest = {
  conceptId: string
  activityType: string        // engine treats as opaque; cartridge interprets
  payload: unknown            // OPAQUE to engine (the word, prompt, tiles, …)
}

type ActivityResult = {
  conceptId: string
  correct: boolean
  score: number               // 0..1, standardized (NOT high/med/low)
  authoritative: boolean      // true = counts toward mastery; false = formative only
  signals?: Record<string, unknown>  // optional, opaque to engine
}

interface Cartridge {
  conceptGraph(): { nodes: ConceptNode[]; edges: PrereqEdge[] }
  // Capture + evaluation are fused (speech can't separate them), so the cartridge
  // owns the whole interaction and returns a Promise.
  runActivity(req: ActivityRequest): Promise<ActivityResult>
}

interface Engine {
  nextActivity(childId: string, subject: string): Promise<ActivityRequest>
  recordResult(childId: string, result: ActivityResult): Promise<void>
  masteryState(childId: string, subject: string): Promise<MasteryView>
}
```

- `runActivity` is **async** (validated: WordPets already returns a `Promise<MatchResult>`).
- `score` is **numeric 0..1**. A small adapter maps the existing `confidence: high|medium|low`
  → numeric until activities emit numeric natively.

## 5. Components & data

### 5.1 Engine (`src/engine/`) — net-new
- **Concept-graph store** — `concepts` (id, subject, title, order/path) + `prerequisites`
  (concept_id, requires_id). Postgres/Supabase (WordPets' existing DB). Subject-tagged so each
  cartridge owns its own graph; engine hosts whichever is loaded.
- **Knowledge state** — per (child, concept): mastery status + FSRS scheduling fields
  (stability, difficulty, due date, last review).
- **Sequencer** — `nextActivity()` = pick from the child's *frontier* (concepts whose prereqs
  are mastered, not yet mastered) OR a concept **due for review** (FSRS), whichever is owed.
- **Mastery model** — `recordResult()` updates state ONLY from `authoritative` results; formative
  results may update engagement/streak but never mastery. Mastery threshold: authoritative
  word-read accuracy over a small number of spaced exposures (exact rule in implementation plan).

### 5.2 Reading cartridge — mostly exists
- **Concept graph data** — ONE small strand to start: short-vowel CVC reading (~15-25 concepts,
  e.g. word families `-at`, `-it`, `-op`). Author from existing WordPets content.
- **Item bank** — words mapped to concepts (reuse existing word lists where possible).
- **Activity layer** (pluggable; each implements `runActivity`):
  - **Blending practice** — *formative.* Existing `BlendingExercise` flow; non-authoritative.
  - **Build-the-word** — *formative, NEW in v1.* Child hears a short-vowel word, drags letter
    tiles to spell it. Reinforces sound→letter; proves the activity layer is genuinely pluggable.
  - **Read-aloud check** — *authoritative.* Child reads a whole word aloud → existing speech
    pipeline (`listenForSpeech` → Whisper) → `matchWord` (strict tier: exact/contains/Levenshtein).
    Emits `{ correct, score, authoritative: true }`.

### 5.3 Parent shell — small additions
- Reuse existing WordPets signup/auth (direct-to-parent).
- **ONE new progress screen**: per child — mastered concepts, current frontier ("working on"),
  next up, and a streak/coins tie-in to existing reward system.

## 6. Data flow (one practice turn)

1. Child opens practice → `engine.nextActivity(childId, "reading")`.
2. Engine consults knowledge state → returns an `ActivityRequest` (a concept + chosen activity).
3. Reading cartridge `runActivity()` renders the activity (game or read-aloud), child interacts.
4. Activity produces `ActivityResult{ correct, score, authoritative }`.
5. `engine.recordResult()` updates mastery (authoritative only) + FSRS schedule; existing
   `tracker.ts` persists the attempt.
6. Progress screen reflects new state. Loop.

## 7. Scope

**IN (v1 — thin adaptive loop):**
- Engine: concept-graph store, knowledge state, sequencer, FSRS spaced review, mastery model.
- Reading cartridge: one short-vowel strand, item bank, activity layer with 3 activities
  (blending=existing, build-the-word=new, read-aloud=authoritative).
- Parent progress screen.
- Tests incl. the **fake-cartridge** boundary test.

**OUT (deliberately deferred — YAGNI):**
- ❌ Math cartridge — but engine stays subject-agnostic so it slots in with zero engine changes.
- ❌ Interest/LLM personalization ("wow" layer) — future home for open-brain, separate PII store.
- ❌ Teacher dashboard / rosters — Ilana uses the parent flow for now.
- ❌ Camera/engagement ("waste meter") monitoring — "creepy for home use" per research.
- ❌ Multiple reading strands, standards alignment, native app, additional mini-games (fast-follow).

## 8. Testing strategy

- **Engine (highest value, pure logic, no UI):** frontier selection picks the right next concept;
  FSRS scheduling brings words back on time; `recordResult` moves mastery on authoritative
  pass/fail and does NOT move it on formative results.
- **Boundary / "math-proof" test:** drive the engine with a **fake throwaway cartridge**; confirm
  the full loop runs without the engine referencing anything reading-specific. This guards the
  "independent, not gated" decision and fails loudly if the boundary is violated.
- **Activity layer:** each activity returns a valid `ActivityResult`; only `authoritative: true`
  activities affect mastery.
- **`matchWord` (read-aloud):** add cases for the authoritative threshold (true reads pass,
  clear misreads fail) — distinct from the existing lenient practice path.

## 9. Risks & open questions (resolve in implementation plan)
- **Whisper word-accuracy** for 5-7-year-olds in noisy home settings — pilot-tune the `matchWord`
  pass threshold; decide retry/affordance on ambiguous reads.
- **Exact mastery rule** — how many authoritative exposures at what accuracy = "mastered".
- **Concept-graph authoring effort** — research flagged this as "the real product / biggest cost";
  the small first strand is the deliberate hedge. Confirm word/concept counts.
- **Per-attempt Whisper cost** — fine at pilot scale; revisit before broad launch.
- **Build-the-word game** — confirm this is the right first mini-game (swappable at review).

## 10. Definition of done (v1)
A parent can sign up, a child practises a short-vowel reading strand through engaging activities,
the app accurately advances and spaces review based on authoritative read-aloud checks, the parent
sees real progress — and a passing fake-cartridge test proves a second subject (math) would require
no engine changes.
