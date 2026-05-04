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
import importlib.util
import json
import os
import sys
from importlib.machinery import SourceFileLoader
from pathlib import Path
from typing import Tuple, List

REDACTOR = os.environ.get(
    "REDACT_SECRETS_BIN",
    str(Path.home() / ".local" / "bin" / "redact-secrets.sh"),
)


def _load_redactor_module():
    """
    Load redact-secrets.sh as a Python module via importlib.

    Why in-process import instead of subprocess: prior implementation called
    `subprocess.run([..., '--quiet'], ...)` then tried to parse the kinds list
    out of stderr, but --quiet suppresses exactly the line being parsed
    (verified: redact-secrets.sh main() only writes the kinds summary when
    --quiet is NOT in argv). The audit path was dead code.

    Why explicit SourceFileLoader: the file's extension is .sh (intentional —
    matches the README's deploy paths and the hook surface convention). The
    default `spec_from_file_location` registers loaders by extension and
    returns None for unrecognized extensions. Forcing SourceFileLoader bypasses
    that check and reads the file as Python source regardless of the suffix.

    In-process import gives us redact() returning (redacted_text, hits)
    directly — no format coupling, no exec overhead, and the redacted text
    is now in memory ready for the P2 active-rewrite path.
    """
    candidates = [Path(REDACTOR), Path(__file__).parent / "redact-secrets.sh"]
    for path in candidates:
        if path.exists():
            try:
                loader = SourceFileLoader("redact_secrets", str(path))
                spec = importlib.util.spec_from_loader(loader.name, loader)
                if spec is None:
                    continue
                mod = importlib.util.module_from_spec(spec)
                loader.exec_module(mod)
                return mod
            except Exception as e:
                sys.stderr.write(
                    f"[transcript-redact] failed to load redactor from {path}: "
                    f"{type(e).__name__}: {e}\n"
                )
                continue
    return None


_REDACTOR_MOD = _load_redactor_module()


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


def _run_redactor(text: str) -> Tuple[str, List[str]]:
    """In-process call to redact-secrets.redact(). Returns (redacted_text, kinds)."""
    if _REDACTOR_MOD is None:
        sys.stderr.write(
            f"[transcript-redact] redact-secrets module could not be loaded "
            f"(tried {REDACTOR} and sibling fallback). Set REDACT_SECRETS_BIN "
            f"or deploy per README.\n"
        )
        return text, []
    try:
        redacted, hits = _REDACTOR_MOD.redact(text)
    except Exception as e:
        # FAIL-CLOSED here too: do NOT echo the input. We don't even know
        # which patterns matched before the exception — return empty kinds
        # and replace the content with a fixed marker so downstream sees
        # the failure.
        exc_class = type(e).__name__
        sys.stderr.write(
            f"[transcript-redact] redactor raised: {exc_class} input_len={len(text)}\n"
        )
        return f"[REDACTION_FAILED:{exc_class}]", []
    # hits is List[Tuple[label, snippet]]; we only surface the labels.
    kinds = sorted({label for label, _snippet in hits})
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
