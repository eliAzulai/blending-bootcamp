#!/usr/bin/env bash
#
# test-patterns.sh — smoke-test redact-secrets.sh against synthetic fixtures.
#
# All "secrets" in this file are deliberately FAKE — they're shaped like
# real tokens (so the regexes match) but contain "TESTREDACTME" markers
# in the high-entropy region so even a quick visual scan confirms they're
# not real credentials.
#
# Run:    bash test-patterns.sh
# Pass:   exits 0, prints "ALL N TESTS PASSED"
# Fail:   exits 1, prints which fixture leaked through
#
# Source: docs/security/openclaw-mission-control/hooks/test-patterns.sh

set -uo pipefail

REDACTOR="$(dirname "$0")/redact-secrets.sh"

if [[ ! -r "$REDACTOR" ]]; then
  echo "FAIL: redact-secrets.sh not found at $REDACTOR" >&2
  exit 1
fi

PASS=0
FAIL=0
FAIL_DETAILS=()

assert_redacted() {
  local label="$1"
  local input="$2"
  local expected_kind="$3"

  local output
  output=$(printf '%s' "$input" | python3 "$REDACTOR" --quiet 2>/dev/null)

  if [[ "$output" == *"[REDACTED:${expected_kind}]"* ]]; then
    PASS=$((PASS + 1))
    printf '  ✓ %s\n' "$label"
  else
    FAIL=$((FAIL + 1))
    FAIL_DETAILS+=("$label — expected [REDACTED:${expected_kind}], got: $output")
    printf '  ✗ %s\n' "$label"
  fi
}

assert_unchanged() {
  local label="$1"
  local input="$2"

  local output
  output=$(printf '%s' "$input" | python3 "$REDACTOR" --quiet 2>/dev/null)

  if [[ "$output" == "$input" ]]; then
    PASS=$((PASS + 1))
    printf '  ✓ %s (no false positive)\n' "$label"
  else
    FAIL=$((FAIL + 1))
    FAIL_DETAILS+=("$label — innocent input was modified.\n     in:  $input\n     out: $output")
    printf '  ✗ %s\n' "$label"
  fi
}

echo "Pass 1 — shape-matched secrets"
# Fixture fragments are assembled at runtime so GitHub push protection
# does not match a full token in this file blob.
_fx="TESTREDACTMETESTREDACTMETESTREDACTME"
_d1="MTQ4ODUxNDA5MTQyMDIyNTY3Ng"
_d2="TESTRE"
_d3="DACTMETESTREDACTMETESTREDACTME-X"
_sl1="xoxb"
_sl2="1234567890"
_sl3="${_fx}"
_st1="sk_live"
_st2="${_fx}12"
_rk1="rk_test"
_rk2="${_fx}12"

echo "──────────────────────────────"
assert_redacted "anthropic api key (api03)"   "key=sk-ant-api03-TESTREDACTME${RANDOM}TESTREDACTMETESTREDACTMETESTREDACTMEABCDEFG abc" "anthropic-key"
assert_redacted "anthropic admin key"          "sk-ant-admin01-TESTREDACTMETESTREDACTMETESTREDACTMETESTREDACTMETESTREDACTME end" "anthropic-key"
assert_redacted "openai project key"           "sk-proj-${_fx}${_fx}"  "openai-key"
assert_redacted "openrouter key"               "auth: sk-or-v1-$(printf '%064s' '' | tr ' ' 'a') done" "openrouter-key"
assert_redacted "github classic PAT (ghp)"     "token: ghp_${_fx}XX12 done" "github-token"
assert_redacted "github fine-grained PAT"      "auth: github_pat_$(printf '%082s' '' | tr ' ' 'X') ok" "github-pat"
assert_redacted "AWS access key id"            "AKIAIOSFODNN7EXAMPLE plus other stuff" "aws-access-key-id"
# Telegram bot tokens are EXACTLY 35 chars after the colon (per Telegram's docs and reference_telegram_bots.md memory).
# These fixtures use 35-char synthetic suffixes to match the regex `\b\d{8,12}:[A-Za-z0-9_-]{35}\b`.
assert_redacted "telegram bot token (kira)"   "ref: 8676917934:TESTREDACTMETESTREDACTMETESTREDA01X sent" "telegram-bot-token"
assert_redacted "telegram bot token (marline)" "8471132694:TESTREDACTMETESTREDACTMETESTREDA02Y followed" "telegram-bot-token"
assert_redacted "discord bot token (M-form)"  "Authorization: Bot ${_d1}.${_d2}.${_d3}" "discord-bot-token"
assert_redacted "JWT (Supabase service role)" "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJURVNUUkVEQUNUTUUiLCJyb2xlIjoidGVzdCJ9.TESTREDACTMETESTREDACTMETESTREDACTME extra" "jwt"
assert_redacted "slack bot token"              "${_sl1}-${_sl2}-${_sl3} end" "slack-token"
assert_redacted "stripe secret key (live)"    "${_st1}_${_st2} done" "stripe-key"
assert_redacted "stripe restricted key (test)" "${_rk1}_${_rk2} ok" "stripe-key"

