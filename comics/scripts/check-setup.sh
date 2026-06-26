#!/usr/bin/env bash
# One-time setup check for comics sync. Run this once on a new Mac BEFORE the
# first real session. It changes nothing — it only confirms everything is wired
# up so "save and sync" will work later.
set -uo pipefail

FAIL=0
ok()  { echo "✅ $1"; }
bad() { echo "❌ $1"; FAIL=1; }

echo "Checking your comics setup…"
echo

# 1. git installed
if command -v git >/dev/null 2>&1; then
  ok "git is installed."
else
  bad "git is not installed.  Fix: brew install git"
fi

# 2. inside the cloned project
cd "$(dirname "$0")/.." 2>/dev/null || true
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -n "$REPO_ROOT" ]; then
  ok "Found the project folder."
  cd "$REPO_ROOT" || true
else
  bad "This isn't the cloned project folder.  Fix: re-clone (see SYNC.md)."
fi

# 3. on the shared comics line (or able to switch to it)
if [ -n "$REPO_ROOT" ]; then
  BR="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  if [ "$BR" = "comics" ]; then
    ok "You're on the 'comics' line."
  elif git checkout comics >/dev/null 2>&1; then
    ok "Switched you to the 'comics' line."
  else
    bad "Couldn't find the 'comics' line.  Ask Eli."
  fi
fi

# 4. GitHub login + reachable (tests auth & network, changes nothing)
if [ -n "$REPO_ROOT" ]; then
  if git ls-remote origin >/dev/null 2>&1; then
    ok "Connected to GitHub (your login works)."
  else
    bad "Can't reach GitHub — you probably need to log in.  Fix: gh auth login  (see SYNC.md)."
  fi
fi

echo
if [ "$FAIL" -eq 0 ]; then
  echo "🎉 All set! Start by telling Codex: \"get the latest comics work\"."
else
  echo "Some checks failed above. Fix those (or ask Eli), then run this again."
  exit 1
fi
