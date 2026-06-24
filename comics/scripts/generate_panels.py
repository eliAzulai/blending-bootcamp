#!/usr/bin/env python3
"""Generate panel images for an issue using an AI image provider + character refs.

For each panel in script.json, builds a prompt from base-style + per-character
canon + the panel's art_prompt, then calls the image API with the character ref
pack as conditioning. Saves PNG + metadata alongside.

Idempotent by default — already-generated panels are skipped. Use --force to
re-roll all panels, or --panel page:panel for surgical re-roll of one.

Usage:
    python scripts/generate_panels.py issues/001-the-cat-and-the-hat
    python scripts/generate_panels.py issues/001-the-cat-and-the-hat --panel 2:3
    python scripts/generate_panels.py issues/001-the-cat-and-the-hat --force
    python scripts/generate_panels.py issues/001-the-cat-and-the-hat --style-ref style-references/wordpets-asset-style-target.jpeg
    python scripts/generate_panels.py issues/001-the-cat-and-the-hat --resolution 2K
    python scripts/generate_panels.py issues/001-the-cat-and-the-hat --provider openai
    python scripts/generate_panels.py issues/001-the-cat-and-the-hat --provider gemini

Pre-flight checks:
    - API key for the chosen provider must be loaded (via wordpets/.env.local
      or the environment): OPENAI_API_KEY (openai) or GEMINI_API_KEY (gemini).
    - script.json must exist and pass validate_script.py.
    - Every character referenced in any panel must have a non-empty refs/
      directory (otherwise the panel falls back to text-to-image, which gives
      poor consistency — warned, not blocked).
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

from lib.secrets import load_env, require  # noqa: E402
from lib.decodability import validate_script  # noqa: E402
from lib.panel_prompts import build_panel_prompt, gather_refs_for_panel  # noqa: E402


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("issue_dir", type=Path)
    parser.add_argument(
        "--panel",
        default=None,
        help="Surgical re-roll: page:panel format, e.g. '2:3'",
    )
    parser.add_argument("--force", action="store_true", help="Re-generate all panels")
    parser.add_argument("--aspect", default="4:3")
    parser.add_argument("--resolution", default="1K")
    parser.add_argument(
        "--provider",
        default="openai",
        choices=["openai", "gemini"],
        help="Image generation provider (default: openai)",
    )
    parser.add_argument(
        "--skip-decodability-check",
        action="store_true",
        help="Skip the validate_script gate (NOT recommended; only use for prompt iteration)",
    )
    parser.add_argument(
        "--style-ref",
        action="append",
        default=[],
        type=Path,
        help="Optional style reference image to pass as conditioning. May be repeated.",
    )
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

    if not args.skip_decodability_check:
        result = validate_script(script)
        if not result.ok:
            print(result.report(), file=sys.stderr)
            print("error: decodability check failed; refusing to generate.", file=sys.stderr)
            print("       fix the script or use --skip-decodability-check.", file=sys.stderr)
            return 1

    load_env()

    if args.provider == "openai":
        require("OPENAI_API_KEY")
        from lib.openai_image_client import OpenAIImageClient
        client = OpenAIImageClient()
    else:
        require("GEMINI_API_KEY")
        from lib.gemini_client import GeminiImageClient
        client = GeminiImageClient()

    style_refs: list[Path] = []
    for ref in args.style_ref:
        ref_path = ref if ref.is_absolute() else _ROOT / ref
        if not ref_path.exists():
            print(f"error: style ref not found: {ref_path}", file=sys.stderr)
            return 2
        style_refs.append(ref_path)

    panels_dir = issue_dir / "panels"
    panels_dir.mkdir(exist_ok=True)

    target: tuple[int, int] | None = None
    if args.panel:
        try:
            page_s, panel_s = args.panel.split(":")
            target = (int(page_s), int(panel_s))
        except ValueError:
            print(f"error: --panel must be page:panel format, got {args.panel!r}", file=sys.stderr)
            return 2

    total = sum(len(p.get("panels", [])) for p in script.get("pages", []))
    print(f"Issue:      {script.get('title', '?')} ({script.get('stage_id','?')})")
    print(f"Provider:   {args.provider} ({client.model})")
    print(f"Panels:     {total} total")
    if style_refs:
        print("Style refs:")
        for ref in style_refs:
            label = ref.relative_to(_ROOT) if ref.is_relative_to(_ROOT) else ref
            print(f"            - {label}")
    if target:
        print(f"Re-roll:    page {target[0]}, panel {target[1]} only")
    elif args.force:
        print("Force:      ON — all panels will regenerate")
    print()

    successes = 0
    skipped = 0
    failures = 0
    for page in script.get("pages", []):
        page_no = page.get("page", 0)
        for panel in page.get("panels", []):
            panel_no = panel.get("panel", 0)
            if target and (page_no, panel_no) != target:
                continue
            out_png = panels_dir / f"page-{page_no:02d}-panel-{panel_no:02d}.png"
            out_meta = panels_dir / f"page-{page_no:02d}-panel-{panel_no:02d}.meta.json"
            if out_png.exists() and not args.force and not target:
                print(f"  page {page_no} panel {panel_no}: skip (exists, use --force to re-roll)")
                skipped += 1
                continue

            refs, missing = gather_refs_for_panel(panel)
            refs = [*style_refs, *refs]
            if missing:
                print(
                    f"  page {page_no} panel {panel_no}: WARN — no refs for "
                    f"{missing}; falling back to text-to-image"
                )

            prompt = build_panel_prompt(script, page, panel)
            print(
                f"  page {page_no} panel {panel_no}: generating "
                f"({len(refs)} refs)... ",
                end="",
                flush=True,
            )
            try:
                image, meta = client.generate(
                    prompt,
                    refs=refs,
                    aspect_ratio=args.aspect,
                    resolution=args.resolution,
                )
            except Exception as e:
                print(f"FAIL: {e}")
                failures += 1
                continue
            image.save(out_png)
            out_meta.write_text(json.dumps(meta.to_dict(), indent=2))
            print(f"-> {out_png.name} ({meta.elapsed_seconds:.1f}s)")
            successes += 1

    print()
    print(f"Generated {successes}, skipped {skipped}, failed {failures}.")
    print(f"Panels in {panels_dir.relative_to(_ROOT)}/")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
