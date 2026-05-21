# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — dev server on port 3000
- `npm run build` — production build (validates all routes)
- `npm run lint` — ESLint
- `npm run pull-secrets` — pull env vars from Infisical into `.env.local`
- No JS/TS test framework yet
- `PYTHONPATH=. pytest kb/tests/ -q` — Python tests for the teaching-resources KB (21 tests). Must run from repo root (`~/projects/wordpets`) with the kb venv active.

## Database (Supabase)

- Apply schema: `psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/schema-v2.sql`
- Seed starter content: `psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed.sql`
- Interactive shell: `/opt/homebrew/opt/libpq/bin/psql "$SUPABASE_DB_URL"`
- `$SUPABASE_DB_URL` lives in Infisical (project `2423b7fc`); `npm run pull-secrets` writes it into `.env.local`. Then `set -a && . ./.env.local && set +a` to export.

## Workspace gotcha

`/Users/eliHome` has a stray `package.json` and `package-lock.json` (renamed to `.bak` on 2026-04-26) from an accidental `npm install` somewhere. Without that fix, Turbopack walked up looking for the workspace root, picked `~` over `~/projects/wordpets`, and PostCSS couldn't resolve `tailwindcss`. `next.config.ts` pins `turbopack.root: process.cwd()` as a defense-in-depth, but **don't run `npm install` from `~`** — it'll re-create the collision.

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
- Phonics activity is **built** (wraps existing `BlendingExercise` with content cycling + scoring); Spelling and Read Aloud are TBD.

### Phase 1a building blocks (child practice loop)

The data layer was deliberately built with **two co-existing branches** — Supabase live and fixture demo — both checked at runtime via `supabaseIsConfigured()`. Fixtures are not scaffolding to be deleted; they're a permanent dev/demo escape hatch. Demo URL: `/student/fixture-student-1` works regardless of Supabase state because `getStudent` short-circuits on the fixture id (a non-uuid string that would otherwise blow up against the `uuid` column).

