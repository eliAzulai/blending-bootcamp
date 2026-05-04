# Security Policy & Permission Infrastructure for OpenClaw + Agentic Harnesses
## Plan v1.1 — incorporating the 2026-04-28 → 2026-05-02 incident

**Status:** Drafted 2026-05-04. Supersedes v1 (which only existed in conversation form, never landed). v1.1 = v1's 5-layer architecture + 8 incident-derived additions + a new P0 phase.

**Audience:** future Claude / Codex / human reading this to understand WHY the policy looks the way it does.

**Source incident report:** `~/security-incident-2026-04-29/{FINDINGS,TIMELINE,ROTATION-MAP}.md`. Read those first if you want the raw evidence; this plan is the synthesis.

---

## TL;DR

The v1 plan governs each agentic harness *internally* (roles, capabilities, sandbox, audit, MC observer). The 2026-04-28 incident proved the harder problem is what happens **between** harnesses on one machine: third-party tools (Cursor) auto-discovering AI tool dirs without consent, identity-binding failures (WhatsApp on personal SIM), credential-cache sweep gaps, and silent-failure of headless jobs. v1.1 keeps every v1 layer and bolts on 8 inter-harness concerns. A new P0 phase lands the four most incident-specific items in 2-3 days because the response work already proved out half of it.

---

## What stays from v1 (core architecture)

```
┌─────────────────────────────────────────────────────────────────────┐
│  L5  Mission Control          observe / revoke / coordinate         │
├─────────────────────────────────────────────────────────────────────┤
│  L4  Audit + alerting         JSONL event log + anomaly views       │
├─────────────────────────────────────────────────────────────────────┤
│  L3  PreToolUse hooks         hard-enforce policy at runtime        │
├─────────────────────────────────────────────────────────────────────┤
│  L2  Settings hierarchy       managed > project > user              │
├─────────────────────────────────────────────────────────────────────┤
│  L1  OS sandbox               Seatbelt / bubblewrap                 │
└─────────────────────────────────────────────────────────────────────┘
```

**Roles** (in `~/projects/config/agent-roles.policy.json` — to be drafted in P1): `dev_engineer`, `researcher`, `ops_assistant`, `publisher`, `background_cron`. Each role has `capabilities`, `denyDomains`, `askDomains`, `sandbox`, `interactive`, `perActionApproval`. An agent can hold exactly one role. Promotion = git commit, not runtime toggle.

**Resource domains** (already in `~/projects/config/openclaw-permissions.policy.json`): `workspace`, `personal_comms`, `calendar_tasks`, `secrets`, `finance`, `external_publish`. Sensitivity tiers low/medium/high/critical.

**Trusted-tasks fast path** (`~/.openclaw/trusted-tasks.json`): `(role, command-pattern, cwd-glob, hash, expires)` triples with 90-day TTL. Bypasses the prompt for repeatable safe commands — only after they're git-committed with a written rationale.

**Mission Control's role:** observe + revoke ONLY. Granting requires a git commit. MC runs as a user with no write access to policy files.

---

## The 8 v1.1 additions (incident-derived)

Each subsection is structured: **Incident → Why v1 missed it → v1.1 addition → Concrete deliverable**.

### Gap 1 — Channel identity policy

**Incident:** OpenClaw was attached to `+972549961347` — your personal SIM. WhatsApp `dmPolicy=allowlist` made the bot auto-reply with pairing codes (`PTUKVDSL`, `ERYXT5QX`) to two real friends (Chana Flam, Herschel) on Apr 28 at 20:25-20:28 Israel time. From their perspective, your number was sending phishing-looking codes.

**Why v1 missed it:** v1 governs *what tools an agent can use*, not *what real-world identity a tool is allowed to bind to*. Same action (sending a message) is fine from `@Marline_family_bot` and catastrophic from `+972549961347`.

**v1.1 addition:** A new top-level policy `channel-identity.policy.json` (P0). Lists allowed bot identities, quarantined personal identifiers, and `deny_bind` rules with permanent containment for phone-number-bound channels (WhatsApp, iMessage) until a dedicated SIM is acquired. Default `auto_reply_default: silent_ignore` for non-allowlisted DMs. `ask_before_emitting` patterns force per-message approval for any send that contains pairing-code-shaped strings to a human identity.

