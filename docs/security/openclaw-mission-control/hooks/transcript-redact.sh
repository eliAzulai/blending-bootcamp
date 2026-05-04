#!/usr/bin/env python3
"""
transcript-redact.sh — Claude Code PostToolUse hook.

Reads the standard PostToolUse hook payload from stdin, extracts the
tool's output content, runs it through redact-secrets.sh, and:

  1. If anything was redacted, writes a JSONL audit event to a sidecar
     file at <transcript_path>.redacted-events.jsonl recording WHAT KIND
     of secret was redacted (not the secret itself, not its position).
  2. Always exits 0 — this hook is observe-and-record, NOT block.
     A blocking hook would risk losing tool output if redaction crashes.

The sidecar approach is deliberate: it preserves the original transcript
unmodified (so forensics chain-of-custody is intact) while giving MC's
audit view a count of "secrets caught in flight" per session. Future
work (P3+) can decide whether to actively rewrite the transcript file.

Hook payload shape (per Claude Code hook docs):
    {
      "hook_event_name": "PostToolUse",
      "tool_name": "Bash",
      "tool_input":    { ... },
      "tool_response": { "content": "..." | "output": "..." },
      "session_id":      "uuid",
      "transcript_path": "/path/to/session.jsonl"
    }

Wiring (in ~/.claude/settings.json):
    {
      "hooks": {
        "PostToolUse": [
          { "matcher": "Bash", "command": "~/.claude/hooks/transcript-redact.sh" }
        ]
      }
    }

Source: docs/security/openclaw-mission-control/hooks/transcript-redact.sh
Target deploy path: ~/.claude/hooks/transcript-redact.sh
"""

import datetime as dt
import json
import os
import subprocess
import sys
from pathlib import Path

REDACTOR = os.environ.get(
    "REDACT_SECRETS_BIN",
    str(Path.home() / ".local" / "bin" / "redact-secrets.sh"),
)


def _extract_content(tool_response) -> str:
    """Pull whatever text-like content this tool emitted into a single string."""
    if isinstance(tool_response, str):
        return tool_response
    if not isinstance(tool_response, dict):
        return ""
    # Common shapes across different tools
    for key in ("content", "output", "stdout", "text", "message"):
        v = tool_response.get(key)
        if isinstance(v, str) and v:
            return v
        if isinstance(v, list):
            # Some tools return content as [{"type": "text", "text": "..."}]
            chunks = []
            for item in v:
                if isinstance(item, dict):
                    chunks.append(item.get("text") or item.get("content") or "")
                elif isinstance(item, str):
                    chunks.append(item)
            joined = "\n".join(c for c in chunks if c)
            if joined:
                return joined
    return ""


def _run_redactor(text: str) -> tuple[str, list[str]]:
    """Subprocess to redact-secrets.sh. Returns (redacted_text, kinds_found)."""
    if not Path(REDACTOR).exists():
        # Fallback: try the staging path so this hook works during development
        # before the file is copied to ~/.local/bin/.
        fallback = Path(__file__).parent / "redact-secrets.sh"
        if fallback.exists():
            redactor = str(fallback)
        else:
            sys.stderr.write(
                f"[transcript-redact] redact-secrets.sh not found at {REDACTOR}; "
                f"set REDACT_SECRETS_BIN or deploy per README.\n"
            )
            return text, []
    else:
        redactor = REDACTOR

    proc = subprocess.run(
        ["python3", redactor, "--quiet"],
        input=text,
        capture_output=True,
        text=True,
        timeout=10,
    )
    redacted = proc.stdout
    # The redactor writes "[redact-secrets] redacted N secret(s) of kinds: [...]"
    # on stderr. Parse the kinds out of it for audit.
    kinds: list[str] = []
    for line in proc.stderr.splitlines():
        if "kinds:" in line:
            try:
                # "...kinds: ['anthropic-key', 'jwt']"
                kinds_str = line.split("kinds:", 1)[1].strip()
                kinds = json.loads(kinds_str.replace("'", '"'))
            except (ValueError, IndexError):
                pass
    return redacted, kinds


def _write_audit_event(transcript_path: str, payload: dict, kinds: list[str], char_count: int) -> None:
    """Append a JSONL audit event next to the transcript."""
    if not transcript_path:
        return
    sidecar = Path(transcript_path).with_suffix(
        Path(transcript_path).suffix + ".redacted-events.jsonl"
    )
    try:
        sidecar.parent.mkdir(parents=True, exist_ok=True)
        with sidecar.open("a") as f:
            json.dump({
                "ts": dt.datetime.now(dt.timezone.utc).isoformat(),
                "session_id": payload.get("session_id"),
                "tool_name": payload.get("tool_name"),
                "kinds": kinds,
                "redacted_chars": char_count,
            }, f)
            f.write("\n")
    except OSError as e:
        sys.stderr.write(f"[transcript-redact] could not write audit sidecar: {e}\n")


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        sys.stderr.write(f"[transcript-redact] hook payload was not valid JSON: {e}\n")
        return 0  # observe-only — never block tool flow on hook failure

    content = _extract_content(payload.get("tool_response"))
    if not content:
        return 0

    redacted, kinds = _run_redactor(content)

    if kinds:
        # Visible to the user via Claude Code's stderr surfacing
        sys.stderr.write(
            f"[transcript-redact] caught {len(kinds)} secret kind(s) in "
            f"{payload.get('tool_name', 'tool')} output: {sorted(set(kinds))}\n"
        )
        _write_audit_event(
            payload.get("transcript_path", ""),
            payload,
            sorted(set(kinds)),
            len(content) - len(redacted),
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
