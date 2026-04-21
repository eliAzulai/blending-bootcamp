# Teaching Resources KB Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a queryable knowledge base from Ilana's 26 teaching PDFs with two ChromaDB collections (curriculum, activities) accessible via CLI and two Claude Code skills.

**Architecture:** PDFs → domain-specific extraction (text via PyMuPDF, images via OpenAI Vision) → structured markdown with YAML frontmatter → sentence-window chunking → two ChromaDB collections with per-chunk metadata for filtering → `query.py` CLI wrapped by `/curriculum-lookup` and `/activity-ideas` skills.

**Tech Stack:** Python 3.10+, PyMuPDF (`fitz`), OpenAI SDK (`gpt-4o-mini` for vision, `text-embedding-3-small` for embeddings), ChromaDB, PyYAML, pytest.

**Spec:** `docs/superpowers/specs/2026-04-22-teaching-resources-kb-design.md`

**Reference implementation:** `~/projects/microgreens-kb/scripts/` (same pattern, single collection).

---

## File Structure

### Create
```
kb/
  sources/                         # renamed from ilana-teaching-resources/
  extracted/
    curriculum/                    # domain-specific markdown outputs
    activities/
  scripts/
    __init__.py
    constants.py                   # DOMAINS, GRADES, COLLECTION_NAMES, paths
    chunking.py                    # tokenize + sentence-window chunker
    extract_text.py                # PyMuPDF text extraction
    extract_vision.py              # OpenAI vision extraction
    extract.py                     # CLI orchestrator (reads metadata.yaml, dispatches)
    index.py                       # markdown → ChromaDB (two collections)
    query.py                       # CLI query interface
  tests/
    __init__.py
    test_chunking.py
    test_extract_text.py
    test_extract_vision.py
    test_metadata.py
    fixtures/
      sample.pdf                   # single-page dummy PDF for text tests
  metadata.yaml                    # file classification (all 26 files tagged)
  requirements.txt
  .gitignore                       # ignore .extract-state.json, __pycache__
  README.md                        # how to extract, index, query
docs/superpowers/plans/2026-04-22-teaching-resources-kb.md  # this file
```

### Outside repo
```
~/.wordpets-kb-db/                 # ChromaDB persistent store
~/.wordpets-kb-state.sqlite        # index.py state tracking
kb/.extract-state.json             # extract.py state tracking (gitignored)
```

### Modify
- `~/projects/wordpets/CLAUDE.md` — document `kb/` directory and skills
- `~/CLAUDE.md` — register `/curriculum-lookup` and `/activity-ideas` under Custom Skills
- `~/.claude/skills/curriculum-lookup/SKILL.md` — create
- `~/.claude/skills/activity-ideas/SKILL.md` — create

---

## Task 1: Scaffold directory structure and move sources

**Files:**
- Create: `kb/sources/` (via rename), `kb/extracted/curriculum/`, `kb/extracted/activities/`, `kb/scripts/`, `kb/tests/`, `kb/tests/fixtures/`
- Create: `kb/.gitignore`, `kb/scripts/__init__.py`, `kb/tests/__init__.py`

- [ ] **Step 1: Rename teaching resources into kb/sources**

```bash
cd ~/projects/wordpets
mv ilana-teaching-resources kb
mv kb kb-tmp
mkdir -p kb/sources kb/extracted/curriculum kb/extracted/activities kb/scripts kb/tests/fixtures
mv kb-tmp/* kb/sources/
rmdir kb-tmp
ls kb/sources | wc -l
```
Expected: `26`

- [ ] **Step 2: Create `kb/.gitignore`**

```
.extract-state.json
__pycache__/
*.pyc
.pytest_cache/
.venv/
```

- [ ] **Step 3: Create empty `__init__.py` files**

```bash
touch kb/scripts/__init__.py kb/tests/__init__.py
```

- [ ] **Step 4: Commit**

```bash
cd ~/projects/wordpets
git add kb/sources kb/.gitignore kb/scripts/__init__.py kb/tests/__init__.py
git commit -m "chore(kb): scaffold directory structure and relocate teaching resources"
```

---

## Task 2: Write metadata.yaml with all 26 files classified

**Files:**
- Create: `kb/metadata.yaml`

- [ ] **Step 1: Create `kb/metadata.yaml`**

```yaml
# File classification for the WordPets teaching resources KB.
# Hand-maintained. Add new files here before running extract.py.
#
# Fields:
#   extraction: vision | text | skip  — how to pull content out
#   grade: list of [K, "1", "2", "3+"]  — target age range
#   domain: list of [curriculum, activity, both]  — which collection(s) to index into
#   program: string or null  — source program/publisher
#   topics: list of strings  — freeform tags for discoverability

files:
  "Letterbook 1 Cc.pdf":
    extraction: vision
    grade: [K]
    domain: [curriculum]
    program: "Ahava Scholastic"
    topics: [letter-c, phonics, CVC, handwriting]

  "Letterbook 3 Gg.pdf":
    extraction: vision
    grade: [K]
    domain: [curriculum]
    program: "Ahava Scholastic"
    topics: [letter-g, phonics, CVC, handwriting]

  "Letterbook 5 Dd.pdf":
    extraction: vision
    grade: [K]
    domain: [curriculum]
    program: "Ahava Scholastic"
    topics: [letter-d, phonics, CVC, handwriting]

  "Book 11 - Dad and Sam.pdf":
    extraction: vision
    grade: ["1", "2"]
    domain: [curriculum]
    program: "Whitebooklets"
    topics: [decodable-reader, CVC, short-a]

  "WB 12 - A Lot On Top.pdf":
    extraction: vision
    grade: ["1", "2"]
    domain: [curriculum]
    program: "Whitebooklets"
    topics: [decodable-reader, CVC, short-o]

  "WB 18 - My Cat Can.pdf":
    extraction: vision
    grade: ["1", "2"]
    domain: [curriculum]
    program: "Whitebooklets"
    topics: [decodable-reader, CVC, short-a]

  "WB 31 - Two Dogs.pdf":
    extraction: vision
    grade: ["1", "2"]
    domain: [curriculum]
    program: "Whitebooklets"
    topics: [decodable-reader, recurring-characters]

  "WB 32 - Yip Yap.pdf":
    extraction: vision
    grade: ["1", "2"]
    domain: [curriculum]
    program: "Whitebooklets"
    topics: [decodable-reader, recurring-characters]

  "WB 33 - A Trip in the Van.pdf":
    extraction: vision
    grade: ["1", "2"]
    domain: [curriculum]
    program: "Whitebooklets"
    topics: [decodable-reader, recurring-characters]

  "ABC See Hear Do Cat Mat Lowercase.pdf":
    extraction: vision
    grade: [K]
    domain: [both]
    program: "ABC See Hear Do"
    topics: [phonics, TPR, movement, lowercase, CVC]

  "ABC4 Giant Flashcards.pdf":
    extraction: vision
    grade: [K, "1"]
    domain: [curriculum]
    program: "ABC See Hear Do"
    topics: [flashcards, long-vowels]

  "ABC4 Writing Practice Book.pdf":
    extraction: text
    grade: [K, "1"]
    domain: [curriculum]
    program: "ABC See Hear Do"
    topics: [writing, long-vowels, word-practice]

  "Handwriting S1-B2.pdf":
    extraction: text
    grade: [K, "1"]
    domain: [curriculum]
    program: "Dash into Learning"
    topics: [handwriting, print, letter-formation]

  "Red Cat Reading Phonics Level1 A.pdf":
    extraction: text
    grade: [K, "1"]
    domain: [curriculum]
    program: "Red Cat Reading"
    topics: [phonics, CVC, kids-vs-phonics]

  "Hamburger Writing Sample.pdf":
    extraction: text
    grade: ["2", "3+"]
    domain: [activity]
    program: "Super Teacher Worksheets"
    topics: [writing, structure, paragraph]

  "Would You Rather Cards.pdf":
    extraction: text
    grade: ["1", "2", "3+"]
    domain: [activity]
    program: null
    topics: [writing-prompts, speaking, discussion]

  "ABC Calm Down Strategy Cards.pdf":
    extraction: text
    grade: [K, "1"]
    domain: [activity]
    program: null
    topics: [SEL, yoga, movement, calm-down]

  "Ice Cream Cone Letter Matching.pdf":
    extraction: vision
    grade: [K]
    domain: [both]
    program: "The Art Kit"
    topics: [letter-matching, uppercase, lowercase, craft]

  "Knock Knock Jokes.pdf":
    extraction: text
    grade: ["1", "2", "3+"]
    domain: [activity]
    program: null
    topics: [jokes, reading-fluency, humor]

  "TECHNOLOGY ESL.pdf":
    extraction: text
    grade: ["2", "3+"]
    domain: [activity]
    program: null
    topics: [ESL, topic-lesson, technology, conversation]

  "Animals ESL.pdf":
    extraction: text
    grade: ["2", "3+"]
    domain: [activity]
    program: null
    topics: [ESL, topic-lesson, animals, conversation]

  "Write-a-thon Explanation.pdf":
    extraction: text
    grade: ["2", "3+"]
    domain: [activity]
    program: null
    topics: [writing, event, extended-writing]

  "Visual Conversation Starter.pdf":
    extraction: vision
    grade: ["1", "2", "3+"]
    domain: [activity]
    program: null
    topics: [conversation, visual-prompt, writing]

  "Shelter Poem.pdf":
    extraction: vision
    grade: ["2", "3+"]
    domain: [activity]
    program: null
    topics: [poetry, acrostic, current-events]

  "Snoopy Comic Example.png":
    extraction: vision
    grade: ["2", "3+"]
    domain: [activity]
    program: null
    topics: [comic-strip, writing, humor]

  "Wordcloud Israel.jpg":
    extraction: vision
    grade: ["1", "2", "3+"]
    domain: [activity]
    program: null
    topics: [vocabulary, wordcloud, holidays, Israel]
```

