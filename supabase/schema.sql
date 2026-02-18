-- Blending Bootcamp database schema
-- Run this in the Supabase SQL Editor

-- Learner profiles (one per child, linked to parent auth user)
create table if not exists learners (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'My Child',
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table learners enable row level security;

-- Parents can only see/manage their own learners
create policy "Parents manage own learners"
  on learners for all
  using (auth.uid() = parent_id)
  with check (auth.uid() = parent_id);

-- Progress per learner per day
create table if not exists progress (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references learners(id) on delete cascade not null,
  day integer not null check (day >= 1 and day <= 14),
  words_blended integer not null default 0,
  time_seconds integer not null default 0,
  completed_at timestamptz default now() not null,
  unique(learner_id, day)
);

-- Enable RLS
alter table progress enable row level security;

-- Parents can only see/manage progress for their own learners
create policy "Parents manage own learner progress"
  on progress for all
  using (
    learner_id in (
      select id from learners where parent_id = auth.uid()
    )
  )
  with check (
    learner_id in (
      select id from learners where parent_id = auth.uid()
    )
  );

-- Automatically create a default learner when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.learners (parent_id, name)
  values (new.id, 'My Child');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
