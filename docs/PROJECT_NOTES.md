# WordPets — Project Notes

Extracted from all project docs, mockups, code, git history, and ChatGPT planning chats as of 2026-04-14.

---

## The People

### You (Eli)
- Tech skills, some dev background
- Built the MVP solo using Claude Code
- Tends to have many ideas, gets distracted and overwhelmed (self-described)
- Role: "school director + tech" — dev, payments, marketing, automations

### Your Wife
- **Experienced English teacher**
- Works with **English-speaking Israeli children ages 6-12**
- Experience with reading and writing fluency
- Role: "head teacher" — lesson planning, teaching, assessment, parent feedback
- Curriculum designer for the teaching side

### Target Audience (refined across chats)
- **Primary:** Children of native English speakers living abroad (specifically Israel)
- These kids **speak and understand English fluently** with decent vocabulary
- But they **do not read and write well** — exposure is mostly oral (at home)
- Their needs are **different from typical EFL students** — they don't need basic vocab, they need literacy
- **Age range:** Started at 3-6 in research, settled on **6-12** in business planning
- **Parent profile:** Anxious about their child falling behind in English literacy, already trying worksheets/apps

---

## The Two Product Visions

There are **two separate product tracks** that emerged from the ChatGPT chats. They share the WordPets brand but serve different purposes:

### Track 1: WordPets App (Self-Service Digital Product)
**Source:** "researching a new webapp" chat + "entrepreneur advisor" chat
**What:** A phonics blending app — "Blending Bootcamp"
**Promise:** "In 14 days your child will blend sounds into words confidently — without guessing"
**Model:** B2C subscription, freemium (Days 1-3 free → Day 4 paywall)
**Price:** $9.99 one-time or $7/month
**Target:** Kids 5-7, parents buy directly
**Status:** MVP built and functional (the codebase)

### Track 2: WordPets English Club (Live Teaching Business)
**Source:** "online english language school" chat
**What:** Small-group live Zoom lessons led by your wife
**Promise:** "We help English-speaking Israeli kids ages 6-12 develop strong reading and writing fluency"
**Model:** Monthly subscription for ongoing school-year program
**Price:** 380-420 ₪/month (ages 6-9, 2x/week) or 280-350 ₪/month (ages 10-12, 1x/week)
**Target:** English-speaking Israeli families
**Status:** Planning complete, ready to launch with WhatsApp outreach

### The Gap Between Them

| Aspect | Track 1 (App) | Track 2 (Live Club) |
|--------|---------------|---------------------|
| Age range | 5-7 | 6-12 |
| Delivery | Self-service app | Live Zoom with teacher |
| Content | Phonics blending only | Reading + writing fluency |
| Duration | 14 days | Ongoing school year |
| Revenue | $7-10/month per user | 280-420 ₪/month per student |
| Scalability | Unlimited | Limited by wife's time |
| Audience | Global | Israeli English speakers |
| Status | MVP built | Plan ready, not launched |

**Key question: Are these the same product or two different businesses?**

---

## What The Dashboard Mockup Shows

The `dashboard-mockup.png` shows a **third vision** that doesn't match either track:
- 26-letter curriculum (one letter at a time, not 14 days)
- 4 activities per letter: Introduction → Phonics → Game → Story
- Collectible pets unlocked per letter
- Worksheet, Craft, Coloring extensions
- This is closer to Reading Eggs / Teach Your Monster scope

This mockup was likely generated during ChatGPT planning but **doesn't match the code (14-day blending) or the live teaching plan (ongoing fluency club).**

---

## The Lesson Loop Vision

From `lesson-loop.png`, the intended daily loop is:
```
Phonics/Recognition → Audiobook Story → Reward → Pet Care → back to Phonics
```
Currently only Phonics/Recognition exists in code. The other 3 nodes are pending.

---

## Competitive Landscape (from research chat)

Apps researched in detail:
- **Reading Eggs** — comprehensive, $9.99/month, 120+ lessons, gamified
- **Teach Your Monster to Read** — free on web, phonics-focused, linear mastery
- **ABCmouse** — broad curriculum, $10/month, highly gamified
- **Homer** — interest-based personalization, $7-8/month
- **Lingokids** — EFL play-based, freemium, Oxford UP partnership
- **Starfall** — free, systematic phonics, dated graphics
- **Duolingo ABC** — free, bite-sized, adaptive
- **Buddy.ai** — voice AI tutor, conversational practice
- **Ello** — AI reading coach, child speech recognition

### Your Wedge
ChatGPT recommended Wedge A (Blending Bootcamp) for speed-to-market, but noted **Wedge C (EFL reading for older kids who "know English but can't read")** as having the strongest founder-market fit — which is exactly your wife's expertise.

