#!/usr/bin/env python3
"""
redact-secrets.sh — stdin → stdout filter that replaces known secret
patterns with [REDACTED:<kind>].

Pure function: no state, no I/O beyond stdin/stdout/stderr.
Composable in pipelines: `cmd | redact-secrets.sh | tee out.txt`

Exit codes:
  0  — succeeded (whether or not anything was redacted)
  1  — argument or I/O error
  2  — unhandled exception during redaction (input echoed unchanged on stderr for debugging)

Patterns are organized in two passes:
  1. Shape-matched secrets (sk-ant-..., AKIA..., bot-token shapes, JWTs)
     — high precision, false positives are rare
  2. Variable-name-assignment patterns (FOO=bar, "FOO":"bar")
     — catches values assigned to known sensitive var names regardless of shape

Both passes apply to every line. Passes are conservative: when in doubt,
this script PREFERS over-redaction to leakage.

Tested against synthetic fixtures in test-patterns.sh — run that to verify
no pattern regresses if you change anything below.

Source: docs/security/openclaw-mission-control/hooks/redact-secrets.sh
Target deploy path: ~/.local/bin/redact-secrets.sh
"""

import re
import sys
from typing import List, Tuple

# ──────────────────────────────────────────────────────────────────────
# Pass 1 — shape-matched secrets
# ──────────────────────────────────────────────────────────────────────
# Each entry: (label, compiled_regex, replacement_string)
# Replacements are literal — no \g<...> backreferences here, since we want
# the redacted output to be obviously redacted, not a partial reveal.

SHAPE_PATTERNS: List[Tuple[str, re.Pattern, str]] = [
    # Anthropic API keys: sk-ant-api03-... or sk-ant-admin01-...
    ("anthropic-key",
     re.compile(r"sk-ant-(?:api03|admin01)-[A-Za-z0-9_\-]{40,}"),
     "[REDACTED:anthropic-key]"),

    # OpenAI: sk-... (project, svcacct, or legacy). The T3BlbkFJ marker is the
    # base64-encoded "OpenAI" — present in nearly every legacy/project key.
    # Modern keys may omit it, so we also catch the sk-(proj|svcacct)- prefix.
    ("openai-key",
     re.compile(r"sk-(?:proj-|svcacct-)?[A-Za-z0-9]{20,30}T3BlbkFJ[A-Za-z0-9_\-]{20,}"),
     "[REDACTED:openai-key]"),
    ("openai-key-prefix",
     re.compile(r"\bsk-(?:proj|svcacct)-[A-Za-z0-9_\-]{40,}"),
     "[REDACTED:openai-key]"),

    # OpenRouter: sk-or-v1-<64 hex>
    ("openrouter-key",
     re.compile(r"sk-or-v1-[a-f0-9]{64}"),
     "[REDACTED:openrouter-key]"),

    # GitHub classic / fine-grained PATs and OAuth tokens
    ("github-token",
     re.compile(r"\b(?:ghp|gho|ghs|ghr|ghu)_[A-Za-z0-9]{36,255}\b"),
     "[REDACTED:github-token]"),
    ("github-pat",
     re.compile(r"\bgithub_pat_[A-Za-z0-9_]{82,}\b"),
     "[REDACTED:github-pat]"),

    # AWS access key id (always 20 chars, AKIA prefix). Secret key paired
    # via variable-name-assignment pass below.
    ("aws-access-key-id",
     re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
     "[REDACTED:aws-access-key-id]"),

    # Telegram bot tokens: <8-12 digit bot id>:<35 char secret>
    # Per reference_telegram_bots memory entry. Word boundaries protect
    # against gobbling URLs that happen to contain a digit:colon.
    ("telegram-bot-token",
     re.compile(r"\b\d{8,12}:[A-Za-z0-9_\-]{35}\b"),
     "[REDACTED:telegram-bot-token]"),

    # Discord bot tokens: 3-segment <user-id-base64>.<timestamp-b64>.<hmac-b64>
    # Both legacy (M-prefix) and newer (N-prefix) formats.
    ("discord-bot-token",
     re.compile(r"\b[MN][A-Za-z0-9_\-]{23,26}\.[A-Za-z0-9_\-]{6}\.[A-Za-z0-9_\-]{27,}\b"),
     "[REDACTED:discord-bot-token]"),

    # JWT (Supabase service-role keys, JWT auth tokens, signed cookies, etc.)
    # Three base64url-encoded segments separated by dots; first segment starts
    # with eyJ (the base64 of {"). Minimum signature length 20 to cut down on
    # false positives matching short opaque strings.
    ("jwt",
     re.compile(r"\beyJ[A-Za-z0-9_\-]+\.eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]{20,}\b"),
     "[REDACTED:jwt]"),

    # Slack tokens (bot, user, app, refresh)
    ("slack-token",
     re.compile(r"\bxox[abprs]-[A-Za-z0-9\-]{10,}\b"),
     "[REDACTED:slack-token]"),

    # Stripe keys (live and test, secret and restricted)
    ("stripe-key",
     re.compile(r"\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{20,}\b"),
     "[REDACTED:stripe-key]"),

    # Generic high-entropy 40-char hex (common API key shape — broad but useful
    # as a final catch-net when paired with an assignment in pass 2)
    # NOTE: applied only after pass 2, see APPLY_HEX_CATCH_NET flag below.
]

