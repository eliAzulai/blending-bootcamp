# AGENTS.md — WordPets Comics (for Codex)

Codex: the canonical guidance for this directory is **`CLAUDE.md`**. Read it as
your instructions. This file exists only so Codex and Claude Code stay in sync —
it deliberately keeps the rules in `CLAUDE.md` and the prompt files, not here, so
the two tools can't drift.

## Session sync (plain-English triggers) — IMPORTANT for Codex

This project is shared with Eli's Claude Code over the `comics` branch on GitHub.
The user (Ilana) is non-technical and will NOT type git commands. When she says
anything like: "get the latest", "start", "save my work", "save and sync",
"sync", "I'm done", "share my work" — run the safe sync script and report the
result in plain language. Do NOT print raw git output unless she asks.

```
bash scripts/comics-sync.sh "<one-line summary of what changed this session>"
```

Interpret the exit code:
- exit 0 → tell her "✅ All synced — your work is saved and shared."
- exit 2 (merge conflict) → her work is saved locally; tell her to message Eli,
  or offer: "I can help resolve the conflict." NEVER use `git push --force`.
- exit 3 (push/login failed) → tell her a GitHub login is needed and Eli runs the
  one-time setup; her work is still saved locally.

Running the script when she STARTS is also correct — with no local changes it
simply pulls the latest. The human-facing version of this lives in `SYNC.md`.

## Story authoring (the shared skill), in order

```
prompts/meta-story-prompt.md   → generates the prompts below, per phonics stage
prompts/story-interview.md     → interrogative idea discovery (Hook/Heart/Joke)
issues/<NNN>/00-story-brief.md → locked creative seed (source of truth)
00-story-prompt.md             → renders the brief into 01-script.md
scripts/validate_script.py     → hard decodability gate
```

## Non-negotiables (the stable ones — full set in CLAUDE.md)

- **Decodability gate:** every speech/caption word must pass
  `scripts/validate_script.py`. Never expand the allowlist to fix a line —
  rewrite the line.
- **Names follow phonics order:** `lib/decodability.py` → `CHARACTER_NAMES` is
  the authority (at `cvc-short-a`, the cat is "cat"/"the cat", never "Whiskers").
- **Constraint as fuel:** treat the stage word budget as the creativity engine,
  not a limit.

Per-issue context lives in that issue's `production-brief.md`. Don't duplicate it.
