-- supabase/seed-demo-history.sql
-- One-off: seeds 14 days of fake practice history for the most recently-created student.
-- Paste in Supabase SQL Editor and Run. Idempotent-ish: re-running adds more sessions.

DO $$
DECLARE
  target_student uuid;
  target_session uuid;
  i int;
  practice_date date;
  did_practice boolean;
BEGIN
  -- Pick the most recently created student
  SELECT id INTO target_student
  FROM students
  ORDER BY created_at DESC
  LIMIT 1;

  IF target_student IS NULL THEN
    RAISE EXCEPTION 'No students found. Create a student first via the app.';
  END IF;

  RAISE NOTICE 'Seeding history for student: %', target_student;

  -- 14 days back to today. Practice on ~9 of 14 days = ~64% (close to success metric)
  FOR i IN 0..13 LOOP
    practice_date := current_date - i;

    -- Skip a few days (no practice = gaps in heatmap)
    did_practice := i NOT IN (1, 4, 7, 10, 12);

    IF did_practice THEN
      INSERT INTO practice_sessions (
        student_id, date, duration_seconds, coins_earned, completed
      ) VALUES (
        target_student,
        practice_date,
        420 + (i * 17) % 180,  -- 7-10 min spread
        15 + (i * 3) % 12,     -- 15-25 coins
        true
      )
      RETURNING id INTO target_session;

      -- Insert 3 activity attempts per session (phonics, spelling, read_aloud)
      INSERT INTO activity_attempts (
        session_id, activity_type, content_ref, score, duration_seconds
      ) VALUES (
        target_session, 'phonics', 'phonics-cvc-short-a:cat', 100, 90 + (i * 5) % 30
      );
      INSERT INTO activity_attempts (
        session_id, activity_type, content_ref, score, duration_seconds
      ) VALUES (
        target_session, 'spelling', 'spelling-cvc-1:hat',
        CASE WHEN i % 3 = 0 THEN 67 ELSE 100 END,  -- some imperfect runs
        120 + (i * 7) % 40
      );
      INSERT INTO activity_attempts (
        session_id, activity_type, content_ref, score, duration_seconds, transcript
      ) VALUES (
        target_session, 'read_aloud', 'read-aloud-cat-hat',
        NULL,  -- non-authoritative per spec
        180 + (i * 11) % 60,
        'the cat sat on the mat the cat had a big hat'
      );
    END IF;
  END LOOP;

  -- Also bump the student coins to match
  UPDATE students
  SET coins = coins + 150
  WHERE id = target_student;

  RAISE NOTICE 'Done. Refresh /teacher/students/% to see heatmap.', target_student;
END $$;
