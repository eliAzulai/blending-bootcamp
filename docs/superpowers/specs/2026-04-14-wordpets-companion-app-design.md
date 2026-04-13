# WordPets Companion App — Design Spec

**Date:** 2026-04-14
**Status:** Approved in brainstorming session
**Project:** ~/projects/blending-bootcamp

---

## Overview

WordPets is a companion practice app for English literacy students ages 6-12. Teachers assign it to their students for daily practice between live sessions. Kids complete reading, spelling, and writing activities to earn rewards for a virtual pet. The app auto-generates daily practice based on focus areas the teacher sets.

Phase 1 is the companion app. It feeds into Phase 2 (a MagicEars-style live teaching platform) and Phase 3 (a fully standalone B2C product). The companion app's activity components, pet system, content library, and student profiles are designed to be reused across all phases.

### The Problem

English-speaking children living abroad (specifically Israel) speak and understand English fluently but can't read or write well. Their needs differ from typical EFL students — they need literacy development, not basic vocabulary. Teachers like Eli's wife work with these kids but lack a structured digital practice tool. Current workflow: scattered PDFs, WhatsApp messages, and generic apps that don't match the curriculum.

### The Promise

A practice app that kids actually open every day because their pet needs them — and that gives the teacher visibility into who's practicing and what they're struggling with.

---

## Phase Roadmap

```
Phase 1: Companion App          Phase 2: WordPets Live           Phase 3: Standalone
(practice between sessions)     (the session itself)             (no teacher needed)

Teacher assigns practice  ──→   Teacher runs live session   ──→  AI runs everything
App delivers daily tasks        on custom platform               App + AI teacher
Pet rewards engagement          All content pre-built            Global B2C
Free (research lab)             Teacher just clicks through      $9.99/month
                                MagicEars model                  Reading Eggs competitor
                                Two revenue streams:
                                ├─ Bundled with teaching
                                └─ Platform for other teachers

        ╰──── companion to ─────╯
                                ╰──── evolves into ──────────────╯
```

**This spec covers Phase 1 only.** Phase 2 and 3 are documented for architectural context — the companion app must be built so its components (activities, pet system, content, profiles) can be reused in live sessions and standalone mode.

---

## Users

### Teacher (Primary: Eli's wife)
- Experienced English teacher, works with English-speaking Israeli children ages 6-12
- Has a mix of students: private and school, motivated and not, ages 6-12
- Currently assigns worksheets, reading, and tasks between sessions via WhatsApp
- Wants to curate specific content for students (this is a core strength)
- Not super organized — needs the app to be forgiving and low-friction
- Doesn't have time to micromanage the app daily

### Student (Child, ages 6-12)
- Speaks and understands English fluently
- Struggles with reading and/or writing
- Needs practice to feel like a game, not homework
- Attention and retention are the core challenges — apps get abandoned
- Two distinct groups: younger (6-8) and older (9-12) with different UX needs

### Parent
- Manages account and signup
- Receives weekly progress updates
- Wants to see their child is making progress
- Not a daily user of the app

---

## Student Experience

### Two Visual Modes

The app adapts its look based on the child's age:

