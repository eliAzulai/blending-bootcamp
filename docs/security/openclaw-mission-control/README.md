# OpenClaw + Mission Control Security Policy — v1.1 staging area

**This is a staging area, not the live deployment.** The artifacts below are drafted in the wordpets worktree because that's where the planning conversation lives. Each file has a target deployment path — moving them is a separate step.

## Why these live here

The user's `~/projects/mission-control/` and `~/projects/config/` are real production-touching directories. Staging in the wordpets worktree gives a single reviewable bundle (this commit set) before anything gets copied to its real home. Once reviewed, run the deploy step at the bottom.

## Files in this bundle

### Plan document
| File | Description |
|---|---|
| `security-policy-plan-v1.1.md` | Full v1.1 plan — overlays the 2026-04-28 → 2026-05-02 incident on the v1 architecture. Adds 8 gaps and a P0 phase. |

### P0 policy files (the four most incident-derived)
Target directory for all four: `~/projects/config/` (alongside the existing `openclaw-permissions.policy.json`).

| File | Target path | Addresses |
|---|---|---|
| `p0/channel-identity.policy.json` | `~/projects/config/channel-identity.policy.json` | Gap 1 — bots never bind to personal accounts |
| `p0/namespace-ownership.policy.json` | `~/projects/config/namespace-ownership.policy.json` | Gap 2 — Cursor MCP hijack class of failure |
| `p0/credential-consumers.json` | `~/.openclaw/credential-consumers.json` | Gap 5 — sweep all caches when rotating |
| `p0/containment-register.json` | `~/.openclaw/containment-register.json` | Gap 7 — disabled features + re-enable preconditions |

### Hooks
| File | Target path | Purpose |
|---|---|---|
| `hooks/redact-secrets.sh` | `~/.local/bin/redact-secrets.sh` | Pure stdin→stdout secret redactor (library) |
| `hooks/transcript-redact.sh` | `~/.claude/hooks/transcript-redact.sh` | PostToolUse hook — redacts secrets in just-written transcripts |
| `hooks/test-patterns.sh` | (run in place from staging) | Self-test against synthetic secrets |

### Wrappers (P1 — runtime command wrappers)
| File | Target path | Purpose |
|---|---|---|
| `wrappers/claim-token.sh` | `~/.local/bin/claim-token.sh` | Token-uniqueness gate (Gap 3) — wraps any command that holds a Discord/Telegram/etc bot token; refuses concurrent claims |

## Deploy step (when ready, run from this directory)

```bash
# Policy files (these are user-owned, edit-by-git workflow)
cp p0/channel-identity.policy.json     ~/projects/config/
cp p0/namespace-ownership.policy.json  ~/projects/config/
cp p0/credential-consumers.json        ~/.openclaw/
cp p0/containment-register.json        ~/.openclaw/
chmod 644 ~/projects/config/channel-identity.policy.json ~/projects/config/namespace-ownership.policy.json
chmod 600 ~/.openclaw/credential-consumers.json ~/.openclaw/containment-register.json

# Hooks (executable, on PATH or hook dir)
mkdir -p ~/.local/bin ~/.claude/hooks
cp hooks/redact-secrets.sh    ~/.local/bin/
cp hooks/transcript-redact.sh ~/.claude/hooks/
chmod 755 ~/.local/bin/redact-secrets.sh ~/.claude/hooks/transcript-redact.sh

# Wrappers
cp wrappers/claim-token.sh ~/.local/bin/
chmod 755 ~/.local/bin/claim-token.sh

# Pre-create the directories the wrappers + hooks expect at runtime
mkdir -p ~/.openclaw/token-claims ~/.openclaw/audit
chmod 700 ~/.openclaw/token-claims ~/.openclaw/audit

# Smoke-test the redactor before wiring into settings.json
bash hooks/test-patterns.sh
```

To wire `transcript-redact.sh` as a `PostToolUse` hook, see the plan doc §Gap 4. **Do this last** — settings.json change is the trigger; everything above is dormant until then.

## Status of the four P0 policies (as of 2026-05-04)

- **channel-identity.policy.json** — populated with current real bot IDs and personal identifiers from incident artifacts. WhatsApp `deny_bind` is permanent until separate SIM acquired.
- **namespace-ownership.policy.json** — populated with the 5 known harness dirs. Cursor's outbound scan ban is the explicit fix for the 2026-04-26 hijack class.
- **credential-consumers.json** — seeded with the consumers we know about from `feedback_infisical_rotation_sweep.md` and `reference_telegram_bots.md`. Almost certainly incomplete; treat it as a seed and grow as you discover more during normal work.
- **containment-register.json** — seeded with the 5 features confirmed disabled mid-incident. Each has explicit preconditions before re-enable.

## What this bundle does NOT include (out of scope for these commits)

- The PreToolUse `role-enforce.sh` hook (depends on `agent-roles.policy.json` which v1 introduced — separate effort)
- `claim-token.sh` flock wrapper (Gap 3 — needs to be co-deployed with consumer changes)
- `mc-cli rotate` command (Gap 5 — needs Mission Control side wiring)
- `heartbeat` CLI (Gap 6 — needs job-side wiring on every cron/launchd)
- MC server.js modifications (Gap 8 — biggest delta, separate effort)

These are tracked in the v1.1 plan §"Updated migration plan" — most land in P1-P4 after the P0 ground is solid.