- [ ] **Step 2: Validate YAML parses and has 26 entries**

```bash
python3 -c "import yaml; d = yaml.safe_load(open('kb/metadata.yaml')); print(len(d['files']))"
```
Expected: `26`

- [ ] **Step 3: Verify every file in sources/ appears in metadata**

```bash
python3 -c "
import os, yaml
meta = yaml.safe_load(open('kb/metadata.yaml'))['files']
sources = set(os.listdir('kb/sources'))
meta_files = set(meta.keys())
missing_in_meta = sources - meta_files
missing_on_disk = meta_files - sources
print(f'missing in metadata: {missing_in_meta}')
print(f'missing on disk:     {missing_on_disk}')
assert not missing_in_meta and not missing_on_disk
print('OK — all 26 files accounted for')
"
```
Expected: `OK — all 26 files accounted for`

- [ ] **Step 4: Commit**

```bash
git add kb/metadata.yaml
git commit -m "feat(kb): classify all 26 teaching resources in metadata.yaml"
```

---

## Task 3: Create requirements.txt and install into a venv

**Files:**
- Create: `kb/requirements.txt`

- [ ] **Step 1: Create `kb/requirements.txt`**

```
PyMuPDF>=1.24,<2
chromadb>=0.5,<1
openai>=1.50,<2
PyYAML>=6.0,<7
pytest>=8.0,<9
Pillow>=10.0,<12
```

- [ ] **Step 2: Create venv and install**

```bash
cd ~/projects/wordpets/kb
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 -c "import fitz, chromadb, openai, yaml, PIL; print('deps OK')"
```
Expected: `deps OK`

- [ ] **Step 3: Commit**

```bash
cd ~/projects/wordpets
git add kb/requirements.txt
git commit -m "chore(kb): add Python dependencies"
```

---

## Task 4: Write constants module

**Files:**
- Create: `kb/scripts/constants.py`

- [ ] **Step 1: Write `kb/scripts/constants.py`**

```python
"""Shared configuration for WordPets KB extraction, indexing, and query."""

import os

# Canonical tag vocabularies
DOMAINS = ["curriculum", "activity"]
EXTRACTION_MODES = ["vision", "text", "skip"]
GRADES = ["K", "1", "2", "3+"]

# ChromaDB collection names (one per domain)
COLLECTIONS = {
    "curriculum": "wordpets-curriculum",
    "activities": "wordpets-activities",
}

# Paths
KB_ROOT = os.path.expanduser("~/projects/wordpets/kb")
SOURCES_DIR = os.path.join(KB_ROOT, "sources")
EXTRACTED_DIR = os.path.join(KB_ROOT, "extracted")
METADATA_FILE = os.path.join(KB_ROOT, "metadata.yaml")
EXTRACT_STATE = os.path.join(KB_ROOT, ".extract-state.json")

DB_PATH = os.path.expanduser("~/.wordpets-kb-db")
INDEX_STATE_DB = os.path.expanduser("~/.wordpets-kb-state.sqlite")

# OpenAI models
VISION_MODEL = "gpt-4o-mini"
EMBEDDING_MODEL = "text-embedding-3-small"

# Chunking
CHUNK_TARGET_TOKENS = 500
OVERLAP_SENTENCES = 2
MIN_CHUNK_CHARS = 100
```

- [ ] **Step 2: Verify module imports cleanly**

```bash
cd ~/projects/wordpets
source kb/.venv/bin/activate
python3 -c "from kb.scripts import constants; print(constants.COLLECTIONS)"
```
Expected: `{'curriculum': 'wordpets-curriculum', 'activities': 'wordpets-activities'}`

- [ ] **Step 3: Commit**

```bash
git add kb/scripts/constants.py
git commit -m "feat(kb): shared constants for extraction/indexing/query"
```

---

## Task 5: Write chunking module (TDD)

**Files:**
- Create: `kb/scripts/chunking.py`, `kb/tests/test_chunking.py`

- [ ] **Step 1: Write the failing tests**

Create `kb/tests/test_chunking.py`:

```python
from kb.scripts.chunking import tokenize_sentences, chunk_sentences, rough_token_count


def test_tokenize_sentences_splits_on_boundaries():
    text = "This is one. This is two! Is this three? Yes it is."
    assert tokenize_sentences(text) == [
        "This is one.",
        "This is two!",
        "Is this three?",
        "Yes it is.",
    ]


def test_tokenize_sentences_collapses_whitespace():
    text = "Hello   world.\n\n\nFoo bar."
    assert tokenize_sentences(text) == ["Hello world.", "Foo bar."]


def test_tokenize_sentences_empty_input():
    assert tokenize_sentences("") == []
    assert tokenize_sentences("   \n\n  ") == []


def test_rough_token_count_uses_whitespace():
    assert rough_token_count("one two three") == 3
    assert rough_token_count("") == 0


def test_chunk_sentences_respects_token_ceiling():
    sentences = ["word " * 100, "word " * 100, "word " * 100, "word " * 100]
    chunks = chunk_sentences(sentences, target_tokens=150, overlap=1)
    assert len(chunks) >= 2
    for chunk in chunks:
        assert rough_token_count(chunk) <= 300  # at most one sentence over


def test_chunk_sentences_overlaps():
    sentences = [f"Sentence number {i}." for i in range(10)]
    chunks = chunk_sentences(sentences, target_tokens=10, overlap=2)
    # With overlap=2, consecutive chunks share some content
    assert len(chunks) > 1
    # The last sentence of one should appear in the next chunk somewhere
    assert any("Sentence number 1" in c for c in chunks[:2])


def test_chunk_sentences_filters_tiny_chunks():
    sentences = ["a.", "b."]  # both under min_chars
    chunks = chunk_sentences(sentences, target_tokens=100, overlap=1, min_chars=10)
    assert chunks == []


def test_chunk_sentences_empty_input():
    assert chunk_sentences([], target_tokens=100, overlap=2) == []
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/projects/wordpets
source kb/.venv/bin/activate
PYTHONPATH=. pytest kb/tests/test_chunking.py -v
```
Expected: ModuleNotFoundError on `kb.scripts.chunking`

- [ ] **Step 3: Write `kb/scripts/chunking.py`**

```python
"""Sentence tokenization and sentence-window chunking."""

import re


def tokenize_sentences(text: str) -> list[str]:
    """Split text into sentences. Zero dependencies — regex-only."""
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    # Split on .!? followed by whitespace + capital letter (start of next sentence)
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z])", text)
    return [p.strip() for p in parts if p.strip()]


def rough_token_count(text: str) -> int:
    """Approximate token count as whitespace-delimited words."""
    return len(text.split())


def chunk_sentences(
    sentences: list[str],
    target_tokens: int = 500,
    overlap: int = 2,
    min_chars: int = 100,
) -> list[str]:
    """Sentence-window chunking with overlap and a soft token ceiling.

    Each window grows until adding the next sentence would exceed target_tokens,
    then slides forward by (window_length - overlap) sentences.
    """
    chunks: list[str] = []
    i = 0
    n = len(sentences)
    while i < n:
        window: list[str] = []
        tokens = 0
        j = i
        while j < n and tokens < target_tokens:
            window.append(sentences[j])
            tokens += rough_token_count(sentences[j])
            j += 1
        chunk = " ".join(window)
        if len(chunk) >= min_chars:
            chunks.append(chunk)
        # Advance by (window_length - overlap) but always make forward progress
        i = max(i + 1, j - overlap)
    return chunks
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
PYTHONPATH=. pytest kb/tests/test_chunking.py -v
```
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add kb/scripts/chunking.py kb/tests/test_chunking.py
git commit -m "feat(kb): sentence-window chunking with tests"
```

---

## Task 6: Write text extractor (TDD)

**Files:**
- Create: `kb/scripts/extract_text.py`, `kb/tests/test_extract_text.py`, `kb/tests/fixtures/sample.pdf`

- [ ] **Step 1: Generate a tiny PDF fixture**

```bash
cd ~/projects/wordpets
source kb/.venv/bin/activate
python3 <<'PY'
import fitz
doc = fitz.open()
p1 = doc.new_page()
p1.insert_text((72, 72), "Hello world. This is page one.")
p2 = doc.new_page()
p2.insert_text((72, 72), "Second page content here.")
doc.save("kb/tests/fixtures/sample.pdf")
doc.close()
print("fixture created")
PY
```
Expected: `fixture created`

- [ ] **Step 2: Write the failing test**

Create `kb/tests/test_extract_text.py`:

```python
import os
from kb.scripts.extract_text import extract_pdf_text


FIXTURE = os.path.join(os.path.dirname(__file__), "fixtures", "sample.pdf")


def test_extract_pdf_text_returns_page_list():
    pages = extract_pdf_text(FIXTURE)
    assert isinstance(pages, list)
    assert len(pages) == 2
    assert "Hello world" in pages[0]
    assert "Second page content" in pages[1]


def test_extract_pdf_text_strips_empty_pages():
    pages = extract_pdf_text(FIXTURE)
    for p in pages:
        assert p == p.strip()
        assert p  # no empty strings
```

- [ ] **Step 3: Run test to verify it fails**

```bash
PYTHONPATH=. pytest kb/tests/test_extract_text.py -v
```
Expected: ModuleNotFoundError on `kb.scripts.extract_text`

- [ ] **Step 4: Write `kb/scripts/extract_text.py`**

```python
"""PDF text extraction via PyMuPDF."""

import fitz


def extract_pdf_text(path: str) -> list[str]:
    """Return per-page text. Strips whitespace and drops fully-empty pages."""
    pages: list[str] = []
    doc = fitz.open(path)
    try:
        for page in doc:
            text = page.get_text().strip()
            if text:
                pages.append(text)
    finally:
        doc.close()
    return pages
```

- [ ] **Step 5: Run test to verify it passes**

```bash
PYTHONPATH=. pytest kb/tests/test_extract_text.py -v
```
Expected: 2 passed

- [ ] **Step 6: Commit**

```bash
git add kb/scripts/extract_text.py kb/tests/test_extract_text.py kb/tests/fixtures/sample.pdf
git commit -m "feat(kb): PyMuPDF text extractor with fixture test"
```

---

## Task 7: Write vision extractor (TDD, mocked)

**Files:**
- Create: `kb/scripts/extract_vision.py`, `kb/tests/test_extract_vision.py`

- [ ] **Step 1: Write the failing test**

Create `kb/tests/test_extract_vision.py`:

```python
from unittest.mock import MagicMock
from kb.scripts.extract_vision import (
    prompt_for_domain,
    describe_image,
    pdf_page_to_png_bytes,
)
import os

FIXTURE = os.path.join(os.path.dirname(__file__), "fixtures", "sample.pdf")


def test_prompt_for_domain_curriculum_mentions_phonics():
    prompt = prompt_for_domain("curriculum")
    assert "phonics" in prompt.lower()
    assert "letter" in prompt.lower() or "sound" in prompt.lower()


def test_prompt_for_domain_activity_mentions_activity():
    prompt = prompt_for_domain("activity")
    assert "activity" in prompt.lower()
    assert "skill" in prompt.lower() or "age" in prompt.lower()


def test_prompt_for_domain_unknown_raises():
    import pytest
    with pytest.raises(ValueError):
        prompt_for_domain("bogus")


def test_pdf_page_to_png_bytes_returns_png():
    png = pdf_page_to_png_bytes(FIXTURE, page_index=0)
    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    assert len(png) > 100


