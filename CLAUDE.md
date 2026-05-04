# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — dev server on port 3000
- `npm run build` — production build (validates all routes)
- `npm run lint` — ESLint
- `npm run pull-secrets` — pull env vars from Infisical into `.env.local`
- No JS/TS test framework yet
- `PYTHONPATH=. pytest kb/tests/ -q` — Python tests for the teaching-resources KB (21 tests). Must run from repo root (`~/projects/wordpets`) with the kb venv active.

## What This Is

WordPets — a companion practice app assigned by a teacher (Eli's wife, Ilana) to her students for daily practice between live sessions. Kids complete phonics, spelling, and read-aloud activities to earn rewards for a virtual pet. Teacher sees who practiced and what they're struggling with.

**Target users (Phase 1a):** English-speaking children living in Israel ages 6-8. They speak/understand English fluently but struggle with reading and writing.

## Status (as of 2026-04-22)

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 0 — Blending Bootcamp MVP** | 14-day phonics blending program, ages 5-7, self-service | **SHELVED as starting point.** Code preserved (see "Phase 0 codebase" below). Do NOT actively iterate. Treat as a working reference for the speech/blending mechanic that gets reused inside Phase 1a. |
| **Phase 1a — Companion App MVP** | Teacher-assigned practice for wife's students (ages 6-8). 3 activities (Phonics, Spelling, Read Aloud), thin pet system, minimal teacher dashboard. | **ACTIVE.** Authoritative spec: `docs/superpowers/specs/2026-04-14-wordpets-companion-app-design.md`. Skeleton scaffolded in `src/app/teacher/`, `src/app/join/`, `src/app/signup/`, `src/components/teacher/`. |
| **Phase 1b — Earn Expansion** | More activities, pet room/outfits/evolution, ages 9-12, parent summaries | Deferred — only if 1a validates (≥60% of wife's students practice 4+ days/week after 4 weeks). |
| **Phase 2+** | Live teaching platform, teacher SaaS, standalone B2C | Out of scope for this codebase right now. |

**Decision log:** The pivot from Phase 0 → Phase 1a was made on 2026-04-14 (resolved in the design spec) and formally documented on 2026-04-22. Phase 0 is kept because (a) its speech pipeline + phoneme matching is the foundation Phase 1a builds on, and (b) it's the historical proof that the core mechanic works.

## Architecture

### Phase 0 codebase (frozen — reference only)

The original Blending Bootcamp MVP. Don't add features here; reuse pieces inside Phase 1a activities.

1. **Home page** (`src/app/page.tsx`) — 14-day vertical timeline, progress from localStorage
2. **Lesson route** (`src/app/lesson/[day]/page.tsx`) — SSG with `generateStaticParams` for days 1-14
3. **LessonScreen** (`src/components/LessonScreen.tsx`) — wraps lesson session, requests mic, tracks time
4. **BlendingExercise** (`src/components/BlendingExercise.tsx`) — core mechanic with two modes:
   - **Speech mode** (mic granted): phoneme-play → phoneme-listen → phoneme-correct/skip → blending → word-play → word-listen → word-correct/skip → done
   - **Tap mode** (fallback): tapping → blending → reveal → done
5. **CelebrationScreen** (`src/components/CelebrationScreen.tsx`) — shown on lesson completion

### Phase 1a scaffolding (in progress)

- `src/app/teacher/` — teacher dashboard routes
- `src/app/signup/`, `src/app/login/`, `src/app/auth/` — account flow (teachers + parents)
- `src/app/join/` — invite-link onboarding for students
- `src/components/teacher/` — dashboard components
- Activity components for Phonics / Spelling / Read Aloud are TBD; Phonics will wrap the existing `BlendingExercise` mechanic with the new content + reward shape.

### Speech Pipeline

Speech input uses MediaRecorder + OpenAI Whisper (not Web Speech API):
- `src/lib/speech-recognition.ts` — records audio via MediaRecorder, sends to `/api/transcribe`
- `src/app/api/transcribe/route.ts` — proxies to Whisper, requires `OPENAI_API_KEY`
- `src/hooks/useSpeechRecognition.ts` — React hook for recording/matching
- `src/lib/phoneme-matching.ts` — fuzzy matching with child speech substitution patterns (th→f, r→w). Very lenient for phonemes (any sound passes), stricter for words.

Speech output (TTS) uses browser Web Speech API:
- `src/lib/speech.ts` — maps phonemes to pronunciation strings (e.g. "c" → "kuh")

### Data

- `src/types/lesson.ts` — discriminated union: Phase1Lesson | Phase2Lesson | Phase3Lesson
- `src/data/curriculum.ts` — 14 lessons, 3 phases, ~5 words/day with phoneme splits. This will become one content source in the broader starter library.

### Progress (Dual Layer)

- **localStorage** (`src/lib/progress.ts`) — stores `{daysCompleted, wordsBlended}`, sequential unlock
- **Supabase** (`src/lib/supabase/progress-sync.ts`) — optional cloud sync. Tables: `learners`, `progress` with RLS scoped to parent

### Auth

- Supabase Auth via `@supabase/ssr` with browser + server clients
- `AuthProvider` context gracefully no-ops if Supabase env vars aren't set
- Middleware refreshes sessions on every request

## Env Vars

**The one correct path**: `npm run pull-secrets` populates `.env.local` from Infisical project `2423b7fc` (legacy name: "blending-bootcamp" — kept under old name intentionally). Don't `export` vars or hand-edit `.env.local`; Infisical is the source of truth. Keys below document what's stored there.

- `OPENAI_API_KEY` — server-side only, Whisper transcription (⚠️ as of 2026-04-23 the key in the `blending-bootcamp` Infisical project is out of credits; KB extraction was run against the `voice` project's key. Top up or rotate before relying on production Whisper.)
- `NEXT_PUBLIC_SUPABASE_URL` — optional, enables cloud sync
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — optional

## Brand

- Name: **WordPets**
- Colors: purple #7C3AED (primary), teal, coral/orange, cream backgrounds #FFF8E1
- Logo: `public/wordpets/logo.png`
- Target device: iPad primary (768×1024), mobile secondary
- Two visual modes planned: playful (ages 6-8) and clean (ages 9-12)

## Design Spec

Authoritative spec: `docs/superpowers/specs/2026-04-14-wordpets-companion-app-design.md`. Read it before doing Phase 1a work. Key Phase 1a scope (read this carefully — it deliberately CUTS scope vs. earlier mockups):

**In Phase 1a:**
- Teacher dashboard: student list, tags, focus areas (Phonics/Spelling/Read Aloud), difficulty, invite links
- 3 activity types only: Phonics blending, Spelling, Read Aloud
- Read Aloud is **non-authoritative** — Whisper records but does NOT score (until validated with real kids)
- Thin pet system: pick + name pet, mood reflects practice, fed with coins. Front-and-center, "feels alive."
- One visual mode (ages 6-8): cream background, big buttons, emoji
- Manual starter content library only (no AI generation, no teacher uploads)
- Invite-link onboarding for parents → students

**Deferred to Phase 1b (do NOT build now):**
- Pet room, outfits, evolution, mini-games, multiple pets
- Comprehension, Writing, Story listening, Sight words as separate activities
- AI content generation, teacher content uploads
- Parent progress summary emails
- Ages 9-12 visual mode

## Success Metric (Phase 1a)

After 4 weeks with wife's students: **≥60% complete practice 4+ days/week** (measured via practice_sessions table). If this fails, rework pet mechanics or content before adding more features.

## Key Design Decisions

1. **Activity components must be standalone** — each accepts content + mode (solo/live) + callbacks, so they can be reused in Phase 2 live sessions later
2. **Content is decoupled from delivery** — same format whether from starter library, AI, or teacher upload (only starter library exists in 1a)
3. **Pet system is a separate module** — activities emit reward events, pet system consumes them
4. **Speech is non-authoritative for Read Aloud** — Whisper has not been validated with 6-8 year olds reading aloud; record + transcribe but do not pass/fail. Phonics blending speech (Phase 0 codebase) keeps its existing fuzzy matching

## Teaching Resources KB (`kb/`)

Queryable knowledge base of Ilana's curated teaching materials. See `kb/README.md`.

- 26 source PDFs/images in `kb/sources/` → 28 extracted markdown files (2 sources are classified `domain: both` and extracted into both collections) → 63 embedded chunks (33 curriculum + 30 activities)
- Three ChromaDB collections: `wordpets-curriculum`, `wordpets-activities`, `wordpets-principles`. Persistent store at `~/.wordpets-kb-db`, extract/index state at `kb/.extract-state.json` and `~/.wordpets-kb-state.sqlite`
- Principles layer: 10 pedagogical design principles extracted from Ilana's expert walkthrough sessions in `kb/extracted/principles/`. Transcripts in `kb/transcripts/`.
- Run `PYTHONPATH=. python3 -m kb.scripts.extract` (incremental via sha256) → `PYTHONPATH=. python3 -m kb.scripts.index` (incremental via content hash, `--full-reindex` to rebuild)
- Query via `PYTHONPATH=. python3 -m kb.scripts.query <curriculum|activities|principles> "question" [--grade K|1|2|3+] [--top N]`
- Skills: `/curriculum-lookup` (what content), `/activity-ideas` (what activities), `/teaching-principles` (how/why to teach)
- Setup: Python 3.10+, then `cd kb && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`. All `kb.scripts.*` modules must be invoked from the repo root with `PYTHONPATH=.`.
- Vision extraction uses `gpt-4o-mini` with `detail: "low"` (fixed 85 tokens/image) plus a 0.5s proactive throttle and 65s TPM-aware retry floor in `kb/scripts/extract_vision.py` — if you change these, expect 200k TPM rate-limits on bulk runs.
- Needs `OPENAI_API_KEY`. Infisical's `blending-bootcamp` project key is currently out of credits; see Env Vars section above.
