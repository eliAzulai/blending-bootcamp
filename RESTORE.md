# Supabase Restore Runbook

> **Status 2026-08-10:** Supabase **RESTORED**. Steps 1–2 **DONE** (verified
> below). Step 3 (OpenAI credits) is **STILL BLOCKING** — needs a human billing
> action. Steps 4–7 remain.

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
Still outstanding: end-to-end RPC test (care event decrements coins
atomically) — do this during the step 5 smoke test with a real account.

> **Gotcha:** `scripts/db.sh` passes args straight to `psql`, so a bare SQL
> string is silently ignored (exit 0, no output). Use `scripts/db.sh -c "select …"`.

## 3. Top up / rotate the OpenAI key — ❌ STILL BLOCKING

`OPENAI_API_KEY` in Infisical project `2423b7fc` (blending-bootcamp) is out of
credits (since 2026-04-23). **Re-verified 2026-08-10:** the key authenticates
(`/v1/models` → 200) but Whisper returns
`insufficient_quota` / `credit_balance_exhausted`.

Until credits are added **`/api/transcribe` fails** → Read Aloud, the
voice-buddy spike, the adaptive read-aloud checkpoint, and builder voice notes
are all dead. The adaptive loop degrades safely (transcription failures are
flagged as errors, never scored as a child's miss; session ends after 3 aborts),
but no authoritative mastery signal can be recorded.

Add credits at platform.openai.com → billing. If the key is rotated, update
Infisical, then locally:

```sh
export INFISICAL_CLIENT_ID="$(security find-generic-password -s INFISICAL_CLIENT_ID -w)"
export INFISICAL_CLIENT_SECRET="$(security find-generic-password -s INFISICAL_CLIENT_SECRET -w)"
node ~/projects/infisical/pull-env.js 2423b7fc-bb02-4075-aba8-d7d04aacc820 prod .env.local
```

(`npm run pull-secrets` alone fails with a 422 — it does not export the
Infisical machine-identity credentials; the two exports above are required.)
Redeploy for prod.

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
