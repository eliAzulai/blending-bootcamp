"""Load API keys from the wordpets `.env.local` file (populated by Infisical).

The wordpets repo already has a working Infisical → .env.local pipeline via
`npm run pull-secrets` (Infisical project `2423b7fc-bb02-4075-aba8-d7d04aacc820`,
legacy name "blending-bootcamp"). The comics pipeline reuses that same file
rather than running its own Infisical client — single source of truth, single
rotate-secrets workflow.

Usage:
    from lib.secrets import load_env, require
    load_env()
    api_key = require("GEMINI_API_KEY")

To populate keys before running the pipeline:
    cd ~/projects/wordpets
    npm run pull-secrets

Required keys for the pilot:
    GEMINI_API_KEY   — for Gemini 3.1 Flash Image (panel + ref generation)

Required keys for later phases (not needed for pilot):
    OPENAI_API_KEY   — for TTS narration
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# wordpets repo root, two levels up from this file
_REPO_ROOT = Path(__file__).resolve().parents[2]
ENV_LOCAL_PATH = _REPO_ROOT / ".env.local"


def load_env(path: Path | None = None, override: bool = False) -> dict[str, str]:
    """Read a `.env.local`-style file and merge it into os.environ.

    Returns the dict of values loaded (whether or not they were already set).
    By default does NOT override existing env vars — process env wins.
    """
    target = path or ENV_LOCAL_PATH
    if not target.exists():
        return {}

    loaded: dict[str, str] = {}
    for raw_line in target.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        loaded[key] = value
        if override or key not in os.environ:
            os.environ[key] = value
    return loaded


class MissingSecret(RuntimeError):
    """Raised when a required secret isn't set after load_env()."""


def require(key: str) -> str:
    """Return env var value or raise MissingSecret with a helpful message."""
    value = os.environ.get(key)
    if not value:
        raise MissingSecret(
            f"{key} is not set.\n"
            f"Comics secrets flow through Infisical → wordpets/.env.local.\n"
            f"To fix:\n"
            f"  1. Add {key} to Infisical project 2423b7fc (blending-bootcamp).\n"
            f"  2. Run `npm run pull-secrets` from {_REPO_ROOT}\n"
            f"  3. Re-run this script.\n"
            f"Expected location: {ENV_LOCAL_PATH}"
        )
    return value


def require_with_load(key: str) -> str:
    """Convenience: load_env() then require(key)."""
    load_env()
    return require(key)


if __name__ == "__main__":
    # CLI for quickly checking what's loaded.
    loaded = load_env()
    keys_of_interest = ["GEMINI_API_KEY", "OPENAI_API_KEY"]
    print(f"Loaded {len(loaded)} entries from {ENV_LOCAL_PATH}")
    for k in keys_of_interest:
        present = k in os.environ and bool(os.environ[k])
        marker = "OK " if present else "-- "
        print(f"  {marker}{k}")
    if not all(os.environ.get(k) for k in keys_of_interest if k != "OPENAI_API_KEY"):
        sys.exit(1)
