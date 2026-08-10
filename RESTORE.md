# Supabase Restore Runbook

> **Status 2026-08-10: RESTORE COMPLETE — DEPLOYED.** Steps 1–5 done. Supabase
> restored, migrations applied, OpenAI credits added and Whisper verified
> end-to-end, `main` pushed and auto-deployed to app.wordpets.xyz, live routes
> smoke-tested. PR #6 closed as superseded (see step 4).
> **Remaining: step 6** (show Ilana the R26 amendment) and **step 7** (start the
> 4-week measurement clock) — both human steps.

## 1. Restore the Supabase project — ✅ DONE (2026-08-10)

Supabase dashboard → project → Restore. Paused projects keep their data.

Verified after restore: `students` = 3, `practice_sessions` = 20, `content` = 35.

## 2. Apply migrations (BEFORE any deploy) — ✅ DONE (2026-08-10)

```sh
scripts/db.sh -f supabase/migrations/20260702_feedback_notes.sql
scripts/db.sh -f supabase/migrations/20260713_pet_reward_system.sql
```

`20260618_restrict_invite_tokens.sql` was already applied pre-pause (policy
`Teachers manage own invites` present) — do not re-run blindly.

Verified 2026-08-10: `care_for_pet` RPC exists; `pet_care_events` +
`feedback_notes` tables exist; `students_coins_nonneg` constraint present;
`activity_attempts.activity_type` CHECK now accepts `letter_hunt`.
RPC verified 2026-08-10 (inside a rolled-back transaction, no data changed):
with `request.jwt.claims` set to the student's `parent_id`,
`care_for_pet(<student>, 'ball')` moved coins 180 → 170, returned the new
balance, and logged one `pet_care_events` row. Rolled back; coins back to 180.

> **Gotcha:** `scripts/db.sh` passes args straight to `psql`, so a bare SQL
> string is silently ignored (exit 0, no output). Use `scripts/db.sh -c "select …"`.

## 3. Top up / rotate the OpenAI key — ✅ DONE (2026-08-10)

Credits added. **Verified end-to-end 2026-08-10:** generated speech for the word
"cat" (`say` → webm), POSTed to `/v1/audio/transcriptions` with `whisper-1` →
returned `{"text":"cat"}`. That is the exact format and word-shape the adaptive
read-aloud checkpoint uses, so the authoritative mastery path is live, not just
billing-clear.

If the key is ever rotated, update Infisical, then locally:

```sh
export INFISICAL_CLIENT_ID="$(security find-generic-password -s INFISICAL_CLIENT_ID -w)"
export INFISICAL_CLIENT_SECRET="$(security find-generic-password -s INFISICAL_CLIENT_SECRET -w)"
node ~/projects/infisical/pull-env.js 2423b7fc-bb02-4075-aba8-d7d04aacc820 prod .env.local
```

(`npm run pull-secrets` alone fails with a 422 — it does not export the
Infisical machine-identity credentials; the two exports above are required.)
Redeploy for prod.

## 4. Restore-gated PRs — ✅ RESOLVED (2026-08-10)

- **PR #6 CLOSED as superseded**, not merged. Branched 2026-07-06, 25 commits
  behind; its Sound Hunt duplicates `LetterHuntGame` and its **drag**-based Word
  Builder contradicts the **tap-to-place** decision (spec B7, re-confirmed
  2026-08-10). Its `pickFormat` fixed rotation also predates the engine, which
  now chooses from mastery state. Branch `claude/clever-golick-86f785` is
  deliberately **NOT deleted** — Missing Word / cloze, `useTileDrag`, WebAudio
  SFX and the 9 cloze content sets are salvage targets (Todoist, WordPets p3).
  Its migration `supabase/migration-2026-07-06-mini-activities.sql` was NOT
  applied; it belongs with the salvage.
- `main` already carries the pet reward system (merged 2026-07-18).

## 5. Deploy and smoke-test — ⚠️ DEPLOYED, interactive pass still owed

**Deployed 2026-08-10:** `main` pushed (`89314fd`), Vercel auto-deploy landed in
~15s. Live smoke (unauthenticated): `/` 200, `/login` 200, `/student` 307,
`/teacher` 307, `/student/adaptive` 307 (auth redirect — the route exists),
`POST /api/transcribe` 401 (auth-gated, not 5xx).

**Still owed — the authenticated click-through below.** It needs a real student
login, so it is a human step. With a real test student account:

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
