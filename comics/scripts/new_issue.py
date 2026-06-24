#!/usr/bin/env python3
"""Scaffold a new comic issue directory.

Auto-numbers based on existing issues/ entries and pre-fills issue.yaml +
script.json from the templates with the stage_id baked in.

Usage:
    python scripts/new_issue.py --stage cvc-short-a --title "The Cat and the Hat"
    python scripts/new_issue.py --stage cvc-short-a --title "The Cat and the Hat" --slug the-cat-and-the-hat
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# Repo root resolution
_THIS = Path(__file__).resolve()
_ROOT = _THIS.parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from lib.decodability import STAGE_ORDER, CHARACTER_NAMES, _stage_index  # noqa: E402

ISSUES_DIR = _ROOT / "issues"
TEMPLATES_DIR = _ROOT / "templates"


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def next_issue_number() -> int:
    if not ISSUES_DIR.exists():
        return 1
    nums: list[int] = []
    for entry in ISSUES_DIR.iterdir():
        if not entry.is_dir():
            continue
        m = re.match(r"^(\d{3})-", entry.name)
        if m:
            nums.append(int(m.group(1)))
    return max(nums, default=0) + 1


def cast_pool_for_stage(stage_id: str) -> list[str]:
    """Character names available at this stage (gating <= current stage)."""
    target_idx = _stage_index(stage_id)
    return sorted(
        name
        for name, gate in CHARACTER_NAMES.items()
        if _stage_index(gate) <= target_idx
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stage", required=True, choices=STAGE_ORDER, help="Phonics stage_id")
    parser.add_argument("--title", required=True, help="Issue title (e.g. 'The Cat and the Hat')")
    parser.add_argument("--slug", default=None, help="Override slug (default: derived from title)")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the planned directory + first lines of files; do not write.",
    )
    args = parser.parse_args(argv)

    issue_num = next_issue_number()
    slug = args.slug or slugify(args.title)
    dir_name = f"{issue_num:03d}-{slug}"
    target_dir = ISSUES_DIR / dir_name

    if target_dir.exists():
        print(f"error: {target_dir} already exists", file=sys.stderr)
        return 1

    issue_yaml_template = (TEMPLATES_DIR / "issue.template.yaml").read_text()
    script_json_template = json.loads((TEMPLATES_DIR / "script.template.json").read_text())

    cast = cast_pool_for_stage(args.stage)

    # Patch the YAML — replace placeholder fields. We do textual replacement
    # rather than parsing/rewriting YAML to preserve human comments.
    issue_yaml = (
        issue_yaml_template
        .replace("issue_number: 0", f"issue_number: {issue_num}")
        .replace('slug: "TBD"', f'slug: "{slug}"')
        .replace('title: "TBD"', f'title: "{args.title}"')
        .replace('stage_id: "TBD"', f'stage_id: "{args.stage}"', 1)
    )
    cast_block = "\n".join(f"  - {name}" for name in cast) or "  - sam"
    issue_yaml = issue_yaml.replace("  - sam\n  # - cat       # generic, not gated by name", cast_block)

    # Patch the script JSON template
    script_json_template["issue_id"] = f"comic-{args.stage}-{issue_num:03d}"
    script_json_template["stage_id"] = args.stage
    script_json_template["title"] = args.title

    if args.dry_run:
        print(f"Would create {target_dir}/")
        print("---issue.yaml first 12 lines---")
        for line in issue_yaml.splitlines()[:12]:
            print(line)
        print("---script.json---")
        print(json.dumps(script_json_template, indent=2))
        return 0

    target_dir.mkdir(parents=True)
    (target_dir / "issue.yaml").write_text(issue_yaml)
    (target_dir / "script.json").write_text(
        json.dumps(script_json_template, indent=2) + "\n"
    )
    print(f"Created {target_dir}")
    print(f"  Stage:  {args.stage}")
    print(f"  Cast:   {', '.join(cast) if cast else '(none gated yet)'}")
    print(f"  Number: {issue_num:03d}")
    print()
    print("Next: edit issue.yaml story_beats, then write panel scripts in script.json,")
    print("then run: python scripts/validate_script.py", target_dir / "script.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
