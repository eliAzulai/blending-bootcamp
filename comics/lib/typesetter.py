"""Typesetter — composites panel images into graphic-novel pages with speech bubbles.

Pipeline position: runs AFTER generate_panels.py, produces finished page images
in issues/<slug>/pages/ ready for the app or print.

Design decisions:
- One output image per page (letter-ratio portrait, ~1240×1754px at 150dpi).
- Panels are stacked vertically within the page, separated by a white gutter.
  Manga-style horizontal splits are a future enhancement.
- Speech bubbles are composited by Pillow, not rendered by the AI — this
  guarantees single-story `a` via Andika, pixel-perfect spelling, and clean
  OCR re-validation.
- Bubble tails point to a heuristic speaker anchor (left/center/right of the
  panel bottom) derived from the script's `bubble_anchor` field or the panel's
  `characters` list position. Override per panel in script.json:
      "bubble_anchor": "left" | "center" | "right"
  For art-directed pilot panels, optional refinements are also supported:
      "bubble_position": "left" | "center" | "right"
      "bubble_tail_anchor": "left" | "center" | "right"
      "bubble_tail": false
      "bubble_top": 16
      "bubble_font_size": 48
- Target word highlighting: a "My Words" page (the last page of every issue)
  is typeset purely from script data — no AI-generated art panel required.
"""

from __future__ import annotations

