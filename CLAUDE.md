# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — dev server on port 3000
- `npm run build` — production build (validates all routes)
- `npm run lint` — ESLint
- `npm run pull-secrets` — pull env vars from Infisical into `.env.local`
- No test framework configured yet

## What This Is

WordPets — a companion practice app for English literacy students ages 6-12. Teachers assign it to students for daily practice between live sessions. Kids complete reading, spelling, and writing activities to earn rewards for a virtual pet.

**Current state:** MVP of the original "Blending Bootcamp" concept — a 14-day phonics blending program for ages 5-7. This is being evolved into the broader companion app described in `docs/superpowers/specs/2026-04-14-wordpets-companion-app-design.md`.

**Target users:** English-speaking children living in Israel who speak/understand English fluently but struggle with reading and writing. Their teacher (Eli's wife) assigns practice via the app.

## Architecture

### Current Lesson Flow (MVP — being reworked)

1. **Home page** (`src/app/page.tsx`) — 14-day vertical timeline, progress from localStorage
2. **Lesson route** (`src/app/lesson/[day]/page.tsx`) — SSG with `generateStaticParams` for days 1-14
3. **LessonScreen** (`src/components/LessonScreen.tsx`) — wraps lesson session, requests mic, tracks time
4. **BlendingExercise** (`src/components/BlendingExercise.tsx`) — core mechanic with two modes:
   - **Speech mode** (mic granted): phoneme-play → phoneme-listen → phoneme-correct/skip → blending → word-play → word-listen → word-correct/skip → done
   - **Tap mode** (fallback): tapping → blending → reveal → done
5. **CelebrationScreen** (`src/components/CelebrationScreen.tsx`) — shown on lesson completion

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

- `OPENAI_API_KEY` — server-side only, Whisper transcription
- `NEXT_PUBLIC_SUPABASE_URL` — optional, enables cloud sync
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — optional

## Brand

- Name: **WordPets**
- Colors: purple #7C3AED (primary), teal, coral/orange, cream backgrounds #FFF8E1
- Logo: `public/wordpets/logo.png`
- Target device: iPad primary (768×1024), mobile secondary
- Two visual modes planned: playful (ages 6-8) and clean (ages 9-12)

## Design Spec

The approved design for the companion app is at `docs/superpowers/specs/2026-04-14-wordpets-companion-app-design.md`. Key additions over current MVP:
- Teacher dashboard with student management, tags, content assignment
- Pet system (care, customization, room decoration, evolution)
- 7 activity types (phonics, read aloud, spelling, sight words, comprehension, writing, story listening)
- Pet mini-games as reward currency
- AI-generated + curated content library
- Invite-link onboarding for students
- Auto-generated parent progress updates

## Key Design Decisions

1. **Activity components must be standalone** — each accepts content + mode (solo/live) + callbacks, for reuse in Phase 2 live sessions
2. **Content is decoupled from delivery** — same format whether from library, AI, or teacher upload
3. **Pet system is a separate module** — activities emit reward events, pet system consumes them
4. **Two age-based visual modes** — determined by student profile age, same components with different styling