**Concrete deliverable:** `p0/channel-identity.policy.json` — written, deploys to `~/projects/config/`. PreToolUse channel-identity-check.sh consults it (P3).

`★ Insight ─────────────────────────────────────`
The deepest lesson from incident #1: permission systems traditionally model *what an agent can do*. They also need to model **whose identity the agent speaks from**. Same action through a different identity has different blast radius. This is the missing first-class concept.
`─────────────────────────────────────────────────`

### Gap 2 — Namespace ownership

**Incident:** Cursor's `anysphere.cursor-mcp` extension auto-scanned `~/.claude/plugins/` without consent (since 2026-04-26), registered every plugin as a Cursor MCP server, and stacked **6 zombie bridge processes** by 2026-04-29. Discord enforces 1 gateway per token → asterix slot race → kicks → OpenClaw and Cursor bridges bouncing each other off the gateway for 3 days.

**Why v1 missed it:** v1 assumed each harness reads only its own config dir. Reality: third-party tools auto-discover by convention. Claude Code's permission system can't bind Cursor.

**v1.1 addition:** `namespace-ownership.policy.json` (P0) declares one owner per AI-tool dir, an explicit `outbound_scans_blocked` list for Cursor, daily sentinel checks for the known footguns (cursor-mcp extension reappearing after Cursor app updates, discord plugin auto-restoring after Claude Code plugin sync). Drop a `.no-auto-discovery` sentinel in each protected dir as a low-cost signal.

**Concrete deliverable:** `p0/namespace-ownership.policy.json` — written, deploys to `~/projects/config/`. Daily sentinel scan via launchd (P1, write-mode in P4).

### Gap 3 — Token-uniqueness gate

**Incident:** Discord enforces 1 gateway connection per bot token. 6 stale Cursor bridges + OpenClaw raced for the asterix slot. Same vulnerability exists for any externally-rate-limited credential.

**Why v1 missed it:** v1 controls *what an agent can do with a token* but not *how many processes can hold a token concurrently*.

**v1.1 addition:** A token-claim lockfile per externally-rate-limited resource at `~/.openclaw/token-claims/`. Every consumer wraps its token use in `flock -nx`. Two claims in 60s for the same token = high-priority audit alert.

**Concrete deliverable:** `~/.local/bin/claim-token.sh` flock wrapper + per-consumer integration (P0 lockfile dir; integration in P1-P2 as each consumer is touched).

### Gap 4 — Secrets-aware command wrappers + transcript redaction

**Incident:** `pull-env.sh open-brain prod` (without `--check-only`) printed live `MCP_ACCESS_KEYS` to a Claude Code transcript. Forced rotating all 6 keys + CLIENT_SECRET + SUPABASE_DB_PASSWORD. `ROTATION-MAP.md` shows the same `INFISICAL_CLIENT_SECRET` value appearing in 20+ Codex shell snapshots and session jsonl files plus dozens of OpenClaw plugin runtime files. Every AI tool that captures terminal I/O is a leak surface.

**Why v1 missed it:** v1's deny list covered `Read(./.env*)` but didn't model commands that *legitimately retrieve secrets and dump them to stdout*.

**v1.1 addition:** Three layers, **deployed across two phases**:
1. **P0.5** — Secret-fetching wrappers default to redacted output. `--show-values` requires confirmation prompt. Specifically: `~/.local/bin/pull-env.sh` shadows the existing one and adds the gate. (P0.5 is a dedicated phase between P0 and P1 — see migration table — because `pull-env.sh` is the **incident root command path**, while the rest of the redaction stack is defense-in-depth. P0.5 ships within 48h of P0, ungated by P1 work.)
2. **P3** — PreToolUse hook auto-detects secret-fetching commands and forces a recording-aware redaction wrapper for any sibling secret-fetcher we missed.
3. **P0 (detection-only) → P2 (active rewrite)** — PostToolUse hook scans tool outputs for known secret patterns. **P0 ships detection-only**: writes a JSONL audit event to a sidecar at `<transcript_path>.redacted-events.jsonl` recording WHAT KIND of secret was caught (no values, no positions). The original transcript is **NOT modified** at P0 — chain-of-custody preserved, learning gathered. **P2 wires the active in-place rewrite path** that uses the same hook with `.pre-redact` backup file alongside any rewritten transcript. The split is deliberate: detection-first lets us calibrate false-positive rates against real session data before doing anything destructive to the canonical transcript. Patterns: Anthropic (`sk-ant-`), OpenAI (`sk-...`), OpenRouter (`sk-or-...`), Telegram bot tokens (`^[0-9]+:[A-Za-z0-9_-]{35}$`), Discord bot tokens, Infisical secrets, Supabase JWTs (`eyJ...`), AWS (`AKIA...`), GitHub (`ghp_`, `gho_`, `ghs_`, `ghr_`, `github_pat_`).

