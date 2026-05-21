-- supabase/seed.sql
-- Seeds the `content` table with the Phase 1a starter library.
-- Idempotent: deletes existing library rows by slug before re-inserting.
-- Apply with: psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed.sql

begin;

-- Phonics word lists
delete from content
where source = 'library'
  and type = 'wordlist'
  and metadata->>'slug' in ('phonics-cvc-at', 'phonics-cvc-it');

insert into content (type, title, body, age_min, age_max, difficulty, metadata, source) values
(
  'wordlist',
  'Short A: -at family',
  'cat,sat,mat,hat,bat',
  6, 8, 'beginner',
  jsonb_build_object(
    'slug', 'phonics-cvc-at',
    'activity', 'phonics',
    'words', jsonb_build_array(
      jsonb_build_object('word','cat','phonemes',jsonb_build_array('c','a','t')),
      jsonb_build_object('word','sat','phonemes',jsonb_build_array('s','a','t')),
      jsonb_build_object('word','mat','phonemes',jsonb_build_array('m','a','t')),
      jsonb_build_object('word','hat','phonemes',jsonb_build_array('h','a','t')),
      jsonb_build_object('word','bat','phonemes',jsonb_build_array('b','a','t'))
    )
  ),
  'library'
),
(
  'wordlist',
  'Short I: -it family',
  'sit,hit,fit,pit',
  6, 8, 'beginner',
  jsonb_build_object(
    'slug', 'phonics-cvc-it',
    'activity', 'phonics',
    'words', jsonb_build_array(
      jsonb_build_object('word','sit','phonemes',jsonb_build_array('s','i','t')),
      jsonb_build_object('word','hit','phonemes',jsonb_build_array('h','i','t')),
      jsonb_build_object('word','fit','phonemes',jsonb_build_array('f','i','t')),
      jsonb_build_object('word','pit','phonemes',jsonb_build_array('p','i','t'))
    )
  ),
  'library'
);

commit;

select id, title, metadata->>'slug' as slug, jsonb_array_length(metadata->'words') as word_count
from content
where source = 'library' and type = 'wordlist'
order by title;
