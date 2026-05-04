# Open Brain capture queue — pending replay

**Status:** 6 captures attempted 2026-05-04 ~19:30; ALL failed with
`Embeddings failed: 401 {"error":{"message":"User not found.","code":401}}`.

The Open Brain Edge Function itself is reachable (the MCP tool calls land
fine and return a structured error), but its outbound call to the embedding
provider (OpenRouter, per `~/projects/open-brain/CLAUDE.md`) returns 401.

**Likely causes (highest first):**
1. `OPENROUTER_API_KEY` in Supabase secrets is invalid, rotated, revoked, or
   expired. Check `https://openrouter.ai/keys` and the Supabase dashboard
   secrets for project `iqloyaonbrjkvhzzsqbl`.
2. OpenRouter account out of credits.
3. The shared `OPENROUTER_API_KEY` in Infisical (`shared/prod`) was rotated
   without updating the Supabase secret. This is the EXACT class of failure
   v1.1 Gap 5 / credential-consumers.json was designed to catch — and the
   registry as shipped does NOT yet include `OPENROUTER_API_KEY`.

**Action items (operator):**
1. Verify the key on OpenRouter dashboard.
2. Update `OPENROUTER_API_KEY` in Supabase secrets (project
   `iqloyaonbrjkvhzzsqbl`) — Supabase dashboard → Edge Functions → Secrets.
3. Add `OPENROUTER_API_KEY` to `~/.openclaw/credential-consumers.json` so
   future rotations sweep the Supabase secret too. (See "Registry update"
   below for the entry to add.)
4. Once the key works, replay these 6 captures by piping each `content`
   block to `mcp__open-brain__capture_thought`.

**Verify the key works again with:**
```bash
mcp__open-brain__search_thoughts("test", limit=1)
```
If it returns a result list (even empty), embeddings are working again.

---

## Registry update suggested

Add this to `~/.openclaw/credential-consumers.json` under `credentials`:

```jsonc
"OPENROUTER_API_KEY": {
  "canonical": { "kind": "infisical", "project": "shared", "env": "prod", "name": "OPENROUTER_API_KEY" },
  "consumers": [
    {
      "path": "Supabase Edge Function secret (project iqloyaonbrjkvhzzsqbl, name OPENROUTER_API_KEY)",
      "consumer": "open-brain-mcp Edge Function — text-embedding-3-small + gpt-4o-mini",
      "rewrite_command": "supabase secrets set OPENROUTER_API_KEY=$NEW --project-ref iqloyaonbrjkvhzzsqbl",
      "post_rotation_check": "see test command above"
    }
  ],
  "post_rotation_health_check": "see test command above",
  "incident_note": "2026-05-04 19:30 — capture_thought + search_thoughts both failed with 401 from embeddings. Caught in arch-reasoning capture session. This entry was missing from the seed inventory at v1.1 P0 ship time."
}
```

---

## Captures to replay (6 thoughts)

Each block below is one `mcp__open-brain__capture_thought` invocation.
Domain defaults to `general` (cross-cutting principles, not family-specific).
Meta fields are recommended but not required.

### Capture 1 — Speaker-identity is its own layer

**meta:** `{"source": "arch-reasoning", "round": "2026-05-04", "framework_move": "right-layer"}`

