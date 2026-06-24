# AGENTS.md — WordPets Comics (for Codex)

Codex: the canonical guidance for this directory is **`CLAUDE.md`**. Read it as
your instructions. This file exists only so Codex and Claude Code stay in sync —
it deliberately keeps the rules in `CLAUDE.md` and the prompt files, not here, so
the two tools can't drift.

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