import math
import textwrap
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Output page dimensions (letter portrait @ 150 dpi is 1275×1650; we use
# slightly wider to give more horizontal panel space).
PAGE_W = 1240
PAGE_H = 1754

GUTTER = 18          # px between panels on the same page
MARGIN = 32          # px page border on all sides
BUBBLE_PADDING = 28  # px inside speech bubble (horizontal)
BUBBLE_VPAD = 18     # px inside speech bubble (vertical)
BUBBLE_RADIUS = 28   # corner radius of rounded-rect bubble
TAIL_LEN = 40        # px length of bubble tail
TAIL_BASE = 22       # px width of tail base

BG_COLOR = (255, 255, 255)         # page background
GUTTER_COLOR = (255, 255, 255)     # gutter between panels
BUBBLE_FILL = (255, 255, 255)      # speech bubble fill
BUBBLE_STROKE = (30, 30, 30)       # speech bubble outline
BUBBLE_STROKE_W = 4                # outline width
TEXT_COLOR = (20, 20, 20)          # speech text

# My Words page
MYWORDS_TITLE_COLOR = (80, 40, 120)   # WordPets purple
MYWORDS_WORD_COLOR = (30, 30, 30)
MYWORDS_SIGHT_COLOR = (100, 100, 100)

FONTS_DIR = Path(__file__).resolve().parents[1] / "fonts" / "Andika-6.200"
_FONT_CACHE: dict[tuple[str, int], ImageFont.FreeTypeFont] = {}


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    key = ("bold" if bold else "regular", size)
    if key not in _FONT_CACHE:
        name = "Andika-Bold.ttf" if bold else "Andika-Regular.ttf"
        _FONT_CACHE[key] = ImageFont.truetype(str(FONTS_DIR / name), size)
    return _FONT_CACHE[key]


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class BubbleSpec:
    """One speech bubble to draw on a panel."""
    text: str
    anchor: str = "center"   # "left" | "center" | "right" — where tail points
    position: str | None = None  # optional bubble box placement
    top: int | None = None       # optional top edge in panel pixels
    font_size: int = 56
    draw_tail: bool = True


@dataclass
class PanelSpec:
    """A rendered panel image plus its speech bubbles."""
    image_path: Path
    bubbles: list[BubbleSpec]


# ---------------------------------------------------------------------------
# Core drawing helpers
# ---------------------------------------------------------------------------

def _wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    """Word-wrap text to fit max_width pixels."""
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        test = (current + " " + word).strip()
        bbox = font.getbbox(test)
        if bbox[2] - bbox[0] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [""]


def _text_block_size(
    lines: list[str], font: ImageFont.FreeTypeFont
) -> tuple[int, int]:
    """Return (width, height) of a block of wrapped lines."""
    ascent, descent = font.getmetrics()
    line_h = ascent + descent
    w = max((font.getbbox(ln)[2] - font.getbbox(ln)[0]) for ln in lines)
    h = line_h * len(lines)
    return w, h


def _draw_rounded_rect(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    radius: int,
    fill: tuple,
    outline: tuple,
    outline_width: int,
) -> None:
    x0, y0, x1, y1 = box
    draw.rounded_rectangle(
        [x0, y0, x1, y1],
        radius=radius,
        fill=fill,
        outline=outline,
        width=outline_width,
    )


def _draw_tail(
    draw: ImageDraw.ImageDraw,
    bubble_box: tuple[int, int, int, int],
    anchor: str,
    panel_w: int,
    panel_h: int,
) -> None:
    """Draw a triangular tail from the bubble bottom toward the speaker."""
    x0, y0, x1, y1 = bubble_box
    bubble_mid_x = (x0 + x1) // 2
    bubble_w = x1 - x0

    # Tail base center on the bubble bottom edge
    if anchor == "left":
        base_cx = x0 + bubble_w // 4
    elif anchor == "right":
        base_cx = x1 - bubble_w // 4
    else:
        base_cx = bubble_mid_x

    base_y = y1
    tip_y = y1 + TAIL_LEN

    # Speaker anchor X: bottom of panel (heuristic). This is intentionally based
    # on the panel, not the bubble, so the bubble can sit away from a face while
    # the tail still points toward the speaker's side.
    if anchor == "left":
        tip_x = int(panel_w * 0.24)
    elif anchor == "right":
        tip_x = int(panel_w * 0.76)
    else:
        tip_x = panel_w // 2

    half_base = TAIL_BASE // 2
    poly = [
        (base_cx - half_base, base_y),
        (base_cx + half_base, base_y),
        (tip_x, tip_y),
    ]
    # Draw filled + outline to match the bubble
    draw.polygon(poly, fill=BUBBLE_FILL)
    draw.line(
        [(base_cx - half_base, base_y), (tip_x, tip_y)],
        fill=BUBBLE_STROKE, width=BUBBLE_STROKE_W,
    )
    draw.line(
        [(base_cx + half_base, base_y), (tip_x, tip_y)],
        fill=BUBBLE_STROKE, width=BUBBLE_STROKE_W,
    )


def _composite_bubble(
    panel_img: Image.Image,
    bubble: BubbleSpec,
    bubble_index: int,
    total_bubbles: int,
) -> None:
    """Draw one speech bubble onto a panel image (in-place)."""
    draw = ImageDraw.Draw(panel_img)
    font = _font(bubble.font_size)
    pw, ph = panel_img.size

    max_text_w = int(pw * 0.65)
    lines = _wrap_text(bubble.text, font, max_text_w)
    tw, th = _text_block_size(lines, font)

    bub_w = tw + BUBBLE_PADDING * 2
    bub_h = th + BUBBLE_VPAD * 2

    # Vertical position: stack bubbles from top, each one below the previous.
    # Reserve TAIL_LEN below bubble so the tail doesn't clip the panel edge.
    top_reserve = MARGIN
    slot_h = bub_h + TAIL_LEN + GUTTER
    bub_top = bubble.top if bubble.top is not None else top_reserve + bubble_index * slot_h
    bub_top = max(8, min(bub_top, ph - bub_h - TAIL_LEN - 8))

    # Horizontal: follow the bubble's visual position. If no position override
    # exists, use the tail anchor so existing scripts render exactly as before.
    position = bubble.position or bubble.anchor
    if position == "left":
        bub_left = MARGIN
    elif position == "right":
        bub_left = pw - MARGIN - bub_w
    else:
        bub_left = (pw - bub_w) // 2

    bub_left = max(MARGIN, min(bub_left, pw - MARGIN - bub_w))
    box = (bub_left, bub_top, bub_left + bub_w, bub_top + bub_h)

    _draw_rounded_rect(draw, box, BUBBLE_RADIUS, BUBBLE_FILL, BUBBLE_STROKE, BUBBLE_STROKE_W)
    if bubble.draw_tail:
        _draw_tail(draw, box, bubble.anchor, pw, ph)

    # Draw text lines
    ascent, descent = font.getmetrics()
    line_h = ascent + descent
    ty = bub_top + BUBBLE_VPAD
    for line in lines:
        lw = font.getbbox(line)[2] - font.getbbox(line)[0]
        tx = bub_left + (bub_w - lw) // 2
        draw.text((tx, ty), line, font=font, fill=TEXT_COLOR)
        ty += line_h


# ---------------------------------------------------------------------------
# Page compositor
# ---------------------------------------------------------------------------

def compose_page(panels: list[PanelSpec], page_number: int) -> Image.Image:
    """Stack panels vertically on a white page and add speech bubbles.

    Returns a PAGE_W × PAGE_H PIL image.
    """
    page = Image.new("RGB", (PAGE_W, PAGE_H), BG_COLOR)

    inner_w = PAGE_W - 2 * MARGIN
    n = len(panels)
    if n == 0:
        return page

    # Total gutter space between panels
    total_gutter = GUTTER * (n - 1)
    panel_h = (PAGE_H - 2 * MARGIN - total_gutter) // n

    y = MARGIN
    for ps in panels:
        # Load and resize panel art
        if ps.image_path.exists():
            art = Image.open(ps.image_path).convert("RGB")
            art = art.resize((inner_w, panel_h), Image.LANCZOS)
        else:
            # Placeholder if panel not yet generated
            art = Image.new("RGB", (inner_w, panel_h), (220, 220, 220))

        # Composite bubbles onto the art
        for idx, bubble in enumerate(ps.bubbles):
            _composite_bubble(art, bubble, idx, len(ps.bubbles))

        page.paste(art, (MARGIN, y))
        y += panel_h + GUTTER

    return page


# ---------------------------------------------------------------------------
# My Words page
# ---------------------------------------------------------------------------

def compose_mywords_page(
    target_words: list[str],
    sight_words: list[str],
    vignette_image_path: Path | None = None,
) -> Image.Image:
    """Typeset the 'My Words' back page from script metadata.

    target_words: the issue's drill words, shown in large Andika.
    sight_words: marked with asterisk, shown smaller / greyed.
    vignette_image_path: optional corner illustration (small art panel).
    """
    page = Image.new("RGB", (PAGE_W, PAGE_H), BG_COLOR)
    draw = ImageDraw.Draw(page)

    title_font = _font(52, bold=True)
    word_font = _font(44)
    sight_font = _font(32)
    note_font = _font(22)

    y = MARGIN + 20

    # Optional vignette top-right
    if vignette_image_path and vignette_image_path.exists():
        vig = Image.open(vignette_image_path).convert("RGB")
        vw, vh = 260, 200
        vig = vig.resize((vw, vh), Image.LANCZOS)
        page.paste(vig, (PAGE_W - MARGIN - vw, MARGIN))
        y = max(y, MARGIN + vh + GUTTER)

    # Title
    draw.text((MARGIN, y), "My Words", font=title_font, fill=MYWORDS_TITLE_COLOR)
    y += title_font.getbbox("My Words")[3] + 24

    # Divider
    draw.line([(MARGIN, y), (PAGE_W - MARGIN, y)], fill=(200, 200, 200), width=2)
    y += 20

    # Target words — two columns
    col_w = (PAGE_W - 2 * MARGIN - GUTTER) // 2
    col_x = [MARGIN, MARGIN + col_w + GUTTER]
    col = 0
    col_y = [y, y]

    for word in target_words:
        draw.text((col_x[col], col_y[col]), word, font=word_font, fill=MYWORDS_WORD_COLOR)
        col_y[col] += word_font.getbbox(word)[3] + 16
        col = 1 - col  # alternate columns

    y = max(col_y) + 32

    # Sight words section
    if sight_words:
        draw.line([(MARGIN, y), (PAGE_W - MARGIN, y)], fill=(220, 220, 220), width=1)
        y += 16
        sight_label = "* Sight words (memorised, not sounded out)"
        draw.text((MARGIN, y), sight_label, font=note_font, fill=(140, 140, 140))
        y += note_font.getbbox(sight_label)[3] + 12
        for word in sight_words:
            draw.text((MARGIN, y), f"* {word}", font=sight_font, fill=MYWORDS_SIGHT_COLOR)
            y += sight_font.getbbox(word)[3] + 10

    return page


# ---------------------------------------------------------------------------
# Script → BubbleSpec conversion
# ---------------------------------------------------------------------------

def bubbles_from_script_panel(panel: dict, characters: list[str] | None = None) -> list[BubbleSpec]:
    """Convert a script.json panel dict into a list of BubbleSpec objects.

    Uses `bubble_anchor` field if present in the panel, otherwise derives
    anchor from the panel's characters list (first character → left,
    last → right, single → center).
    """
    speech = panel.get("speech") or []
    if not speech:
        return []

    chars = panel.get("characters") or characters or []

    def _valid_anchor(value: str | None) -> str | None:
        if value in ("left", "center", "right"):
            return value
        return None

    def _anchor_for_speaker(speaker: str) -> str:
        override = _valid_anchor(panel.get("bubble_tail_anchor")) or _valid_anchor(panel.get("bubble_anchor"))
        if override and override in ("left", "center", "right"):
            return override
        if not chars or len(chars) == 1:
            return "center"
        try:
            idx = chars.index(speaker)
        except ValueError:
            return "center"
        if idx == 0:
            return "left"
        if idx == len(chars) - 1:
            return "right"
        return "center"

    return [
        BubbleSpec(
            text=b.get("text", ""),
            anchor=_anchor_for_speaker(b.get("speaker", "")),
            position=_valid_anchor(b.get("position")) or _valid_anchor(panel.get("bubble_position")),
            top=b.get("top", panel.get("bubble_top")),
            font_size=int(b.get("font_size", panel.get("bubble_font_size", 56))),
            draw_tail=bool(b.get("tail", panel.get("bubble_tail", True))),
        )
        for b in speech
        if b.get("text", "").strip()
    ]
