"""OpenAI vision extraction: PDF/image pages → structured description."""

import base64
import io
import re
import time

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

# Gentle proactive throttle. With detail="low" images are fixed at 85 tokens each,
# so TPM is no longer the bottleneck — this small interval just smooths burst traffic.
MIN_CALL_INTERVAL_SECONDS = 0.5
_last_call_time = [0.0]  # list for mutable closure


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


def describe_image(client, png_bytes: bytes, prompt: str, max_retries: int = 10) -> str:
    """Send a page image to the vision model and return the description.

    Retries on 429 TPM limits. The error message suggests a retry window but
    actual TPM reset can take a full minute, so we floor waits at 65s.
    """
    b64 = base64.b64encode(png_bytes).decode("ascii")
    data_url = f"data:image/png;base64,{b64}"
    payload = dict(
        model=VISION_MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": data_url, "detail": "low"}},
                ],
            }
        ],
        max_tokens=500,
        temperature=0.2,
    )
    for attempt in range(max_retries):
        _throttle()
        try:
            response = client.chat.completions.create(**payload)
            _last_call_time[0] = time.time()
            return response.choices[0].message.content.strip()
        except Exception as exc:  # noqa: BLE001 — SDK error class varies
            if "rate_limit" not in str(exc).lower() and "429" not in str(exc):
                raise
            wait = _retry_delay_from_error(str(exc), attempt)
            print(f"    rate limited, sleeping {wait:.1f}s (attempt {attempt+1}/{max_retries})", flush=True)
            time.sleep(wait)
    raise RuntimeError(f"describe_image failed after {max_retries} retries")


def _throttle() -> None:
    """Enforce MIN_CALL_INTERVAL_SECONDS between calls (skipped if never called)."""
    if not _last_call_time[0]:
        return
    elapsed = time.time() - _last_call_time[0]
    if elapsed < MIN_CALL_INTERVAL_SECONDS:
        time.sleep(MIN_CALL_INTERVAL_SECONDS - elapsed)


def _retry_delay_from_error(msg: str, attempt: int) -> float:
    """Parse 'try again in 1.23s' / '258ms' hints from the error.

    Floor at 65s because the suggested retry time often just moves us into the
    next TPM window where we immediately hit the limit again; waiting a full
    minute lets the per-minute counter reset cleanly.
    """
    m = re.search(r"try again in ([\d.]+)(ms|s)", msg)
    if m:
        val = float(m.group(1))
        seconds = val / 1000 if m.group(2) == "ms" else val
        return max(seconds + 0.5, 65.0)
    return min(120.0, 2 ** attempt)