The app you built (Wedge A) targets younger kids (5-7) with basic phonics. Your wife's actual expertise and market access is older kids (6-12) who already speak English but need literacy. **These don't fully overlap.**

---

## Shark Tank Verdicts (from planning chat)

**What a judge would accept:**
- 14-21 day fixed path (not open-ended)
- Explicit skills progression
- Visible confidence gain by Day 5-7
- One core mechanic reused everywhere
- Measurable result parents can see

**Automatic rejection:**
- "Hundreds of lessons"
- "Adaptive AI learning paths"
- "Gamified world with quests and maps"
- Multiple age bands

**The single question:** "What exact problem disappears for a parent after 14 days of using your product?"

---

## What's Built (Code)

MVP of Track 1 only. 8 commits, Feb 18-26, idle since.

**Core mechanic:** Tap phoneme cards → hear sounds → slide together → say word → Whisper confirms
**14-day curriculum:** Phase 1 (CVC) → Phase 2 (blends/digraphs) → Phase 3 (decodable stories)
**Stack:** Next.js 16 + TypeScript + Tailwind 4 + Supabase + OpenAI Whisper
**Progress:** localStorage + optional Supabase sync
**Auth:** Supabase Auth with RLS

**Pending in code:** Pet care, audiobook, tracing, word-hunt, Stripe paywall, parent dashboard, service worker

---

## Business Strategy (from planning chats)

### Fastest Path to Revenue
The "online English school" chat concluded that **live Zoom teaching is the fastest money** — no app needed, just your wife teaching small groups with WhatsApp enrollment.

### App as Long-Term Play
The app (Track 1) was positioned as a product that can scale without wife's time, but it's a longer build. The recommendation was to get the live teaching generating income first, then build the app in parallel.

### Pricing Validated
- Parents already pay for English instruction (500-700+ ₪ for tutors)
- $7-10/month for app is in line with market (Reading Eggs ~$9.99/month)
- Monthly subscription preferred over one-time purchase

### Growth Loop
- Teacher referral: printable progress certificates + class coupon codes
- Parent loop: weekly skills report email + next steps
- Content loop: TikTok/IG Reels showing "blending fix in 10 minutes"

---

## Open Decisions

### 1. Which product are you building?
- (A) The 14-day blending app (current code) — global, self-service, ages 5-7
- (B) The WordPets English Club live teaching — Israeli market, wife-led, ages 6-12
- (C) Both — app supplements the live teaching, or they're independent products

### 2. Who is the real customer?
- Parents of kids who already speak English but can't read/write (your wife's niche)
- OR parents of any kid who can't blend (broader market, current app)

### 3. Should the curriculum be rebuilt?
- Current code: 14 days, 65 words, phonics blending only
- Dashboard mockup: 26 letters, 4 activities each
- Wife's teaching: ongoing program, reading + writing + comprehension
- These are three different curricula

### 4. What is your wife's actual involvement?
- Is she testing the app with real kids?
- Is she designing curriculum for the app or just for live teaching?
- Is she a co-founder or just consulting?

### 5. Has anyone tested this with children?
- The speech recognition (Whisper) needs real-world validation with 5-7 year olds
- The phoneme matching is set very lenient — is that the right call?
- No user testing data exists

---

## File Inventory

### Planning Docs (~/projects/wordpets/)
| File | Content | Size |
|------|---------|------|
| `i want to start a online english language school...` | Full business plan chat — live teaching, pricing, launch package, curriculum, WordPets English Club branding | 1.6MB |
| `write me a prompt for researching a new webapp...` | Market research — competitive analysis, AI features, pedagogy, UX guidelines, feature roadmap | 834KB |
| `you are a an expert business ideas researcher...` | Wedge analysis, MVP definition, blending bootcamp spec, Shark Tank critique | ~40KB |

### Project Assets (~/projects/blending-bootcamp/)
| File | Status |
|------|--------|
| `CLAUDE.md` | Current — architecture reference |
| `README.md` | Current — rewritten 2026-04-13 |
| `supabase/schema.sql` | Current — DB schema |
| `public/wordpets/logo.png` | Logo (cat, dog, guinea pig, bird, rabbit) |
| `public/wordpets/logo-alt.png` | Alt logo (different style) |
| `public/wordpets/dashboard-mockup.png` | Parent dashboard concept (26-letter model — doesn't match code) |
| `public/wordpets/lesson-loop.png` | 4-node lesson loop diagram |

### Codebase (~/projects/blending-bootcamp/src/)
29 TypeScript files, ~3,200 lines. Well-organized. Only implements Track 1 (blending app).