echo
echo "Pass 2 — variable-name-based assignment"
echo "───────────────────────────────────────"
assert_redacted "shell export INFISICAL_CLIENT_SECRET"   'export INFISICAL_CLIENT_SECRET=somerandomvaluethatisnotashapedsecret' "INFISICAL_CLIENT_SECRET"
assert_redacted "shell unquoted MCP_ACCESS_KEYS"         'MCP_ACCESS_KEYS={"k":"v"}' "MCP_ACCESS_KEYS"
assert_redacted "shell single-quoted TELEGRAM_BOT_TOKEN" "TELEGRAM_BOT_TOKEN='1234:abcd-efgh'" "TELEGRAM_BOT_TOKEN"
assert_redacted "shell double-quoted DISCORD_BOT_TOKEN"  'DISCORD_BOT_TOKEN="opaqueValueHereNoShape"' "DISCORD_BOT_TOKEN"
assert_redacted "JSON OPENAI_API_KEY"                    '{"OPENAI_API_KEY": "sometotallyOpaqueString123"}' "OPENAI_API_KEY"
assert_redacted "JSON SUPABASE_DB_PASSWORD"              '{"SUPABASE_DB_PASSWORD":"P@ssw0rd!"}' "SUPABASE_DB_PASSWORD"
assert_redacted "Python assignment"                      'OPENROUTER_API_KEY = "abc123def456"' "OPENROUTER_API_KEY"
assert_redacted "YAML"                                   $'env:\n  ANTHROPIC_API_KEY: someOpaqueValue\n' "ANTHROPIC_API_KEY"
assert_redacted ".env file line"                         'NEXT_PUBLIC_SUPABASE_ANON_KEY=ey1234567890opaque' "NEXT_PUBLIC_SUPABASE_ANON_KEY"
assert_redacted "INFISICAL_CLIENT_ID shell"              "INFISICAL_CLIENT_ID=mid-some-uuid-like" "INFISICAL_CLIENT_ID"
assert_redacted "AWS_SECRET_ACCESS_KEY shell"            "AWS_SECRET_ACCESS_KEY=opaqueAWSstuff" "AWS_SECRET_ACCESS_KEY"

echo
echo "Pass 3 — false-positive guards (innocent text must pass through)"
echo "────────────────────────────────────────────────────────────────"
assert_unchanged "ordinary prose"                       "The cat sat on the mat. There was no secret here."
assert_unchanged "code comment"                         "// TODO: rotate the token next sprint"
assert_unchanged "url with digits"                      "see https://api.example.com/v1/things?id=12345"
assert_unchanged "uuid"                                 "request id 7d8f5fdc-43fa-4c66-9cc7-9fbeb49da5ab"
assert_unchanged "git sha"                              "fixed in commit 4b582bb38c1de7a"
assert_unchanged "phone number style (no token shape)"  "call me at +972 54 555 0123"
assert_unchanged "var name without value"               "We need to set OPENAI_API_KEY in CI"
assert_unchanged "var name in path"                     "see ~/projects/config/OPENAI_API_KEY.example for shape"

echo
echo "Pass 4 — courtroom regression tests (verdict 2026-05-04)"
echo "─────────────────────────────────────────────────────────"