**Ages 6-8 ("Little Readers"):**
- Warm cream background (#FFF8E1)
- Large buttons, lots of emoji
- Pet is front-and-center (big, animated, talks to the child)
- Playful language ("Read to Luna!", "Spell the sounds!")
- Rewards are visual and immediate (treats, toys, stars)

**Ages 9-12 ("Fluent Readers"):**
- Clean slate/cool tones
- Compact layout, stats visible
- Pet is a subtle icon (corner of screen, level indicator)
- Direct language ("Read Aloud — The Iron Giant Chapter 2")
- Streaks and personal records for motivation

### Daily Flow

1. Child opens app
2. Sees their pet + today's practice (2-3 activities, ~7-10 min total)
3. Completes activities → earns coins/treats
4. Uses rewards to: feed pet, play mini-games, buy pet items, decorate pet's room
5. Pet evolves over time based on consistency

### The Pet System

**Core mechanics:**
- Child picks a pet on signup (cat, dog, guinea pig, bird, bunny — matching logo animals)
- Pet has mood/hunger/happiness reflecting practice consistency
- Pet levels up over time — visual evolution (baby → grown → rare variant)
- Older kids (9-12) get cooler/rarer pets (dragon, wolf) as aspirational unlocks

**Pet's Room:**
- 2D environment the child decorates
- Starts empty, earn furniture/decorations/wallpaper through practice
- Tamagotchi meets Toca Boca aesthetic, not Minecraft

**Pet customization:**
- Outfits, accessories, colors earned through practice
- Seasonal/limited items for engagement hooks

**Multiple pets:**
- Long-term hook: complete enough practice → unlock a second pet
- Collect all 5 logo animals + rare/special pets

### Mini-Games (Reward, Not Learning)

Quick, simple games where the child's pet is the character. These are the reward currency — complete practice → unlock game time. One-screen, one-mechanic games. Examples:

- Pet Runner — endless runner, pet dodges obstacles
- Pet Painter — color-by-number scenes with your pet
- Pet Dress-Up — drag outfits/accessories onto pet
- Pet Kitchen — "cook" a meal for pet, tap ingredients
- Pet Race — tap-to-run race against CPU pet
- Pet Builder — block-stacking, build tower/house for pet
- Pet Dance — rhythm game, tap along to music
- Pet Bath — drag soap/water, silly animations
- Pet Hide & Seek — find pet hidden behind objects

**Drip-feed strategy:** Launch with 3-4 games. Add new ones every few weeks as engagement events.

**Tech:** Simple Canvas or DOM animations. No game engine needed. A few hundred lines each.

---

## Activity Types

All activities are interactive and game-like — not worksheets. Each earns pet rewards on completion.

| Activity | Ages | Mechanic | AI Involvement |
|----------|------|----------|----------------|
| **Phonics/Blending** | 6-8 | Tap phonemes → blend → say word into mic | Whisper transcription + fuzzy matching (existing) |
| **Read Aloud** | 6-12 | Passage appears, child reads into mic | Whisper tracks fluency (wpm, accuracy) |
| **Spelling** | 6-12 | Hear word → type or drag letters to spell | Instant validation, timed rounds |
| **Sight Words** | 6-9 | Flashcard-style speed recognition | Timed, beat-your-record |
| **Reading Comprehension** | 8-12 | Read passage → answer questions | AI-generated questions, auto-scored |
| **Writing Practice** | 8-12 | Prompted writing tasks | AI feedback on spelling/grammar |
| **Story Listening** | 6-12 | Audiobook with highlighted follow-along text | TTS or pre-recorded audio |

**Reuse note for Phase 2:** These same activity components must work in a live session context — teacher triggers them, students respond in real-time, teacher sees results. Design them as standalone components with a mode prop (solo vs. live).

---

## Teacher Experience

### Dashboard

**Top-level view:**
- Student count, who practiced today, who's inactive (3+ days)
- Student list with: pet avatar, name, age, focus level, weekly activity count, key metric
- Inactive students highlighted in red/warning

**Student detail view (tap a student):**
- Toggle focus areas on/off: Phonics, Spelling, Read Aloud, Sight Words, Comprehension, Writing, Story Listening
- Set difficulty: Beginner / Intermediate / Advanced
- Assign specific content: pick a passage, word list, or writing prompt from the library or upload her own
- View practice history and performance trends

### Student Management

- **Add students:** Tap "Add Student" → generates invite link → send via WhatsApp
- **Tags:** Free-form tags for grouping (e.g. "Monday class", "private", "grade 4"). Not rigid groups — she tags as she goes. Can assign content to a tag (all students with that tag get it).
- **No class codes** — invite links only, her classes are small

### Content Assignment (Guided Autopilot)

Default behavior: Teacher sets focus areas + difficulty → app auto-generates daily practice plan for each student using the content library and AI generation.

Override: Teacher can assign specific content to a student or tag group at any time. Assigned content takes priority over auto-generated practice for that day.

### Parent Updates

- Auto-generated weekly summary per student
- Example: "Maya practiced 5 out of 5 days this week! She read 'The Lost Kite' at 42 words per minute (up from 35 last week). Spelling accuracy is 79% — we're focusing on 'ea' and 'oo' patterns next week."
- Teacher can review, edit, and send (or auto-send if she trusts it)
- Delivery via WhatsApp link or email

---

## Content Pipeline

Three sources, layered by effort:

### 1. Starter Library (Ships with App)
Curated content organized by age and difficulty:
- Reading passages (20-30 per level to start)
- Spelling word lists (Dolch/Fry sight words + phonics patterns)
- Writing prompts (age-appropriate, engaging topics)
- Comprehension questions (pre-written for starter passages)
- Stories for listening (with audio)

This must be enough to run for months without the teacher adding anything.

### 2. AI Generation (On Demand)
Teacher or app can generate content from parameters:
- "Reading passage, age 8, topic: animals, focus: ea/oo vowel patterns"
- "Spelling list, 15 words, CCVC blends, grade 3 level"
- "Writing prompt, age 10, narrative, about an adventure"
- AI generates → teacher reviews if she wants → content goes into student's practice

The app itself uses AI generation for daily practice when the starter library has been exhausted or when specific focus areas need targeted content.

### 3. Teacher's Own Materials (Optional)
- Upload passages (paste text or upload file)
- Create word lists
- Write custom prompts
- These are always available but never required

---

## Onboarding

### Teacher Onboarding
1. Teacher signs up (email + password)
2. Brief setup: name, teaching context (private/school/mixed)
3. Dashboard is empty — "Add your first student" prompt
4. Add students via invite links

### Student Onboarding
1. Parent receives invite link via WhatsApp
2. Parent opens link → creates account (parent name, child name, child age)
3. Child picks a pet (choose from 5 starter animals)
4. Names their pet
5. Short intro: pet needs daily feeding through practice
6. First practice session begins (teacher has already set focus areas, or defaults apply)

### Default Focus Areas (if teacher hasn't set them yet)
- Ages 6-8: Phonics + Sight Words + Story Listening
- Ages 9-12: Read Aloud + Spelling + Comprehension

---

## Technical Architecture

### Stack (Extending Existing)
- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Speech:** OpenAI Whisper API (existing, for read aloud + phonics)
- **TTS:** Browser Web Speech API (existing) + potential upgrade to OpenAI TTS for story listening
- **AI Content:** Claude API or OpenAI for passage/prompt generation
- **Hosting:** Vercel (frontend) + Supabase (backend)
- **PWA:** Manifest configured, service worker needed for offline support

### New Database Tables (Extending Existing Schema)
```
teachers
  - id, email, name, created_at

students (replaces/extends learners)
  - id, parent_id (FK auth.users), teacher_id (FK teachers), name, age, pet_type, pet_name, pet_level, created_at

tags
  - id, teacher_id, name

student_tags
  - student_id, tag_id

focus_areas
  - id, student_id, area (enum), difficulty (enum), active (bool)

assignments
  - id, teacher_id, student_id (nullable), tag_id (nullable), content_id, due_date

content
  - id, type (passage/wordlist/prompt/story), title, body, age_min, age_max, difficulty, source (library/ai/teacher), teacher_id (nullable), created_at

practice_sessions
  - id, student_id, date, activities (jsonb), duration_seconds, coins_earned, completed

pet_inventory
  - id, student_id, item_type (food/toy/furniture/outfit), item_id, earned_at

progress (existing, extended)
  - add: wpm, accuracy, spelling_score, comprehension_score per session
```

### Key Design Decisions for Phase 2 Reuse

1. **Activity components are standalone:** Each activity (ReadAloud, Spelling, Comprehension, etc.) is a React component that accepts content + mode (solo/live) + callbacks. In solo mode, it runs independently. In live mode, the teacher controls progression and sees responses in real-time.

2. **Content is decoupled from delivery:** The content library, AI generation, and teacher uploads all produce the same content format. Whether content is delivered in solo practice or a live session doesn't matter — it's the same data.

3. **Pet system is a separate module:** Pet state, inventory, and mini-games are independent of the learning activities. Activities emit "reward" events; the pet system consumes them. This means the pet works in both solo and live contexts.

4. **Real-time capability:** Use Supabase Realtime (already available) for live session features in Phase 2. No additional infrastructure needed.

---

## Monetization Roadmap

### Phase 1: Free (Now)
- No monetization
- Wife uses with her existing students
- Value: testing data, curriculum validation, product feedback
- Cost: ~$5-10/month (Whisper API for her student volume)

### Phase 2: Two Revenue Streams (6-12 months)
**Stream A — Bundled with live teaching:**
- WordPets Live platform + companion app included in teaching fee
- Justifies 380-420 ₪/month pricing

**Stream B — Platform for other teachers:**
- Other English teachers sign up, get their own dashboard
- Free tier: 5 students, basic activities
- Paid tier: $15-30/month, unlimited students, AI content generation, analytics

### Phase 3: Standalone B2C (12-24 months)
- Direct to parents, no teacher required
- AI-driven placement + personalized practice plan
- $9.99/month or $79/year
- Free: first week + basic pet
- Paid: full content, pet games, room customization, rare pets
- Global market: English-speaking families abroad, EFL learners

---

## What's NOT in Scope (Phase 1)

- Live session platform (Phase 2)
- AI teacher / automated lessons (Phase 2-3)
- Multiplayer / social features
- App Store / Google Play (PWA only)
- Stripe payments
- Multiple languages / localization
- Parent-facing app (parents get WhatsApp updates, not an app)
- Offline mode (nice-to-have, not launch requirement)

---

## Success Metrics (Phase 1)

After 4 weeks with wife's students:

| Metric | Target |
|--------|--------|
| Daily practice completion | ≥60% of students practice 4+ days/week |
| Session duration | 7-10 minutes average |
| Pet engagement | Kids mention their pet unprompted |
| Teacher effort | Wife spends <10 min/week managing the app |
| Speech recognition | Whisper works reliably with 6-12 year olds |
| Parent feedback | "My child actually wants to practice" |
| Content adequacy | Starter library lasts 4+ weeks without running out |

If these fail → content, pacing, or pet mechanics need rework before Phase 2.

---

## Open Items

1. **Starter library content** — needs to be created or curated. Wife should review for appropriateness and level accuracy.
2. **Pet art** — need illustrated pet sprites, evolution stages, items, room assets. Style should match existing logo (cute, warm, clean lines).
3. **Mini-game scope for launch** — pick 3-4 from the list, build the rest post-launch.
4. **Read Aloud scoring** — Whisper gives transcription, but fluency scoring (wpm, accuracy) needs a comparison algorithm. How strict?
5. **Writing feedback** — what level of AI feedback is appropriate for a 7-year-old vs a 12-year-old?
6. **Existing codebase** — the current blending-bootcamp code has phonics/blending components that can be reused. The home page, auth, and progress tracking need significant rework to support the new multi-student, teacher-driven model. The existing 14-day curriculum (`src/data/curriculum.ts`) becomes one content source in the starter library — its phonics lessons slot into the Phonics/Blending activity type for younger students. The current single-user flow (home page timeline → lesson → celebration) is replaced by the pet-driven daily practice flow.
