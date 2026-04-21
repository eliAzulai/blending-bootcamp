# Teaching Resources Knowledge Base

Date: 2026-04-22

## Overview

A queryable knowledge base built from Ilana's curated teaching resources (26 PDFs + images). Two separate ChromaDB collections — one for curriculum design (phonics patterns, letter sequences, reading levels) and one for activity ideas (prompts, games, crafts, movement). Accessible via CLI scripts and two Claude Code skills.

## Source Material

26 files in `kb/sources/`:

- **Letterbooks** (K): Letterbook 1 Cc, 3 Gg, 5 Dd — Ahava curriculum using Scholastic Readers
- **Whitebooklets** (1st-2nd): Books 11, 12, 18, 31, 32, 33 — highly decodable readers with recurring characters
- **ABC See Hear Do**: Cat Mat Lowercase, Giant Flashcards, Writing Practice Book — TPR/movement-based phonics
- **Handwriting**: S1-B2 Print from Dash into Learning
- **Red Cat Reading**: Kids Vs Phonics Level 1 A
- **Worksheets**: Hamburger Writing, Would You Rather Cards, ABC Calm Down Strategy Cards, Ice Cream Cone Letter Matching, Knock Knock Jokes
- **ESL lessons**: Technology ESL, Animals ESL
- **Writing**: Write-a-thon Explanation, Visual Conversation Starter, Shelter Poem
- **Images**: Snoopy Comic Example (PNG), Wordcloud Israel (JPG)

## Directory Structure

```
~/projects/wordpets/
  kb/
    sources/                    # renamed from ilana-teaching-resources/
    extracted/
      curriculum/               # structured markdown from curriculum-tagged files
      activities/               # structured markdown from activity-tagged files
    scripts/
      extract.py                # PDF -> markdown (text + vision)
      index.py                  # markdown -> ChromaDB
      query.py                  # CLI query interface
    metadata.yaml               # file classification & tags
    .extract-state.json         # tracks extraction state (gitignored)
    requirements.txt            # pymupdf, chromadb, openai
```

## Metadata Schema

Each source file is classified in `kb/metadata.yaml`:

```yaml
files:
  "Letterbook 1 Cc.pdf":
    extraction: vision          # vision | text | skip
    grade: [K]                  # K, 1, 2, 3+
    domain: [curriculum]        # curriculum | activity | both
    program: "Ahava Scholastic"
    topics: [letter-c, phonics, CVC]

  "Would You Rather Cards.pdf":
    extraction: text
    grade: [1, 2, 3+]
    domain: [activity]
    program: null
    topics: [writing-prompts, speaking]
```

### Full File Classification

**Vision extraction (13 files):**
- Letterbook 1 Cc, 3 Gg, 5 Dd
- Whitebooklets 11, 12, 18, 31, 32, 33
- ABC See Hear Do Cat Mat Lowercase
- ABC4 Giant Flashcards
- Snoopy Comic Example (PNG)
- Wordcloud Israel (JPG)

**Text extraction (10 files):**
- ABC4 Writing Practice Book
- Hamburger Writing Sample
- Handwriting S1-B2
- Red Cat Reading Phonics Level 1 A
- Write-a-thon Explanation
- TECHNOLOGY ESL
- Animals ESL
- Would You Rather Cards
- ABC Calm Down Strategy Cards
- Knock Knock Jokes

**Vision extraction (3 files):**
- Ice Cream Cone Letter Matching
- Shelter Poem
- Visual Conversation Starter

## Extraction Pipeline

### Text Extractor

Uses PyMuPDF (`fitz`) to pull text page by page. Output format:

```markdown
---
source: "Would You Rather Cards.pdf"
program: null
grade: [1, 2, 3+]
domain: [activity]
topics: [writing-prompts, speaking]
pages: 4
---

## Page 1

Would you rather have a pet dragon or a pet unicorn?
...
```

### Vision Extractor