def test_describe_image_passes_prompt_and_returns_text():
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content="A picture of the letter C."))]
    )
    result = describe_image(
        client=mock_client,
        png_bytes=b"fake-png-data",
        prompt="Describe the phonics content.",
    )
    assert result == "A picture of the letter C."
    call = mock_client.chat.completions.create.call_args
    messages = call.kwargs["messages"]
    assert any("phonics" in str(m).lower() for m in messages)
    assert any("image_url" in str(m) for m in messages)
```

- [ ] **Step 2: Run test to verify it fails**

```bash
PYTHONPATH=. pytest kb/tests/test_extract_vision.py -v
```
Expected: ModuleNotFoundError

- [ ] **Step 3: Write `kb/scripts/extract_vision.py`**

```python
"""OpenAI vision extraction: PDF/image pages → structured description."""

import base64
import io

import fitz
from PIL import Image

from kb.scripts.constants import VISION_MODEL


CURRICULUM_PROMPT = (
    "You are analyzing a page from a children's phonics or reading curriculum. "
    "Describe the phonics content on this page concisely. Include any of: "
    "target letter(s) or sound(s), example words, word families, "
    "CVC/CVCe patterns, reading level indicators, and teaching sequence. "
    "Use short lines with 'key: value' format where natural. "
    "Do not invent details — describe only what is visible."
)

ACTIVITY_PROMPT = (
    "You are analyzing a page from a classroom teaching activity. "
    "Describe the activity concisely. Include any of: activity type, "
    "instructions, target skills, age or grade suitability, materials needed, "
    "and example prompts or content visible on the page. "
    "Use short lines with 'key: value' format where natural. "
    "Do not invent details — describe only what is visible."
)

PROMPTS = {"curriculum": CURRICULUM_PROMPT, "activity": ACTIVITY_PROMPT}


def prompt_for_domain(domain: str) -> str:
    if domain not in PROMPTS:
        raise ValueError(f"Unknown domain: {domain}. Expected one of {list(PROMPTS)}.")
    return PROMPTS[domain]


def pdf_page_to_png_bytes(path: str, page_index: int, dpi: int = 144) -> bytes:
    """Render a single PDF page to PNG bytes. For PNG/JPG inputs use load_image_bytes."""
    doc = fitz.open(path)
    try:
        page = doc[page_index]
        zoom = dpi / 72
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom))
        return pix.tobytes("png")
    finally:
        doc.close()


def load_image_bytes(path: str) -> bytes:
    """Load a PNG/JPG/JPEG file and return PNG-encoded bytes (normalized)."""
    img = Image.open(path)
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="PNG")
    return buf.getvalue()


def count_pages(path: str) -> int:
    """Return number of pages. PDFs use fitz; images are always 1 page."""
    lower = path.lower()
    if lower.endswith((".png", ".jpg", ".jpeg")):
        return 1
    doc = fitz.open(path)
    try:
        return len(doc)
    finally:
        doc.close()


def describe_image(client, png_bytes: bytes, prompt: str) -> str:
    """Send a page image to the vision model and return the description."""
    b64 = base64.b64encode(png_bytes).decode("ascii")
    data_url = f"data:image/png;base64,{b64}"
    response = client.chat.completions.create(
        model=VISION_MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        max_tokens=500,
        temperature=0.2,
    )
    return response.choices[0].message.content.strip()
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
PYTHONPATH=. pytest kb/tests/test_extract_vision.py -v
```
Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
git add kb/scripts/extract_vision.py kb/tests/test_extract_vision.py
git commit -m "feat(kb): OpenAI vision extractor with domain-specific prompts"
```

---

## Task 8: Write extract.py CLI orchestrator

**Files:**
- Create: `kb/scripts/extract.py`, `kb/tests/test_metadata.py`

- [ ] **Step 1: Write the failing test for metadata loading**

Create `kb/tests/test_metadata.py`:

```python
import os
import tempfile
import yaml

from kb.scripts.extract import load_metadata, slugify, output_paths_for


def _write_meta(d):
    f = tempfile.NamedTemporaryFile(suffix=".yaml", delete=False, mode="w")
    yaml.safe_dump({"files": d}, f)
    f.close()
    return f.name


def test_load_metadata_returns_dict():
    path = _write_meta({
        "Foo.pdf": {
            "extraction": "text",
            "grade": ["K"],
            "domain": ["curriculum"],
            "program": "Test",
            "topics": ["t1"],
        }
    })
    try:
        m = load_metadata(path)
        assert "Foo.pdf" in m
        assert m["Foo.pdf"]["extraction"] == "text"
    finally:
        os.unlink(path)


def test_load_metadata_rejects_bad_extraction():
    path = _write_meta({
        "Foo.pdf": {
            "extraction": "bogus",
            "grade": ["K"],
            "domain": ["curriculum"],
            "program": None,
            "topics": [],
        }
    })
    try:
        import pytest
        with pytest.raises(ValueError, match="extraction"):
            load_metadata(path)
    finally:
        os.unlink(path)


def test_load_metadata_rejects_bad_domain():
    path = _write_meta({
        "Foo.pdf": {
            "extraction": "text",
            "grade": ["K"],
            "domain": ["oops"],
            "program": None,
            "topics": [],
        }
    })
    try:
        import pytest
        with pytest.raises(ValueError, match="domain"):
            load_metadata(path)
    finally:
        os.unlink(path)


def test_slugify_handles_spaces_and_punctuation():
    assert slugify("Letterbook 1 Cc.pdf") == "letterbook-1-cc"
    assert slugify("WB 33 - A Trip in the Van.pdf") == "wb-33-a-trip-in-the-van"
    assert slugify("Wordcloud Israel.jpg") == "wordcloud-israel"


def test_output_paths_for_curriculum_only():
    entry = {"domain": ["curriculum"]}
    paths = output_paths_for("Foo.pdf", entry, base="/tmp/extracted")
    assert paths == {"curriculum": "/tmp/extracted/curriculum/foo.md"}


def test_output_paths_for_both():
    entry = {"domain": ["both"]}
    paths = output_paths_for("Foo.pdf", entry, base="/tmp/extracted")
    assert paths == {
        "curriculum": "/tmp/extracted/curriculum/foo.md",
        "activity": "/tmp/extracted/activities/foo.md",
    }
```

- [ ] **Step 2: Run test to verify it fails**

```bash
PYTHONPATH=. pytest kb/tests/test_metadata.py -v
```
Expected: ModuleNotFoundError

- [ ] **Step 3: Write `kb/scripts/extract.py`**

