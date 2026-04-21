"""OpenAI vision extraction: PDF/image pages → structured description."""

import base64
import io

import fitz
from PIL import Image

from kb.scripts.constants import VISION_MODEL


CURRICULUM_PROMPT = (
    "You are analyzing a page from a children's phonics or reading curriculum. "
    "Describe the phonics content on this page concisely. Include any of: "
    "target letter(s) or sound(s), example words, word families, "
    "CVC/CVCe patterns, reading level indicators, and teaching sequence. "
    "Use short lines with 'key: value' format where natural. "
    "Do not invent details — describe only what is visible."
)

ACTIVITY_PROMPT = (
    "You are analyzing a page from a classroom teaching activity. "
    "Describe the activity concisely. Include any of: activity type, "
    "instructions, target skills, age or grade suitability, materials needed, "
    "and example prompts or content visible on the page. "
    "Use short lines with 'key: value' format where natural. "
    "Do not invent details — describe only what is visible."
)

PROMPTS = {"curriculum": CURRICULUM_PROMPT, "activity": ACTIVITY_PROMPT}


def prompt_for_domain(domain: str) -> str:
    if domain not in PROMPTS:
        raise ValueError(f"Unknown domain: {domain}. Expected one of {list(PROMPTS)}.")
    return PROMPTS[domain]


def pdf_page_to_png_bytes(path: str, page_index: int, dpi: int = 144) -> bytes:
    """Render a single PDF page to PNG bytes. For PNG/JPG inputs use load_image_bytes."""
    doc = fitz.open(path)
    try:
        page = doc[page_index]
        zoom = dpi / 72
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom))
        return pix.tobytes("png")
    finally:
        doc.close()


def load_image_bytes(path: str) -> bytes:
    """Load a PNG/JPG/JPEG file and return PNG-encoded bytes (normalized)."""
    img = Image.open(path)
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="PNG")
    return buf.getvalue()


def count_pages(path: str) -> int:
    """Return number of pages. PDFs use fitz; images are always 1 page."""
    lower = path.lower()
    if lower.endswith((".png", ".jpg", ".jpeg")):
        return 1
    doc = fitz.open(path)
    try:
        return len(doc)
    finally:
        doc.close()


def describe_image(client, png_bytes: bytes, prompt: str) -> str:
    """Send a page image to the vision model and return the description."""
    b64 = base64.b64encode(png_bytes).decode("ascii")
    data_url = f"data:image/png;base64,{b64}"
    response = client.chat.completions.create(
        model=VISION_MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        max_tokens=500,
        temperature=0.2,
    )
    return response.choices[0].message.content.strip()
