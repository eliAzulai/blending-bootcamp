# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — dev server on port 3000
- `npm run build` — production build (validates all routes)
- `npm run lint` — ESLint
- No test framework configured yet

## What This Is

WordPets (branded from "Blending Bootcamp") — a phonics blending app for kids ages 5-7. 14-day program, ~10 min/day. The child taps phoneme cards, listens to sounds, then says the word aloud. Speech recognition confirms pronunciation.

## Architecture

### Core Lesson Flow

The lesson experience is a pipeline of components:

1. **Home page** (`src/app/page.tsx`) — 14-day vertical timeline, reads progress from localStorage, shows locked/current/completed states per day
2. **Lesson route** (`src/app/lesson/[day]/page.tsx`) — SSG with `generateStaticParams` for days 1-14, server component that loads lesson data and renders `LessonClient`
3. **LessonScreen** (`src/components/LessonScreen.tsx`) — wraps the full lesson session. Requests mic permission on mount, iterates through words, tracks elapsed time, marks day complete on finish
4. **BlendingExercise** (`src/components/BlendingExercise.tsx`) — the core mechanic. Has two modes:
   - **Speech mode** (mic granted): phoneme-play -> phoneme-listen -> phoneme-correct/skip -> blending -> word-play -> word-listen -> word-correct/skip -> done
   - **Tap mode** (fallback): tapping -> blending -> reveal -> done (manual "I can say it!" confirm)
5. **CelebrationScreen** (`src/components/CelebrationScreen.tsx`) — shown on lesson completion

### Speech Recognition Pipeline

Speech input uses MediaRecorder + OpenAI Whisper (not the Web Speech API):

- `src/lib/speech-recognition.ts` — records audio for N seconds via MediaRecorder, sends blob to `/api/transcribe`
- `src/app/api/transcribe/route.ts` — proxies audio to OpenAI Whisper API, requires `OPENAI_API_KEY` env var
- `src/hooks/useSpeechRecognition.ts` — React hook wrapping the recording/matching flow
- `src/lib/phoneme-matching.ts` — fuzzy matching with accept maps, child speech substitution patterns (th->f, r->w), and Levenshtein distance. Very lenient for phonemes (always passes if child makes any sound), stricter for whole words

Speech output (TTS) uses the browser's Web Speech API:
- `src/lib/speech.ts` — maps single-letter phonemes to pronunciation strings (e.g., "c" -> "kuh") because TTS reads letter names, not sounds

### Data Model

- `src/types/lesson.ts` — discriminated union: Phase1Lesson | Phase2Lesson | Phase3Lesson. Phase 3 adds `decodableText`
- `src/data/curriculum.ts` — hardcoded 14 lessons across 3 phases (Sound Glue, Automatic Blending, Transfer to Reading), ~5 words per day, each word split into phonemes

### Progress Tracking (Dual Layer)

- **localStorage** (`src/lib/progress.ts`) — always works, stores `{daysCompleted: number[], wordsBlended: number}`. Sequential unlock: day N requires day N-1 complete
- **Supabase** (`src/lib/supabase/progress-sync.ts`) — optional cloud sync when authenticated. Tables: `learners` (parent_id FK to auth.users), `progress` (learner_id, day, words_blended, time_seconds). RLS policies scope all queries to parent's own learners

### Auth

- Supabase Auth via `@supabase/ssr`, configured with browser client (`src/lib/supabase/client.ts`) and server client (`src/lib/supabase/server.ts`)
- `AuthProvider` context wraps the app in layout, gracefully no-ops if Supabase env vars aren't set
- Middleware (`src/middleware.ts`) refreshes sessions on every request
- Login/signup pages at `/login` and `/signup`, OAuth callback at `/auth/callback`

## Env Vars

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (optional; app works without it using localStorage only)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `OPENAI_API_KEY` — server-side only, for Whisper transcription API

## Brand

- Name: **WordPets**
- Colors: purple (#7C3AED primary), teal, coral/orange, cream backgrounds (#FFF8E1)
- Logo at `public/wordpets/logo.png`
- Target: mobile/tablet PWA (standalone mode, no user scaling)

## Pending Features

Stripe paywall at Day 4, parent dashboard, service worker for offline, pet care reward screen, audiobook story player, letter tracing canvas, word-hunt game.