**Concrete deliverables in this commit set:** `hooks/redact-secrets.sh` (library, fail-closed on exception — never echoes input) + `hooks/transcript-redact.sh` (PostToolUse hook, in-process importlib import of the library, sidecar audit event only). Wrapper for `pull-env.sh` lands in P0.5 (separate, ships within 48h). Active in-place transcript rewrite lands in P2.

`★ Insight ─────────────────────────────────────`
The non-obvious rotation cost wasn't the rotation itself — it was discovering 20+ leak locations in AI tool session logs. **Every AI tool is a recording device for every other AI tool's mistakes.** Active redaction at write-time is the eventual goal (P2), but P0 deliberately ships detection-only so the false-positive rate can be measured against real session data before anything destructive runs against a live transcript. The sidecar audit event tells us which kinds we'd be redacting, in what session, without yet touching the canonical file.
`─────────────────────────────────────────────────`

### Gap 5 — Credential consumer registry

**Incident:** Rotated `INFISICAL_CLIENT_SECRET` → updated Keychain → forgot `~/.config/open-brain/infisical-creds.env`. Obsidian launchd 03:15 silently failed for 3 nights. Caught by accident on 2026-05-02 when a SQL backfill task tripped over the same auth chain.

**Why v1 missed it:** v1 doesn't model "every place a credential is cached."

**v1.1 addition:** `credential-consumers.json` is the **canonical registry SCHEMA + initial seed inventory** at P0. The file ships with `"status": "seed_inventory"` at the top level — explicit acknowledgement that it's incomplete (it has TODOs for ANTHROPIC_API_KEY, marline-side tokens, and a `<TODO-fill...>` placeholder for the ClaudeCode discord bot id we never confirmed). `mc-cli rotate <CRED>` (lands in P1) MUST gate on the `validate_credential` rule per credential before treating any rotation as transactional: refuses to rotate if the entry has `_planned: true` consumers, contains string TODO placeholders, has unreachable consumer paths, or has unreachable consumer hosts. Rotating a credential that fails validation is a **runtime error**, not a warning. Adding a new consumer of a registered credential without listing it here is a **lint error**.

**Concrete deliverable:** `p0/credential-consumers.json` — written with seed_inventory status + validate_credential rule, deploys to `~/.openclaw/`. `mc-cli rotate` command lands in P1, gated on validate_credential.

### Gap 6 — Heartbeat / silent-failure detection

**Incident:** Obsidian launchd ran 03:15 nightly, silently failed for 3 nights, only caught by accident.

**Why v1 missed it:** v1 has audit log for tool *invocations* but not for *expected runs that didn't happen*.

**v1.1 addition:** Every cron/launchd/headless job writes a heartbeat to `~/.openclaw/heartbeats.jsonl`. A daily watchdog at 04:00 audits against `~/.openclaw/expected-heartbeats.json` (registry of job + cron expression + max acceptable lag). Missing job entry = caught at audit step. Failed heartbeat = alert.

**Concrete deliverable:** `~/.local/bin/heartbeat` CLI + daily audit job — P1. MC consumes heartbeats.jsonl for "freshness" view.

### Gap 7 — Containment register

**Incident:** Both Mac Telegram channels are currently `enabled: false` because the env-hydration wrapper was disabled mid-incident. Watchdog disabled. WhatsApp removed. Discord plugin renamed. Cursor MCP extension quarantined. **Nothing tracks the conditions that need to be met before flipping any of these back on.**

**Why v1 missed it:** v1 has trusted-tasks (positive list) but no parallel disabled-features list with re-enable preconditions.

