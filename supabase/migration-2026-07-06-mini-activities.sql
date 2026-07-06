-- Mini-activities wave 1: new content types + attempt format column.
-- Idempotent. Apply with:
--   scripts/db.sh -f supabase/migration-2026-07-06-mini-activities.sql
begin;

-- Postgres auto-names the inline CHECK on content.type "content_type_check".
alter table content drop constraint if exists content_type_check;
alter table content add constraint content_type_check
  check (type in ('wordlist', 'passage', 'word_match_set', 'cloze_sentence'));

-- Which game produced an attempt. activity_type keeps meaning the SLOT
-- (phonics/spelling/read_aloud) so existing teacher-dashboard queries are
-- untouched. null = legacy formats (blending/typing/read-aloud).
alter table activity_attempts add column if not exists format text;

commit;