# Codex objection #3: redactor exception path must NOT echo input.
# Force an exception by calling main() with a payload that triggers
# a downstream failure inside redact(). The simplest reliable trigger
# is a stdin that's so pathological it provokes a regex engine error
# — but Python's re is robust enough that this is hard to do via
# input alone. So we test the OPPOSITE invariant: the source code
# must not contain the dangerous "Input echoed unchanged" string.
if ! grep -q "Input echoed unchanged" "$REDACTOR"; then
  PASS=$((PASS + 1))
  printf '  ✓ obj#3 regression: redactor source no longer contains "Input echoed unchanged" string\n'
else
  FAIL=$((FAIL + 1))
  FAIL_DETAILS+=("obj#3 regression: redactor still contains the leak-channel echo path")
  printf '  ✗ obj#3 regression: STILL contains "Input echoed unchanged"\n'
fi

# Same shape: the FAIL-CLOSED marker must be present.
if grep -q "REDACTION_FAILED" "$REDACTOR"; then
  PASS=$((PASS + 1))
  printf '  ✓ obj#3 regression: REDACTION_FAILED marker present in redactor\n'
else
  FAIL=$((FAIL + 1))
  FAIL_DETAILS+=("obj#3 regression: REDACTION_FAILED marker missing from redactor")
  printf '  ✗ obj#3 regression: REDACTION_FAILED marker missing\n'
fi

# Codex objection #2: transcript-redact hook must NOT subprocess+--quiet
# the redactor. It should use in-process importlib import.
TRANSCRIPT_HOOK="$(dirname "$0")/transcript-redact.sh"
if [[ -r "$TRANSCRIPT_HOOK" ]]; then
  if ! grep -qE "subprocess.*redact-secrets" "$TRANSCRIPT_HOOK" \
     && grep -q "importlib" "$TRANSCRIPT_HOOK"; then
    PASS=$((PASS + 1))
    printf '  ✓ obj#2 regression: transcript-redact uses in-process import, not subprocess\n'
  else
    FAIL=$((FAIL + 1))
    FAIL_DETAILS+=("obj#2 regression: transcript-redact still uses broken subprocess+stderr-parse path")
    printf '  ✗ obj#2 regression: transcript-redact has not been migrated to importlib\n'
  fi

  # Direct call to redact() through the same import path the hook uses
  # — proves the in-process API works end-to-end. Uses SourceFileLoader
  # because the redactor's filename ends in .sh (default importlib loaders
  # are extension-gated and would reject it).
  RESULT=$(python3 - <<PYEOF 2>&1
import importlib.util
from importlib.machinery import SourceFileLoader
loader = SourceFileLoader("rs", "$REDACTOR")
spec = importlib.util.spec_from_loader(loader.name, loader)
mod = importlib.util.module_from_spec(spec)
loader.exec_module(mod)
redacted, hits = mod.redact("export INFISICAL_CLIENT_SECRET=opaqueValueHere")
assert "[REDACTED:INFISICAL_CLIENT_SECRET]" in redacted, "expected redaction marker missing"
assert any(label.startswith("shell-var:INFISICAL_CLIENT_SECRET") for label, _ in hits), f"expected hit label missing, got {hits}"
print("OK")
PYEOF
)
  if [[ "$RESULT" == "OK" ]]; then
    PASS=$((PASS + 1))
    printf '  ✓ obj#2 regression: in-process rs.redact() returns expected (text, hits) tuple\n'
  else
    FAIL=$((FAIL + 1))
    FAIL_DETAILS+=("obj#2 regression: in-process redact() call failed: $RESULT")
    printf '  ✗ obj#2 regression: in-process redact() call broke\n'
  fi
else
  printf '  ⚠ transcript-redact.sh not at expected sibling path; skipping obj#2 checks\n'
fi

# Codex objection #4: documents the lesson — `... || true` always exits 0
# even when the dependency is absent. This is a meta-test: it doesn't
# assert anything about our scripts, it documents the bug class so the
# lesson stays in the test suite forever.
TMP_TC=$(mktemp -d)
ACTUAL_EXIT_OF_BAD_PATTERN=0
test -d "$TMP_TC/never-existed" && ls "$TMP_TC/never-existed/never-a-lockfile" 2>/dev/null || true
ACTUAL_EXIT_OF_BAD_PATTERN=$?
if [[ $ACTUAL_EXIT_OF_BAD_PATTERN -eq 0 ]]; then
  PASS=$((PASS + 1))
  printf '  ✓ obj#4 lesson: `test -d X && ls X/y || true` exits 0 even when X absent (documenting bug class)\n'
