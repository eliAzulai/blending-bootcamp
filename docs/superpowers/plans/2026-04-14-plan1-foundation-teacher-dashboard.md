# Plan 1: Foundation + Teacher Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the database schema, role-based auth (teacher/parent/student), invite-link onboarding, and teacher dashboard — the backbone that Plans 2 and 3 plug into.

**Architecture:** Three Supabase roles (teacher, parent, student) with RLS. Teachers sign up directly, parents join via invite link. The existing single-user auth flow is replaced with a role-aware system. The teacher dashboard is a new `/teacher` route group with student management, tags, and focus area controls.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Supabase (Auth + PostgreSQL + RLS), `@supabase/ssr`

**Spec:** `docs/superpowers/specs/2026-04-14-wordpets-companion-app-design.md`

**Existing code to keep:** `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`, `src/components/AuthProvider.tsx` (will be modified), `src/app/auth/callback/route.ts`, `src/app/layout.tsx`

**Existing code to remove later (not in this plan):** `src/app/page.tsx` (14-day timeline), `src/app/lesson/`, `src/components/BlendingExercise.tsx`, `src/components/LessonScreen.tsx`, `src/components/CelebrationScreen.tsx`, `src/lib/progress.ts` — these are the old single-user lesson flow. They stay in the codebase during Plan 1 but are not linked to the new routes.

---

## File Structure

### New files
```
supabase/schema-v2.sql                          — New schema (teachers, students, tags, focus_areas, etc.)
src/types/database.ts                           — TypeScript types matching Supabase tables
src/lib/supabase/admin.ts                       — Server-side admin helpers (create invite, lookup role)
src/app/teacher/layout.tsx                      — Teacher route group layout (nav, auth guard)
src/app/teacher/page.tsx                        — Teacher dashboard (student list, stats)
src/app/teacher/students/[id]/page.tsx          — Student detail (focus areas, history)
src/app/teacher/add-student/page.tsx            — Generate invite link
src/app/teacher/content/page.tsx                — Content library browser (placeholder for Plan 2)
src/app/join/[token]/page.tsx                   — Parent invite landing (signup + link to teacher)
src/app/join/[token]/pet-select/page.tsx        — Child picks pet after parent signs up
src/components/teacher/StudentCard.tsx           — Student row in dashboard list
src/components/teacher/FocusAreaToggle.tsx        — Toggle focus areas for a student
src/components/teacher/TagManager.tsx             — Add/remove tags on students
src/components/teacher/StatsBar.tsx               — Top stats (total students, active today, inactive)
```

### Modified files
```
src/components/AuthProvider.tsx                 — Add role field (teacher/parent) to context
src/app/signup/page.tsx                         — Becomes teacher signup (role=teacher)
src/app/login/page.tsx                          — Role-aware redirect after login
src/app/layout.tsx                              — No changes to structure, just ensure AuthProvider works
```

---

## Task 1: Database Schema v2

**Files:**
- Create: `supabase/schema-v2.sql`

This SQL replaces the old schema. Run it in Supabase SQL Editor. The old `learners` and `progress` tables are dropped and replaced.

- [ ] **Step 1: Write the schema SQL**

