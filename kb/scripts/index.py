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
