-- Migration: pet reward system — care events, atomic coin spend, letter_hunt attempts.
-- Spec: docs/superpowers/specs/2026-07-13-wordpets-pet-reward-system-design.md
--
-- ⚠️ Supabase project is paused as of 2026-07-13. Apply this migration as part
-- of the restore runbook, BEFORE deploying the app build that ships the care
-- UI. The app fails closed either way (the care_for_pet RPC won't exist on an
-- unmigrated DB and the home page hides care UI when pet_care_events is
-- unreadable), but restore-then-migrate is the documented order.

begin;

-- 1. Care events. One row per care action; the render-side "cared today" /
--    satiation / memory-line derivations all read this table.
create table if not exists pet_care_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade not null,
  verb text not null check (verb in ('snack', 'ball', 'treat')),
  coins_spent integer not null check (coins_spent > 0),
  created_at timestamptz default now() not null
);

create index if not exists pet_care_events_student_created_idx
  on pet_care_events (student_id, created_at desc);

alter table pet_care_events enable row level security;

-- Reads mirror practice_sessions: parents see their own child's events,
-- teachers see their students'. There is deliberately NO insert policy —
-- all writes go through the care_for_pet RPC below, which enforces the
-- parent check, the satiation cap, and the atomic coin decrement.
create policy "Parents read child care events" on pet_care_events for select
  using (exists (select 1 from students s where s.id = student_id and s.parent_id = auth.uid()));
create policy "Teachers read student care events" on pet_care_events for select
  using (exists (select 1 from students s where s.id = student_id and s.teacher_id = auth.uid()));

-- 2. Coins can never go negative. Backstop for the legacy client-REST
--    read-modify-write in src/lib/tracker.ts finish() as well as the RPC.
alter table students drop constraint if exists students_coins_nonneg;
alter table students add constraint students_coins_nonneg check (coins >= 0);

-- 3. Atomic care action. SECURITY DEFINER (bypasses RLS) but hard-scoped:
--    only the student's own parent can call it, the cost table lives HERE
--    (client cannot lie about prices), satiation is enforced server-side,
--    and the decrement is conditional so a double-tap can never go negative.
--    Returns the new coin balance, or null when any guard fails (the app
--    treats null as a silent no-op — never an error a child can read).
create or replace function public.care_for_pet(p_student_id uuid, p_verb text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cost integer;
  v_new_balance integer;
begin
  v_cost := case p_verb
    when 'snack' then 5
    when 'ball' then 10
    when 'treat' then 15
    else null
  end;
  if v_cost is null then
    return null;
  end if;

  -- Caller must be the student's parent.
  if not exists (
    select 1 from students
    where id = p_student_id and parent_id = auth.uid()
  ) then
    return null;
  end if;

  -- Satiation: at most 3 care events per UTC day (matches the app's UTC
  -- "today" convention; see src/lib/pet.ts).
  if (
    select count(*) from pet_care_events
    where student_id = p_student_id
      and created_at >= date_trunc('day', now() at time zone 'utc')
  ) >= 3 then
    return null;
  end if;

  -- Atomic conditional spend: 0 rows updated = can't afford = no-op.
  update students
  set coins = coins - v_cost
  where id = p_student_id and coins >= v_cost
  returning coins into v_new_balance;

  if v_new_balance is null then
    return null;
  end if;

  insert into pet_care_events (student_id, verb, coins_spent)
  values (p_student_id, p_verb, v_cost);

  return v_new_balance;
end;
$$;

revoke all on function public.care_for_pet(uuid, text) from public;
revoke all on function public.care_for_pet(uuid, text) from anon;
grant execute on function public.care_for_pet(uuid, text) to authenticated;

-- 4. Letter Hunt attempts are a first-class activity type — never recorded as
--    'phonics' (recognition scores must not pollute the teacher's
--    blending-production signal; see the 2026-07-13 spec).
alter table activity_attempts drop constraint if exists activity_attempts_activity_type_check;
alter table activity_attempts add constraint activity_attempts_activity_type_check
  check (activity_type in ('phonics', 'spelling', 'read_aloud', 'letter_hunt'));

commit;
