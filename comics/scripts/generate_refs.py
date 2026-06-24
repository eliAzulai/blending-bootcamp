#!/usr/bin/env python3
"""Generate candidate character reference images.

Use this iteratively to build a per-character ref pack:

    python scripts/generate_refs.py --character whiskers --batch 6
    # review candidates/2026-05-06-batch-1/, pick favorites,
    # copy/move chosen images into characters/whiskers/refs/

Each batch lands in its own dated directory so you can iterate without
losing earlier candidates. The prompt is built from the character's
canon.md + the base-style.md prompt.

Usage examples:
    python scripts/generate_refs.py --character whiskers --batch 6
    python scripts/generate_refs.py --character sam --batch 8 --pose "headshot"
    python scripts/generate_refs.py --character whiskers --use-existing-refs
    python scripts/generate_refs.py --character sam --style-ref style-references/wordpets-asset-style-target.jpeg

The --use-existing-refs flag includes any images already in characters/<name>/refs/
as conditioning, useful for refining variations once you have an initial set.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

_THIS = Path(__file__).resolve()
_ROOT = _THIS.parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from lib.secrets import load_env, require  # noqa: E402
from lib.gemini_client import GeminiImageClient, load_ref_pack, load_text  # noqa: E402

CHARACTERS_DIR = _ROOT / "characters"
PROMPTS_DIR = _ROOT / "prompts"


def _build_prompt(character_name: str, pose: str | None) -> str:
    base = load_text(PROMPTS_DIR / "base-style.md")
    canon_path = CHARACTERS_DIR / character_name / "canon.md"
    if not canon_path.exists():
        raise FileNotFoundError(
            f"No canon.md for character {character_name!r} at {canon_path}"
        )
    canon = canon_path.read_text()

    pose_clause = (
        f"\n\nPOSE / FRAMING FOR THIS IMAGE:\n{pose}\n"
        if pose
        else "\n\nPOSE / FRAMING:\nFull-body, neutral standing pose, three-quarter view, plain warm-cream background.\n"
    )

    return (
        f"{base}\n\n"
        f"---\n\n"
        f"CHARACTER REFERENCE IMAGE: {character_name.upper()}\n"
        f"You are generating a reference image of a single character to be used\n"
        f"as conditioning for a comic series. Single character, no other\n"
        f"figures or text in frame.\n\n"
        f"CHARACTER CANON:\n{canon}"
        f"{pose_clause}"
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--character", required=True, help="Character name (matches characters/<name>/)")
    parser.add_argument("--batch", type=int, default=4, help="Number of candidate images to generate (default 4)")
    parser.add_argument("--pose", default=None, help="Optional pose/framing override clause")
    parser.add_argument(
        "--use-existing-refs",
        action="store_true",
        help="Include any images already in characters/<name>/refs/ as conditioning",
    )
    parser.add_argument("--aspect", default="3:4", help="Aspect ratio (default 3:4 portrait for character refs)")
    parser.add_argument("--resolution", default="1K", help="Resolution: 512, 1K, 2K, 4K (default 1K)")
    parser.add_argument(
        "--style-ref",
        action="append",
        default=[],
        type=Path,
        help="Optional style reference image to pass as conditioning. May be repeated.",
    )
    args = parser.parse_args(argv)

    load_env()
    require("GEMINI_API_KEY")

    char_dir = CHARACTERS_DIR / args.character
    if not char_dir.exists():
        print(f"error: character dir not found: {char_dir}", file=sys.stderr)
        print(
            f"Create {char_dir}/canon.md first, describing the character's "
            "visual canon.",
            file=sys.stderr,
        )
        return 1

    candidates_root = char_dir / "candidates"
    candidates_root.mkdir(exist_ok=True)
    batch_idx = 1
    today = time.strftime("%Y-%m-%d")
    while (candidates_root / f"{today}-batch-{batch_idx}").exists():
        batch_idx += 1
    batch_dir = candidates_root / f"{today}-batch-{batch_idx}"
    batch_dir.mkdir()

    prompt = _build_prompt(args.character, args.pose)
    refs = load_ref_pack(args.character, _ROOT) if args.use_existing_refs else []
    style_refs: list[Path] = []
    for ref in args.style_ref:
        ref_path = ref if ref.is_absolute() else _ROOT / ref
        if not ref_path.exists():
            print(f"error: style ref not found: {ref_path}", file=sys.stderr)
            return 2
        style_refs.append(ref_path)
    refs = [*style_refs, *refs]

    print(f"Character: {args.character}")
    print(f"Batch:     {batch_dir.relative_to(_ROOT)}")
    if refs:
        print(f"Refs:      {len(refs)} image(s)")
        for ref in refs:
            print(f"           - {ref.relative_to(_ROOT) if ref.is_relative_to(_ROOT) else ref}")
    else:
        print("Refs:      none (text-to-image)")
    print(f"Aspect:    {args.aspect}  Resolution: {args.resolution}  Count: {args.batch}")
    print()

    client = GeminiImageClient()
    successes = 0
    for i in range(1, args.batch + 1):
        print(f"  [{i}/{args.batch}] generating...", end="", flush=True)
        try:
            image, meta = client.generate(
                prompt,
                refs=refs,
                aspect_ratio=args.aspect,
                resolution=args.resolution,
            )
        except Exception as e:  # surface the error but continue the batch
            print(f" FAIL: {e}")
            (batch_dir / f"img-{i:02d}.error.txt").write_text(str(e))
            continue
        out_png = batch_dir / f"img-{i:02d}.png"
        out_meta = batch_dir / f"img-{i:02d}.meta.json"
        image.save(out_png)
        out_meta.write_text(json.dumps(meta.to_dict(), indent=2))
        print(f" -> {out_png.relative_to(_ROOT)} ({meta.elapsed_seconds:.1f}s)")
        successes += 1

    print()
    print(f"Generated {successes}/{args.batch} candidates in {batch_dir}")
    print()
    print("Next steps:")
    print(f"  1. Open {batch_dir} and review the candidates.")
    print(f"  2. Copy 6-10 favorites into characters/{args.character}/refs/.")
    print(f"  3. Iterate with --use-existing-refs to refine.")
    return 0 if successes > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
