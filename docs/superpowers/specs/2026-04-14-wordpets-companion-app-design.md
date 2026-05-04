# WordPets Companion App — Design Spec (Revised)

**Date:** 2026-04-14
**Revised:** 2026-04-14 (post courtroom deliberation — scope cut approved by Codex GPT-5.4)
**Status:** Approved
**Project:** ~/projects/wordpets

---

## Product Decision (Resolved)

This is a **companion app for wife's existing live teaching students**. The open decisions from PROJECT_NOTES.md were resolved on 2026-04-14:

- **Product:** Companion to wife's live teaching (not a standalone app, not a self-serve product)
- **Target:** Ages 6-8 for Phase 1 (wife's younger students who need phonics + early reading)
- **Goal:** Do wife's students practice more consistently with the app than without it?
- **Business:** Free Phase 1 (research lab). Revenue comes later via Phase 2 (bundled with teaching + teacher platform).

---

## Overview

WordPets is a companion practice app assigned by a teacher to students ages 6-8 for daily practice between live sessions. Kids complete phonics, spelling, and read-aloud activities to earn rewards for a virtual pet. The teacher sees who practiced and what they're struggling with.

### The Problem

English-speaking children living abroad (specifically Israel) speak and understand English fluently but can't read or write well. Their teacher assigns worksheets and tasks via WhatsApp between sessions — scattered, untrackable, easy to skip.

### The Promise

A practice app that kids actually open every day because their pet needs them — and that gives the teacher visibility into who's practicing.

### Success Metric

**After 4 weeks with wife's students: ≥60% of students complete practice 4+ days/week.**

Baseline: 0 days/week (no structured between-session practice currently). Measured by practice_sessions table. If this fails, pet mechanics or content need rework before expanding.

---

## Phase Roadmap

```
Phase 1a: MVP Companion        Phase 1b: Earn Expansion       Phase 2+: Future
(this spec)                    (if 1a validates)              (not this spec)

2-3 activities            ──→  More activities            ──→  Live platform
Basic pet (thin)               Pet room, outfits, evolution    Teacher SaaS
One age band (6-8)             Expand to 9-12                  Standalone B2C
Minimal teacher dashboard      Parent summaries, AI content    $9.99/month
```

**This spec covers Phase 1a only.**

---

## Users

### Teacher (Wife)
- Experienced English teacher, English-speaking Israeli children
- Currently assigns work via WhatsApp between live sessions
- Needs: see who practiced, set focus areas per student
- Must take <10 min/week of app management time
- Not super organized — app must be forgiving

### Student (Child, ages 6-8)
- Speaks English fluently, struggles with reading/writing
- Practice must feel like a game, not homework
- Attention is short — session must be 7-10 min max

### Parent
- Signs up via invite link from teacher
- Not a daily user — receives no in-app communications in Phase 1a

---

## Student Experience

### One Visual Mode (Ages 6-8)
- Warm cream background (#FFF8E1)
- Large buttons, emoji, playful language
- Pet is front-and-center (big, animated, talks to the child)
- Rewards are visual and immediate

### Daily Flow

1. Child opens app
2. Sees their pet + today's practice (2-3 activities, ~7-10 min)
3. Completes activities → earns coins
4. Coins feed/play with pet → pet shows happy mood
5. Streak tracking (visual, not punitive)

### Pet System (Thin — Phase 1a)

**What's in:**
- Child picks a pet on signup (cat, dog, guinea pig, bird, bunny)
- Names their pet
- Pet has mood/expressions that reflect practice consistency (happy when fed, sleepy when neglected)
- Simple animations: eating, playing, sleeping, celebrating
- Feed pet with coins earned from practice
- Pet reacts to correct answers during activities (bounces, smiles)

**What's NOT in (deferred to Phase 1b):**
- Pet room/environment decoration
- Pet outfits/accessories/customization
- Pet evolution/leveling
- Multiple pets / collecting
- Mini-games

**The investment goes into making the pet feel alive** — expressions, reactions, personality — not into inventory systems.

---

## Activity Types (Phase 1a: Three Only)

| Activity | Mechanic | Speech? |
|----------|----------|---------|
| **Phonics/Blending** | Tap phonemes → blend → say word into mic | Whisper transcription + fuzzy matching (existing code) |
| **Spelling** | Hear word → drag/type letters to spell it | No speech — instant validation, timed rounds |
| **Read Aloud** | Passage appears, child reads into mic | Whisper transcribes — **non-authoritative** (records but does not grade pass/fail) |

### Speech: Non-Authoritative

Whisper has NOT been validated with 6-8 year olds reading aloud. In Phase 1a:
- Child reads aloud, Whisper transcribes
- App records the transcription and audio
- App does NOT score pass/fail or fluency
- Teacher can optionally review recordings in student detail
- Speech becomes authoritative only after validation with real students

Read-aloud limited to **1 per daily session** to avoid teacher review overhead.

---

## Teacher Experience (Minimal)

### Dashboard
- Student list with: pet emoji, name, age, days practiced this week
- Inactive students (3+ days no practice) highlighted
- Top stats: total students, practiced today, inactive count

### Student Detail
- Toggle focus areas on/off: Phonics, Spelling, Read Aloud
- Set difficulty: Beginner / Intermediate / Advanced
- View practice history (dates, activities completed)
- Optionally review read-aloud transcriptions

### Student Management
- **Add students:** Generate invite link → send via WhatsApp
- **Tags:** Free-form tags for grouping (e.g. "Monday class", "private")
- **No content assignment, no content overrides, no parent summaries** in Phase 1a

### How It Works (Guided Autopilot)
Teacher sets focus areas + difficulty once per student. App auto-generates daily practice from focus areas using the starter content library. Teacher checks dashboard once or twice a week to see who's practicing.

---

## Content (Phase 1a: Manual Only)

### Starter Library (Ships with App)
Curated content for ages 6-8, organized by difficulty:
- Phonics word lists: CVC, CCVC, CVCC, digraphs (~60-80 words, reusing existing curriculum.ts + additions)
- Spelling word lists: same words used in phonics + Dolch sight words
- Read-aloud passages: 10-15 short decodable passages (40-80 words each)

This must be enough to run for 4+ weeks without the teacher adding anything.

### What's NOT in Phase 1a
- AI content generation
- Teacher content uploads
- Writing prompts / comprehension questions
- Stories for listening
- Content assignment overrides

---

## Onboarding

### Teacher
1. Sign up (email + password + name)
2. See empty dashboard → "Add your first student"
3. Generate invite link, send via WhatsApp

### Student (Parent Does This)
1. Parent opens invite link
2. Creates account (parent name, child name, child age)
3. Child picks a pet from 5 options
4. Names their pet
5. Brief intro: "Your pet needs you to practice every day!"
6. First practice session (default focus areas applied: Phonics + Spelling + Read Aloud)

---

## Technical Architecture

### Stack
- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Speech:** OpenAI Whisper API (existing, non-authoritative for read aloud)
- **TTS:** Browser Web Speech API (existing, for phoneme pronunciation)
- **Hosting:** Vercel + Supabase
- **PWA:** Manifest configured (service worker not required for Phase 1a)

### Database Schema

```sql
-- profiles (extends auth.users with role)
profiles (id uuid PK → auth.users, role text CHECK('teacher','parent'), name text)

-- students
students (id uuid PK, parent_id → auth.users, teacher_id → auth.users,
          name text, age int CHECK(3-18),
          pet_type text, pet_name text, pet_mood text DEFAULT 'happy',
          coins int DEFAULT 0)

-- tags + student_tags
tags (id uuid PK, teacher_id → auth.users, name text, UNIQUE(teacher_id, name))
student_tags (student_id → students, tag_id → tags, PK(student_id, tag_id))

-- focus_areas
focus_areas (id uuid PK, student_id → students,
             area text CHECK('phonics','spelling','read_aloud'),
             difficulty text CHECK('beginner','intermediate','advanced'),
             active bool DEFAULT true,
             UNIQUE(student_id, area))

-- invite_tokens
invite_tokens (id uuid PK, teacher_id → auth.users,
               token text UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
               student_name text, student_age int,
               used bool DEFAULT false, used_by → auth.users)

-- practice_sessions
practice_sessions (id uuid PK, student_id → students,
                   date date DEFAULT current_date,
                   duration_seconds int DEFAULT 0,
                   coins_earned int DEFAULT 0,
                   completed bool DEFAULT false)

-- activity_attempts (explicit, not jsonb blob)
activity_attempts (id uuid PK, session_id → practice_sessions,
                   activity_type text CHECK('phonics','spelling','read_aloud'),
                   content_ref text,  -- reference to content item
                   score int,         -- 0-100 for phonics/spelling, NULL for read_aloud
                   duration_seconds int,
                   transcript text,   -- Whisper transcription for read_aloud
                   audio_url text,    -- stored audio for teacher review
                   created_at timestamptz DEFAULT now())

-- content (starter library, seeded)
content (id uuid PK, type text CHECK('wordlist','passage'),
         title text, body text,
         age_min int, age_max int,
         difficulty text CHECK('beginner','intermediate','advanced'),
         metadata jsonb DEFAULT '{}',  -- type-specific structured data
         source text DEFAULT 'library' CHECK('library','teacher'))
```

All tables have RLS. Teachers see their students. Parents see their children. CHECK constraints prevent ambiguous records.

### No Phase 2 Abstractions
- Activity components are built for solo use only — no `mode` prop, no live-session wiring
- Clean boundaries and composable components, but no premature abstraction
- If Phase 2 happens, refactoring will be straightforward because components are small and focused

---

## What's NOT in Scope (Phase 1a)

- Ages 9-12 (deferred to Phase 1b)
- Pet room, evolution, outfits, mini-games (Phase 1b)
- AI content generation (Phase 1b)
- Teacher content uploads/overrides (Phase 1b)
- Parent summaries/communications (Phase 1b)
- Writing practice, comprehension, sight words, story listening activities (Phase 1b+)
- Live session platform (Phase 2)
- Stripe payments (Phase 2)
- App Store / Google Play (PWA only)
- Offline mode
- Multiple languages

---

## Phase 1b: Earned Expansion (Only If 1a Validates)

Build these ONLY after success metric is met (≥60% practice 4+ days/week for 4 weeks):

- Pet room decoration + outfits + evolution
- 3-4 mini-games (Pet Runner, Pet Painter, Pet Dress-Up, Pet Kitchen)
- Expand to ages 9-12 with second visual mode
- AI content generation
- Parent weekly summaries
- Additional activities: sight words, comprehension, writing
- Teacher content uploads
