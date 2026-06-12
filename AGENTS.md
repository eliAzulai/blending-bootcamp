# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — dev server on port 3000
- `npm run build` — production build (validates all routes)
- `npm run lint` — ESLint
- `npm run pull-secrets` — pull env vars from Infisical into `.env.local`
- No JS/TS test framework yet
- `kb/.venv/bin/pytest kb/tests/ -q` — Python tests for the teaching-resources KB (21 tests). Works from repo root or `kb/` (`kb/pyproject.toml` puts the repo root on `pythonpath`, so no `PYTHONPATH=.` needed).

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

**Blending Bootcamp scope fence:** The repo, Infisical project, and some old docs still use the legacy `blending-bootcamp` name because WordPets started as a 14-day bootcamp prototype. That is history and infrastructure naming only. Do not rebuild the self-service bootcamp, `/lesson/[day]`, localStorage progress timelines, Phase 0 routes, or standalone B2C flow unless Eli explicitly re-scopes it. Current product work is WordPets Phase 1a.

## Status (as of 2026-05-27)

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 1a — Companion App** | Teacher-assigned practice for Ilana's students (ages 6-8). 3 activities (Phonics, Spelling, Read Aloud), thin pet system, minimal teacher dashboard. | **LIVE** at https://app.wordpets.xyz. Authoritative spec: `docs/superpowers/specs/2026-04-14-wordpets-companion-app-design.md`. Success metric: >=60% practicing 4+ days/week after 4 weeks. |
| **Phase 1b — Earn Expansion** | More activities, pet room/outfits/evolution, ages 9-12, parent summaries | Deferred — only triggered if 1a hits its metric. |
| **Phase 2+** | Live teaching platform, teacher SaaS, standalone B2C | Out of scope for this codebase. |

The original **Phase 0 — Blending Bootcamp** was the starting point of this repo. As of 2026-05-11 its routes and supporting files have been removed; only the reusable mechanic survives: `BlendingExercise.tsx`, `PhonemeCard.tsx`, `useSpeechRecognition.ts`, `phoneme-matching.ts`, and `speech.ts`. Those are used by `PhonicsActivity` inside the Phase 1a practice loop. There is no longer a "Phase 0 codebase to preserve".

## Architecture

### Routes (Phase 1a — current)

- `/` — server-rendered landing page. Routes signed-in users to their role-appropriate home.
- `/signup`, `/login` — server actions; no AuthProvider.
- `/join/[token]`, `/join/[token]/pet-select`, `/join/success` — parent join flow.
- `/student`, `/student/practice` — child home + practice runner. Both server components; activities themselves are client components.
- `/teacher`, `/teacher/add-student`, `/teacher/students/[id]` — teacher dashboard. All server components.
- `/api/transcribe`, `/auth/callback` — supporting endpoints.

### Components

- `src/components/PetDisplay.tsx` — pet emoji + name + mood + coins.
- `src/components/activities/PhonicsActivity.tsx` — wraps `BlendingExercise` for the practice flow.
- `src/components/activities/SpellingActivity.tsx` — TTS-prompted typing.
- `src/components/activities/ReadAloudActivity.tsx` — records passage to Whisper; non-authoritative.
- `src/components/teacher/*` — `StudentCard`, `StatsBar`, `TagManager`, `FocusAreaToggle`, `PracticeHistory`.
- `src/components/BlendingExercise.tsx` + `PhonemeCard.tsx` — the original phoneme blending mechanic; kept because `PhonicsActivity` uses it.
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
- `src/lib/fixtures/student.ts` — source-of-truth content (phonics word lists, spelling word lists, read-aloud passages). Fed into the live DB via `scripts/seed-content.ts`. See "Practice content pipeline" below.

### Progress / tracking

- `src/lib/tracker.ts` — `createSessionTracker(studentId)` returns either `NoopTracker` (when Supabase is not configured) or `SupabaseTracker` (opens a `practice_sessions` row, writes `activity_attempts`, bumps `students.coins` on finish).

### Auth

- Server-side throughout. Server components fetch the user via `await createClient()` from `@/lib/supabase/server` and call `supabase.auth.getUser()`. Mutations are server actions in `actions.ts` files alongside the page.
- The browser Supabase client (`@/lib/supabase/client`) exists only for the practice activity tracker. All auth-gated rendering goes through server components.
- No AuthProvider, no `useAuth`, no client-side role checks. If you see those reappearing, that is a regression.
- Middleware refreshes sessions on every request.

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

### Server auth is the current architecture