**v1.1 addition:** `containment-register.json` (P0) lists every disabled feature, the incident that disabled it, and explicit preconditions before re-enable. Each precondition is a shell check that returns ok/pending. MC surfaces these as persistent banner items. Re-enable requires all preconditions passing AND writes a "lifted from containment" audit event.

**Concrete deliverable:** `p0/containment-register.json` — written, deploys to `~/.openclaw/`. MC banner UI is P4.

### Gap 8 — Inter-harness coordinator (the meta-gap)

**Incident:** FINDINGS line 120: *"5 different AI tools that overlap on the same machine ... interactions are not orchestrated by anyone."*

**Why v1 missed it:** v1 governs each harness internally. Nobody sees the machine-wide picture.

**v1.1 addition:** MC absorbs three coordinator responsibilities (still observe + revoke, never grant):

| Responsibility | Concrete |
|---|---|
| Token-claim referee | Watches `~/.openclaw/token-claims/*.lock`. Alerts on conflicts. Displays current holder per token. |
| Namespace sentinel | Daily scan: any process with `~/.claude/`, `~/.openclaw/`, `~/.codex/`, `~/.hermes/` in its open files that isn't the registered owner → alert. |
| Containment register surfacing | Persistent banner with disabled features + precondition status + click-to-recheck. Never click-to-enable. |

Cross-host: scan also runs on Hetzner via SSH (read-only) and m1book the same. One MC = one operator view across all three machines.

**Concrete deliverable:** `mission-control/lib/{token-claim-referee,namespace-sentinel,containment-register-view}.js` — P4. Largest delta in the plan.

---

## Updated v1.1 architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  L5  Mission Control          observe / revoke / coordinate         │
│      + token-claim referee    + namespace sentinel  + containment   │
├─────────────────────────────────────────────────────────────────────┤
│  L4  Audit + alerting         + heartbeat watchdog                  │
│                               + transcript redaction (write-time)   │
├─────────────────────────────────────────────────────────────────────┤
│  L3  PreToolUse hooks         + channel-identity check              │
│                               + secret-pattern wrapper             │
├─────────────────────────────────────────────────────────────────────┤
│  L2  Settings hierarchy       + namespace ownership policy          │
│                               + token-claim lockfile gate           │
├─────────────────────────────────────────────────────────────────────┤
│  L1  OS sandbox               + credential-consumer registry        │
│                                 (OS-level enforced where possible)  │
└─────────────────────────────────────────────────────────────────────┘
```

## Files added in v1.1 (delta only)

```
~/projects/config/
  channel-identity.policy.json        ← NEW (Gap 1)        ← P0
  namespace-ownership.policy.json     ← NEW (Gap 2)        ← P0
  agent-roles.policy.json             ← NEW (v1)           ← P1

~/.openclaw/
  token-claims/                       ← NEW dir (Gap 3)    ← P0 dir, P1 wrappers
  credential-consumers.json           ← NEW (Gap 5)        ← P0
  heartbeats.jsonl                    ← NEW (Gap 6)        ← P1
  expected-heartbeats.json            ← NEW (Gap 6)        ← P1
  containment-register.json           ← NEW (Gap 7)        ← P0
  trusted-tasks.json                  ← NEW (v1)           ← P3

~/.local/bin/
  pull-env.sh                         ← REPLACE (Gap 4)    ← P2
  redact-secrets.sh                   ← NEW (Gap 4)        ← THIS COMMIT
  claim-token.sh                      ← NEW (Gap 3)        ← P1
  rewrite-infisical-creds             ← NEW (Gap 5)        ← P1
  heartbeat                           ← NEW (Gap 6)        ← P1
  mc-cli                              ← NEW (Gap 5,7)      ← P1-P2

~/.claude/hooks/
  channel-identity-check.sh           ← NEW (Gap 1)        ← P3
  secret-pattern-wrapper.sh           ← NEW (Gap 4)        ← P2
  transcript-redact.sh                ← NEW (Gap 4)        ← THIS COMMIT
  role-enforce.sh                     ← NEW (v1)           ← P3

/Library/Application Support/ClaudeCode/
  managed-settings.json               ← NEW (v1)           ← P2

~/projects/mission-control/lib/
  token-claim-referee.js              ← NEW (Gap 8)        ← P4
  namespace-sentinel.js               ← NEW (Gap 8)        ← P4
  containment-register-view.js        ← NEW (Gap 7,8)      ← P4
  policy-reader.js                    ← NEW (v1)           ← P4
