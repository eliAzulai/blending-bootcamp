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
