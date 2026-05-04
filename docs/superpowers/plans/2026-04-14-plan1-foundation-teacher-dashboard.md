# Plan 1: Foundation + Teacher Dashboard (Revised Post-Courtroom)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the database schema, role-based auth (teacher/parent), invite-link onboarding with pet selection, and a minimal teacher dashboard — the backbone that activities and pet system plug into.

**Architecture:** Two Supabase roles (teacher, parent). Teachers sign up directly, parents join via invite link. Teacher dashboard shows student list + focus area controls. Schema uses explicit tables (not jsonb blobs) with CHECK constraints. No Phase 2 abstractions.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Supabase (Auth + PostgreSQL + RLS), `@supabase/ssr`

**Spec:** `docs/superpowers/specs/2026-04-14-wordpets-companion-app-design.md` (revised post-courtroom)

**Scope:** Ages 6-8 only. 3 focus areas (phonics, spelling, read_aloud). Minimal teacher surface. No content assignment, no parent summaries, no Phase 2 abstractions.

---

## File Structure

### New files
```
supabase/schema-v2.sql                          — Full schema with RLS
src/types/database.ts                           — TypeScript types matching tables
src/lib/supabase/admin.ts                       — Server helpers (profile lookup)
src/app/teacher/layout.tsx                      — Teacher layout + auth guard + nav
src/app/teacher/page.tsx                        — Dashboard (student list + stats)
src/app/teacher/students/[id]/page.tsx          — Student detail (focus areas, tags, history)
src/app/teacher/add-student/page.tsx            — Generate invite link
src/app/join/[token]/page.tsx                   — Parent signup via invite
src/app/join/[token]/pet-select/page.tsx        — Child picks + names pet
src/app/join/success/page.tsx                   — Success confirmation
src/components/teacher/StatsBar.tsx              — Top stats bar
src/components/teacher/StudentCard.tsx           — Student row in list
src/components/teacher/FocusAreaToggle.tsx       — Toggle phonics/spelling/read_aloud
src/components/teacher/TagManager.tsx            — Add/remove tags
```

### Modified files
```
src/components/AuthProvider.tsx                 — Add profile + role to context
src/app/signup/page.tsx                         — Becomes teacher signup
src/app/login/page.tsx                          — Role-aware redirect
```

---

## Task 1: Database Schema

**Files:** Create `supabase/schema-v2.sql`

- [ ] **Step 1: Write the schema**

