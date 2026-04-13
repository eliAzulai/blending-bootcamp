# WordPets

Phonics blending app for kids ages 5-7. A 14-day program (~10 min/day) that teaches children to decode words by tapping phoneme cards, listening to sounds, and speaking aloud for verification.

## How It Works

The curriculum has three phases:

1. **Sound Glue (Days 1-4)** — simple CVC words (cat, sit, dog)
2. **Automatic Blending (Days 5-9)** — consonant blends, digraphs, speed drills
3. **Transfer to Reading (Days 10-14)** — decodable sentences and mini stories

Each lesson: tap phonemes → hear the sounds → slide them together → say the word → mic confirms pronunciation.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Speech recognition via MediaRecorder + OpenAI Whisper API
- TTS via browser Web Speech API with phoneme pronunciation mapping
- Supabase Auth + progress sync (optional — works offline with localStorage)
- PWA-ready (manifest configured, service worker pending)

## Setup

```bash
npm install
cp .env.local.example .env.local  # fill in your keys
npm run dev                        # http://localhost:3000
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Server-side Whisper transcription |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL (enables cloud sync) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anon key |

Without Supabase vars, the app works fully offline using localStorage for progress.

## Commands

```bash
npm run dev    # dev server (port 3000)
npm run build  # production build
npm run lint   # ESLint
```
