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
    "principles": "wordpets-principles",
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
