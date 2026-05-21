-- supabase/schema-v2.sql
-- WordPets Phase 1a schema. Run in Supabase SQL Editor.

-- Clean up old tables
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists progress cascade;
drop table if exists learners cascade;

-- PROFILES (extends auth.users with role)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('teacher', 'parent')),
  name text not null,
  created_at timestamptz default now() not null
);
alter table profiles enable row level security;
create policy "Users read own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on profiles for insert with check (auth.uid() = id);

-- STUDENTS
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references auth.users(id) on delete cascade not null,
  teacher_id uuid references auth.users(id) on delete set null,
  name text not null,
  age integer not null check (age >= 3 and age <= 18),
  pet_type text not null default 'cat' check (pet_type in ('cat', 'dog', 'guinea_pig', 'bird', 'bunny', 'penguin')),
  pet_name text not null default 'My Pet',
  pet_mood text not null default 'happy' check (pet_mood in ('happy', 'hungry', 'sleepy', 'excited')),
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
-- Parents need INSERT/UPDATE/DELETE during onboarding (pet-select inserts default focus areas).
-- Without this, the join flow hits a 403 and focus areas are never created.
create policy "Parents manage own child focus areas" on focus_areas for all
  using (exists (select 1 from students s where s.id = student_id and s.parent_id = auth.uid()))
  with check (exists (select 1 from students s where s.id = student_id and s.parent_id = auth.uid()));

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
create policy "Parents insert sessions for own children" on practice_sessions for insert
  with check (exists (select 1 from students s where s.id = student_id and s.parent_id = auth.uid()));
create policy "Parents update own child sessions" on practice_sessions for update
  using (exists (select 1 from students s where s.id = student_id and s.parent_id = auth.uid()));

-- ACTIVITY ATTEMPTS (explicit schema, not jsonb blob)
create table if not exists activity_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references practice_sessions(id) on delete cascade not null,
  activity_type text not null check (activity_type in ('phonics', 'spelling', 'read_aloud')),
  content_ref text,
  score integer check (score is null or (score >= 0 and score <= 100)),
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
create policy "Parents manage own child attempts" on activity_attempts for all
  using (exists (
    select 1 from practice_sessions ps
    join students s on s.id = ps.student_id
    where ps.id = session_id and s.parent_id = auth.uid()
  ));

-- CONTENT (seeded starter library, plus teacher-uploaded in future)
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
  teacher_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now() not null
);
alter table content enable row level security;
create policy "Anyone reads library content" on content for select
  using (source = 'library');
create policy "Teachers read own content" on content for select
  using (source = 'teacher' and teacher_id = auth.uid());
create policy "Teachers manage own content" on content for all
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
