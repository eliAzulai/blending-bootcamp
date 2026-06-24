# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An offline authoring pipeline that produces phonics-decodable comics for the WordPets app. Lives at `~/projects/wordpets/comics/` — a sibling subsystem to `kb/` inside the wordpets repo. The in-app consumer (a Phase 1b "Story" activity) lives in `~/projects/wordpets/src/`. This pipeline only produces assets; it does not touch the Next.js runtime.

## Commands

```bash
# Setup (once)
/opt/homebrew/bin/python3.12 -m venv .venv
.venv/bin/pip install -e ".[dev]"

# Tests (148, all stdlib-only — no API calls)
PYTHONPATH=. .venv/bin/pytest -q

# Single test module
PYTHONPATH=. .venv/bin/pytest tests/test_decodability.py -q

# Validate a script against its phonics stage (hard gate before generation)
PYTHONPATH=. .venv/bin/python scripts/validate_script.py issues/001-the-cat-and-the-hat/script.json

# Generate character reference image candidates
PYTHONPATH=. .venv/bin/python scripts/generate_refs.py --character whiskers --batch 6
PYTHONPATH=. .venv/bin/python scripts/generate_refs.py --character whiskers --use-existing-refs --batch 4  # refine

# Generate panels for an issue
PYTHONPATH=. .venv/bin/python scripts/generate_panels.py issues/001-the-cat-and-the-hat
PYTHONPATH=. .venv/bin/python scripts/generate_panels.py issues/001-the-cat-and-the-hat --panel 2:3   # surgical re-roll
PYTHONPATH=. .venv/bin/python scripts/generate_panels.py issues/001-the-cat-and-the-hat --force       # re-roll all

# Scaffold a new issue (auto-numbers, pre-fills from templates)
PYTHONPATH=. .venv/bin/python scripts/new_issue.py --stage cvc-short-a --title "The Hat Trap"
PYTHONPATH=. .venv/bin/python scripts/new_issue.py --stage cvc-short-i --title "Sit, Cat" --dry-run

# Check secrets status
PYTHONPATH=. .venv/bin/python lib/secrets.py
```

## Secrets

API keys flow through `wordpets/.env.local`, populated by the wordpets repo's pull-secrets script:

```bash
cd ~/projects/wordpets
npm run pull-secrets   # pulls from Infisical project 2423b7fc (blending-bootcamp), env prod
```

Required keys for the pilot: **`GEMINI_API_KEY`** (must be added to that Infisical project). `OPENAI_API_KEY` is also there but only needed for TTS (not yet built). The comics pipeline never handles keys directly — `lib/secrets.py` reads `.env.local` and surfaces a clear error message if a key is missing.

## Architecture

### The authoring pipeline (5 steps, all manual triggers)

```
new_issue.py        → issue.yaml + script.json scaffold
validate_script.py  → hard gate: every word must be decodable at the issue's stage
generate_refs.py    → candidate reference images for characters (iterative, human curates)
generate_panels.py  → panel images using script.json + character ref packs
[typeset, TTS, publish — not yet built; wait for pilot approval]
```

Each `issues/<NNN>-<slug>/` directory is self-contained: `issue.yaml` (human-authored metadata/story beats), `script.json` (the gateable artifact), `panels/` (generated PNGs + `.meta.json` per panel), `audio/`, `pages/` (composited).

### Pilot-first rule

`issues/001-the-cat-and-the-hat/` is the canonical pilot. Before creating new
issues, building later pipeline stages, or extracting/updating a reusable
skill, refine this pilot against `issues/001-the-cat-and-the-hat/production-brief.md`.
The skill should point back to the pilot brief instead of duplicating all of
the repository context.

### Story authoring (idea → script) — the shared cross-tool skill

The story layer is authored before any art, in this order:

```
prompts/meta-story-prompt.md   → generates the two prompts below, per stage
prompts/story-interview.md     → interrogative idea discovery (Hook/Heart/Joke,
                                 constraint-as-fuel; one question at a time)
issues/<NNN>/00-story-brief.md → locked creative seed (SOURCE OF TRUTH)
00-story-prompt.md             → renders the brief into 01-script.md
scripts/validate_script.py     → hard decodability gate
```

**Both Claude Code and Codex must follow this same flow.** It is the shared
"skill." Keep the canonical content in these files; `CLAUDE.md` and `AGENTS.md`
are pointers to them, so the two tools cannot drift. Edit the prompt files, not
copies pasted into a chat or a machine-local skill.

### `lib/decodability.py` — the load-bearing module

Every word in every speech bubble / caption / SFX must pass through this module before art generation. Key structures:

- `STAGE_ORDER` — the canonical phonics progression sequence. Order matters: cumulative allowlists are built by walking from index 0.
- `ACTIVE_STAGES` — stages seeded in the live wordpets DB. Parity-tested against `wordpets/src/lib/fixtures/student.ts` in `tests/test_curriculum_parity.py`. Do not add words here without also updating the app fixture.
- `PLANNED_STAGES` — forward-planned stages not yet seeded. Comics for these stages can be authored ahead of app rollout without breaking the parity test.
- `CHARACTER_NAMES` — name → gating stage. A character's name cannot appear in any script until its gating stage. This is both a decodability rule and a story device: kids "earn" each character.
- `SIGHT_WORDS` — pragmatic K-1 list, appears in any issue regardless of stage.

The `validate_script()` function is imported by `generate_panels.py` as a pre-flight check and by `validate_script.py` as the CLI gate. **Never bypass this gate** — `generate_panels.py` exposes `--skip-decodability-check` but it exists only for prompt iteration, not production.

### Gemini image generation (`lib/gemini_client.py`)

Model: `gemini-3.1-flash-image-preview`. Multi-image conditioning via PIL Image objects passed directly in `contents=[]`. Character refs live in `characters/<name>/refs/*.png` — `load_ref_pack()` loads them sorted deterministically for reproducibility. Each generated panel saves a `.meta.json` alongside the PNG (model, prompt, ref paths, seed, elapsed) so re-rolls are auditable.

`generate_panels.py` is **idempotent by default** — existing panels are skipped. Use `--panel page:panel` for surgical re-roll of one panel without re-rolling the rest (important for cost control).

### Character ref packs (`characters/<name>/`)

`canon.md` describes the character's locked visual attributes. `refs/` holds 6-10 hand-curated images (headshots, full-body, expression sheet) selected from `candidates/<dated-batch>/` output. **Do not regenerate refs casually** — drift in the ref pack breaks consistency across all downstream issues. Iterate in `candidates/` first, then commit to `refs/` deliberately.

### `prompts/base-style.md`

Injected at the head of every panel prompt. Governs the Ghibli watercolor aesthetic, panel layout, character consistency instruction, and the single-story `a` rule (non-negotiable for early readers). Editing this file changes every future panel generation globally.

## Key constraints

- **Single-story `a` in any in-art lettering**: the two-story typographic `a` is unreadable to phonics learners. If Gemini can't enforce it, prefer omitting in-art text entirely — the typesetter adds speech bubbles post-generation using the Andika font.
- **Character names follow phonics stage order**: at `cvc-short-a`, Whiskers is "Cat" or "the cat" — not "Whiskers". `CHARACTER_NAMES` in `decodability.py` is the authority. `new_issue.py` auto-computes the available cast for a stage.
- **`ACTIVE_STAGES` and `wordpets` fixtures must stay in sync**: `tests/test_curriculum_parity.py` asserts this. If you add a stage to the app, update both.
- **Typesetting / TTS / publish not yet built** (as of 2026-05-06): deliberately deferred until pilot panels are reviewed and art direction is approved. Don't build them until then.
