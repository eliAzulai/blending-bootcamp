#!/usr/bin/env python3
"""Dump the full Gemini prompt for every panel to a markdown file.

Dry-run review tool — no API calls, no images generated. Use this to read
and iterate on prompts before spending Gemini credits.

Output: issues/<slug>/prompts-preview.md

Usage:
    python scripts/preview_prompts.py issues/001-the-cat-and-the-hat
    python scripts/preview_prompts.py issues/001-the-cat-and-the-hat --page 2
    python scripts/preview_prompts.py issues/001-the-cat-and-the-hat --print
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

from lib.panel_prompts import build_panel_prompt, gather_refs_for_panel  # noqa: E402
from lib.decodability import validate_script  # noqa: E402


def _divider(title: str, width: int = 72) -> str:
    bar = "─" * width
    return f"\n{bar}\n## {title}\n{bar}\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("issue_dir", type=Path)
    parser.add_argument("--page", type=int, default=None, help="Preview one page only")
    parser.add_argument(
        "--print",
        dest="print_stdout",
        action="store_true",
        help="Print to stdout instead of writing a file",
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

    # Run decodability check and surface result (warning only — preview still runs)
    val = validate_script(script)
    validation_note = (
        "✅ Decodability: PASS"
        if val.ok
        else f"⚠️  Decodability: FAIL ({len(val.violations)} violation(s))\n"
        + "\n".join(f"  - {v}" for v in val.violations)
    )

    lines: list[str] = []

    lines.append(f"# Prompt Preview — {script.get('title', '?')}")
    lines.append(f"\n**Stage:** `{script.get('stage_id', '?')}`  ")
    lines.append(f"**Issue:** `{script.get('issue_id', '?')}`  ")
    lines.append(f"**Generated from:** `{script_path.relative_to(_ROOT)}`\n")
    lines.append(validation_note)
    lines.append("\n---\n")
    lines.append(
        "> Edit `script.json` art_prompt fields and re-run to iterate.\n"
        "> Edit `prompts/base-style.md` to change the global style.\n"
        "> Edit `characters/<name>/canon.md` to update a character description.\n"
    )

    total_panels = 0
    for page_data in script.get("pages", []):
        page_no = page_data.get("page", 0)
        if args.page is not None and page_no != args.page:
            continue

        for panel in page_data.get("panels", []):
            panel_no = panel.get("panel", 0)
            total_panels += 1

            refs, missing = gather_refs_for_panel(panel)
            ref_note = (
                f"{len(refs)} ref image(s): "
                + ", ".join(p.name for p in refs[:4])
                + ("…" if len(refs) > 4 else "")
                if refs
                else "⚠️  NO REFS — will fall back to text-to-image"
            )
            if missing:
                ref_note += f"  (missing: {', '.join(missing)})"

            speech = panel.get("speech") or []
            sfx = panel.get("sfx") or []
            speech_str = "  ".join(
                f'**{b["speaker"]}:** "{b["text"]}"' for b in speech if b.get("text")
            ) or "_none_"

            lines.append(_divider(f"Page {page_no} · Panel {panel_no}"))
            lines.append(f"**Characters:** {', '.join(panel.get('characters') or []) or 'none'}  ")
            lines.append(f"**Speech:** {speech_str}  ")
            lines.append(f"**SFX:** {', '.join(str(s) for s in sfx) or 'none'}  ")
            lines.append(f"**Refs:** {ref_note}\n")
            lines.append("### Full prompt\n")
            lines.append("```")
            lines.append(build_panel_prompt(script, page_data, panel))
            lines.append("```\n")

    output = "\n".join(lines)

    if args.print_stdout:
        print(output)
        return 0

    out_path = issue_dir / "prompts-preview.md"
    out_path.write_text(output)
    print(f"Wrote {total_panels} panel prompt(s) to {out_path.relative_to(_ROOT)}")
    print(f"Open with: open {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