```python
"""Extract content from source files into per-domain markdown.

Reads kb/metadata.yaml, dispatches each file to the text or vision extractor,
writes structured markdown to kb/extracted/<domain>/<slug>.md, and tracks
content hashes in kb/.extract-state.json so re-runs are idempotent.
"""

import argparse
import hashlib
import json
import os
import re
import sys

import yaml

from kb.scripts.constants import (
    EXTRACTED_DIR,
    EXTRACT_STATE,
    EXTRACTION_MODES,
    DOMAINS,
    METADATA_FILE,
    SOURCES_DIR,
)
from kb.scripts.extract_text import extract_pdf_text
from kb.scripts.extract_vision import (
    count_pages,
    describe_image,
    load_image_bytes,
    pdf_page_to_png_bytes,
    prompt_for_domain,
)


VALID_DOMAINS = set(DOMAINS + ["both"])


def load_metadata(path: str) -> dict:
    with open(path) as f:
        data = yaml.safe_load(f)
    files = data.get("files", {})
    for name, entry in files.items():
        ex = entry.get("extraction")
        if ex not in EXTRACTION_MODES:
            raise ValueError(f"{name}: invalid extraction '{ex}' (expected {EXTRACTION_MODES})")
        for d in entry.get("domain", []):
            if d not in VALID_DOMAINS:
                raise ValueError(f"{name}: invalid domain '{d}' (expected {sorted(VALID_DOMAINS)})")
    return files


def slugify(filename: str) -> str:
    base = os.path.splitext(filename)[0].lower()
    base = re.sub(r"[^a-z0-9]+", "-", base)
    return base.strip("-")


def expand_domains(domain_list: list[str]) -> list[str]:
    """'both' → ['curriculum', 'activity']. Otherwise passthrough deduped."""
    out = []
    for d in domain_list:
        if d == "both":
            out.extend(["curriculum", "activity"])
        else:
            out.append(d)
    return list(dict.fromkeys(out))  # dedupe preserve order


def output_paths_for(filename: str, entry: dict, base: str = EXTRACTED_DIR) -> dict[str, str]:
    slug = slugify(filename)
    domains = expand_domains(entry["domain"])
    # directory name: 'curriculum' → curriculum/, 'activity' → activities/
    dir_map = {"curriculum": "curriculum", "activity": "activities"}
    return {d: os.path.join(base, dir_map[d], f"{slug}.md") for d in domains}


def file_hash(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()[:16]


def load_state() -> dict:
    if not os.path.exists(EXTRACT_STATE):
        return {}
    with open(EXTRACT_STATE) as f:
        return json.load(f)


def save_state(state: dict) -> None:
    with open(EXTRACT_STATE, "w") as f:
        json.dump(state, f, indent=2, sort_keys=True)


def frontmatter(source: str, entry: dict, domain: str, pages: int) -> str:
    fm = {
        "source": source,
        "program": entry.get("program"),
        "grade": entry.get("grade", []),
        "domain": [domain],
        "topics": entry.get("topics", []),
        "pages": pages,
    }
    return "---\n" + yaml.safe_dump(fm, sort_keys=False).strip() + "\n---\n\n"


def extract_one_text(source_path: str, entry: dict, out_paths: dict[str, str]) -> None:
    pages = extract_pdf_text(source_path)
    body = "\n\n".join(f"## Page {i+1}\n\n{p}" for i, p in enumerate(pages))
    for domain, path in out_paths.items():
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(frontmatter(os.path.basename(source_path), entry, domain, len(pages)))
            f.write(body)


def extract_one_vision(source_path: str, entry: dict, out_paths: dict[str, str], client) -> None:
    n_pages = count_pages(source_path)
    is_image = source_path.lower().endswith((".png", ".jpg", ".jpeg"))

    for domain, path in out_paths.items():
        prompt = prompt_for_domain(domain)
        descriptions: list[str] = []
        for i in range(n_pages):
            if is_image:
                img_bytes = load_image_bytes(source_path)
            else:
                img_bytes = pdf_page_to_png_bytes(source_path, page_index=i)
            desc = describe_image(client, img_bytes, prompt)
            descriptions.append(desc)

        body = "\n\n".join(f"## Page {i+1}\n\n{d}" for i, d in enumerate(descriptions))
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(frontmatter(os.path.basename(source_path), entry, domain, n_pages))
            f.write(body)


def main():
    parser = argparse.ArgumentParser(description="Extract KB sources into structured markdown.")
    parser.add_argument("--only", help="Process only this filename (debug)")
    parser.add_argument("--force", action="store_true", help="Re-extract even if unchanged")
    parser.add_argument("--dry-run", action="store_true", help="Print plan without calling APIs")
    args = parser.parse_args()

    metadata = load_metadata(METADATA_FILE)
    state = load_state()

    client = None
    needs_client = any(e.get("extraction") == "vision" for e in metadata.values())
    if needs_client and not args.dry_run:
        from openai import OpenAI
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise SystemExit("OPENAI_API_KEY not set (needed for vision extraction)")
        client = OpenAI(api_key=api_key)

    processed = 0
    skipped = 0
    for filename, entry in metadata.items():
        if args.only and filename != args.only:
            continue
        if entry.get("extraction") == "skip":
            continue

        source_path = os.path.join(SOURCES_DIR, filename)
        if not os.path.exists(source_path):
            print(f"MISSING: {filename}", file=sys.stderr)
            continue

        chash = file_hash(source_path)
        if not args.force and state.get(filename) == chash:
            skipped += 1
            continue

        out_paths = output_paths_for(filename, entry)
        print(f"[{entry['extraction']:6s}] {filename} → {list(out_paths.keys())}")

        if args.dry_run:
            continue

        if entry["extraction"] == "text":
            extract_one_text(source_path, entry, out_paths)
        elif entry["extraction"] == "vision":
            extract_one_vision(source_path, entry, out_paths, client)

        state[filename] = chash
        save_state(state)
        processed += 1

    print(f"\nProcessed: {processed}, skipped (unchanged): {skipped}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
PYTHONPATH=. pytest kb/tests/test_metadata.py -v
```
Expected: 6 passed

- [ ] **Step 5: Dry-run the extractor to confirm wiring**

```bash
PYTHONPATH=. python3 -m kb.scripts.extract --dry-run | head -30
```
Expected: 26 lines like `[text  ] Foo.pdf → ['activity']` / `[vision] Foo.pdf → ['curriculum']`, ending with `Processed: 0, skipped (unchanged): 0`

- [ ] **Step 6: Commit**

```bash
git add kb/scripts/extract.py kb/tests/test_metadata.py
git commit -m "feat(kb): extract.py orchestrator with state tracking"
```

---

## Task 9: Run full extraction end-to-end

**Files:**
- Generates: `kb/extracted/curriculum/*.md`, `kb/extracted/activities/*.md`, `kb/.extract-state.json`

- [ ] **Step 1: Ensure OPENAI_API_KEY is set**

```bash
cd ~/projects/wordpets
npm run pull-secrets  # writes .env.local from Infisical
export OPENAI_API_KEY=$(grep '^OPENAI_API_KEY=' .env.local | cut -d= -f2- | tr -d '"')
test -n "$OPENAI_API_KEY" && echo "key loaded"
```
Expected: `key loaded`

- [ ] **Step 2: Smoke test with one text file first**

```bash
source kb/.venv/bin/activate
PYTHONPATH=. python3 -m kb.scripts.extract --only "Would You Rather Cards.pdf"
ls kb/extracted/activities/
head -20 kb/extracted/activities/would-you-rather-cards.md
```
Expected: file exists with frontmatter + page content

- [ ] **Step 3: Smoke test with one vision file**

```bash
PYTHONPATH=. python3 -m kb.scripts.extract --only "Letterbook 1 Cc.pdf"
ls kb/extracted/curriculum/
head -30 kb/extracted/curriculum/letterbook-1-cc.md
```
Expected: frontmatter + at least one `## Page N` section with vision-model description