Sends each page as an image to `gpt-4o-mini` with domain-specific prompts:

**Curriculum prompt**: "Describe the phonics content on this page. List: target letter/sound, example words, word families, CVC/CVCe patterns, reading level indicators, and any teaching sequence."

**Activity prompt**: "Describe this teaching material. List: the activity type, instructions, target skills, age/grade suitability, and materials needed."

Output format:

```markdown
---
source: "Letterbook 1 Cc.pdf"
program: "Ahava Scholastic"
grade: [K]
domain: [curriculum]
topics: [letter-c, phonics, CVC]
pages: 12
---

## Page 1
Target letter: C (uppercase and lowercase)
Key words: cat, car, cup, can
Activity: trace the letter, circle pictures starting with C
Teaching approach: visual + kinesthetic (tracing)
```

### State Tracking

`kb/.extract-state.json` stores content hashes per file. Running `extract.py` only processes new or changed files. Cost estimate for initial extraction: ~104 vision API calls at gpt-4o-mini rates, roughly $0.50-1.00.

### Dual-Domain Files

Files tagged `domain: [both]` produce extracted markdown in both `curriculum/` and `activities/` subdirectories.

## ChromaDB Collections

```
Database: ~/.wordpets-kb-db
State: ~/.wordpets-kb-state.sqlite

Collections:
  wordpets-curriculum    # phonics patterns, letter sequences, reading levels, word families
  wordpets-activities    # prompts, games, crafts, movement ideas, worksheets
```

### Chunking

Sentence-window chunking (same as microgreens-kb):
- 500-token target per chunk
- 2-sentence overlap between chunks
- Each chunk carries metadata: source, program, grade, topics, page

### Embedding

`text-embedding-3-small` via OpenAI API (cheapest option, same as microgreens-kb).

### Filtering

Queries can filter by grade level or topic via ChromaDB `where` clauses:

```python
collection.query(query_texts=["CVC blending patterns"], where={"grade": "K"})
```

## CLI Interface

Single `query.py` with collection as first positional arg:

```bash
# Curriculum queries
python3 kb/scripts/query.py curriculum "CVC blending for age 5"
python3 kb/scripts/query.py curriculum "long vowel patterns" --grade K
python3 kb/scripts/query.py curriculum "letter G activities" --top 3

# Activity queries
python3 kb/scripts/query.py activities "writing prompts first grade"
python3 kb/scripts/query.py activities "movement games" --grade K

# Extract & index
python3 kb/scripts/extract.py
python3 kb/scripts/index.py
python3 kb/scripts/index.py --full-reindex
```

## Claude Code Skills

### /curriculum-lookup

Queries `wordpets-curriculum` collection. Returns formatted results with source file, grade, and relevance score. Accepts optional `--grade` filter.

Usage: `/curriculum-lookup what phonics patterns work for teaching the letter blend "sh"?`

### /activity-ideas

Queries `wordpets-activities` collection. Same format and options.

Usage: `/activity-ideas creative writing prompt for 6 year olds`

Both skills run `query.py` under the hood and format output for conversation context. Registered in root `CLAUDE.md` and WordPets project `CLAUDE.md`.

## Dependencies

```
# kb/requirements.txt
PyMuPDF>=1.24
chromadb>=0.5
openai>=1.0
pyyaml>=6.0
```

`OPENAI_API_KEY` pulled from environment (already set for WordPets via Infisical).

## External Links (not indexed)

The source Google Doc also contained website links and YouTube videos. These are not part of the KB but noted for reference:

- Reading Eggs, Fast Phonics, Teach Your Monster, Class Dojo, ABC See Hear Do, Super Teacher Worksheets, Red Cat Reading, Dash into Learning
- YouTube: Kids vs Phonics sample, Funny news listening comprehension
- Grateful Together journal, Kazoo Magazine, Rebus Puzzles, Riddles for Kids
- Akiva Poem (Canva)
