# WordPets

A companion practice app for English literacy students ages 6-8. A teacher (Eli's wife, Ilana) assigns it to her students for daily practice between live sessions. Kids complete phonics, spelling, and read-aloud activities to earn rewards for a virtual pet — and the teacher sees who practiced and what they're struggling with.

## Status

**Phase 0 — Blending Bootcamp MVP (shelved as starting point):** A 14-day phonics blending program for ages 5-7. Code is preserved as a working reference for the speech/blending mechanic — it is no longer the active development target.

**Phase 1a — Companion App MVP (active):** Teacher-assigned practice for wife's students. 3 activities (Phonics, Spelling, Read Aloud), thin pet system, minimal teacher dashboard. See `docs/superpowers/specs/2026-04-14-wordpets-companion-app-design.md` for the authoritative spec.

The pivot was decided on 2026-04-14 and formally documented on 2026-04-22. See `CLAUDE.md` for the full status table.

## Phase 0 (frozen) — How It Worked

The Blending Bootcamp curriculum has three phases:

1. **Sound Glue (Days 1-4)** — simple CVC words (cat, sit, dog)
2. **Automatic Blending (Days 5-9)** — consonant blends, digraphs, speed drills
3. **Transfer to Reading (Days 10-14)** — decodable sentences and mini stories

Each lesson: tap phonemes → hear the sounds → slide them together → say the word → mic confirms pronunciation.

This is still runnable in the codebase (visit `/lesson/[day]`) but no new features are being added.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Speech recognition via MediaRecorder + OpenAI Whisper API
- TTS via browser Web Speech API with phoneme pronunciation mapping
- Supabase Auth + progress sync (optional — works offline with localStorage)
- PWA-ready (manifest configured, service worker pending)

## Setup

```bash
npm install
npm run pull-secrets               # pulls env vars from Infisical (preferred)
# OR: cp .env.local.example .env.local && fill in keys manually
npm run dev                        # http://localhost:3000
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Server-side Whisper transcription |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL (enables cloud sync) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | No | Supabase publishable key (new naming; `sb_publishable_...`) |

Without Supabase vars, the Phase 0 app works fully offline using localStorage for progress. Phase 1a (teacher dashboard, students, invites) requires Supabase.

## Commands

```bash
npm run dev           # dev server (port 3000)
npm run build         # production build
npm run lint          # ESLint
npm run pull-secrets  # pull env vars from Infisical
```