- [ ] **Step 4: Run full extraction**

```bash
time PYTHONPATH=. python3 -m kb.scripts.extract
```
Expected: ~26 files processed, completes in a few minutes. Watch for any failures.

- [ ] **Step 5: Verify outputs**

```bash
ls kb/extracted/curriculum/ | wc -l
ls kb/extracted/activities/ | wc -l
du -sh kb/extracted/
```
Expected: file counts matching the metadata (13 curriculum-only + 3 both + 10 activity-only + 3 both = 16 curriculum files, 13 activity files)

- [ ] **Step 6: Commit extracted markdown**

```bash
git add kb/extracted/
git commit -m "feat(kb): generate extracted markdown for all 26 sources"
```

---

## Task 10: Write index.py

**Files:**
- Create: `kb/scripts/index.py`

- [ ] **Step 1: Write `kb/scripts/index.py`**

```python
"""Index extracted markdown into two ChromaDB collections (curriculum + activities).

Idempotent: keys on (rel_path, content_hash). Renames create a new entry.
Content changes delete old chunks and re-upsert.
"""

import argparse
import glob
import hashlib
import os
import re
import sqlite3
import sys

import yaml
import chromadb
from chromadb.utils import embedding_functions

from kb.scripts.chunking import chunk_sentences, tokenize_sentences
from kb.scripts.constants import (
    COLLECTIONS,
    DB_PATH,
    EMBEDDING_MODEL,
    EXTRACTED_DIR,
    INDEX_STATE_DB,
    MIN_CHUNK_CHARS,
    OVERLAP_SENTENCES,
    CHUNK_TARGET_TOKENS,
)


# Map on-disk directory name → domain key → ChromaDB collection name
DIR_TO_DOMAIN = {"curriculum": "curriculum", "activities": "activities"}


def file_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:16]


def split_frontmatter(text: str) -> tuple[dict, str]:
    """Split a YAML frontmatter document. Returns ({}, text) if no frontmatter."""
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---\n", 4)
    if end == -1:
        return {}, text
    meta = yaml.safe_load(text[4:end]) or {}
    body = text[end + 5 :]
    return meta, body


def get_state_conn():
    conn = sqlite3.connect(INDEX_STATE_DB)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS indexed_files (
            collection TEXT,
            rel_path TEXT,
            content_hash TEXT,
            chunk_ids TEXT,
            PRIMARY KEY (collection, rel_path)
        )
        """
    )
    conn.commit()
    return conn


def sanitize_meta(meta: dict) -> dict:
    """ChromaDB metadata values must be str/int/float/bool — flatten lists."""
    out = {}
    for k, v in meta.items():
        if v is None:
            continue
        if isinstance(v, list):
            out[k] = ",".join(str(x) for x in v)
        elif isinstance(v, (str, int, float, bool)):
            out[k] = v
        else:
            out[k] = str(v)
    return out


def index_file(collection, conn, collection_key: str, filepath: str, force: bool = False) -> int:
    with open(filepath) as f:
        text = f.read()
    frontmatter, body = split_frontmatter(text)

    rel = os.path.relpath(filepath, EXTRACTED_DIR)
    chash = file_hash(text)

    row = conn.execute(
        "SELECT content_hash, chunk_ids FROM indexed_files WHERE collection=? AND rel_path=?",
        (collection_key, rel),
    ).fetchone()

    if row and row[0] == chash and not force:
        return 0

    # Delete old chunks for this path
    if row:
        old_ids = [x for x in row[1].split(",") if x]
        if old_ids:
            try:
                collection.delete(ids=old_ids)
            except Exception:
                pass
        conn.execute(
            "DELETE FROM indexed_files WHERE collection=? AND rel_path=?",
            (collection_key, rel),
        )

    sentences = tokenize_sentences(body)
    chunks = chunk_sentences(
        sentences,
        target_tokens=CHUNK_TARGET_TOKENS,
        overlap=OVERLAP_SENTENCES,
        min_chars=MIN_CHUNK_CHARS,
    )
    if not chunks:
        return 0

    base_meta = sanitize_meta(frontmatter)
    base_meta["rel_path"] = rel

    ids = [f"{collection_key}::{rel}::{chash}::{i}" for i in range(len(chunks))]
    metadatas = [{**base_meta, "chunk_index": i} for i in range(len(chunks))]

    collection.upsert(documents=chunks, ids=ids, metadatas=metadatas)
    conn.execute(
        "INSERT INTO indexed_files VALUES (?,?,?,?)",
        (collection_key, rel, chash, ",".join(ids)),
    )
    conn.commit()
    print(f"  [{collection_key:12s}] {len(chunks)} chunks ← {rel}")
    return len(chunks)


def main():
    parser = argparse.ArgumentParser(description="Index extracted markdown into ChromaDB.")
    parser.add_argument("--full-reindex", action="store_true", help="Drop collections and rebuild")
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit("OPENAI_API_KEY not set")

    client = chromadb.PersistentClient(path=DB_PATH)
    ef = embedding_functions.OpenAIEmbeddingFunction(
        api_key=api_key,
        model_name=EMBEDDING_MODEL,
    )

    if args.full_reindex:
        for name in COLLECTIONS.values():
            try:
                client.delete_collection(name)
            except Exception:
                pass
        if os.path.exists(INDEX_STATE_DB):
            os.remove(INDEX_STATE_DB)
        print("Full reindex: collections cleared.")

    collections = {
        key: client.get_or_create_collection(name, embedding_function=ef)
        for key, name in COLLECTIONS.items()
    }
    conn = get_state_conn()

    total = 0
    for dir_name, collection_key in [("curriculum", "curriculum"), ("activities", "activities")]:
        pattern = os.path.join(EXTRACTED_DIR, dir_name, "*.md")
        for filepath in sorted(glob.glob(pattern)):
            total += index_file(collections[collection_key], conn, collection_key, filepath, force=args.full_reindex)

    conn.close()
    print(f"\nTotal chunks upserted this run: {total}")
    for key, col in collections.items():
        print(f"  {COLLECTIONS[key]}: {col.count()} chunks")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run initial indexing**

```bash
cd ~/projects/wordpets
source kb/.venv/bin/activate
export OPENAI_API_KEY=$(grep '^OPENAI_API_KEY=' .env.local | cut -d= -f2- | tr -d '"')
PYTHONPATH=. python3 -m kb.scripts.index
```
Expected: per-file log lines + summary showing both collections non-empty

- [ ] **Step 3: Verify idempotency (second run should be a no-op)**

```bash
PYTHONPATH=. python3 -m kb.scripts.index
```
Expected: `Total chunks upserted this run: 0` and unchanged counts per collection

- [ ] **Step 4: Commit**

```bash
git add kb/scripts/index.py
git commit -m "feat(kb): indexer writes to curriculum + activities collections"
```

---

## Task 11: Write query.py

**Files:**
- Create: `kb/scripts/query.py`

- [ ] **Step 1: Write `kb/scripts/query.py`**

```python
"""Query a WordPets KB collection with natural language."""

import argparse
import os
import sys

