# Supabase Restore Runbook

The Supabase project (legacy name `blending-bootcamp`) is **paused** (as of
2026-07-13, second pause). Everything below is gated on restoring it. Run the
steps in order; each is blocking for the ones after it.

## 1. Restore the Supabase project

Supabase dashboard → project → Restore. Paused projects keep their data;
verify the `students`, `practice_sessions`, `content` tables have rows after
restore before proceeding.

## 2. Apply the pet reward system migration (BEFORE any deploy)

```sh
scripts/db.sh -f supabase/migrations/20260713_pet_reward_system.sql
```

Creates `pet_care_events` + RLS, the `care_for_pet` RPC, the
`students.coins >= 0` constraint, and extends `activity_attempts.activity_type`
with `letter_hunt`. The app build on `main` fails closed without it (care UI
hides itself), but the feature is dead until this runs.

Verify: `select proname from pg_proc where proname = 'care_for_pet';` returns
one row, and inserting a care event via the RPC as a test parent decrements
coins atomically.

## 3. Top up / rotate the OpenAI key

`OPENAI_API_KEY` in Infisical project `2423b7fc` (blending-bootcamp) is out of
credits (since 2026-04-23). Whisper transcription (`/api/transcribe`, Read
Aloud) and the voice-buddy spike are dead until topped up. After updating
Infisical: `npm run pull-secrets` locally; redeploy for prod.

## 4. Merge/deploy the restore-gated PRs

- PR #6 (gated on restore — see project memory).
- `main` already carries the pet reward system (merged 2026-07-18).

## 5. Deploy and smoke-test

Deploy `main` to app.wordpets.xyz, then with a real test student account:

1. `/student` renders; care buttons appear (verb hidden if unaffordable).
2. Tap a care verb → reaction plays, coins decrement, refresh persists it.
3. Complete a practice session → "+coins", "learned your word" card with TTS.
4. `/student` now shows the Letter Hunt entry; play a round; confirm a
   `letter_hunt` row landed in `activity_attempts` attached to today's
   session (NOT a new session row).
5. `/teacher` shows the MetricStrip (success metric %) and the student's
   session history with the Letter Hunt chip.

## 6. Before students use the new build

- Show Ilana the R26 amendment (`docs/non-negotiable-rules.md`) and the
  `/dev/pet` harness. If she vetoes motion, switch care reactions to static
  emoji/label swap (see 2026-07-13 spec, grilling decision #7).

## 7. Start the measurement clock

The Phase 1a metric (>=60% at 4+ days/week) is now instrumented on `/teacher`.
Note the deploy date; the 4-week evaluation window starts at the first assigned
practice after restore. Run the rush-through guardrail query (spec, decision
#6) ~2 weeks after Letter Hunt has usage.