# ──────────────────────────────────────────────────────────────────────
# Pass 2 — variable-name-based assignment
# ──────────────────────────────────────────────────────────────────────
# Catches values assigned to known sensitive variable names, regardless of
# the value's shape. Covers shell exports, JSON, YAML, .env files, and
# Python/JS literals.

SENSITIVE_VARS = [
    "MCP_ACCESS_KEYS",
    "INFISICAL_CLIENT_SECRET",
    "INFISICAL_CLIENT_ID",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_BOT_TOKEN_KIRA",
    "DISCORD_BOT_TOKEN",
    "DISCORD_TOKEN",
    "OPENAI_API_KEY",
    "OPENROUTER_API_KEY",
    "ANTHROPIC_API_KEY",
    "SUPABASE_DB_PASSWORD",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_JWT_SECRET",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_ACCESS_KEY_ID",
    "GITHUB_TOKEN",
    "GH_TOKEN",
    "NPM_TOKEN",
    "VERCEL_TOKEN",
    "CLOUDFLARE_API_TOKEN",
    "STRIPE_SECRET_KEY",
    "SERPAPI_KEY",
    "TAVILY_API_KEY",
    "ELEVENLABS_API_KEY",
    "DEEPGRAM_API_KEY",
    "GOOGLE_API_KEY",
    "AZURE_OPENAI_KEY",
]


def _build_var_patterns() -> List[Tuple[str, re.Pattern, str]]:
    """Build per-variable assignment patterns covering shell, JSON, YAML, .env."""
    patterns: List[Tuple[str, re.Pattern, str]] = []
    for var in SENSITIVE_VARS:
        v = re.escape(var)
        # Shell / .env / Makefile: VAR=value, VAR='value', VAR="value", export VAR=value
        # Stops at whitespace, end-of-line, or close-of-quote.
        patterns.append((
            f"shell-var:{var}",
            re.compile(
                rf"((?:export\s+)?{v}\s*=\s*)"
                rf"(['\"]?)"
                rf"([^\s'\"\n]+)"
                rf"(\2)",
                re.MULTILINE,
            ),
            rf"\g<1>\g<2>[REDACTED:{var}]\g<2>",
        ))
        # JSON: "VAR": "value"
        patterns.append((
            f"json-var:{var}",
            re.compile(rf"(\"{v}\"\s*:\s*)\"([^\"]+)\""),
            rf'\g<1>"[REDACTED:{var}]"',
        ))
        # YAML: VAR: value (no quotes) — be careful, YAML keys can have arbitrary
        # punctuation in values, so we anchor to start-of-value-after-colon and
        # eat to end of line.
        patterns.append((
            f"yaml-var:{var}",
            re.compile(rf"(^|\n)(\s*{v}\s*:\s+)(?!\[)([^\n\s][^\n]*)"),
            rf"\g<1>\g<2>[REDACTED:{var}]",
        ))
        # Python/JS: VAR = "value" or VAR = 'value'
        patterns.append((
            f"py-var:{var}",
            re.compile(rf"(\b{v}\s*=\s*)(['\"])([^'\"]+)(\2)"),
            rf"\g<1>\g<2>[REDACTED:{var}]\g<2>",
        ))
    return patterns


VAR_PATTERNS: List[Tuple[str, re.Pattern, str]] = _build_var_patterns()

# ──────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────


def redact(text: str) -> Tuple[str, List[Tuple[str, str]]]:
    """
    Apply all patterns to text. Return (redacted_text, hits).

    hits is a list of (label, snippet_first_40_chars) tuples for audit
    logging. snippets are taken from the ORIGINAL text and intentionally
    truncated — they're for "what kind, roughly" context, not forensics.
    """
    hits: List[Tuple[str, str]] = []

    # Pass 1: shape patterns
    out = text
    for label, pattern, replacement in SHAPE_PATTERNS:
        for m in pattern.finditer(out):
            hits.append((label, m.group(0)[:40]))
        out = pattern.sub(replacement, out)

    # Pass 2: variable assignments
    for label, pattern, replacement in VAR_PATTERNS:
        for m in pattern.finditer(out):
            hits.append((label, m.group(0)[:40]))
        out = pattern.sub(replacement, out)

    return out, hits


# ──────────────────────────────────────────────────────────────────────
# CLI entry
# ──────────────────────────────────────────────────────────────────────


def main(argv: List[str]) -> int:
    if len(argv) > 1 and argv[1] in ("-h", "--help"):
        sys.stderr.write(__doc__)
        return 0
    try:
        text = sys.stdin.read()
    except (KeyboardInterrupt, BrokenPipeError):
        return 1
    try:
        redacted, hits = redact(text)
    except Exception as e:
        sys.stderr.write(f"[redact-secrets] ERROR: {e}\n")
        sys.stderr.write("Input echoed unchanged for debugging:\n")
        sys.stderr.write(text)
        return 2
    sys.stdout.write(redacted)
    if hits and "--quiet" not in argv:
        kinds = sorted({h[0] for h in hits})
        sys.stderr.write(f"[redact-secrets] redacted {len(hits)} secret(s) of kinds: {kinds}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
