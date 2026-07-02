-- supabase/migrations/20260702_feedback_notes.sql
-- Builder feedback notes (dev prototype requirements loop; spec 2026-07-02 §2.7).
-- Standalone by design: references NO practice schema (piece-2 boundary).
-- Transcript text only — audio is never stored.

begin;

create table if not exists feedback_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  transcript text not null,
  context jsonb not null default '{}',
  created_at timestamptz default now() not null
);

alter table feedback_notes enable row level security;

create policy "Owners insert own notes" on feedback_notes
  for insert with check (auth.uid() = user_id);
create policy "Owners read own notes" on feedback_notes
  for select using (auth.uid() = user_id);

commit;