```sql
-- supabase/schema-v2.sql
-- WordPets Companion App schema
-- Run in Supabase SQL Editor (replaces schema.sql)

-- Clean up old tables
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists progress cascade;
drop table if exists learners cascade;

-- ============================================================
-- PROFILES (extends auth.users with role)
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('teacher', 'parent')),
  name text not null,
  created_at timestamptz default now() not null
);

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Insert profile on signup (called from app, not trigger)

-- ============================================================
-- STUDENTS
-- ============================================================
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references auth.users(id) on delete cascade not null,
  teacher_id uuid references auth.users(id) on delete set null,
  name text not null,
  age integer not null check (age >= 3 and age <= 18),
  pet_type text not null default 'cat',
  pet_name text not null default 'My Pet',
  pet_level integer not null default 1,
  pet_xp integer not null default 0,
  coins integer not null default 0,
  created_at timestamptz default now() not null
);

alter table students enable row level security;

create policy "Parents manage own students"
  on students for all
  using (auth.uid() = parent_id)
  with check (auth.uid() = parent_id);

create policy "Teachers read their students"
  on students for select
  using (auth.uid() = teacher_id);

create policy "Teachers update their students"
  on students for update
  using (auth.uid() = teacher_id);

-- ============================================================
-- TAGS
-- ============================================================
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now() not null,
  unique(teacher_id, name)
);

alter table tags enable row level security;

create policy "Teachers manage own tags"
  on tags for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- ============================================================
-- STUDENT_TAGS (join table)
-- ============================================================
create table if not exists student_tags (
  student_id uuid references students(id) on delete cascade not null,
  tag_id uuid references tags(id) on delete cascade not null,
  primary key (student_id, tag_id)
);

alter table student_tags enable row level security;

create policy "Teachers manage student tags"
  on student_tags for all
  using (
    exists (
      select 1 from students s
      where s.id = student_id and s.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- FOCUS AREAS
-- ============================================================
create type focus_area_type as enum (
  'phonics', 'read_aloud', 'spelling', 'sight_words',
  'comprehension', 'writing', 'story_listening'
);

create type difficulty_level as enum ('beginner', 'intermediate', 'advanced');

create table if not exists focus_areas (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade not null,
  area focus_area_type not null,
  difficulty difficulty_level not null default 'beginner',
  active boolean not null default true,
  unique(student_id, area)
);

alter table focus_areas enable row level security;

create policy "Teachers manage focus areas"
  on focus_areas for all
  using (
    exists (
      select 1 from students s
      where s.id = student_id and s.teacher_id = auth.uid()
    )
  );

create policy "Parents read own child focus areas"
  on focus_areas for select
  using (
    exists (
      select 1 from students s
      where s.id = student_id and s.parent_id = auth.uid()
    )
  );

-- ============================================================
-- INVITE TOKENS
-- ============================================================
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

create policy "Teachers manage own invites"
  on invite_tokens for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create policy "Anyone can read unused invites by token"
  on invite_tokens for select
  using (used = false);

-- ============================================================
-- PRACTICE SESSIONS (for Plan 2+, created now for schema stability)
-- ============================================================
create table if not exists practice_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade not null,
  date date not null default current_date,
  activities jsonb not null default '[]'::jsonb,
  duration_seconds integer not null default 0,
  coins_earned integer not null default 0,
  completed boolean not null default false,
  created_at timestamptz default now() not null
);

alter table practice_sessions enable row level security;

create policy "Parents read own child sessions"
  on practice_sessions for select
  using (
    exists (
      select 1 from students s
      where s.id = student_id and s.parent_id = auth.uid()
    )
  );

create policy "Teachers read their student sessions"
  on practice_sessions for select
  using (
    exists (
      select 1 from students s
      where s.id = student_id and s.teacher_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Run in Supabase SQL Editor**

Go to Supabase dashboard → SQL Editor → paste and run `supabase/schema-v2.sql`.
Expected: All tables created, no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/schema-v2.sql
git commit -m "feat: add v2 schema with teachers, students, tags, focus areas, invites"
```

---

## Task 2: TypeScript Database Types

**Files:**
- Create: `src/types/database.ts`

These types mirror the Supabase tables and are used throughout the app.

- [ ] **Step 1: Write the types**

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

export interface Student {
  id: string;
  parent_id: string;
  teacher_id: string | null;
  name: string;
  age: number;
  pet_type: PetType;
  pet_name: string;
  pet_level: number;
  pet_xp: number;
  coins: number;
  created_at: string;
}

export interface Tag {
  id: string;
  teacher_id: string;
  name: string;
  created_at: string;
}

export type FocusAreaType =
  | "phonics"
  | "read_aloud"
  | "spelling"
  | "sight_words"
  | "comprehension"
  | "writing"
  | "story_listening";

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
  activities: Record<string, unknown>[];
  duration_seconds: number;
  coins_earned: number;
  completed: boolean;
  created_at: string;
}

/** Student with joined data for teacher dashboard */
export interface StudentWithDetails extends Student {
  focus_areas: FocusArea[];
  tags: Tag[];
  recent_sessions: PracticeSession[];
}

/** Default focus areas by age group */
export const DEFAULT_FOCUS_AREAS: Record<string, FocusAreaType[]> = {
  young: ["phonics", "sight_words", "story_listening"],   // ages 6-8
  older: ["read_aloud", "spelling", "comprehension"],     // ages 9-12
};