```sql
-- supabase/schema-v2.sql
-- WordPets Phase 1a schema. Run in Supabase SQL Editor.

-- Clean up old tables
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists progress cascade;
drop table if exists learners cascade;

-- PROFILES
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('teacher', 'parent')),
  name text not null,
  created_at timestamptz default now() not null
);
alter table profiles enable row level security;
create policy "Users read own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

-- STUDENTS
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references auth.users(id) on delete cascade not null,
  teacher_id uuid references auth.users(id) on delete set null,
  name text not null,
  age integer not null check (age >= 3 and age <= 18),
  pet_type text not null default 'cat',
  pet_name text not null default 'My Pet',
  pet_mood text not null default 'happy',
  coins integer not null default 0,
  created_at timestamptz default now() not null
);
alter table students enable row level security;
create policy "Parents manage own students" on students for all
  using (auth.uid() = parent_id) with check (auth.uid() = parent_id);
create policy "Teachers read their students" on students for select
  using (auth.uid() = teacher_id);
create policy "Teachers update their students" on students for update
  using (auth.uid() = teacher_id);

-- TAGS
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now() not null,
  unique(teacher_id, name)
);
alter table tags enable row level security;
create policy "Teachers manage own tags" on tags for all
  using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

-- STUDENT_TAGS
create table if not exists student_tags (
  student_id uuid references students(id) on delete cascade not null,
  tag_id uuid references tags(id) on delete cascade not null,
  primary key (student_id, tag_id)
);
alter table student_tags enable row level security;
create policy "Teachers manage student tags" on student_tags for all
  using (exists (select 1 from students s where s.id = student_id and s.teacher_id = auth.uid()));

-- FOCUS AREAS (3 types only for Phase 1a)
create table if not exists focus_areas (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade not null,
  area text not null check (area in ('phonics', 'spelling', 'read_aloud')),
  difficulty text not null default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  active boolean not null default true,
  unique(student_id, area)
);
alter table focus_areas enable row level security;
create policy "Teachers manage focus areas" on focus_areas for all
  using (exists (select 1 from students s where s.id = student_id and s.teacher_id = auth.uid()));
create policy "Parents read child focus areas" on focus_areas for select
  using (exists (select 1 from students s where s.id = student_id and s.parent_id = auth.uid()));

-- INVITE TOKENS
create table if not exists invite_tokens (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references auth.users(id) on delete cascade not null,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  student_name text,
  student_age integer,
  used boolean not null default false,
  used_by uuid references auth.users(id),
  created_at timestamptz default now() not null
);
alter table invite_tokens enable row level security;
create policy "Teachers manage own invites" on invite_tokens for all
  using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create policy "Anyone reads unused invites" on invite_tokens for select
  using (used = false);

-- PRACTICE SESSIONS
create table if not exists practice_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade not null,
  date date not null default current_date,
  duration_seconds integer not null default 0,
  coins_earned integer not null default 0,
  completed boolean not null default false,
  created_at timestamptz default now() not null
);
alter table practice_sessions enable row level security;
create policy "Parents read child sessions" on practice_sessions for select
  using (exists (select 1 from students s where s.id = student_id and s.parent_id = auth.uid()));
create policy "Teachers read student sessions" on practice_sessions for select
  using (exists (select 1 from students s where s.id = student_id and s.teacher_id = auth.uid()));

-- ACTIVITY ATTEMPTS (explicit, not jsonb)
create table if not exists activity_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references practice_sessions(id) on delete cascade not null,
  activity_type text not null check (activity_type in ('phonics', 'spelling', 'read_aloud')),
  content_ref text,
  score integer check (score >= 0 and score <= 100),
  duration_seconds integer not null default 0,
  transcript text,
  audio_url text,
  created_at timestamptz default now() not null
);
alter table activity_attempts enable row level security;
create policy "Teachers read student attempts" on activity_attempts for select
  using (exists (
    select 1 from practice_sessions ps
    join students s on s.id = ps.student_id
    where ps.id = session_id and s.teacher_id = auth.uid()
  ));

-- CONTENT (seeded starter library)
create table if not exists content (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('wordlist', 'passage')),
  title text not null,
  body text not null,
  age_min integer not null default 6,
  age_max integer not null default 8,
  difficulty text not null default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  metadata jsonb not null default '{}'::jsonb,
  source text not null default 'library' check (source in ('library', 'teacher')),
  created_at timestamptz default now() not null
);
alter table content enable row level security;
create policy "Anyone reads library content" on content for select
  using (source = 'library');
create policy "Teachers read own content" on content for select
  using (source = 'teacher');
```

- [ ] **Step 2: Run in Supabase SQL Editor**

Expected: All tables created, no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/schema-v2.sql
git commit -m "feat: add v2 schema — profiles, students, tags, focus areas, invites, attempts, content"
```

---

## Task 2: TypeScript Types

**Files:** Create `src/types/database.ts`

- [ ] **Step 1: Write types**

```typescript
// src/types/database.ts

export type Role = "teacher" | "parent";

export interface Profile {
  id: string;
  role: Role;
  name: string;
  created_at: string;
}

export type PetType = "cat" | "dog" | "guinea_pig" | "bird" | "bunny";
export type PetMood = "happy" | "hungry" | "sleepy" | "excited";