Old docs and plans may mention `AuthProvider`, `useAuth`, `/student/[id]`, or per-activity nested routes like `/student/[id]/practice/phonics`. Those are historical. The current app uses server components plus server actions, with `/student` and `/student/practice` as the child-facing routes. Reintroducing client-side auth guards or id-in-path student routes should be treated as a regression unless explicitly re-scoped.

### Practice tracking still uses the browser client

`src/lib/tracker.ts` writes practice sessions and attempts during the client-side activity loop. Keep that contract small: activities emit attempts and finish events, while server pages load the user/student/content before rendering the practice runner.

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
- **Generate new content**: invoke `/wordpets-content <type> <difficulty> <pattern>` — produces TS snippet + SQL grounded in Ilana's pedagogical principles. See `~/.Codex/skills/wordpets-content/SKILL.md`.

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

Python pipeline that produces phonics-decodable comic issues for the Phase 1b "Story Listening" activity. **Sibling subsystem to `kb/` — same repo, separate venv, separate concerns.** As of 2026-05-27, `comics/` is intentionally local-only and separate from pushed `main` unless Eli explicitly asks to reconcile or commit it. Asset production may run in parallel with Phase 1a; in-app shipping waits until Phase 1a hits >=60% practice rate. See `comics/README.md` and the plan at `~/.Codex/plans/new-project-planning-red-snazzy-wadler.md`.

- **What it produces**: 5–7 page manga/Ghibli-style phonics comics. Recurring kid + pet cast (Sam, Whiskers). Every word in every speech bubble is mechanically gated to the issue's phonics stage. Target words preview page per Ilana's `decodable-word-preview` principle.
- **Pipeline (5 steps)**: `new_issue.py` → `validate_script.py` (hard gate) → `generate_panels.py` (Gemini 3 Pro Image with character refs) → `typeset_pages.py` (Pillow + Andika font + OCR re-validation) → `publish_issue.py` (OpenAI TTS + asset bundle into `public/comics/<slug>/` + seed SQL).
- **Decodability gate**: `comics/lib/decodability.py` is the single source of truth for what words are allowed at each stage. Cumulative across stages, plus a sight-word allowlist, plus character names gated to introduction stages (e.g. "Whiskers" requires both `wh-` and `-er` taught — empty placeholder stage `digraphs-wh-er` exists in the validator just to anchor that gate).
- **Stage parity**: `comics/tests/test_curriculum_parity.py` parses `src/lib/fixtures/student.ts` and asserts `ACTIVE_STAGES` match word-for-word. Current app fixture stage IDs are `phonics-cvc-short-a`, `phonics-cvc-short-i`, `phonics-cvc-short-o`, `phonics-cvc-short-u`, `phonics-cvc-short-e`, `phonics-cvc-mixed`, `phonics-beg-blends`, `phonics-end-blends`, `phonics-digraphs-sh-ch`, `phonics-digraphs-th`, `phonics-magic-e`, and `phonics-vowel-teams`. If you add a phonics stage to the app, update the validator (or vice versa); the parity test will catch drift.
- **Setup**: `cd comics && /opt/homebrew/bin/python3.12 -m venv .venv && .venv/bin/pip install -e ".[dev]"`. Run tests: `cd comics && PYTHONPATH=. .venv/bin/pytest`. Current local-only baseline: 158 tests pass after the 2026-05-27 fixture-parity cleanup.
- **Secrets**: API keys flow through Infisical → `wordpets/.env.local` via `npm run pull-secrets` (same flow as the rest of the wordpets project — comics doesn't have its own Infisical client). Pilot needs `GEMINI_API_KEY` (Gemini 3.1 Flash Image, model name `gemini-3.1-flash-image-preview`); typesetter/TTS phases later need `OPENAI_API_KEY`. Both belong in Infisical project `2423b7fc` (legacy "blending-bootcamp") env `prod`.
- **Pilot tooling built (2026-05-06)**: `lib/secrets.py` (env loader), `lib/gemini_client.py` (Gemini wrapper with character-ref multi-image conditioning), `scripts/generate_refs.py` (candidate ref generation), `scripts/generate_panels.py` (panel generation with surgical re-roll via `--panel page:panel`).
- **Pilot-first scope**: deliberately stops at "one reviewable pilot issue". Typesetting, OCR re-validation, TTS, and publish steps NOT YET BUILT — they wait until pilot art direction is approved by Eli + Ilana.
- **In-app feature is deferred to Phase 1b**: do NOT build `StoryActivity.tsx`, the schema migration, or the `/practice/story/` route until Phase 1a validates. Asset production proceeds independently.