export function getDefaultFocusAreas(age: number): FocusAreaType[] {
  return age <= 8 ? DEFAULT_FOCUS_AREAS.young : DEFAULT_FOCUS_AREAS.older;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/database.ts
git commit -m "feat: add TypeScript types for v2 database schema"
```

---

## Task 3: Auth Provider — Add Role Awareness

**Files:**
- Modify: `src/components/AuthProvider.tsx`
- Create: `src/lib/supabase/admin.ts`

The auth provider needs to know the user's role (teacher or parent) and expose it in context.

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

export async function createProfile(role: "teacher" | "parent", name: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: user.id, role, name })
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}
```

- [ ] **Step 2: Update AuthProvider with role**

Replace the entire contents of `src/components/AuthProvider.tsx`:

```typescript
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient, supabaseIsConfigured } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile, Role } from "@/types/database";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    if (!supabaseIsConfigured()) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data as Profile | null);
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  useEffect(() => {
    if (!supabaseIsConfigured()) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    async function init() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) await fetchProfile(data.user.id);
      setLoading(false);
    }
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        await fetchProfile(newUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (!supabaseIsConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role ?? null,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds (existing pages still compile).

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/admin.ts src/components/AuthProvider.tsx
git commit -m "feat: add role-aware auth provider with profile loading"
```

---

## Task 4: Teacher Signup

**Files:**
- Modify: `src/app/signup/page.tsx` — becomes teacher signup
- Modify: `src/app/login/page.tsx` — role-aware redirect

- [ ] **Step 1: Rewrite signup page for teachers**

Replace the entire contents of `src/app/signup/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function TeacherSignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2. Create teacher profile
    if (authData.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({ id: authData.user.id, role: "teacher", name });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      router.push("/teacher");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-3xl font-extrabold text-purple-700">
          Teacher Signup
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Create your WordPets teacher account
        </p>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none transition-colors focus:border-purple-400"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none transition-colors focus:border-purple-400"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none transition-colors focus:border-purple-400"
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-purple-600 px-6 py-3 text-lg font-bold text-white shadow-md transition-all hover:bg-purple-700 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Teacher Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-purple-600 hover:text-purple-700">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update login page with role-aware redirect**

In `src/app/login/page.tsx`, change the `handleLogin` function's success redirect. Replace:

```typescript
      router.push("/");
      router.refresh();
```

With:

```typescript
      // Redirect based on role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", (await supabase.auth.getUser()).data.user!.id)
        .single();

      if (profile?.role === "teacher") {
        router.push("/teacher");
      } else {
        router.push("/student");
      }
      router.refresh();
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/signup/page.tsx src/app/login/page.tsx
git commit -m "feat: teacher signup with profile creation, role-aware login redirect"
```

---

## Task 5: Teacher Dashboard Layout + Auth Guard

**Files:**
- Create: `src/app/teacher/layout.tsx`

- [ ] **Step 1: Create teacher layout with auth guard**

```typescript
// src/app/teacher/layout.tsx
"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || role !== "teacher")) {
      router.push("/login");
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user || role !== "teacher") return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/teacher" className="text-xl font-bold text-purple-700">
            WordPets
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/teacher"
              className="text-sm font-medium text-gray-600 hover:text-purple-700"
            >
              Students
            </Link>
            <Link
              href="/teacher/add-student"
              className="text-sm font-medium text-gray-600 hover:text-purple-700"
            >
              + Add Student
            </Link>
            <button
              onClick={signOut}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/teacher/layout.tsx
git commit -m "feat: teacher dashboard layout with nav and auth guard"
```

---

## Task 6: Stats Bar Component

**Files:**
- Create: `src/components/teacher/StatsBar.tsx`

- [ ] **Step 1: Create the stats bar**

```typescript
// src/components/teacher/StatsBar.tsx
"use client";

interface StatsBarProps {
  totalStudents: number;
  practicedToday: number;
  inactive: number;
}

