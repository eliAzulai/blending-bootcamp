#!/usr/bin/env bash
# Comics sync — safe one-tap "save + share" for the `comics` branch.
#
# Run it when you SIT DOWN (gets the latest) and when you FINISH (saves +
# uploads your work). It is safe to run anytime: with no local changes it just
# pulls the latest; with changes it saves them, merges in anyone else's work,
# then uploads — in the order that can't lose work.
#
# Meant to be run by Codex when the user says "save my work" / "sync" / etc.
# (see comics/AGENTS.md). Humans: see comics/SYNC.md.
#
# Exit codes:  0 = synced   2 = merge conflict (human needed)   3 = push/login failed
set -uo pipefail

BRANCH="comics"
NOTE="${1:-comics update}"

# Go to the repo root, wherever this script was called from.
cd "$(dirname "$0")/.." 2>/dev/null || { echo "❌ Can't find the comics folder."; exit 1; }
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "❌ This folder isn't connected to GitHub yet. Ask Eli to do the one-time setup (see SYNC.md)."
  exit 1
}
cd "$REPO_ROOT" || exit 1

# Make sure we're on the shared comics line.
CURRENT="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
if [ "$CURRENT" != "$BRANCH" ]; then
  git checkout "$BRANCH" 2>/dev/null || { echo "❌ Couldn't switch to the '$BRANCH' line. Ask Eli."; exit 1; }
fi

echo "→ Saving your changes…"
# Stage only comics/ — this branch is the comics subsystem; never sweep app files.
git add -A -- comics
if ! git diff --cached --quiet -- comics; then
  git commit -q -m "$NOTE" || { echo "❌ Couldn't save changes. Ask Eli."; exit 1; }
  echo "  ✅ Saved."
else
  echo "  (nothing new to save)"
fi

echo "→ Getting the latest from GitHub…"
if ! git pull --no-rebase --no-edit origin "$BRANCH" 2>/dev/null; then
  git merge --abort 2>/dev/null
  echo ""
  echo "⚠️  You and Eli changed the same thing — I can't merge them automatically."
  echo "    Your work is safe and saved on this computer (nothing is lost)."
  echo "    👉 Message Eli, or ask: \"help me resolve a comics git conflict\"."
  exit 2
fi

echo "→ Uploading to GitHub…"
if ! git push origin "$BRANCH" 2>/dev/null; then
  echo ""
  echo "⚠️  Couldn't upload — usually a GitHub login expired on this Mac."
  echo "    Your work is still saved on this computer."
  echo "    👉 Ask Eli to run the one-time login (see SYNC.md)."
  exit 3
fi

echo ""
echo "✅ All synced. Your comics work is saved and shared."