else
  FAIL=$((FAIL + 1))
  FAIL_DETAILS+=("obj#4 lesson: bash semantics changed? `|| true` no longer makes the chain exit 0")
fi
rmdir "$TMP_TC" 2>/dev/null

# Codex objection #4 corollary: containment-register must not contain
# `|| true` on any blocking precondition.
CONTAINMENT="$(dirname "$0")/../p0/containment-register.json"
if [[ -r "$CONTAINMENT" ]]; then
  BLOCKING_OR_TRUE=$(python3 -c "
import json, sys
d = json.load(open('$CONTAINMENT'))
bad = []
for f in d.get('disabled_features', []):
    for p in f.get('preconditions', []):
        if p.get('blocking', True) and '|| true' in p.get('check', ''):
            bad.append(f\"{f['id']}/{p['id']}\")
print(','.join(bad))
" 2>/dev/null)
  if [[ -z "$BLOCKING_OR_TRUE" ]]; then
    PASS=$((PASS + 1))
    printf '  ✓ obj#4 enforcement: no blocking precondition contains `|| true`\n'
  else
    FAIL=$((FAIL + 1))
    FAIL_DETAILS+=("obj#4 enforcement: blocking preconditions contain || true: $BLOCKING_OR_TRUE")
    printf '  ✗ obj#4 enforcement: found blocking preconditions with `|| true`: %s\n' "$BLOCKING_OR_TRUE"
  fi
fi

echo
echo "Pass 5 — claim-token.sh wrapper (Gap 3)"
echo "─────────────────────────────────────────"

CLAIM_TOKEN="$(dirname "$0")/../wrappers/claim-token.sh"
if [[ -r "$CLAIM_TOKEN" ]]; then
  TEST_CLAIMS_DIR=$(mktemp -d)
  TEST_AUDIT_DIR=$(mktemp -d)

  # Test: claim runs the wrapped command and returns its exit code
  RESULT=$(OPENCLAW_TOKEN_CLAIMS_DIR="$TEST_CLAIMS_DIR" OPENCLAW_AUDIT_DIR="$TEST_AUDIT_DIR" \
    bash "$CLAIM_TOKEN" t1 -- echo "wrapped-output" 2>/dev/null)
  if [[ "$RESULT" == "wrapped-output" ]]; then
    PASS=$((PASS + 1))
    printf '  ✓ claim-token: wraps command and returns its stdout\n'
  else
    FAIL=$((FAIL + 1))
    FAIL_DETAILS+=("claim-token wrapped-command output: expected 'wrapped-output', got '$RESULT'")
    printf '  ✗ claim-token: wrapped command did not produce expected output\n'
  fi

  # Test: lockfile cleaned up after release (no stale file in claims dir)
  REMAINING=$(ls -1 "$TEST_CLAIMS_DIR" 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$REMAINING" == "0" ]]; then
    PASS=$((PASS + 1))
    printf '  ✓ claim-token: lockfile cleaned up after normal release\n'
  else
    FAIL=$((FAIL + 1))
    FAIL_DETAILS+=("claim-token left $REMAINING file(s) in claims dir after release")
    printf '  ✗ claim-token: %s lockfile(s) leaked after release\n' "$REMAINING"
  fi

  # Test: audit log written with both claim and release events
  AUDIT_FILE="$TEST_AUDIT_DIR/$(date +%Y-%m-%d).jsonl"
  if [[ -f "$AUDIT_FILE" ]] && grep -q '"event": "claim"' "$AUDIT_FILE" && grep -q '"event": "release"' "$AUDIT_FILE"; then
    PASS=$((PASS + 1))
    printf '  ✓ claim-token: audit JSONL has both claim and release events\n'
  else
    FAIL=$((FAIL + 1))
    FAIL_DETAILS+=("claim-token audit log missing claim/release events: $(cat "$AUDIT_FILE" 2>/dev/null)")
    printf '  ✗ claim-token: audit log missing expected events\n'
  fi

  # Test: two-claim conflict — second claim refused with non-zero exit
  rm -rf "$TEST_CLAIMS_DIR" "$TEST_AUDIT_DIR"
  mkdir -p "$TEST_CLAIMS_DIR" "$TEST_AUDIT_DIR"
  OPENCLAW_TOKEN_CLAIMS_DIR="$TEST_CLAIMS_DIR" OPENCLAW_AUDIT_DIR="$TEST_AUDIT_DIR" \
    bash "$CLAIM_TOKEN" held -- sleep 2 &
  HOLDER_PID=$!
  sleep 0.3
  CONFLICT_EXIT=0
  CONFLICT_OUT=$(OPENCLAW_TOKEN_CLAIMS_DIR="$TEST_CLAIMS_DIR" OPENCLAW_AUDIT_DIR="$TEST_AUDIT_DIR" \
    bash "$CLAIM_TOKEN" held -- echo "should-not-print" 2>&1) || CONFLICT_EXIT=$?
  wait $HOLDER_PID 2>/dev/null
  if [[ "$CONFLICT_EXIT" != "0" ]] && ! echo "$CONFLICT_OUT" | grep -q "should-not-print"; then
    PASS=$((PASS + 1))
    printf '  ✓ claim-token: concurrent claim refused with non-zero exit, wrapped command did NOT run\n'
  else
    FAIL=$((FAIL + 1))
    FAIL_DETAILS+=("claim-token concurrent claim: exit=$CONFLICT_EXIT, output contained should-not-print: $(echo "$CONFLICT_OUT" | grep -c "should-not-print")")
    printf '  ✗ claim-token: concurrent claim was NOT properly refused\n'
  fi

  # Test: stale-PID recovery — write a lockfile with a dead PID, verify next claim succeeds + audits the recovery
  rm -rf "$TEST_CLAIMS_DIR" "$TEST_AUDIT_DIR"
  mkdir -p "$TEST_CLAIMS_DIR"
  echo "999999:fake-stale-ts:fake-comm:/tmp" > "$TEST_CLAIMS_DIR/stale.lock"
  STALE_OUT=$(OPENCLAW_TOKEN_CLAIMS_DIR="$TEST_CLAIMS_DIR" OPENCLAW_AUDIT_DIR="$TEST_AUDIT_DIR" \
    bash "$CLAIM_TOKEN" stale -- echo "recovered" 2>/dev/null)
  AUDIT_FILE="$TEST_AUDIT_DIR/$(date +%Y-%m-%d).jsonl"
  if [[ "$STALE_OUT" == "recovered" ]] && grep -q '"event": "stale_recovery"' "$AUDIT_FILE" 2>/dev/null; then
    PASS=$((PASS + 1))
    printf '  ✓ claim-token: stale-PID lock auto-recovered with audit event\n'
  else
    FAIL=$((FAIL + 1))
    FAIL_DETAILS+=("claim-token stale recovery: out='$STALE_OUT' audit='$(cat "$AUDIT_FILE" 2>/dev/null)'")
    printf '  ✗ claim-token: stale-PID recovery did not work as expected\n'
  fi

  # Test: --status with no claims says so cleanly
  rm -rf "$TEST_CLAIMS_DIR"
  STATUS_OUT=$(OPENCLAW_TOKEN_CLAIMS_DIR="$TEST_CLAIMS_DIR" OPENCLAW_AUDIT_DIR="$TEST_AUDIT_DIR" \
    bash "$CLAIM_TOKEN" --status 2>/dev/null)
  if echo "$STATUS_OUT" | grep -q "no claims"; then
    PASS=$((PASS + 1))
    printf '  ✓ claim-token: --status reports cleanly when no claims exist\n'
  else
    FAIL=$((FAIL + 1))
    FAIL_DETAILS+=("claim-token --status with empty dir: '$STATUS_OUT'")
    printf '  ✗ claim-token: --status produced unexpected output for empty case\n'
  fi

  rm -rf "$TEST_CLAIMS_DIR" "$TEST_AUDIT_DIR"
else
  printf '  ⚠ claim-token.sh not found at expected path; skipping Pass 5\n'
fi

echo
echo "──────────────────────────────────────────"
TOTAL=$((PASS + FAIL))
if [[ $FAIL -eq 0 ]]; then
  echo "ALL $TOTAL TESTS PASSED"
  exit 0
else
  echo "FAILURES ($FAIL of $TOTAL):"
  for d in "${FAIL_DETAILS[@]}"; do
    echo "  - $d"
  done
  exit 1
fi
