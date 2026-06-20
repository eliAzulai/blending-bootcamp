-- Migration: stop anonymous enumeration of children's names + ages.
--
-- Problem: invite_tokens carries student_name + student_age, and the policy
--   "Anyone reads unused invites" granted SELECT to PUBLIC (which the anon role
--   inherits) for every row WHERE used = false. With no TO clause and no
--   token predicate, an anonymous holder of the public anon key could run
--   `select student_name, student_age from invite_tokens where used = false`
--   and enumerate every pending invite's child first-name + age.
--
-- Fix: the join flow only ever needs ONE invite, looked up by its exact token
--   (see src/app/join/[token]/page.tsx + actions.ts). Replace the broad anon
--   SELECT with a token-scoped SECURITY DEFINER function that returns only the
--   fields the acceptance flow needs, and only for an exact, unused token.
--   An anon caller can validate a specific token they already hold, but can no
--   longer list the table. Tokens are 128-bit random (gen_random_bytes(16)),
--   so they are not guessable/brute-forceable.

begin;

-- 1. Remove the over-broad policy.
drop policy if exists "Anyone reads unused invites" on invite_tokens;

-- 2. Token-scoped lookup. SECURITY DEFINER runs as the owner and bypasses RLS,
--    but the function body is hard-scoped to a single exact, unused token, so it
--    cannot be used to enumerate. Returns only the fields the join flow uses.
create or replace function public.get_invite_by_token(p_token text)
returns table (
  token text,
  teacher_id uuid,
  student_name text,
  student_age integer
)
language sql
security definer
set search_path = public
stable
as $$
  select token, teacher_id, student_name, student_age
  from invite_tokens
  where token = p_token
    and used = false
$$;

-- 3. Least-privilege execute grant.
revoke all on function public.get_invite_by_token(text) from public;
grant execute on function public.get_invite_by_token(text) to anon, authenticated;

-- 4. Authenticated token claim. Parents cannot update invite_tokens directly
--    under RLS (only teachers manage their own invites), so the join action uses
--    this exact-token function after Supabase signup. The boolean return lets
--    the action detect a race/reuse instead of silently continuing.
--    The auth.uid() predicate prevents callers from setting used_by to any
--    account except their own.
create or replace function public.claim_invite_token(p_token text, p_used_by uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update invite_tokens
  set used = true,
      used_by = p_used_by
  where token = p_token
    and used = false
    and p_used_by = auth.uid();

  return found;
end;
$$;

revoke all on function public.claim_invite_token(text, uuid) from public;
grant execute on function public.claim_invite_token(text, uuid) to authenticated;

commit;
