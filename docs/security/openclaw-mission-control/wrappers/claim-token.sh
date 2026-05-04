#!/usr/bin/env bash
# claim-token.sh — token-uniqueness gate for externally-rate-limited resources.
#
# Closes Gap 3 of the security policy v1.1: prevents two processes on this
# machine from concurrently holding the same gateway token. The 2026-04-26→29
# incident was Cursor's anysphere.cursor-mcp + OpenClaw both claiming the
# asterix Discord bot token (Discord enforces ONE gateway connection per
# token); 6 zombie bridges stacked over 3 days, repeated reconnect-storm.
#
# Mechanism: noclobber-based atomic file creation per resource at
# ~/.openclaw/token-claims/<resource>.lock. `(set -o noclobber; > file)`
# fails atomically if the file exists, succeeds atomically if it doesn't —
# this is POSIX, works on macOS without any external util (flock is
# Linux-only / requires Homebrew util-linux). Stale locks (PID dead) are
# auto-recovered inline with an audit event. Every claim, release, conflict,
# and recovery writes a JSONL line to ~/.openclaw/audit/YYYY-MM-DD.jsonl.
#
# Trade-off vs flock: the kernel doesn't auto-release the lockfile on
# ungraceful termination. We mitigate via (a) trap on EXIT to delete the
# lockfile in normal-exit and most-signal cases, and (b) inline stale-PID
# recovery on the next claim attempt. SIGKILL still leaks until the next
# claim, which the recovery path then cleans up.
#
# Usage:
#   claim-token.sh <resource> -- <command> [args...]
#       Acquire the lock for <resource>, run <command>, release on exit.
#       Exits 1 immediately if another live process holds the lock.
#       Exits with the wrapped command's exit code on success.
#
#   claim-token.sh --status [<resource>]
#       List current claim(s). With no arg: every lock in token-claims/.
#       With <resource>: just that one. Always exits 0.
#
#   claim-token.sh --release <resource>
#       Operator override — force-release the lock. Audit-logged loudly.
#       Use when a holder process is hung but flock can't tell (zombie
#       child of dead parent, etc.).
#
#   claim-token.sh --help
#       Print this header.
#
# Resource naming convention (match channel-identity.policy.json bot ids):
#   asterix-discord, claudecode-discord
#   marline-telegram, kira-telegram
#   <dedicated-sim>-whatsapp  (when re-enabled per channel-identity policy)
#
# Source: docs/security/openclaw-mission-control/wrappers/claim-token.sh
# Target deploy path: ~/.local/bin/claim-token.sh
#
# Design notes:
# - flock is the right primitive here, not just a PID file: flock survives
#   ungraceful termination (the kernel releases the lock when the process
#   dies). PID files leak.
# - We still WRITE the PID + metadata into the lockfile body for human/MC
#   inspection and stale recovery (when the lock IS released but the
#   contents tell us who last held it).
# - Audit log is JSONL, one event per line. MC's coordinator (Gap 8 / P4)
#   will tail this file to surface conflicts and current holders.

set -euo pipefail

CLAIMS_DIR="${OPENCLAW_TOKEN_CLAIMS_DIR:-$HOME/.openclaw/token-claims}"
AUDIT_DIR="${OPENCLAW_AUDIT_DIR:-$HOME/.openclaw/audit}"

usage() {
  sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
}

# Append a single JSONL event to today's audit log. Fields are flat to keep
# downstream parsing trivial. Never fails the main flow if logging fails —
# audit is best-effort for the operator, not load-bearing for correctness.
#
# Pass values to Python via env vars instead of bash parameter substitution
# inside the heredoc. Avoids `${var@Q}` (bash 4.4+) which the macOS-default
# bash 3.2 doesn't support, and avoids manual shell-escaping of values that
# may contain quotes/backticks/dollar signs.
audit() {
  local event="$1"
  local resource="${2:-}"
  local extra_json="${3:-}"
  local logfile="$AUDIT_DIR/$(date +%Y-%m-%d).jsonl"
  mkdir -p "$AUDIT_DIR" 2>/dev/null || return 0
  CT_EVENT="$event" CT_RESOURCE="$resource" CT_EXTRA="$extra_json" \
  CT_PID="$$" CT_PPID="$PPID" CT_CWD="$PWD" \
  python3 -c '
import json, os, time
record = {
    "ts": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
    "tool": "claim-token",
    "event": os.environ["CT_EVENT"],
    "resource": os.environ["CT_RESOURCE"],
    "pid": int(os.environ["CT_PID"]),
    "ppid": int(os.environ["CT_PPID"]),
    "cwd": os.environ["CT_CWD"],
}
extra = os.environ.get("CT_EXTRA", "")
if extra:
    try:
        record.update(json.loads(extra))
    except (ValueError, TypeError):
        record["_extra_raw"] = extra
print(json.dumps(record))
' >> "$logfile" 2>/dev/null || true
}

# Check whether the PID in an existing lockfile is still alive.
# Returns 0 if alive, 1 if dead/missing.
is_holder_alive() {
  local lockfile="$1"
  [ -f "$lockfile" ] || return 1
  local body
  body=$(cat "$lockfile" 2>/dev/null) || return 1
  local pid="${body%%:*}"
  [[ "$pid" =~ ^[0-9]+$ ]] || return 1
  kill -0 "$pid" 2>/dev/null
}

