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
