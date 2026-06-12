# WordPets Teaching Resources KB

Queryable knowledge base built from Ilana's curated teaching PDFs. Two ChromaDB
collections: `wordpets-curriculum` (phonics, letters, reading levels) and
`wordpets-activities` (prompts, games, crafts).

## Structure

- `sources/` — 26 source PDFs and images (read-only)
- `extracted/curriculum/` — structured markdown for curriculum domain
- `extracted/activities/` — structured markdown for activity domain
- `scripts/` — extract, index, query
- `metadata.yaml` — file classification (hand-maintained)
- `.extract-state.json` — content-hash state for incremental extraction (gitignored)

## Setup

```bash
cd ~/projects/wordpets/kb
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run from the project root (`~/projects/wordpets`) so `PYTHONPATH=.` works:

```bash
cd ~/projects/wordpets
source kb/.venv/bin/activate
export OPENAI_API_KEY=$(grep '^OPENAI_API_KEY=' .env.local | cut -d= -f2- | tr -d '"')
```

## Pipeline

```bash
# 1. Classify each new file in kb/metadata.yaml
# 2. Extract sources → markdown (idempotent; incremental on re-run)
PYTHONPATH=. python3 -m kb.scripts.extract

# 3. Index markdown → ChromaDB
PYTHONPATH=. python3 -m kb.scripts.index

# 4. Query
PYTHONPATH=. python3 -m kb.scripts.query curriculum "CVC blending for K"
PYTHONPATH=. python3 -m kb.scripts.query activities "writing prompts first grade" --grade 1
```

Full reindex: `PYTHONPATH=. python3 -m kb.scripts.index --full-reindex`
Force re-extract: `PYTHONPATH=. python3 -m kb.scripts.extract --force`

## Claude Code skills

- `/curriculum-lookup <question>` — natural-language curriculum queries
- `/activity-ideas <question>` — natural-language activity queries

## Tests

```bash
kb/.venv/bin/pytest kb/tests/ -v   # from repo root, or: cd kb && .venv/bin/pytest -v
```

`kb/pyproject.toml` adds the repo root to pytest's `pythonpath`, so `PYTHONPATH=.` is no longer required.

## External storage

- ChromaDB: `~/.wordpets-kb-db/`
- Index state: `~/.wordpets-kb-state.sqlite`