export interface Student {
  id: string;
  parent_id: string;
  teacher_id: string | null;
  name: string;
  age: number;
  pet_type: PetType;
  pet_name: string;
  pet_mood: PetMood;
  coins: number;
  created_at: string;
}

export interface Tag {
  id: string;
  teacher_id: string;
  name: string;
  created_at: string;
}

export type FocusAreaType = "phonics" | "spelling" | "read_aloud";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface FocusArea {
  id: string;
  student_id: string;
  area: FocusAreaType;
  difficulty: DifficultyLevel;
  active: boolean;
}

export interface InviteToken {
  id: string;
  teacher_id: string;
  token: string;
  student_name: string | null;
  student_age: number | null;
  used: boolean;
  used_by: string | null;
  created_at: string;
}

export interface PracticeSession {
  id: string;
  student_id: string;
  date: string;
  duration_seconds: number;
  coins_earned: number;
  completed: boolean;
  created_at: string;
}

export interface ActivityAttempt {
  id: string;
  session_id: string;
  activity_type: FocusAreaType;
  content_ref: string | null;
  score: number | null;
  duration_seconds: number;
  transcript: string | null;
  audio_url: string | null;
  created_at: string;
}

export const ALL_FOCUS_AREAS: FocusAreaType[] = ["phonics", "spelling", "read_aloud"];