- `src/lib/student-data.ts` — `getStudent(id)`, `getPhonicsContent()`. Each branches on Supabase config; falls back to fixture if query fails or returns nothing.
- `src/lib/tracker.ts` — `createSessionTracker(studentId)` returns `NoopTracker` (logs to console) or `SupabaseTracker` (opens a `practice_sessions` row, writes `activity_attempts`, finalizes with coin total + duration, bumps `students.coins`) based on env. Read-modify-write on coins is acceptable for Phase 1a single-tab usage.
- `src/lib/fixtures/student.ts` — fixture student "Alex" + cat "Whiskers", two phonics word lists (`-at` and `-it` families) lifted from `src/data/curriculum.ts`. Mirrors the seeded `content` rows in the live DB.
- `src/components/PetDisplay.tsx` — emoji + name + mood label + coin counter. Mood-colored background.
- `src/components/activities/PhonicsActivity.tsx` — wraps `BlendingExercise`, cycles N words, records each attempt as `activity_attempts` (score=100 per completed word — `BlendingExercise` is encouragement-first and doesn't surface pass/fail), awards 2 coins per word.
- `src/app/student/[id]/page.tsx` — child home: pet + "Today's practice" → Phonics card.
- `src/app/student/[id]/practice/phonics/page.tsx` — mic permission prompt → activity → completion screen with coin total. Loads student + content in parallel via `Promise.all`.
- `supabase/schema-v2.sql` — current schema (9 tables, RLS on all).
- `supabase/seed.sql` — Phase 1a starter library content (idempotent via slug-keyed delete-then-insert). Live DB has 2 phonics wordlists seeded (`phonics-cvc-at`, `phonics-cvc-it`).

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

### Auth

- Supabase Auth via `@supabase/ssr` with browser + server clients
- `AuthProvider` context gracefully no-ops if Supabase env vars aren't set
- Middleware refreshes sessions on every request

## Env Vars

**The one correct path**: `npm run pull-secrets` populates `.env.local` from Infisical project `2423b7fc` (legacy name: "blending-bootcamp" — kept under old name intentionally). Don't `export` vars or hand-edit `.env.local`; Infisical is the source of truth. Keys below document what's stored there.

- `OPENAI_API_KEY` — server-side only, Whisper transcription (⚠️ as of 2026-04-23 the key in the `blending-bootcamp` Infisical project is out of credits; KB extraction was run against the `voice` project's key. Top up or rotate before relying on production Whisper.)
- `NEXT_PUBLIC_SUPABASE_URL` — optional, enables cloud sync
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — optional. Note: Supabase renamed `anon` keys → `publishable` keys (`sb_publishable_...`). New projects only get the new format. The library accepts either; the env var name is just convention.
- `SUPABASE_DB_URL` — server-side only (no `NEXT_PUBLIC_` prefix). Session pooler URL with embedded password. Used for `psql` migrations and any future server-side scripts. NOT used by the Next.js client. To use locally:
  ```bash
  source <(node -e 'require("/Users/eliHome/projects/infisical/secrets").initSecrets({projectId:"2423b7fc-bb02-4075-aba8-d7d04aacc820",environment:"prod"}).then(()=>console.log("export SUPABASE_DB_URL=\""+require("/Users/eliHome/projects/infisical/secrets").getSecret("SUPABASE_DB_URL")+"\""))') && /opt/homebrew/opt/libpq/bin/psql "$SUPABASE_DB_URL"
  ```
  or just `npm run pull-secrets` to drop it into `.env.local` alongside the others.

## Supabase project facts

- Project ref: `ukqjnqyaddieyoofhany`, region: **ap-southeast-2 (Sydney)** — ~250-280ms RTT from Israel. Acceptable for Phase 1a; reconsider for Phase 1b if latency becomes felt.
- Pooler hostname: `aws-1-ap-southeast-2.pooler.supabase.com:5432` (session mode — supports DDL).
- `psql` lives at `/opt/homebrew/opt/libpq/bin/psql` (Homebrew `libpq`, not on PATH).
- Schema applied via `psql "$SUPABASE_DB_URL" -f supabase/schema-v2.sql` on 2026-04-26. 9 tables: `profiles`, `students`, `tags`, `student_tags`, `focus_areas`, `invite_tokens`, `practice_sessions`, `activity_attempts`, `content`. RLS policies attached to all.
- Direct connection `db.ukqjnqyaddieyoofhany.supabase.co:5432` is IPv6-only on free tier — use the pooler from IPv4 networks.

## Architectural gotchas (load-bearing)

These were discovered during the Phase 1a smoke-test session (2026-04-26). Removing or "simplifying" them will break onboarding.

### Auth state propagates async after signup

`supabase.auth.signUp()` returns before AuthProvider's `onAuthStateChange` fires with the new user. Two consequences:

1. **Don't redirect immediately when `loading=false && !user`.** `src/app/teacher/layout.tsx` defers the `/login` push by 2.5s via a `setTimeout` whose cleanup cancels if `user` arrives in the meantime. Without the deferral, fresh signups bounce to `/login` because the layout sees `user=null` for ~1s after `loading` flips to false.
2. **Call `refreshProfile(userId)` after inserting a profile row.** AuthProvider's first `fetchProfile` raced the insert and got HTTP 406 (PostgREST's "no rows" code, NOT 404). It cached `profile=null`, so `role` stays null forever and layouts that gate on role render blank. `src/app/signup/page.tsx` and `src/app/join/[token]/page.tsx` both call `refreshProfile(authData.user.id)` after the insert — pass the userId explicitly because AuthProvider's `user` state may still be stale at call time.

### Data queries bypass `@supabase/ssr` (use direct PostgREST `fetch`)

`src/lib/student-data.ts` and `src/lib/tracker.ts` do NOT use `supabase.from(...).select(...)`. They build `fetch(`${url}/rest/v1/...`)` calls directly, with the JWT pulled out of the `sb-<ref>-auth-token` cookie.

**Why:** `@supabase/ssr`'s `createBrowserClient` calls `_useSession` before every query. `_useSession` acquires a `navigator.locks` lock keyed on the project ref. If a prior page's `auth.getUser()` was aborted by navigation while holding that lock, every subsequent `.from()` on ANY client in the browser hangs indefinitely (the lock key is browser-wide, so making a fresh client doesn't help). The hang isn't a timeout — it's a permanent deadlock until the page reloads.

`src/lib/supabase/client.ts` exports both `createClient()` (singleton, used ONLY by AuthProvider — needs the lock for cross-tab session sync) and `createDataClient()` (fresh, lock-bypassed via `auth: { lock: (_, __, fn) => fn() }`). The `createDataClient` is currently unused now that we went all-REST, but kept for cases where you want the JS client's query builder ergonomics.

If you reach for `supabase.from(...)` in a new component, you'll inherit the hang. Use the REST helpers in `student-data.ts` as a model, or call `createDataClient()` and accept the (smaller but still real) risk.

### Parents need RLS to manage their own focus_areas

`focus_areas` has BOTH a teacher policy and a parent policy:
- "Teachers manage focus areas" — teacher of the student can do anything
- "Parents read child focus areas" — parent of the student can SELECT
- "Parents manage own child focus areas" — parent of the student can also INSERT/UPDATE/DELETE

The third policy is required because the join flow inserts default focus areas during pet-select (before any teacher has touched the student). Without it, that insert silently 403s and the kid lands with no practice schedule.

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

Python pipeline that produces phonics-decodable comic issues for the Phase 1b "Story Listening" activity. **Sibling subsystem to `kb/` — same repo, separate venv, separate concerns.** Asset production runs in parallel with Phase 1a; in-app shipping waits until Phase 1a hits ≥60% practice rate. See `comics/README.md` and the plan at `~/.claude/plans/new-project-planning-red-snazzy-wadler.md`.

- **What it produces**: 5–7 page manga/Ghibli-style phonics comics. Recurring kid + pet cast (Sam, Whiskers). Every word in every speech bubble is mechanically gated to the issue's phonics stage. Target words preview page per Ilana's `decodable-word-preview` principle.
- **Pipeline (5 steps)**: `new_issue.py` → `validate_script.py` (hard gate) → `generate_panels.py` (Gemini 3 Pro Image with character refs) → `typeset_pages.py` (Pillow + Andika font + OCR re-validation) → `publish_issue.py` (OpenAI TTS + asset bundle into `public/comics/<slug>/` + seed SQL).
- **Decodability gate**: `comics/lib/decodability.py` is the single source of truth for what words are allowed at each stage. Cumulative across stages, plus a sight-word allowlist, plus character names gated to introduction stages (e.g. "Whiskers" requires both `wh-` and `-er` taught — empty placeholder stage `digraphs-wh-er` exists in the validator just to anchor that gate).
- **Stage parity**: `comics/tests/test_curriculum_parity.py` parses `src/lib/fixtures/student.ts` and asserts ACTIVE_STAGES match word-for-word. If you add a phonics stage to the app, you must update the validator (or vice versa) — the test will catch drift.
- **Setup**: `cd comics && /opt/homebrew/bin/python3.12 -m venv .venv && .venv/bin/pip install -e ".[dev]"`. Run tests: `PYTHONPATH=. .venv/bin/pytest`. Currently 148 tests, all green.
- **Secrets**: API keys flow through Infisical → `wordpets/.env.local` via `npm run pull-secrets` (same flow as the rest of the wordpets project — comics doesn't have its own Infisical client). Pilot needs `GEMINI_API_KEY` (Gemini 3.1 Flash Image, model name `gemini-3.1-flash-image-preview`); typesetter/TTS phases later need `OPENAI_API_KEY`. Both belong in Infisical project `2423b7fc` (legacy "blending-bootcamp") env `prod`.
- **Pilot tooling built (2026-05-06)**: `lib/secrets.py` (env loader), `lib/gemini_client.py` (Gemini wrapper with character-ref multi-image conditioning), `scripts/generate_refs.py` (candidate ref generation), `scripts/generate_panels.py` (panel generation with surgical re-roll via `--panel page:panel`).
- **Pilot-first scope**: deliberately stops at "one reviewable pilot issue". Typesetting, OCR re-validation, TTS, and publish steps NOT YET BUILT — they wait until pilot art direction is approved by Eli + Ilana.
- **In-app feature is deferred to Phase 1b**: do NOT build `StoryActivity.tsx`, the schema migration, or the `/practice/story/` route until Phase 1a validates. Asset production proceeds independently.
