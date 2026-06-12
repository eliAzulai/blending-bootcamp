# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Read first**: [`docs/non-negotiable-rules.md`](docs/non-negotiable-rules.md) — root rules that override design preference, content generation, and developer taste. Particularly R1 (literacy font, no system-ui) and R2-R3 (decodability + difficulty progression).

## Commands

- `npm run dev` — dev server on port 3000
- `npm run build` — production build (validates all routes)
- `npm run lint` — ESLint
- `npm run pull-secrets` — pull env vars from Infisical into `.env.local`
- No JS/TS test framework yet
- `kb/.venv/bin/pytest kb/tests/ -q` — Python tests for the teaching-resources KB (21 tests). Works from repo root or `kb/` (`kb/pyproject.toml` puts the repo root on `pythonpath`, so no `PYTHONPATH=.` needed).

## What This Is

WordPets — a companion practice app assigned by a teacher (Eli's wife, Ilana) to her students for daily practice between live sessions. Kids complete phonics, spelling, and read-aloud activities to earn rewards for a virtual pet. Teacher sees who practiced and what they're struggling with.

**Target users (Phase 1a):** English-speaking children living in Israel ages 6-8. They speak/understand English fluently but struggle with reading and writing.

## Status (as of 2026-05-27)

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 1a — Companion App** | Teacher-assigned practice for Ilana's students (ages 6-8). 3 activities (Phonics, Spelling, Read Aloud), thin pet system, minimal teacher dashboard. | **LIVE** at https://app.wordpets.xyz. Spec: `docs/superpowers/specs/2026-04-14-wordpets-companion-app-design.md`. Success metric: ≥60% practicing 4+ days/week after 4 weeks. |
| **Phase 1b — Earn Expansion** | More activities, pet room/outfits/evolution, ages 9-12, parent summaries | Deferred — only triggered if 1a hits its metric. |
| **Phase 2+** | Live teaching platform, teacher SaaS, standalone B2C | Out of scope for this codebase. |

The original **Phase 0 — Blending Bootcamp** (14-day standalone phonics program) was the starting point of this repo. As of 2026-05-11 its routes and supporting files have been removed; only the reusable mechanic survives: `BlendingExercise.tsx` + `PhonemeCard.tsx` + `useSpeechRecognition.ts` + `phoneme-matching.ts` + `speech.ts`. Those are used by `PhonicsActivity` inside the Phase 1a practice loop. There is no longer a "Phase 0 codebase to preserve" — the cleanup is complete.

**Blending Bootcamp scope fence:** The repo, Infisical project, and some old docs still use the legacy `blending-bootcamp` name. That is history and infrastructure naming only. Do not rebuild the self-service bootcamp, `/lesson/[day]`, localStorage progress timelines, Phase 0 routes, or standalone B2C flow unless Eli explicitly re-scopes it. Current product work is WordPets Phase 1a.

## Architecture

### Routes (Phase 1a — current)

- `/` — server-rendered landing page. Routes signed-in users to their role-appropriate home.
- `/signup`, `/login` — server actions (no AuthProvider). See `auth/actions.ts` and per-page `actions.ts`.
- `/join/[token]`, `/join/[token]/pet-select`, `/join/success` — parent join flow.
- `/student`, `/student/practice` — child home + practice runner. Both server components; activities themselves are client components.
- `/teacher`, `/teacher/add-student`, `/teacher/students/[id]` — teacher dashboard. All server components.
- `/api/transcribe`, `/auth/callback` — supporting endpoints.

### Components

- `src/components/PetDisplay.tsx` — pet emoji + name + mood + coins.
- `src/components/activities/PhonicsActivity.tsx` — wraps `BlendingExercise` for the practice flow.
- `src/components/activities/SpellingActivity.tsx` — TTS-prompted typing.
- `src/components/activities/ReadAloudActivity.tsx` — record passage to Whisper; non-authoritative.
- `src/components/teacher/*` — `StudentCard`, `StatsBar`, `TagManager`, `FocusAreaToggle`, `PracticeHistory`.
- `src/components/BlendingExercise.tsx` + `PhonemeCard.tsx` — the original phoneme blending mechanic; kept because PhonicsActivity uses it.
- `src/components/SignOutButton.tsx` — tiny client wrapper around the server-action sign-out.

### Speech Pipeline

Speech input uses MediaRecorder + OpenAI Whisper (not Web Speech API):
- `src/lib/speech-recognition.ts` — records audio via MediaRecorder, sends to `/api/transcribe`
- `src/app/api/transcribe/route.ts` — proxies to Whisper, requires `OPENAI_API_KEY`
- `src/hooks/useSpeechRecognition.ts` — React hook for recording/matching
- `src/lib/phoneme-matching.ts` — fuzzy matching with child speech substitution patterns (th→f, r→w). Very lenient for phonemes (any sound passes), stricter for words.

Speech output (TTS) uses browser Web Speech API:
- `src/lib/speech.ts` — maps phonemes to pronunciation strings (e.g. "c" → "kuh")

### Data

- `src/types/database.ts` — TypeScript types matching the Supabase schema (`Profile`, `Student`, `FocusArea`, `InviteToken`, `PracticeSession`, `ActivityAttempt`, `Content`).
- `src/lib/fixtures/student.ts` — source-of-truth content (phonics word lists, spelling word lists, read-aloud passages). Fed into the live DB via `scripts/seed-content.ts`. See "Practice content pipeline" section below.

### Progress / tracking

- `src/lib/tracker.ts` — `createSessionTracker(studentId)` returns either `NoopTracker` (when Supabase isn't configured) or `SupabaseTracker` (opens a `practice_sessions` row, writes `activity_attempts`, bumps `students.coins` on finish).

### Auth

- Server-side throughout. Server components fetch the user via `await createClient()` from `@/lib/supabase/server` and call `supabase.auth.getUser()`. Mutations are server actions in `actions.ts` files alongside the page.
- The browser supabase client (`@/lib/supabase/client`) exists only for the practice activity tracker (writes during a session). All auth-gated rendering goes through server components.
- No AuthProvider, no useAuth, no client-side role checks. If you see those reappearing, that's a regression — see PR #4 (~commits c104108 + 41a0b53) for why.
- Middleware refreshes sessions on every request

## Env Vars

**The one correct path**: `npm run pull-secrets` populates `.env.local` from Infisical project `2423b7fc` (legacy name: "blending-bootcamp" — kept under old name intentionally). Don't `export` vars or hand-edit `.env.local`; Infisical is the source of truth. Keys below document what's stored there.

- `OPENAI_API_KEY` — server-side only, Whisper transcription (⚠️ as of 2026-04-23 the key in the `blending-bootcamp` Infisical project is out of credits; KB extraction was run against the `voice` project's key. Top up or rotate before relying on production Whisper.)
- `NEXT_PUBLIC_SUPABASE_URL` — optional, enables cloud sync
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — optional; primary key used by server/middleware/tracker.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — optional backwards-compatible fallback for the browser client only.

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

## Pet Kitchen status

Pet Kitchen was explored as a Phase 1a spelling wrapper in May 2026, but it is **not current implementation scope**. The related docs under `docs/superpowers/specs/2026-05-19-*`, `docs/superpowers/plans/2026-05-19-*`, and `docs/playtests/2026-05-19-*` are historical/deferred. The implementation/assets/tests were removed from current `main` during the 2026-05-27 source-of-truth reconciliation. Do not rebuild Pet Kitchen or route the spelling activity through it unless Eli explicitly re-scopes it against the current `/student/practice` architecture and Phase 1a metric.

## Success Metric (Phase 1a)

After 4 weeks with wife's students: **≥60% complete practice 4+ days/week** (measured via practice_sessions table). If this fails, rework pet mechanics or content before adding more features.

## Key Design Decisions

1. **Activity components must be standalone** — each accepts content + mode (solo/live) + callbacks, so they can be reused in Phase 2 live sessions later
2. **Content is decoupled from delivery** — same format whether from starter library, AI, or teacher upload (only starter library exists in 1a)
3. **Pet system is a separate module** — activities emit reward events, pet system consumes them
4. **Speech is non-authoritative for Read Aloud** — Whisper has not been validated with 6-8 year olds reading aloud; record + transcribe but do not pass/fail. Phonics blending speech (Phase 0 codebase) keeps its existing fuzzy matching

## Practice content pipeline

Practice content (phonics word lists, spelling word lists, read-aloud passages) flows: **fixtures → seed script → DB → runtime query**.

- **Source of truth**: `src/lib/fixtures/student.ts` exports typed arrays (`fixturePhonicsContent`, `fixtureSpellingContent`, `fixtureReadAloudPassages`). Hand-edits here go to the repo, not the live app.
- **Migration**: `scripts/seed-content.ts` reads the fixtures and emits idempotent SQL (`begin / delete from content where source='library' / insert / commit`). Apply with `scripts/db.sh -f <(npx tsx scripts/seed-content.ts)`.
- **Runtime**: `src/app/student/practice/page.tsx` calls `src/lib/content.ts` (`getPhonicsContent`, `getSpellingContent`, `getReadAloudPassage`) which query the `content` table directly. Falls back to fixture defaults if DB returns nothing.
- **Rotation**: `rotation = count(completed sessions for student) % matching.length`. Computed server-side.
- **Generate new content**: invoke `/wordpets-content <type> <difficulty> <pattern>` — produces TS snippet + SQL grounded in Ilana's pedagogical principles. See `~/.claude/skills/wordpets-content/SKILL.md`.

## Teaching Resources KB (`kb/`)

Queryable knowledge base of Ilana's curated teaching materials. See `kb/README.md`.

- 26 source PDFs/images in `kb/sources/` → 28 extracted markdown files (2 sources are classified `domain: both` and extracted into both collections) → 63 embedded chunks (33 curriculum + 30 activities)
- Three ChromaDB collections: `wordpets-curriculum`, `wordpets-activities`, `wordpets-principles`. Persistent store at `~/.wordpets-kb-db`, extract/index state at `kb/.extract-state.json` and `~/.wordpets-kb-state.sqlite`
- Principles layer: 10 pedagogical design principles extracted from Ilana's expert walkthrough sessions in `kb/extracted/principles/`. Transcripts in `kb/transcripts/`.
- Run `PYTHONPATH=. python3 -m kb.scripts.extract` (incremental via sha256) → `PYTHONPATH=. python3 -m kb.scripts.index` (incremental via content hash, `--full-reindex` to rebuild)
- Query via `PYTHONPATH=. python3 -m kb.scripts.query <curriculum|activities|principles> "question" [--grade K|1|2|3+] [--top N]`
- Skills: `/curriculum-lookup` (what content), `/activity-ideas` (what activities), `/teaching-principles` (how/why to teach), `/wordpets-content` (generate new practice content grounded in Ilana's principles)
- Setup: Python 3.10+, then `cd kb && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`. All `kb.scripts.*` modules must be invoked from the repo root with `PYTHONPATH=.`.
- Vision extraction uses `gpt-4o-mini` with `detail: "low"` (fixed 85 tokens/image) plus a 0.5s proactive throttle and 65s TPM-aware retry floor in `kb/scripts/extract_vision.py` — if you change these, expect 200k TPM rate-limits on bulk runs.
- Needs `OPENAI_API_KEY`. Infisical's `blending-bootcamp` project key is currently out of credits; see Env Vars section above.

## Comics authoring (`comics/`)

`comics/` is a local-only sibling subsystem for Phase 1b decodable comic asset production. Keep it separate from pushed `main` unless Eli explicitly asks to reconcile or commit it. Its in-app story/listening surface remains deferred until Phase 1a validates.

- Stage parity: `comics/tests/test_curriculum_parity.py` parses `src/lib/fixtures/student.ts` and asserts comic `ACTIVE_STAGES` match the app fixture word-for-word.
- Local test command: `cd comics && PYTHONPATH=. .venv/bin/pytest`.
- Current local-only baseline after the 2026-05-27 cleanup: 158 comics tests pass.
