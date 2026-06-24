"""Build Gemini image prompts for comic panels.

Shared by generate_panels.py (production generation) and preview_prompts.py
(dry-run prompt review). Keeping this in lib/ means neither script imports
from the other, and changes to prompt structure happen in one place.
"""

from __future__ import annotations

from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
PROMPTS_DIR = _ROOT / "prompts"
CHARACTERS_DIR = _ROOT / "characters"


def _load_text(path: Path) -> str:
    return path.read_text() if path.exists() else ""


def build_panel_prompt(
    issue_meta: dict,
    page: dict,
    panel: dict,
) -> str:
    """Return the full Gemini prompt string for one panel.

    Combines:
      - prompts/base-style.md  (global style lock)
      - Per-character canon.md blocks for every character in the panel
      - The panel's art_prompt and SFX directives from script.json
    """
    base = _load_text(PROMPTS_DIR / "base-style.md")
    panel_chars = panel.get("characters") or []

    canon_blocks: list[str] = []
    for ch in panel_chars:
        canon_path = CHARACTERS_DIR / ch / "canon.md"
        if canon_path.exists():
            canon_blocks.append(f"=== {ch.upper()} CANON ===\n{canon_path.read_text()}")

    sfx = panel.get("sfx") or []
    sfx_clause = ""
    if sfx:
        sfx_clause = (
            "\nSFX (render as art-baked all-caps lettering, manga-style, "
            "single-story `a` rule applies):\n  "
            + ", ".join(s if isinstance(s, str) else s.get("text", "") for s in sfx)
            + "\n"
        )

    return (
        f"{base}\n\n"
        f"---\n\n"
        f"PANEL CONTEXT\n"
        f"Issue: {issue_meta.get('title', '?')} (stage {issue_meta.get('stage_id', '?')})\n"
        f"Page {page.get('page', '?')}, panel {panel.get('panel', '?')}.\n\n"
        f"CHARACTERS IN THIS PANEL: {', '.join(panel_chars) if panel_chars else 'none'}\n"
        f"{chr(10).join(canon_blocks)}\n\n"
        f"ART DIRECTION:\n{panel.get('art_prompt', 'TBD')}\n"
        f"{sfx_clause}\n"
        f"LAYOUT:\n"
        f"- Render this as the illustration content only, not as a finished comic page.\n"
        f"- DO NOT draw panel borders, gutters, empty caption boxes, empty speech bubbles,\n"
        f"  title bars, white rectangles, labels, or text containers inside the image.\n"
        f"- Leave a natural low-detail area in the upper part of the scene where a speech\n"
        f"  bubble can be typeset later — it should look like ordinary background, not a box.\n"
        f"- DO NOT render speech text in the art.\n"
        f"- Maintain character appearance EXACTLY as in the reference images.\n"
    )


def gather_refs_for_panel(panel: dict, root: Path | None = None) -> tuple[list[Path], list[str]]:
    """Return (ref_image_paths, missing_character_names) for a panel.

    missing is non-empty when a character has no images in their refs/ dir,
    meaning generation will fall back to text-to-image (warn, don't block).
    """
    from lib.gemini_client import load_ref_pack  # local import to avoid circular
    r = root or _ROOT
    refs: list[Path] = []
    missing: list[str] = []
    for ch in panel.get("characters") or []:
        ch_refs = load_ref_pack(ch, r)
        if not ch_refs:
            missing.append(ch)
        refs.extend(ch_refs)
    return refs, missing