export default function StatsBar({
  totalStudents,
  practicedToday,
  inactive,
}: StatsBarProps) {
  return (
    <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200">
      <div className="bg-white px-4 py-4 text-center">
        <div className="text-2xl font-bold text-purple-600">{totalStudents}</div>
        <div className="text-xs text-gray-500">Students</div>
      </div>
      <div className="bg-white px-4 py-4 text-center">
        <div className="text-2xl font-bold text-green-600">{practicedToday}</div>
        <div className="text-xs text-gray-500">Practiced Today</div>
      </div>
      <div className="bg-white px-4 py-4 text-center">
        <div className="text-2xl font-bold text-amber-600">{inactive}</div>
        <div className="text-xs text-gray-500">Inactive 3+ Days</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/teacher/StatsBar.tsx
git commit -m "feat: add StatsBar component for teacher dashboard"
```

---

## Task 7: Student Card Component

**Files:**
- Create: `src/components/teacher/StudentCard.tsx`

- [ ] **Step 1: Create the student card**

```typescript
// src/components/teacher/StudentCard.tsx
"use client";

import Link from "next/link";
import type { Tag } from "@/types/database";

const PET_EMOJI: Record<string, string> = {
  cat: "🐱",
  dog: "🐕",
  guinea_pig: "🐹",
  bird: "🐦",
  bunny: "🐰",
};

interface StudentCardProps {
  id: string;
  name: string;
  age: number;
  petType: string;
  petName: string;
  petLevel: number;
  tags: Tag[];
  practiceThisWeek: number;
  lastActive: string | null;
  isInactive: boolean;
}

export default function StudentCard({
  id,
  name,
  age,
  petType,
  petName,
  petLevel,
  tags,
  practiceThisWeek,
  lastActive,
  isInactive,
}: StudentCardProps) {
  const bgClass = isInactive
    ? "bg-red-50 border-red-200"
    : "bg-white border-gray-200";

  return (
    <Link
      href={`/teacher/students/${id}`}
      className={`flex items-center gap-3 rounded-xl border p-4 transition-shadow hover:shadow-md ${bgClass}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-xl">
        {PET_EMOJI[petType] ?? "🐾"}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-gray-900">{name}</div>
        <div className="text-xs text-gray-500">
          Age {age} · {petName} (Lv {petLevel})
        </div>
        {tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {tags.map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
              >
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-right">
        {isInactive ? (
          <div className="text-xs font-medium text-red-600">
            Inactive
          </div>
        ) : (
          <div className="text-xs font-medium text-green-600">
            {practiceThisWeek}/5 days
          </div>
        )}
        <div className="text-[10px] text-gray-400">
          {lastActive ? `Last: ${lastActive}` : "No activity"}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/teacher/StudentCard.tsx
git commit -m "feat: add StudentCard component for teacher dashboard"
```

---

## Task 8: Teacher Dashboard Page

**Files:**
- Create: `src/app/teacher/page.tsx`

- [ ] **Step 1: Create the dashboard page**

```typescript
// src/app/teacher/page.tsx
"use client";

import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import StatsBar from "@/components/teacher/StatsBar";
import StudentCard from "@/components/teacher/StudentCard";
import type { Student, Tag } from "@/types/database";
import Link from "next/link";

interface StudentRow extends Student {
  tags: Tag[];
  session_count: number;
  last_session_date: string | null;
}

export default function TeacherDashboard() {
  const { user, profile } = useAuth();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadStudents() {
      const supabase = createClient();

      // Get students with their tags
      const { data: studentsData } = await supabase
        .from("students")
        .select(`
          *,
          student_tags ( tag_id ),
          practice_sessions ( date )
        `)
        .eq("teacher_id", user!.id)
        .order("name");

      // Get all teacher's tags for lookup
      const { data: tagsData } = await supabase
        .from("tags")
        .select("*")
        .eq("teacher_id", user!.id);

      const tagsMap = new Map((tagsData ?? []).map((t) => [t.id, t as Tag]));

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const rows: StudentRow[] = (studentsData ?? []).map((s) => {
        const tagIds = (s.student_tags as { tag_id: string }[]).map(
          (st) => st.tag_id
        );
        const tags = tagIds
          .map((id) => tagsMap.get(id))
          .filter(Boolean) as Tag[];

        const sessions = (s.practice_sessions as { date: string }[]) ?? [];
        const recentSessions = sessions.filter(
          (sess) => new Date(sess.date) >= weekAgo
        );
        const lastDate = sessions.length
          ? sessions.sort(
              (a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            )[0].date
          : null;

        return {
          ...s,
          tags,
          session_count: recentSessions.length,
          last_session_date: lastDate,
          student_tags: undefined,
          practice_sessions: undefined,
        } as StudentRow;
      });

      setStudents(rows);
      setLoading(false);
    }

    loadStudents();
  }, [user]);

  if (loading) {
    return <p className="py-12 text-center text-gray-400">Loading...</p>;
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const threeDaysAgo = new Date(
    now.getTime() - 3 * 24 * 60 * 60 * 1000
  ).toISOString().slice(0, 10);

  const practicedToday = students.filter((s) =>
    s.last_session_date === today
  ).length;
  const inactive = students.filter(
    (s) => !s.last_session_date || s.last_session_date < threeDaysAgo
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hi, {profile?.name ?? "Teacher"}
        </h1>
        <p className="text-sm text-gray-500">Your students this week</p>
      </div>

      <StatsBar
        totalStudents={students.length}
        practicedToday={practicedToday}
        inactive={inactive}
      />

      {students.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 px-6 py-12 text-center">
          <p className="mb-2 text-lg font-semibold text-gray-700">
            No students yet
          </p>
          <p className="mb-4 text-sm text-gray-500">
            Add your first student to get started
          </p>
          <Link
            href="/teacher/add-student"
            className="inline-block rounded-xl bg-purple-600 px-6 py-3 font-bold text-white shadow-md hover:bg-purple-700"
          >
            + Add Student
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((s) => (
            <StudentCard
              key={s.id}
              id={s.id}
              name={s.name}
              age={s.age}
              petType={s.pet_type}
              petName={s.pet_name}
              petLevel={s.pet_level}
              tags={s.tags}
              practiceThisWeek={s.session_count}
              lastActive={s.last_session_date}
              isInactive={
                !s.last_session_date || s.last_session_date < threeDaysAgo
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/teacher/page.tsx
git commit -m "feat: teacher dashboard page with student list and stats"
```

---

## Task 9: Add Student / Generate Invite Link

**Files:**
- Create: `src/app/teacher/add-student/page.tsx`

- [ ] **Step 1: Create the add student page**

```typescript
// src/app/teacher/add-student/page.tsx
"use client";

import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function AddStudentPage() {
  const { user } = useAuth();
  const [studentName, setStudentName] = useState("");
  const [studentAge, setStudentAge] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("invite_tokens")
      .insert({
        teacher_id: user.id,
        student_name: studentName || null,
        student_age: studentAge ? parseInt(studentAge) : null,
      })
      .select("token")
      .single();

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const link = `${window.location.origin}/join/${data.token}`;
    setInviteLink(link);
    setLoading(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Student</h1>
        <p className="text-sm text-gray-500">
          Generate an invite link to send to the parent via WhatsApp
        </p>
      </div>

      {!inviteLink ? (
        <form onSubmit={generateInvite} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Student name (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Maya"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none focus:border-purple-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Age (optional)
            </label>
            <input
              type="number"
              placeholder="e.g. 7"
              min="3"
              max="18"
              value={studentAge}
              onChange={(e) => setStudentAge(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none focus:border-purple-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-purple-600 px-6 py-3 text-lg font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Invite Link"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-green-50 border border-green-200 p-4">
            <p className="mb-2 text-sm font-medium text-green-800">
              Invite link ready!
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 rounded-lg border border-green-300 bg-white px-3 py-2 text-sm"
              />
              <button
                onClick={copyLink}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-green-600">
              Send this to the parent on WhatsApp. They&apos;ll sign up and their
              child will be linked to your dashboard.
            </p>
          </div>
          <button
            onClick={() => {
              setInviteLink("");
              setStudentName("");
              setStudentAge("");
            }}
            className="w-full rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Generate Another Link
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/teacher/add-student/page.tsx
git commit -m "feat: add student page with invite link generation"
```

---

## Task 10: Parent Invite Join Flow

**Files:**
- Create: `src/app/join/[token]/page.tsx`
- Create: `src/app/join/[token]/pet-select/page.tsx`

- [ ] **Step 1: Create the join page (parent signup via invite)**

```typescript
// src/app/join/[token]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { InviteToken } from "@/types/database";

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [invite, setInvite] = useState<InviteToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadInvite() {
      const supabase = createClient();
      const { data } = await supabase
        .from("invite_tokens")
        .select("*")
        .eq("token", token)
        .eq("used", false)
        .single();

      if (!data) {
        setError("This invite link is invalid or has already been used.");
        setLoading(false);
        return;
      }

      setInvite(data as InviteToken);
      if (data.student_name) setChildName(data.student_name);
      if (data.student_age) setChildAge(String(data.student_age));
      setLoading(false);
    }
    loadInvite();
  }, [token]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!invite) return;
    setSubmitting(true);
    setError("");

    const supabase = createClient();

    // 1. Create parent auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError(authError?.message ?? "Signup failed");
      setSubmitting(false);
      return;
    }

    const parentId = authData.user.id;

    // 2. Create parent profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: parentId, role: "parent", name: parentName });

    if (profileError) {
      setError(profileError.message);
      setSubmitting(false);
      return;
    }

    // 3. Create student linked to teacher
    const { data: student, error: studentError } = await supabase
      .from("students")
      .insert({
        parent_id: parentId,
        teacher_id: invite.teacher_id,
        name: childName,
        age: parseInt(childAge),
      })
      .select("id")
      .single();

    if (studentError || !student) {
      setError(studentError?.message ?? "Could not create student");
      setSubmitting(false);
      return;
    }

    // 4. Mark invite as used
    await supabase
      .from("invite_tokens")
      .update({ used: true, used_by: parentId })
      .eq("id", invite.id);

    // 5. Go to pet selection
    router.push(`/join/${token}/pet-select?student=${student.id}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mb-4 text-5xl">😕</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-3xl font-extrabold text-purple-700">
          Join WordPets
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Your child&apos;s teacher invited you!
        </p>

        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Your name (parent)"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            required
            className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none focus:border-purple-400"
          />
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none focus:border-purple-400"
          />
          <input
            type="password"
            placeholder="Create password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none focus:border-purple-400"
          />

          <div className="border-t border-gray-100 pt-4">
            <p className="mb-2 text-sm font-medium text-gray-700">
              About your child
            </p>
          </div>

          <input
            type="text"
            placeholder="Child's name"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            required
            className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none focus:border-purple-400"
          />
          <input
            type="number"
            placeholder="Child's age"
            value={childAge}
            onChange={(e) => setChildAge(e.target.value)}
            required
            min="3"
            max="18"
            className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none focus:border-purple-400"
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-purple-600 px-6 py-3 text-lg font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? "Setting up..." : "Join & Pick a Pet!"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create pet selection page**

```typescript
// src/app/join/[token]/pet-select/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PetType } from "@/types/database";
import { getDefaultFocusAreas } from "@/types/database";

const PETS: { type: PetType; emoji: string; label: string }[] = [
  { type: "cat", emoji: "🐱", label: "Cat" },
  { type: "dog", emoji: "🐕", label: "Dog" },
  { type: "guinea_pig", emoji: "🐹", label: "Guinea Pig" },
  { type: "bird", emoji: "🐦", label: "Bird" },
  { type: "bunny", emoji: "🐰", label: "Bunny" },
];

export default function PetSelectPage() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("student");
  const router = useRouter();

  const [selected, setSelected] = useState<PetType | null>(null);
  const [petName, setPetName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!selected || !petName.trim() || !studentId) return;
    setSaving(true);

    const supabase = createClient();

    // Update pet choice
    const { error: petError } = await supabase
      .from("students")
      .update({ pet_type: selected, pet_name: petName.trim() })
      .eq("id", studentId);

    if (petError) {
      alert(petError.message);
      setSaving(false);
      return;
    }

    // Get student age to set default focus areas
    const { data: student } = await supabase
      .from("students")
      .select("age")
      .eq("id", studentId)
      .single();

    if (student) {
      const defaults = getDefaultFocusAreas(student.age);
      const focusRows = defaults.map((area) => ({
        student_id: studentId,
        area,
        difficulty: "beginner" as const,
        active: true,
      }));

      await supabase.from("focus_areas").insert(focusRows);
    }

    // Done — redirect to a simple success page
    router.push("/join/success");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-3xl font-extrabold text-purple-700">
          Pick Your Pet!
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          This pet will be your learning buddy
        </p>

        <div className="mb-6 grid grid-cols-5 gap-2">
          {PETS.map((pet) => (
            <button
              key={pet.type}
              onClick={() => setSelected(pet.type)}
              className={`flex flex-col items-center rounded-xl p-3 transition-all ${
                selected === pet.type
                  ? "bg-purple-100 ring-2 ring-purple-500 scale-110"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <span className="text-3xl">{pet.emoji}</span>
              <span className="mt-1 text-[10px] font-medium text-gray-600">
                {pet.label}
              </span>
            </button>
          ))}
        </div>

        {selected && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Name your pet!"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              maxLength={20}
              className="w-full rounded-xl border-2 border-purple-200 px-4 py-3 text-center text-lg font-bold outline-none focus:border-purple-400"
            />
            <button
              onClick={handleSave}
              disabled={!petName.trim() || saving}
              className="w-full rounded-xl bg-purple-600 px-6 py-3 text-lg font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : `Let's Go with ${petName}!`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create simple success page**

```typescript
// src/app/join/success/page.tsx
export default function JoinSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
        <div className="mb-4 text-6xl">🎉</div>
        <h1 className="mb-2 text-2xl font-extrabold text-purple-700">
          All Set!
        </h1>
        <p className="text-sm text-gray-500">
          Your child&apos;s account is ready. Their teacher will set up practice
          activities, and your child can start learning with their new pet!
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/join/
git commit -m "feat: parent invite join flow with pet selection and default focus areas"
```

---

## Task 11: Focus Area Toggle Component

**Files:**
- Create: `src/components/teacher/FocusAreaToggle.tsx`

- [ ] **Step 1: Create the focus area toggle**

```typescript
// src/components/teacher/FocusAreaToggle.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FocusArea, FocusAreaType, DifficultyLevel } from "@/types/database";

const AREA_LABELS: Record<FocusAreaType, string> = {
  phonics: "Phonics",
  read_aloud: "Read Aloud",
  spelling: "Spelling",
  sight_words: "Sight Words",
  comprehension: "Comprehension",
  writing: "Writing",
  story_listening: "Story Listening",
};

const ALL_AREAS: FocusAreaType[] = [
  "phonics", "read_aloud", "spelling", "sight_words",
  "comprehension", "writing", "story_listening",
];

const DIFFICULTIES: DifficultyLevel[] = ["beginner", "intermediate", "advanced"];

interface FocusAreaToggleProps {
  studentId: string;
  focusAreas: FocusArea[];
  onUpdate: () => void;
}

export default function FocusAreaToggle({
  studentId,
  focusAreas,
  onUpdate,
}: FocusAreaToggleProps) {
  const [saving, setSaving] = useState(false);

  const areaMap = new Map(focusAreas.map((fa) => [fa.area, fa]));

  async function toggleArea(area: FocusAreaType) {
    setSaving(true);
    const supabase = createClient();
    const existing = areaMap.get(area);

    if (existing) {
      await supabase
        .from("focus_areas")
        .update({ active: !existing.active })
        .eq("id", existing.id);
    } else {
      await supabase.from("focus_areas").insert({
        student_id: studentId,
        area,
        difficulty: "beginner",
        active: true,
      });
    }

    setSaving(false);
    onUpdate();
  }

  async function changeDifficulty(area: FocusAreaType, difficulty: DifficultyLevel) {
    const existing = areaMap.get(area);
    if (!existing) return;

    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("focus_areas")
      .update({ difficulty })
      .eq("id", existing.id);
    setSaving(false);
    onUpdate();
  }

  return (
    <div className={`space-y-2 ${saving ? "opacity-60" : ""}`}>
      <h3 className="text-sm font-semibold text-gray-700">Focus Areas</h3>
      <div className="flex flex-wrap gap-2">
        {ALL_AREAS.map((area) => {
          const fa = areaMap.get(area);
          const isActive = fa?.active ?? false;

          return (
            <button
              key={area}
              onClick={() => toggleArea(area)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {AREA_LABELS[area]}
            </button>
          );
        })}
      </div>

      {/* Show difficulty selectors for active areas */}
      {focusAreas
        .filter((fa) => fa.active)
        .map((fa) => (
          <div key={fa.area} className="flex items-center gap-2 text-xs">
            <span className="w-24 text-gray-600">{AREA_LABELS[fa.area]}:</span>
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => changeDifficulty(fa.area, d)}
                className={`rounded px-2 py-0.5 ${
                  fa.difficulty === d
                    ? "bg-purple-100 font-medium text-purple-700"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/teacher/FocusAreaToggle.tsx
git commit -m "feat: add FocusAreaToggle component for student detail view"
```

---

## Task 12: Tag Manager Component

**Files:**
- Create: `src/components/teacher/TagManager.tsx`

- [ ] **Step 1: Create the tag manager**

```typescript
// src/components/teacher/TagManager.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import type { Tag } from "@/types/database";

interface TagManagerProps {
  studentId: string;
  currentTags: Tag[];
  allTags: Tag[];
  onUpdate: () => void;
}

export default function TagManager({
  studentId,
  currentTags,
  allTags,
  onUpdate,
}: TagManagerProps) {
  const { user } = useAuth();
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);

  const currentTagIds = new Set(currentTags.map((t) => t.id));

  async function addTag(tagId: string) {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("student_tags").insert({ student_id: studentId, tag_id: tagId });
    setSaving(false);
    onUpdate();
  }

  async function removeTag(tagId: string) {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("student_tags")
      .delete()
      .eq("student_id", studentId)
      .eq("tag_id", tagId);
    setSaving(false);
    onUpdate();
  }

  async function createAndAddTag() {
    if (!newTag.trim() || !user) return;
    setSaving(true);
    const supabase = createClient();

    // Create tag (or get existing)
    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("teacher_id", user.id)
      .eq("name", newTag.trim())
      .single();

    let tagId: string;

    if (existing) {
      tagId = existing.id;
    } else {
      const { data: created } = await supabase
        .from("tags")
        .insert({ teacher_id: user.id, name: newTag.trim() })
        .select("id")
        .single();
      if (!created) {
        setSaving(false);
        return;
      }
      tagId = created.id;
    }

    await supabase.from("student_tags").insert({ student_id: studentId, tag_id: tagId });
    setNewTag("");
    setSaving(false);
    onUpdate();
  }

  return (
    <div className={`space-y-2 ${saving ? "opacity-60" : ""}`}>
      <h3 className="text-sm font-semibold text-gray-700">Tags</h3>

      {/* Current tags */}
      <div className="flex flex-wrap gap-1">
        {currentTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700"
          >
            {tag.name}
            <button
              onClick={() => removeTag(tag.id)}
              className="ml-0.5 text-purple-400 hover:text-purple-700"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Add existing tag */}
      {allTags.filter((t) => !currentTagIds.has(t.id)).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {allTags
            .filter((t) => !currentTagIds.has(t.id))
            .map((tag) => (
              <button
                key={tag.id}
                onClick={() => addTag(tag.id)}
                className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-200"
              >
                + {tag.name}
              </button>
            ))}
        </div>
      )}

      {/* Create new tag */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="New tag..."
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createAndAddTag()}
          maxLength={30}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-purple-400"
        />
        <button
          onClick={createAndAddTag}
          disabled={!newTag.trim()}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/teacher/TagManager.tsx
git commit -m "feat: add TagManager component for student tagging"
```

---

## Task 13: Student Detail Page

**Files:**
- Create: `src/app/teacher/students/[id]/page.tsx`

- [ ] **Step 1: Create the student detail page**

```typescript
// src/app/teacher/students/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import FocusAreaToggle from "@/components/teacher/FocusAreaToggle";
import TagManager from "@/components/teacher/TagManager";
import type { Student, FocusArea, Tag } from "@/types/database";
import Link from "next/link";

const PET_EMOJI: Record<string, string> = {
  cat: "🐱", dog: "🐕", guinea_pig: "🐹", bird: "🐦", bunny: "🐰",
};

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [studentTags, setStudentTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();

    const [studentRes, focusRes, studentTagsRes, allTagsRes] = await Promise.all([
      supabase.from("students").select("*").eq("id", id).eq("teacher_id", user.id).single(),
      supabase.from("focus_areas").select("*").eq("student_id", id),
      supabase.from("student_tags").select("tag_id").eq("student_id", id),
      supabase.from("tags").select("*").eq("teacher_id", user.id),
    ]);

    if (!studentRes.data) {
      router.push("/teacher");
      return;
    }

    setStudent(studentRes.data as Student);
    setFocusAreas((focusRes.data ?? []) as FocusArea[]);

    const tagIds = new Set((studentTagsRes.data ?? []).map((st: { tag_id: string }) => st.tag_id));
    const allTagsList = (allTagsRes.data ?? []) as Tag[];
    setAllTags(allTagsList);
    setStudentTags(allTagsList.filter((t) => tagIds.has(t.id)));

    setLoading(false);
  }, [id, user, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !student) {
    return <p className="py-12 text-center text-gray-400">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <Link href="/teacher" className="text-sm text-purple-600 hover:underline">
        ← Back to dashboard
      </Link>

      {/* Student header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-4xl">
          {PET_EMOJI[student.pet_type] ?? "🐾"}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
          <p className="text-sm text-gray-500">
            Age {student.age} · {student.pet_name} (Level {student.pet_level}) · {student.coins} coins
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <TagManager
          studentId={student.id}
          currentTags={studentTags}
          allTags={allTags}
          onUpdate={loadData}
        />
      </div>

      {/* Focus areas */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <FocusAreaToggle
          studentId={student.id}
          focusAreas={focusAreas}
          onUpdate={loadData}
        />
      </div>

      {/* Practice history placeholder */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-700">Practice History</h3>
        <p className="mt-2 text-xs text-gray-400">
          Practice sessions will appear here once the student starts using the app.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/teacher/students/
git commit -m "feat: student detail page with focus areas and tag management"
```

---

## Task 14: Content Library Placeholder

**Files:**
- Create: `src/app/teacher/content/page.tsx`

A placeholder page for the content library (implemented in Plan 2). Keeps the nav link working.

- [ ] **Step 1: Create placeholder page**

```typescript
// src/app/teacher/content/page.tsx
export default function ContentPage() {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-300 px-6 py-12 text-center">
      <div className="mb-4 text-5xl">📚</div>
      <h1 className="mb-2 text-xl font-bold text-gray-700">Content Library</h1>
      <p className="text-sm text-gray-500">
        Reading passages, word lists, writing prompts, and stories will be managed here.
        Coming in the next update.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Add content link to teacher nav**

In `src/app/teacher/layout.tsx`, add a nav link after the "Add Student" link:

```typescript
            <Link
              href="/teacher/content"
              className="text-sm font-medium text-gray-600 hover:text-purple-700"
            >
              Content
            </Link>
```

- [ ] **Step 3: Verify build and commit**

Run: `npm run build`

```bash
git add src/app/teacher/content/ src/app/teacher/layout.tsx
git commit -m "feat: add content library placeholder page"
```

---

## Task 15: End-to-End Smoke Test

No new files — verify the full flow works in the dev server.

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Test teacher signup**

1. Go to `http://localhost:3000/signup`
2. Enter name, email, password
3. Should redirect to `/teacher`
4. Should see empty dashboard with "Add Student" prompt

- [ ] **Step 3: Test invite flow**

1. Click "Add Student"
2. Enter student name and age
3. Click "Generate Invite Link"
4. Copy the link

- [ ] **Step 4: Test parent join (in incognito)**

1. Open invite link in incognito browser
2. Fill in parent name, email, password, child name, age
3. Should redirect to pet selection
4. Pick a pet, name it
5. Should see success page

- [ ] **Step 5: Verify student appears in teacher dashboard**

1. Go back to teacher browser
2. Refresh `/teacher`
3. New student should appear in the list with pet emoji and tags

- [ ] **Step 6: Test student detail**

1. Click on the student card
2. Should see student detail page
3. Toggle focus areas on/off
4. Add a tag
5. Verify changes persist on page reload

- [ ] **Step 7: Commit any fixes**

If any fixes were needed during testing:

```bash
git add -A
git commit -m "fix: smoke test fixes for teacher dashboard flow"
```

---

## Summary

**13 commits across 15 tasks.** After this plan:

- ✅ Database schema supports teachers, students, tags, focus areas, invites
- ✅ Teachers can sign up and access their dashboard
- ✅ Teachers can generate invite links and send to parents
- ✅ Parents can join via invite, create student, pick pet
- ✅ Default focus areas set automatically based on child's age
- ✅ Teacher can view student detail, toggle focus areas, manage tags
- ✅ Auth is role-aware (teacher vs parent)
- ✅ Content library page exists as placeholder

**Next:** Plan 2 (Content System + Activity Components) builds the actual learning activities and content pipeline on top of this foundation.
