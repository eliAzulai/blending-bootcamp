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
assert_redacted "openrouter key"               "OPENROUTER_API_KEY=sk-or-v1-$(printf '%064s' '' | tr ' ' 'a')" "openrouter-key"
assert_redacted "github classic PAT (ghp)"     "token: ghp_${_fx}XX12 done" "github-token"
assert_redacted "github fine-grained PAT"      "auth: github_pat_$(printf '%082s' '' | tr ' ' 'X') ok" "github-pat"
assert_redacted "AWS access key id"            "AKIAIOSFODNN7EXAMPLE plus other stuff" "aws-access-key-id"
assert_redacted "telegram bot token (kira)"   "ref: 8676917934:TESTREDACTMETESTREDACTMETESTREDA01 sent" "telegram-bot-token"
assert_redacted "telegram bot token (marline)" "8471132694:TESTREDACTMETESTREDACTMETESTREDA02 followed" "telegram-bot-token"
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