cmd_status() {
  local target="${1:-}"
  mkdir -p "$CLAIMS_DIR"
  local found=0
  for lockfile in "$CLAIMS_DIR"/*.lock; do
    [ -f "$lockfile" ] || continue
    local resource
    resource=$(basename "$lockfile" .lock)
    if [ -n "$target" ] && [ "$target" != "$resource" ]; then
      continue
    fi
    found=1
    local body
    body=$(cat "$lockfile" 2>/dev/null || echo "")
    local pid="${body%%:*}"
    local rest="${body#*:}"
    if [ -n "$body" ] && kill -0 "$pid" 2>/dev/null; then
      echo "  $resource: HELD by pid=$pid ($rest)"
    elif [ -n "$body" ]; then
      echo "  $resource: STALE (recorded pid=$pid is dead; $rest)"
    else
      echo "  $resource: empty lockfile (corrupt)"
    fi
  done
  [ "$found" -eq 0 ] && echo "  (no claims)"
  return 0
}

cmd_release() {
  local resource="${1:?--release requires <resource>}"
  local lockfile="$CLAIMS_DIR/$resource.lock"
  if [ ! -f "$lockfile" ]; then
    echo "ERROR: no lockfile at $lockfile" >&2
    return 1
  fi
  local body
  body=$(cat "$lockfile" 2>/dev/null || echo "")
  audit "force_release" "$resource" "{\"prior_holder\":\"$body\"}"
  rm -f "$lockfile"
  echo "Force-released: $resource (prior holder: $body)" >&2
  return 0
}

cmd_claim_and_run() {
  local resource="$1"
  shift
  if [ "${1:-}" != "--" ]; then
    echo "ERROR: command separator '--' required between resource and command" >&2
    echo "Usage: claim-token.sh $resource -- <command> [args...]" >&2
    return 2
  fi
  shift  # consume the --
  if [ "$#" -eq 0 ]; then
    echo "ERROR: no command given after --" >&2
    return 2
  fi

  mkdir -p "$CLAIMS_DIR"
  local lockfile="$CLAIMS_DIR/$resource.lock"

  local comm
  comm=$(ps -o comm= -p $$ 2>/dev/null | xargs basename 2>/dev/null || echo "claim-token")
  local body_payload
  body_payload="$$:$(date +%Y-%m-%dT%H:%M:%S%z):$comm:$PWD"

  # Atomic acquire via noclobber: succeeds iff the file does not exist.
  # Two-phase to handle stale recovery: try → if fail, check liveness → if
  # dead, audit + remove + retry once.
  if ! (set -o noclobber; printf '%s' "$body_payload" > "$lockfile") 2>/dev/null; then
    # File exists — check whether the recorded holder is still alive.
    if ! is_holder_alive "$lockfile"; then
      local stale_body
      stale_body=$(cat "$lockfile" 2>/dev/null || echo "")
      audit "stale_recovery" "$resource" "{\"stale_holder\":\"$stale_body\"}"
      rm -f "$lockfile"
      # Retry once after recovery.
      if ! (set -o noclobber; printf '%s' "$body_payload" > "$lockfile") 2>/dev/null; then
        # Lost a race with another live claimant during recovery — fall through
        # to the conflict path.
        :
      else
        # Successfully claimed after stale recovery. Continue to run.
        body_payload=""  # signal: no further conflict path
      fi
    fi
  else
    body_payload=""  # signal: clean acquire on first try
  fi

  if [ -n "$body_payload" ]; then
    # We did NOT acquire the lock — another live process holds it.
    local body
    body=$(cat "$lockfile" 2>/dev/null || echo "(unknown)")
    audit "conflict" "$resource" "{\"current_holder\":\"$body\",\"would_run\":\"$*\"}"
    {
      echo "ERROR: $resource is currently held by another process."
      echo "  Current holder: $body"
      echo "  Refusing to claim concurrently — Discord/Telegram enforce ONE"
      echo "  gateway connection per token; concurrent claims cause kicks."
      echo
      echo "  See current claims:    claim-token.sh --status"
      echo "  Force-release (audit): claim-token.sh --release $resource"
    } >&2
    return 1
  fi

  # We hold the lock. Set up a trap so the lockfile is removed on normal
  # exit AND on most signals. SIGKILL/SIGSTOP can't be trapped — a future
  # claim attempt will detect via stale-PID recovery and clean up.
  trap 'rm -f "'"$lockfile"'" 2>/dev/null' EXIT INT TERM HUP

  audit "claim" "$resource" "{\"command\":\"$*\"}"

  # Run the wrapped command. Capture exit code so we can audit it.
  local exit_code=0
  "$@" || exit_code=$?

  audit "release" "$resource" "{\"exit_code\":$exit_code}"
  # Explicit release — the EXIT trap will also fire and rm again, harmless.
  rm -f "$lockfile" 2>/dev/null || true

  return $exit_code
}

# Argument dispatch. Order matters: --help / --status / --release before the
# positional resource path so flags don't get treated as resource names.
case "${1:-}" in
  --help|-h)
    usage
    ;;
  --status)
    shift
    cmd_status "${1:-}"
    ;;
  --release)
    shift
    cmd_release "${1:-}"
    ;;
  "")
    echo "ERROR: no resource given. Run --help for usage." >&2
    exit 2
    ;;
  -*)
    echo "ERROR: unknown flag: $1" >&2
    exit 2
    ;;
  *)
    cmd_claim_and_run "$@"
    ;;
esac