import chromadb
from chromadb.utils import embedding_functions

from kb.scripts.constants import COLLECTIONS, DB_PATH, EMBEDDING_MODEL, GRADES


def query(collection_key: str, text: str, n_results: int = 5, grade: str | None = None) -> list[dict]:
    if collection_key not in COLLECTIONS:
        raise SystemExit(f"Unknown collection '{collection_key}'. Expected one of: {list(COLLECTIONS)}")
    if grade and grade not in GRADES:
        raise SystemExit(f"Invalid grade '{grade}'. Expected one of: {GRADES}")

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit("OPENAI_API_KEY not set")

    client = chromadb.PersistentClient(path=DB_PATH)
    ef = embedding_functions.OpenAIEmbeddingFunction(
        api_key=api_key,
        model_name=EMBEDDING_MODEL,
    )
    try:
        collection = client.get_collection(COLLECTIONS[collection_key], embedding_function=ef)
    except Exception:
        raise SystemExit(f"Collection '{COLLECTIONS[collection_key]}' not found. Run: python3 -m kb.scripts.index")

    if collection.count() == 0:
        raise SystemExit(f"Collection empty. Run: python3 -m kb.scripts.index")

    # grade is stored as comma-joined string (e.g. "K,1"). Use $contains substring match.
    where_doc = None
    # ChromaDB doesn't support substring on metadata, so we over-fetch and filter in Python.
    fetch_n = n_results * 4 if grade else n_results
    results = collection.query(
        query_texts=[text],
        n_results=min(fetch_n, collection.count()),
    )

    docs = results["documents"][0]
    metas = results["metadatas"][0]
    dists = results["distances"][0]

    out = []
    for doc, meta, dist in zip(docs, metas, dists):
        if grade:
            stored = meta.get("grade", "")
            grades_here = [g.strip() for g in stored.split(",")] if stored else []
            if grade not in grades_here:
                continue
        out.append({"doc": doc, "meta": meta, "distance": dist})
        if len(out) >= n_results:
            break
    return out


def format_result(i: int, r: dict, max_chars: int = 600) -> str:
    m = r["meta"]
    header = (
        f"Result {i+1}  dist={r['distance']:.4f}  "
        f"source={m.get('source')}  grade={m.get('grade')}  "
        f"program={m.get('program')}"
    )
    body = r["doc"]
    if len(body) > max_chars:
        body = body[:max_chars] + "…"
    return f"{'='*70}\n{header}\n{'='*70}\n{body}"


def main():
    parser = argparse.ArgumentParser(description="Query the WordPets KB.")
    parser.add_argument("collection", choices=list(COLLECTIONS.keys()), help="Which collection to query")
    parser.add_argument("question", nargs="+", help="Natural language question")
    parser.add_argument("--grade", choices=GRADES, help="Filter by grade level")
    parser.add_argument("--top", type=int, default=5, help="Number of results (default 5)")
    args = parser.parse_args()

    results = query(args.collection, " ".join(args.question), n_results=args.top, grade=args.grade)
    if not results:
        print("No results found.")
        return
    for i, r in enumerate(results):
        print(format_result(i, r))
        print()


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Smoke-test curriculum query**

```bash
cd ~/projects/wordpets
source kb/.venv/bin/activate
export OPENAI_API_KEY=$(grep '^OPENAI_API_KEY=' .env.local | cut -d= -f2- | tr -d '"')
PYTHONPATH=. python3 -m kb.scripts.query curriculum "CVC blending for kindergarten" --top 3
```
Expected: 3 results with source filenames, grades, and body text. Top result should cite a Letterbook or Whitebooklet.

- [ ] **Step 3: Smoke-test activities query with grade filter**

```bash
PYTHONPATH=. python3 -m kb.scripts.query activities "creative writing prompts" --grade "2" --top 3
```
Expected: results showing items like Would You Rather Cards or Hamburger Writing, all with grade including "2".

- [ ] **Step 4: Commit**

```bash
git add kb/scripts/query.py
git commit -m "feat(kb): query.py CLI with grade filtering"
```

---

## Task 12: Create /curriculum-lookup skill

**Files:**
- Create: `~/.claude/skills/curriculum-lookup/SKILL.md`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p ~/.claude/skills/curriculum-lookup
```

- [ ] **Step 2: Write `~/.claude/skills/curriculum-lookup/SKILL.md`**

```markdown
---
name: curriculum-lookup
description: >
  Query the WordPets teaching-resources curriculum knowledge base for phonics
  patterns, letter sequences, reading levels, word families, and handwriting
  guidance. Use when designing WordPets lessons, choosing CVC/CVCe progressions,
  picking decodable readers, or cross-referencing Ilana's source materials
  (Letterbooks, Whitebooklets, ABC See Hear Do, Red Cat Reading, Handwriting S1-B2).
  Trigger on: "curriculum", "phonics", "letter", "CVC", "blending", "decodable",
  "reading level", "word family", "handwriting", "WordPets lesson".
---

# Curriculum Lookup — WordPets Teaching Resources

Query the `wordpets-curriculum` ChromaDB collection built from Ilana's source
materials. Returns top matches with source file, grade, and program.

## Usage

Take the user's question as-is (or rephrase it more concretely if vague), then run:

```bash
cd ~/projects/wordpets
source kb/.venv/bin/activate
export OPENAI_API_KEY=$(grep '^OPENAI_API_KEY=' .env.local | cut -d= -f2- | tr -d '"')
PYTHONPATH=. python3 -m kb.scripts.query curriculum "<question>" [--grade K|1|2|3+] [--top N]
```

- Default `--top 5` is usually right. Use `--top 3` for focused queries, `--top 10` for exploration.
- Pass `--grade` when the user specifies an age or grade ("for kindergarten", "first graders").

## Formatting results

After running the CLI, summarize for the user:

1. Lead with a 2-3 sentence direct answer synthesized from the top matches.
2. List the sources you drew from with their grades and programs.
3. Include one representative quote or detail per source where helpful.
4. If results are weak (high distances, off-topic), say so plainly — don't oversell.

## When NOT to use

- For activity ideas (worksheets, prompts, games): use `/activity-ideas` instead.
- For general programming or WordPets app code questions: this skill has no code content.
- If the user's question is clearly outside the source material (e.g. non-English literacy, upper-grade reading): note the gap rather than returning loose matches.

## Troubleshooting

- "Collection empty" → run `PYTHONPATH=. python3 -m kb.scripts.index` from `~/projects/wordpets`
- "OPENAI_API_KEY not set" → run `npm run pull-secrets` first, then re-export the var
- Missing extracted content → run `PYTHONPATH=. python3 -m kb.scripts.extract`
```

- [ ] **Step 3: Verify skill loads**

```bash
ls ~/.claude/skills/curriculum-lookup/SKILL.md
head -5 ~/.claude/skills/curriculum-lookup/SKILL.md
```
Expected: file exists with frontmatter

- [ ] **Step 4: Commit skill** (note: skills live outside the repo, so no repo commit here)

Skill is in place at `~/.claude/skills/curriculum-lookup/SKILL.md`. No git action needed — skills are user-level, not project-level.

---

## Task 13: Create /activity-ideas skill

**Files:**
- Create: `~/.claude/skills/activity-ideas/SKILL.md`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p ~/.claude/skills/activity-ideas
```