**content:**
> Architectural pattern (from 2026-05-04 security policy v1.1 work): SPEAKER-IDENTITY IS ITS OWN LAYER. Permission systems traditionally model the action ("can X send a message?") but rarely model the speaker ("whose identity is X attributed to?"). Same action through a different identity has different blast radius. The 2026-04-28 WhatsApp pairing-blast happened because a *permitted* action ran from the wrong identity (user's personal phone number +972549961347 — bot auto-replied with pairing codes to two real friends). Fix: a separate channel-identity policy file controls which real-world identities (phone numbers, emails, accounts) any agent is allowed to attach to in the first place. Conflating action and identity in one policy means you can never make the speaker-identity decision atomic — every per-message check has to re-derive it. When a permission system feels insufficient, ask whether the missing concern is "what" (action), "who" (identity), or "by whose authority" (governance). If two of these conflate, separate them.

### Capture 2 — Granting and observing must not share a surface

**meta:** `{"source": "arch-reasoning", "round": "2026-05-04", "framework_move": "right-layer"}`

**content:**
> Architectural pattern (from 2026-05-04 security policy v1.1 work): GRANTING AND OBSERVING MUST NOT SHARE A SURFACE. Mission Control could naturally absorb both functions (UI for both is similar). The v1.1 plan explicitly forbids it — MC is constrained to "observe + revoke ONLY, never grant." If granting and observing share a surface, every UX improvement to observation creeps into being a UX improvement to granting, and the security UI becomes the weakest link. Granting is a deliberate, traceable, reviewed act (git commit, with rationale, written down). Observation should be frictionless. Asymmetric friction is the FEATURE, not a UX cost. Generalizes: when a tool is asked to do both X and (X-with-elevated-privilege), check whether the elevated path needs a different surface entirely — even if the data and UI shape are similar.

### Capture 3 — COMPROMISE rebuttals only work if they ship

**meta:** `{"source": "arch-reasoning", "round": "2026-05-04", "framework_move": "evidence-vs-aspiration"}`

**content:**
> Architectural pattern (from 2026-05-04 courtroom round): COMPROMISE REBUTTALS ONLY WORK IF THEY SHIP — bake the deadline INTO the plan, not into a backlog TODO. When Codex flagged objection #8 PARTIAL (the incident-root pull-env.sh wrapper deferred to P2), the rebuttal was COMPROMISE: insert a new P0.5 phase containing exactly that one item. Codex accepted IF it shipped within 48h of P0. The phrase "within 48h, NOT gated on P1" was written INTO the migration table of the plan doc itself. Result: P0.5 actually shipped in the same session as P0. If "we should also do P0.5" had been a TODO instead, it would have competed with everything else in P1 work and probably slipped — same end state as if the compromise had never been made. Pattern: any compromise that defers work needs an explicit time/phase commitment in the document that holds the architectural decision, not in a separate TODO list. If the commitment can't be made specific, the compromise is probably aspiration dressed as direction.

### Capture 4 — Verify after edit + runtime probes

**meta:** `{"source": "arch-reasoning", "round": "2026-05-04", "framework_move": "cross-examine"}`

**content:**
> Engineering discipline (from 2026-05-04 courtroom round): VERIFY AFTER EDIT BY RUNNING THE CODE AGAINST CONCRETE INPUTS. The model that just wrote a fix shares the same blind spots as the model that reviews it (because it IS that model). The buggy assumption is also the assumption used to evaluate the fix. Two concrete instances same session: (1) wrote both the redactor (--quiet suppresses the kinds line) AND the hook (parses for that exact line) — the bug was invisible because I held both pieces in my head as "the design," not as "two pieces that have to fit at runtime." Provable in 30 seconds with `printf 'foo' | python3 redact-secrets.sh --quiet 2>&1 1>/dev/null` showing empty stderr. Codex caught it. (2) The fix for #1 (switch to importlib.util) introduced a NEW dead-code path because spec_from_file_location rejects non-.py extensions. Verify step caught it. Same model that just missed the original bug then missed the regression in its own fix. Discipline: after editing code, run the code against an input that would FAIL if the fix is wrong. Don't trust syntax-check or "looks right." Corollary for runtime-capability questions: path-existence tests don't answer runtime questions. `[ -r /dev/tty ]` checks the device file exists (it always does on Unix); the right probe is `(exec </dev/tty) 2>/dev/null` which actually tries to open it. Path-test for a runtime-capability question is the wrong instinct.

### Capture 5 — Reference: security policy v1.1

**meta:** `{"source": "arch-reasoning", "round": "2026-05-04", "kind": "reference", "deploy_status": "P0+P0.5 live"}`

**content:**
> REFERENCE: Security policy v1.1 — canonical multi-harness security framework for OpenClaw + Mission Control + Claude Code + Codex + Hermes on the user's fleet. Built after the 2026-04-28 → 2026-05-02 incident (WhatsApp pairing-blast + Cursor MCP hijack + transcript secret leak + stale credential cache). 5-layer defense in depth: L1 OS sandbox (Seatbelt/bubblewrap) / L2 settings hierarchy (managed > project > user) / L3 PreToolUse hooks (runtime role enforcement, channel-identity check) / L4 audit + alerting (JSONL events, heartbeat, transcript redaction) / L5 Mission Control (observe + revoke ONLY, never grant). 8 incident-derived gaps: channel identity policy, namespace ownership, token-uniqueness gate, secrets-aware wrappers + transcript redaction, credential consumer registry, heartbeat detection, containment register, inter-harness coordinator. As of 2026-05-04, P0 deployed to live paths (~/projects/config/, ~/.openclaw/, ~/.local/bin/, ~/.claude/hooks/) AND P0.5 (pull-env.sh safe-default) deployed; P1-P4 pending. Canonical doc: `~/projects/wordpets/.claude/worktrees/wonderful-easley-c10f28/docs/security/openclaw-mission-control/security-policy-plan-v1.1.md`. Read before designing anything that touches permissions, secrets handling, hooks, agent identity, or cross-tool coordination on this fleet.

### Capture 6 — The three-surface compiler meta-pattern

**meta:** `{"source": "arch-reasoning", "round": "2026-05-04", "kind": "meta-pattern", "topic": "knowledge-distillation"}`

**content:**
> Meta-pattern (from 2026-05-04 session): the "three-surface compiler" for distilling lessons from a long session. A single substantive piece of work produces insights that need THREE different recall modes, not one. (1) Teaching surface — long-form narrative with concrete examples and drill ideas (in this fleet: ~/projects/arch-reasoning/session-log.md). Read deliberately when sitting down to practice. (2) Recall surface — terse memory entries auto-loaded into context whenever future work touches related areas (in this fleet: ~/.claude/projects/-Users-eliHome/memory/ + Open Brain captures). Cost little context budget but rich enough to seed a decision. (3) State surface — project-specific facts about WHERE artifacts live, what's deployed, what's pending (in this fleet: ~/.claude/projects/-Users-eliHome-projects-wordpets/memory/). The split prevents the worst-of-both-worlds outcome where everything is either too long to load every time OR too terse to actually teach from. Same content, three audiences (future-Claude reading at session start, current-self teaching from drills, current-self-tomorrow recovering project context). Apply: at the end of a substantive session, before clearing context, ask "what's the teaching version, what's the loadable-into-context version, what's the next-session-needs-to-know-cold version" and write each separately to its appropriate surface.
