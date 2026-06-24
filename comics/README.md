# WordPets Comics — Authoring Pipeline

Python pipeline that produces phonics-decodable comic issues for the WordPets app's Story Listening activity. Sibling subsystem to `kb/` — same repo, separate venv.

## Why this exists separately from the Next.js app

Heavy batch image generation, OpenAI TTS calls, OCR validation, and large binary asset assembly don't belong in the Next.js runtime. This pipeline produces *finished* asset bundles that get copied into `wordpets/public/comics/<slug>/` and seeded into the `content` table. The app consumes finished assets only.

## The 5-step authoring workflow

```
issue idea → 1. new_issue → 2. validate_script → 3. generate_panels → 4. typeset_pages → 5. publish_issue
```

1. **`new_issue.py --stage cvc-short-a --title "The Cat and the Hat"`** — scaffolds `issues/NNN-slug/` with `issue.yaml` (story beats) + `script.json` (panel scripts) pre-filled with the stage allowlist.
2. **`validate_script.py issues/NNN-slug/script.json`** — hard gate. Tokenizes every speech bubble + SFX, asserts each token is in the stage's allowlist. No advance until clean.
3. **`generate_panels.py issues/NNN-slug/`** — Gemini 3 Pro Image with multi-image character refs. Surgical re-roll via `regenerate_panel.py`.
4. **`typeset_pages.py issues/NNN-slug/`** — Pillow speech-bubble placement using the Andika font. OCR re-validation against the script.
5. **`publish_issue.py issues/NNN-slug/`** — OpenAI TTS narration + timestamps. Bundles into `issue.json`. Copies to `wordpets/public/comics/`. Emits seed SQL.

## Decodability is mechanically enforced

Every word in every speech bubble must be in `words_for_stage(stage_id)`, computed cumulatively from this stage and all prior stages, plus a small sight-word allowlist (`the, a, is, I, to, and, said, my`). Validation runs **twice**: once before art generation (against the script), once after typesetting (against OCR of the rendered bubbles). Either failure is a hard error.

The validator's stage table is parity-tested against `wordpets/src/lib/fixtures/student.ts` so the comic and the app cannot drift.

## Quick start

```bash
cd ~/projects/wordpets/comics
/opt/homebrew/bin/python3.12 -m venv .venv
.venv/bin/pip install -e ".[dev]"
PYTHONPATH=. .venv/bin/pytest -q
```

## Secrets (via Infisical, not local files)

API keys flow through Infisical → `wordpets/.env.local` (populated by
`npm run pull-secrets`). The comics pipeline reads from that same file —
single source of truth, single rotate-secrets workflow.

To wire up the pilot:

1. Add **`GEMINI_API_KEY`** to Infisical project `2423b7fc-bb02-4075-aba8-d7d04aacc820` (legacy name "blending-bootcamp"), env `prod`.
2. From `~/projects/wordpets`, run `npm run pull-secrets`.
3. Verify with `PYTHONPATH=. .venv/bin/python lib/secrets.py` — should show `OK GEMINI_API_KEY`.

Later phases also need `OPENAI_API_KEY` (for TTS) — that key already lives
in the same Infisical project, but the wordpets CLAUDE.md notes it may be
out of credits; check before relying on it.

## Pilot workflow (current state — June 2026)

The pipeline is intentionally centered on **one reviewable pilot issue**:
`issues/001-the-cat-and-the-hat/`. Refine that pilot before starting new
issues or extracting a reusable authoring skill. The pilot has rendered
panels/pages and a manual anchor-reference consistency workflow in
`issues/001-the-cat-and-the-hat/panel-prompts.md`; the production rules live in
`issues/001-the-cat-and-the-hat/production-brief.md`.

Typesetting exists for review pages. OCR re-validation, TTS, and publish are
still deferred until the pilot art direction and series format are approved.

```bash
# 1. Read the pilot production rules.
sed -n '1,240p' issues/001-the-cat-and-the-hat/production-brief.md

# 2. Refine the pilot script, manual panel prompts, or character canon.
$EDITOR issues/001-the-cat-and-the-hat/script.json
$EDITOR issues/001-the-cat-and-the-hat/panel-prompts.md

# 3. Validate the pilot script.
PYTHONPATH=. .venv/bin/python scripts/validate_script.py issues/001-the-cat-and-the-hat/script.json

# 4. Re-typeset the review pages after script or bubble changes.
PYTHONPATH=. .venv/bin/python scripts/typeset_pages.py issues/001-the-cat-and-the-hat --force

# 5. Generate candidate ref images only when the pilot needs a stronger locked ref pack.
#    Attach the WordPets asset-style screenshot so candidates do not drift back to watercolor.
PYTHONPATH=. .venv/bin/python scripts/generate_refs.py --character whiskers --batch 6 --style-ref style-references/wordpets-asset-style-target.jpeg
PYTHONPATH=. .venv/bin/python scripts/generate_refs.py --character sam --batch 6 --style-ref style-references/wordpets-asset-style-target.jpeg

# 6. Open characters/<name>/candidates/<dated-batch>/ in Finder, pick the 6-10
#    images that BEST match the canon. Copy them to characters/<name>/refs/.
#    (Iterate with --use-existing-refs if you want refinement variants.)

# 7. Generate or surgically re-roll panels for issue 001.
PYTHONPATH=. .venv/bin/python scripts/generate_panels.py issues/001-the-cat-and-the-hat

# 8. Open issues/001-the-cat-and-the-hat/panels/ and review.
#    To re-roll one panel: --panel 2:3
#    To re-roll all panels: --force
```

After this, you steer with the smallest possible change: edit
`characters/<name>/canon.md` for identity decisions, `prompts/base-style.md`
for series-wide style decisions, `script.json` for story/bubbles, and
`panel-prompts.md` for the manual consistency workflow. Once the pilot is
approved, extract the reusable skill from the pilot brief and then decide
whether to build OCR re-validation, TTS, and publish steps.

## Design constraints (non-negotiable)

- **Strict stage allowlist for all text** — no exceptions, no "almost decodable" sneaks.
- **Character names enter the cast in phonics-progression order** — at `cvc-short-a` the cat is just "Cat"; "Whiskers" only appears once `wh-`/`-er` is taught.
- **Surgical panel re-rolls** — never re-roll a whole issue when one panel is bad.
- **OpenAI TTS at publish time, not runtime** — app plays static MP3s, no per-session API spend.
- **Andika font in all speech bubbles** — single-story `a` for early-reader typography. AI in-art lettering is minimized; we control glyphs in post.

## Pedagogy

Every design decision traces to a principle in `~/projects/wordpets/kb/extracted/principles/`. The most load-bearing:

- **`video-book-hybrid.md`** — the decodability constraint creates the humor ("absurd by necessity").
- **`decodable-word-preview.md`** — every issue ships with a "My Words" preview page.
- **`systematic-review.md`** — recurring cast doubles as a phonics review device.
- **`break-up-monotony.md`** — wordless drama panels as palate cleansers.
- **`consistency-breeds-trust.md`** — same page count + cast across a stage's issues.

Re-read these before authoring.