- [ ] **Step 2: Write `~/.claude/skills/activity-ideas/SKILL.md`**

```markdown
---
name: activity-ideas
description: >
  Query the WordPets teaching-resources activity knowledge base for writing
  prompts, speaking/discussion starters, ESL topic lessons, yoga/SEL cards,
  jokes, comic strips, wordclouds, letter-matching crafts, and poetry templates.
  Use when designing WordPets activities, brainstorming classroom extensions,
  or pulling specific prompts from Ilana's materials (Would You Rather, Knock
  Knock Jokes, ABC Calm Down, ESL worksheets, Hamburger Writing, Write-a-thon,
  Visual Conversation Starter, Shelter Poem).
  Trigger on: "activity", "writing prompt", "discussion", "game", "craft",
  "ESL", "yoga", "calm down", "joke", "comic", "wordcloud", "poem", "speaking".
---

# Activity Ideas — WordPets Teaching Resources

Query the `wordpets-activities` ChromaDB collection built from Ilana's source
materials. Returns top matches with source file, grade, and program.

## Usage

Take the user's question as-is (or rephrase it more concretely if vague), then run:

```bash
cd ~/projects/wordpets
source kb/.venv/bin/activate
export OPENAI_API_KEY=$(grep '^OPENAI_API_KEY=' .env.local | cut -d= -f2- | tr -d '"')
PYTHONPATH=. python3 -m kb.scripts.query activities "<question>" [--grade K|1|2|3+] [--top N]
```

- Default `--top 5` is usually right. Use `--top 3` for focused queries, `--top 10` for exploration.
- Pass `--grade` when the user specifies an age or grade.

## Formatting results

After running the CLI, summarize for the user:

1. Lead with a short direct answer — what activity fits, or what prompt to use.
2. List the sources you drew from with their grades.
3. Include concrete examples (actual prompts, jokes, or activity steps) rather than vague descriptions.
4. If results are weak, say so — don't invent content that isn't in the source material.

## When NOT to use

- For phonics/reading curriculum questions: use `/curriculum-lookup` instead.
- For general brainstorming unrelated to Ilana's materials: this skill only knows what's indexed.

## Troubleshooting

- "Collection empty" → run `PYTHONPATH=. python3 -m kb.scripts.index` from `~/projects/wordpets`
- "OPENAI_API_KEY not set" → run `npm run pull-secrets` first, then re-export the var
- Missing extracted content → run `PYTHONPATH=. python3 -m kb.scripts.extract`
```

- [ ] **Step 3: Verify skill loads**

```bash
ls ~/.claude/skills/activity-ideas/SKILL.md
```
Expected: file exists

---

## Task 14: Write README and update CLAUDE.md files

**Files:**
- Create: `kb/README.md`
- Modify: `~/projects/wordpets/CLAUDE.md`, `~/CLAUDE.md`

- [ ] **Step 1: Write `kb/README.md`**

```markdown
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
PYTHONPATH=. pytest kb/tests/ -v
```

## External storage

- ChromaDB: `~/.wordpets-kb-db/`
- Index state: `~/.wordpets-kb-state.sqlite`
```

- [ ] **Step 2: Append to `~/projects/wordpets/CLAUDE.md`**

Add this section after the existing `## Design Spec` section:

```markdown
## Teaching Resources KB (`kb/`)

Queryable knowledge base of Ilana's curated teaching materials. See `kb/README.md`.

- 26 source PDFs/images in `kb/sources/`
- Two ChromaDB collections: `wordpets-curriculum`, `wordpets-activities`
- Run `PYTHONPATH=. python3 -m kb.scripts.extract` (incremental) → `PYTHONPATH=. python3 -m kb.scripts.index`
- Query via `PYTHONPATH=. python3 -m kb.scripts.query <curriculum|activities> "question" [--grade K|1|2|3+]`
- Or via skills: `/curriculum-lookup`, `/activity-ideas`
- Setup: `cd kb && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
- Needs `OPENAI_API_KEY` (already in Infisical project `blending-bootcamp`, pulled by `npm run pull-secrets`)
```

- [ ] **Step 3: Add skills to `~/CLAUDE.md`**

In the `## Custom Skills & Scripts` section, add these two bullets alongside the existing skills:

```markdown
- `/curriculum-lookup` — Query WordPets curriculum KB (phonics, letters, reading levels) from Ilana's materials
- `/activity-ideas` — Query WordPets activities KB (prompts, games, crafts, ESL) from Ilana's materials
```

- [ ] **Step 4: Commit**

```bash
cd ~/projects/wordpets
git add kb/README.md CLAUDE.md
git commit -m "docs(kb): README, project CLAUDE.md entry, skill registrations"
```

(The `~/CLAUDE.md` update is outside this repo — the edit is committed only if that directory is git-tracked.)

---

## Task 15: End-to-end smoke test via skill

**Files:** (none modified)

- [ ] **Step 1: Open a fresh Claude Code session and invoke `/curriculum-lookup`**

Prompt:
> `/curriculum-lookup what phonics patterns are used in the Letterbook Cc materials for kindergarten?`

Expected: Claude invokes the skill, runs `query.py curriculum ...`, summarizes results citing Letterbook 1 Cc and any related CVC-short-a content.

- [ ] **Step 2: Invoke `/activity-ideas`**

Prompt:
> `/activity-ideas give me three writing prompts suitable for a 2nd grader`

Expected: Claude runs `query.py activities ... --grade 2`, returns items like Would You Rather, Hamburger Writing, Write-a-thon.

- [ ] **Step 3: Invoke with a deliberately off-topic query**

Prompt:
> `/curriculum-lookup how do I deploy a Vercel site?`

Expected: Skill runs, returns low-relevance results, and Claude's summary acknowledges the query is out of scope.

- [ ] **Step 4: Final commit log review**

```bash
cd ~/projects/wordpets
git log --oneline -15
```
Expected: ~10-12 commits covering scaffolding, metadata, chunking, extractors, orchestrator, extracted content, indexer, query, and docs.

---

## Self-Review Notes

- **Spec coverage:** All spec sections map to tasks — file structure (Task 1), metadata schema (Task 2), text/vision extractors (Tasks 6-8), chunking & collections (Tasks 5, 10), CLI (Task 11), skills (Tasks 12-13), docs (Task 14), end-to-end run (Tasks 9, 15).
- **Placeholders:** None — every step has concrete code and commands.
- **Type consistency:** `COLLECTIONS` dict keys `curriculum`/`activities` are used uniformly across `constants.py`, `index.py`, `query.py`, and `extract.py`. The on-disk folder `extracted/activities/` maps to the `activity` domain in metadata (singular), which is normalized in `extract.py:output_paths_for`.
- **"Both" domain handling:** Test `test_output_paths_for_both` asserts expansion; `extract_one_vision` loops over `out_paths.items()` so each domain gets its own prompt, matching the spec.
- **Grade filtering quirk:** ChromaDB can't do substring on metadata and we store grades as comma-joined strings, so `query.py` over-fetches (×4) and filters in Python. Documented in-code.
