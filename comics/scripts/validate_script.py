#!/usr/bin/env python3
"""Validate a comic script against its phonics stage allowlist.

Hard gate before any image generation. Exit code 0 means clean; 1 means at
least one violation; 2 means the script file or args are unusable.

Usage:
    python scripts/validate_script.py issues/001-the-cat-and-the-hat/script.json
    python scripts/validate_script.py path/to/script.json --quiet
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Allow running as a script: add repo root to path so `lib` resolves.
_THIS = Path(__file__).resolve()
_ROOT = _THIS.parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from lib.decodability import validate_script  # noqa: E402


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("script_path", type=Path, help="Path to script.json")
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress success output; still print failures.",
    )
    args = parser.parse_args(argv)

    if not args.script_path.exists():
        print(f"error: script file not found: {args.script_path}", file=sys.stderr)
        return 2

    try:
        script = json.loads(args.script_path.read_text())
    except json.JSONDecodeError as e:
        print(f"error: invalid JSON in {args.script_path}: {e}", file=sys.stderr)
        return 2

    result = validate_script(script)

    if not result.ok:
        print(result.report(), file=sys.stderr)
        return 1

    if not args.quiet:
        print(result.report())
    return 0


if __name__ == "__main__":
    sys.exit(main())
