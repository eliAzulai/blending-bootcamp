#!/usr/bin/env python3
"""Composite panel images into finished graphic-novel pages with speech bubbles.

Reads script.json for speech data, loads generated panel PNGs from panels/,
and outputs complete page images to pages/ — one PNG per page.

Usage:
    python scripts/typeset_pages.py issues/001-the-cat-and-the-hat
    python scripts/typeset_pages.py issues/001-the-cat-and-the-hat --page 3
    python scripts/typeset_pages.py issues/001-the-cat-and-the-hat --force

Output:
    issues/<slug>/pages/page-01.png  ...  page-06.png

The last page (My Words) requires no panel art — it is typeset purely from
the script's target_words and sight_words fields.

Pre-flight:
    - panels/ must exist (run generate_panels.py first).
    - Any missing panel PNG is replaced with a grey placeholder so you can
      typeset a partial issue for review.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

_THIS = Path(__file__).resolve()
_ROOT = _THIS.parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from lib.typesetter import (  # noqa: E402
    PanelSpec,
    BubbleSpec,
    bubbles_from_script_panel,
    compose_page,
    compose_mywords_page,
)


def _is_mywords_page(page: dict, script: dict) -> bool:
    """Detect the My Words page: only one panel whose art_prompt mentions MY WORDS."""
    panels = page.get("panels", [])
    if len(panels) != 1:
        return False
    art = panels[0].get("art_prompt", "").upper()
    return "MY WORDS" in art or "MYWORDS" in art


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("issue_dir", type=Path)
    parser.add_argument("--page", type=int, default=None, help="Typeset a single page number only")
    parser.add_argument("--force", action="store_true", help="Re-typeset existing pages")
    parser.add_argument("--page-width", type=int, default=None, help="Override page width in px")
    parser.add_argument("--page-height", type=int, default=None, help="Override page height in px")
    args = parser.parse_args(argv)

    issue_dir = args.issue_dir.resolve()
    if not issue_dir.exists():
        print(f"error: issue dir not found: {issue_dir}", file=sys.stderr)
        return 2

    script_path = issue_dir / "script.json"
    if not script_path.exists():
        print(f"error: no script.json in {issue_dir}", file=sys.stderr)
        return 2

    script = json.loads(script_path.read_text())
    panels_dir = issue_dir / "panels"
    pages_dir = issue_dir / "pages"
    pages_dir.mkdir(exist_ok=True)

    target_words = script.get("target_words") or []
    sight_words = script.get("sight_words") or script.get("permitted_sight_words") or []

    # Strip asterisks if present (some scripts store them as "* the")
    sight_words = [w.lstrip("* ") for w in sight_words]

    print(f"Issue:  {script.get('title','?')} ({script.get('stage_id','?')})")
    print(f"Pages:  {len(script.get('pages', []))}")
    print()

    successes = 0
    skipped = 0

    for page_data in script.get("pages", []):
        page_no = page_data.get("page", 0)

        if args.page is not None and page_no != args.page:
            continue

        out_path = pages_dir / f"page-{page_no:02d}.png"
        if out_path.exists() and not args.force and args.page is None:
            print(f"  page {page_no}: skip (exists — use --force to re-typeset)")
            skipped += 1
            continue

        # --- My Words page ---
        if _is_mywords_page(page_data, script):
            print(f"  page {page_no}: My Words page... ", end="", flush=True)
            # Use the first panel's image as the vignette if it was generated
            panel_pngs = sorted(panels_dir.glob(f"page-{page_no:02d}-panel-*.png"))
            vignette = panel_pngs[0] if panel_pngs else None
            img = compose_mywords_page(
                target_words=target_words,
                sight_words=sight_words,
                vignette_image_path=vignette,
            )
            img.save(out_path)
            print(f"-> {out_path.relative_to(_ROOT)}")
            successes += 1
            continue

        # --- Regular panels page ---
        page_panels = page_data.get("panels", [])
        specs: list[PanelSpec] = []
        for panel in page_panels:
            panel_no = panel.get("panel", 0)
            png = panels_dir / f"page-{page_no:02d}-panel-{panel_no:02d}.png"
            bubbles = bubbles_from_script_panel(panel)
            specs.append(PanelSpec(image_path=png, bubbles=bubbles))

        missing = sum(1 for s in specs if not s.image_path.exists())
        if missing:
            print(f"  page {page_no}: WARN — {missing}/{len(specs)} panel(s) missing, using placeholder")

        print(f"  page {page_no}: {len(specs)} panel(s), {sum(len(s.bubbles) for s in specs)} bubble(s)... ", end="", flush=True)
        img = compose_page(specs, page_no)
        img.save(out_path)
        print(f"-> {out_path.relative_to(_ROOT)}")
        successes += 1

    print()
    print(f"Typeset {successes} page(s), skipped {skipped}.")
    print(f"Pages in: {pages_dir.relative_to(_ROOT)}/")

    if successes > 0:
        print()
        print("Next: open pages/ and review. Adjust bubble_anchor in script.json")
        print("      and re-run with --page N for any bubbles that need repositioning.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