export const DEFAULT_FOCUS_AREAS: FocusAreaType[] = ["phonics", "spelling", "read_aloud"];
```

- [ ] **Step 2: Commit**

```bash
git add src/types/database.ts
git commit -m "feat: add TypeScript types for v2 schema"
```

---

## Task 3: Auth Provider + Role Awareness

**Files:** Create `src/lib/supabase/admin.ts`, Modify `src/components/AuthProvider.tsx`

- [ ] **Step 1: Create admin helpers**

```typescript
// src/lib/supabase/admin.ts
import { createClient } from "./client";
import type { Profile } from "@/types/database";

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data as Profile | null;
}
```

- [ ] **Step 2: Update AuthProvider** — replace entire file with role-aware version (adds `profile`, `role`, `refreshProfile` to context). See previous Plan 1 Task 3 Step 2 for full code.

- [ ] **Step 3: Verify build** — `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/admin.ts src/components/AuthProvider.tsx
git commit -m "feat: role-aware auth provider with profile loading"
```

---

## Task 4: Teacher Signup + Login Redirect

**Files:** Modify `src/app/signup/page.tsx`, Modify `src/app/login/page.tsx`

- [ ] **Step 1: Rewrite signup as teacher signup** — adds name field, creates profile with role='teacher', redirects to /teacher. See previous Plan 1 Task 4 Step 1 for full code.

- [ ] **Step 2: Update login redirect** — after login, check profile role and redirect to /teacher or /student.

- [ ] **Step 3: Verify build** — `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/app/signup/page.tsx src/app/login/page.tsx
git commit -m "feat: teacher signup with profile, role-aware login redirect"
```

---

## Task 5: Teacher Layout + Dashboard + Components

**Files:** Create `src/app/teacher/layout.tsx`, `src/app/teacher/page.tsx`, `src/components/teacher/StatsBar.tsx`, `src/components/teacher/StudentCard.tsx`

- [ ] **Step 1: Create teacher layout** with auth guard + nav (Students, + Add Student, Sign Out). See previous Plan 1 Task 5 for full code.

- [ ] **Step 2: Create StatsBar** — shows total students, practiced today, inactive 3+ days. See previous Plan 1 Task 6 for full code.

- [ ] **Step 3: Create StudentCard** — shows pet emoji, name, age, tags, weekly practice count, inactive warning. See previous Plan 1 Task 7 for full code.

- [ ] **Step 4: Create dashboard page** — loads students with tags and sessions, renders StatsBar + StudentCard list, empty state with "Add Student" CTA. See previous Plan 1 Task 8 for full code.

- [ ] **Step 5: Verify build** — `npm run build`

- [ ] **Step 6: Commit**

```bash
git add src/app/teacher/ src/components/teacher/
git commit -m "feat: teacher dashboard with student list, stats bar, student cards"
```

---

## Task 6: Add Student + Invite Link

**Files:** Create `src/app/teacher/add-student/page.tsx`

- [ ] **Step 1: Create add-student page** — form with optional student name/age, generates invite token, shows copyable link. See previous Plan 1 Task 9 for full code.

- [ ] **Step 2: Verify build** — `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/teacher/add-student/
git commit -m "feat: invite link generation for adding students"
```

---

## Task 7: Parent Join Flow + Pet Selection

**Files:** Create `src/app/join/[token]/page.tsx`, `src/app/join/[token]/pet-select/page.tsx`, `src/app/join/success/page.tsx`

- [ ] **Step 1: Create join page** — validates token, parent signup form (name, email, password, child name, child age), creates parent profile + student record linked to teacher, marks invite used. See previous Plan 1 Task 10 Step 1 for full code.

- [ ] **Step 2: Create pet-select page** — 5 pet options (cat, dog, guinea pig, bird, bunny) with emoji, name input, saves pet choice + creates default focus areas (all 3 active at beginner). See previous Plan 1 Task 10 Step 2 for full code.

- [ ] **Step 3: Create success page** — simple confirmation. See previous Plan 1 Task 10 Step 3 for full code.

- [ ] **Step 4: Verify build** — `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/app/join/
git commit -m "feat: parent invite join flow with pet selection"
```

---

## Task 8: Student Detail + Focus Areas + Tags

**Files:** Create `src/components/teacher/FocusAreaToggle.tsx`, `src/components/teacher/TagManager.tsx`, `src/app/teacher/students/[id]/page.tsx`

- [ ] **Step 1: Create FocusAreaToggle** — 3 toggle buttons (Phonics, Spelling, Read Aloud) + difficulty selector per active area. See previous Plan 1 Task 11 for full code (simplified to 3 areas instead of 7).

- [ ] **Step 2: Create TagManager** — current tags with remove, add existing tag, create new tag. See previous Plan 1 Task 12 for full code.

- [ ] **Step 3: Create student detail page** — header with pet emoji + name + age, TagManager, FocusAreaToggle, practice history placeholder. See previous Plan 1 Task 13 for full code.

- [ ] **Step 4: Verify build** — `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/components/teacher/FocusAreaToggle.tsx src/components/teacher/TagManager.tsx src/app/teacher/students/
git commit -m "feat: student detail with focus area toggles and tag management"
```

---

## Task 9: End-to-End Smoke Test

- [ ] **Step 1:** Start dev server — `npm run dev`
- [ ] **Step 2:** Test teacher signup at `/signup` → should redirect to `/teacher` with empty dashboard
- [ ] **Step 3:** Generate invite link at `/teacher/add-student`
- [ ] **Step 4:** Open invite link in incognito → parent signup → pet selection → success
- [ ] **Step 5:** Refresh teacher dashboard → student appears with pet emoji and name
- [ ] **Step 6:** Click student → toggle focus areas, add tag → verify persistence on reload
- [ ] **Step 7:** Commit any fixes

```bash
git add -A
git commit -m "fix: smoke test fixes for teacher dashboard flow"
```

---

## Summary

**9 tasks, ~8 commits.** After this plan:

- ✅ Schema with explicit tables, CHECK constraints, RLS
- ✅ Teacher signup + role-aware auth
- ✅ Invite link → parent join → pet selection
- ✅ Teacher dashboard (student list, stats, focus areas, tags)
- ✅ Default focus areas set on student creation
- ✅ No Phase 2 abstractions, no over-engineering

**Next:** Plan 2 builds the 3 activity components (phonics, spelling, read aloud), the basic pet, the daily practice flow, and seeds the starter content library.