```

## Migration plan

| Phase | Scope | Days | Reversible? |
|---|---|---|---|
| **P0 (week 0)** | Land Gaps 1, 3 (lockfile dir), 5, 7 — channel identity + token claim infra + cred registry + containment register. **All four files written; deploy is a copy step.** | 2-3 | yes |
| **P0.5 (within 48h of P0 — NOT gated on P1 work)** | Replace `~/.local/bin/pull-env.sh` with the safe wrapper: defaults to `--check-only` (metadata only), requires confirm prompt for `--show-values`. This is the **incident root command path** — shipping the policy bundle (P0) without this lets the same leak class recur. Single-purpose, single-commit phase. | 0.5-1 | yes — old wrapper backed up at `~/.local/bin/pull-env.sh.pre-p0.5` |
| **P1 (week 1)** | Schema + audit (read-only). Stand up heartbeat (Gap 6), namespace sentinel scan in read-only mode (Gap 2 monitor), claim-token.sh wrapper (Gap 3 enforcement), mc-cli rotate (Gap 5 transactional, gated on `validate_credential`). Write `agent-roles.policy.json`. | 3-5 | yes |
| **P2 (week 2)** | Managed settings + sandbox floor. **Active in-place transcript rewrite** (Gap 4): switch transcript-redact.sh from sidecar-detection to in-place rewrite with `.pre-redact` backup. Wrap remaining secret-fetching commands not covered by P0.5 (PreToolUse auto-detection). Install transcript-redact.sh as PostToolUse hook in `~/.claude/settings.json`. | 3-5 | yes — managed settings have `disableBypassPermissionsMode` for circuit-breaker; transcript backup file enables manual revert |
| **P3 (week 3)** | PreToolUse hook (`role-enforce.sh`) + channel-identity-check hook (Gap 1 enforcement, consumes the structured `ask_before_emitting.rules` schema) + trusted-tasks.json seeded from P1 audit data. | 3-5 | yes |
| **P4 (week 4)** | MC lockdown: drop write endpoints, add token-claim referee + namespace sentinel write-mode (with parent-process matching, NOT just process-name whitelist) + containment-register banner UI (Gap 8). Set policy files root-owned. Flip `allowManagedPermissionRulesOnly: true`. | 5-7 | yes via git revert |

Each phase is reversible. None requires a big rewrite. P0 is intentionally tiny and immediate. **P0.5 is the load-bearing follow-up** — if P0.5 drifts behind P1, the plan effectively still leaves the incident root unmitigated. Treat P0.5 missing the 48h deadline as a planning failure that triggers re-review of the whole rollout sequence.

---

## Threat model (unchanged from v1, expanded)

| Threat | Realistic vector | v1.1 mitigation |
|---|---|---|
| Prompt injection via untrusted content | Web pages, GitHub READMEs, Discord/Telegram messages, documents | L1 sandbox + L2 deny floor + L3 hooks |
| Lateral creep across resource domains | Dev agent starts touching `personal_comms`, `secrets`, `finance` | Roles with `denyDomains` (L3 hook) |
| Cron / background agent silent escalation | Scheduled agent quietly starts running new tools | `background_cron` role + heartbeat monitoring (Gap 6) + namespace sentinel (Gap 2) |
| MC integration → permission laundering | MC becomes the click-through surface | MC observe + revoke ONLY (architectural) |
| Trusted-but-stale rules | 6-month-old "always allow" for a tool whose blast radius grew | Trusted-tasks 90d TTL |
| Cross-host inconsistency | Mac approves X, Hetzner approves Y, m1book approves Z | Single policy files in dotfiles repo, pulled by all hosts |
| **Bot-on-personal-account leakage** (NEW) | Bot bound to personal phone/email/account | Channel identity policy (Gap 1) |
| **Third-party auto-discovery** (NEW) | Cursor scans Claude Code's plugin dir | Namespace ownership + sentinel (Gap 2) |
| **Token gateway race** (NEW) | Two processes claim same Discord/Telegram token | Token-claim lockfile (Gap 3) |
| **Secrets in transcript files** (NEW) | `pull-env.sh` dumps to Claude Code session log | Wrappers + transcript redaction (Gap 4) |
| **Credential cache drift** (NEW) | Keychain rotated, file copies stale | Credential consumer registry (Gap 5) |
| **Silent headless failure** (NEW) | Launchd job dies silently for days | Heartbeat audit (Gap 6) |
| **Containment drift** (NEW) | Disabled feature re-enabled before preconditions met | Containment register with blocking preconditions (Gap 7) |
| **Inter-harness coordination failure** (NEW) | 5 AI tools overlap on one machine, none orchestrated | MC coordinator role (Gap 8) |

---

## What's STILL not covered (be honest)

1. **The bot-on-personal-account problem is permanent until you get a separate SIM.** Policy bans it; you still need to acquire the hardware before WhatsApp can come back at all.
2. **Cursor app updates will reinstall `cursor-mcp`** every time. Namespace sentinel catches it post-hoc; the right ultimate fix is a launchd job watching the app bundle.
3. **Codex's session jsonl files** still accumulate secrets historically (see ROTATION-MAP.md). v1.1 prevents future leaks but doesn't clean the past 30+ files. Rotation is the safe answer; in-place scrubbing risks editing forensic evidence.
4. **Hermes is a black box** until we have its logs.
5. **Watchdog correctness** is an ops correctness bug, not a security bug — out of scope for this plan but tracked in containment-register.json with explicit preconditions.
6. **Namespace sentinel relies on parent-process matching, which Linux/macOS doesn't make trivially robust.** v1.1 fixes the obvious "node whitelist too broad" hole by walking ppid → parent comm via `ps -o comm=`, but determined evasion (process renaming, double-fork) can defeat this. Mitigation: combine with the `bun --cwd` pattern check AND the Cursor app-bundle quarantine — three weak signals together are stronger than one strong signal.
7. **Detection-only PostToolUse hook (P0)** does not actually clean leaked secrets from transcripts — it only records what would be redacted. P2 active rewrite is what closes this loop. Until then, redacted-events.jsonl sidecars give visibility but the canonical transcript still contains the leak. The sequencing is deliberate (detection-first, calibration before destructive action) but means P0→P2 is the load-bearing path for the redaction story, not P0 alone.

---

## Open questions (worth deciding before P1)

1. **Sandbox on Hetzner with `marline` user** — bubblewrap needs unprivileged user namespaces; check `/proc/sys/kernel/unprivileged_userns_clone` before assuming. Fallback `enableWeakerNestedSandbox` is documented as weakening security.
2. **Voice harness** (`~/projects/voice/`) — does it inherit OpenClaw's role or get its own? Recommendation: `voice` is just a UI; it inherits whatever agent it's bridging to.
3. **MCP server trust per role** — `~/.claude.json` has dozens of MCP servers (open-brain, granola, marketing plugins). Should `allowedMcpServers` be role-bound? Strong yes — `dev_engineer` has no business calling `mcp__plugin_marketing_klaviyo__*`. Add to roles in P3.
4. **Per-action approval for `publisher` role** — UX needed. Telegram bot prompt? Inline in harness? Don't route through MC (see §"Mission Control's role").
5. **Policy unreachable failure mode** — recommend fail-closed, mirroring sandbox `failIfUnavailable: true`.

---

## Cross-references

- **v1 conversation thread** — original plan written 2026-05-04 in this worktree's session
- **Incident report** — `~/security-incident-2026-04-29/{FINDINGS,TIMELINE,ROTATION-MAP,CLAUDE}.md`
- **Auto-memory entries** the plan draws from:
  - `project_openclaw_whatsapp_unlinked.md`
  - `project_discord_bridge_zombie_launchers.md`
  - `feedback_infisical_rotation_sweep.md`
  - `project_infisical_state.md`
  - `reference_telegram_bots.md`
  - `reference_discord_bots.md`
- **Existing scaffolding** — `~/projects/config/openclaw-permissions.policy.json` (capability bundles), `~/projects/mission-control/server.js:282` (`permissionSnapshot()`), `~/projects/mission-control/server.js:350` (`/api/permissions/sync`)
- **Claude Code docs informing the design**:
  - https://code.claude.com/docs/en/security
  - https://code.claude.com/docs/en/permissions
  - https://code.claude.com/docs/en/sandboxing
