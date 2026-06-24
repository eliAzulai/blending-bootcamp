"""Thin wrapper around OpenAI's image generation for comic panel production.

Drop-in alternative to GeminiImageClient — same .generate() signature,
same return type (PIL.Image, GenerationMetadata).

Model: gpt-image-1 (default) — supports multi-image reference conditioning.
Falls back gracefully to text-only generation when no refs are provided.

Ref conditioning: OpenAI uses base64-encoded images passed as additional
messages in the conversation, similar to Gemini's Part.from_bytes approach.
"""

from __future__ import annotations

import base64
import io
import os
import time
from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image

from lib.gemini_client import GenerationMetadata  # reuse the same metadata dataclass

DEFAULT_MODEL = os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-1")
DEFAULT_ASPECT = "4:3"
DEFAULT_RESOLUTION = "1K"

# Map our resolution labels to OpenAI size strings
# gpt-image-1 supports: 1024x1024, 1536x1024, 1024x1536, auto
_RESOLUTION_MAP = {
    "512": "1024x1024",   # no 512 in gpt-image-1; use smallest square
    "1K": "1024x1024",
    "2K": "1536x1024",    # landscape; flipped for portrait below
    "4K": "1536x1024",    # gpt-image-1 max is 1536 on longest side
}

# Map our aspect ratio labels to OpenAI size strings
_ASPECT_SIZE_MAP = {
    "1:1":  "1024x1024",
    "4:3":  "1536x1024",
    "3:4":  "1024x1536",
    "16:9": "1536x1024",
    "9:16": "1024x1536",
    "3:2":  "1536x1024",
    "2:3":  "1024x1536",
}


def _size_for(aspect_ratio: str, resolution: str) -> str:
    """Pick the best OpenAI size string for a given aspect + resolution."""
    if aspect_ratio in _ASPECT_SIZE_MAP:
        return _ASPECT_SIZE_MAP[aspect_ratio]
    return _RESOLUTION_MAP.get(resolution, "1024x1024")


def _encode_image(path: Path) -> str:
    """Base64-encode an image file for the OpenAI API."""
    return base64.standard_b64encode(path.read_bytes()).decode("utf-8")


def _mime(path: Path) -> str:
    suffix = path.suffix.lower()
    return {"jpg": "image/jpeg", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
            ".png": "image/png", ".webp": "image/webp"}.get(suffix, "image/png")


class OpenAIImageClient:
    """Generate comic panels via OpenAI gpt-image-1 with optional ref conditioning."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str = DEFAULT_MODEL,
    ):
        from openai import OpenAI  # type: ignore

        self.model = model
        self._client = OpenAI(api_key=api_key) if api_key else OpenAI()

    def generate(
        self,
        prompt: str,
        refs: list[Path] | None = None,
        aspect_ratio: str = DEFAULT_ASPECT,
        resolution: str = DEFAULT_RESOLUTION,
    ) -> tuple[Image.Image, GenerationMetadata]:
        """Generate one panel image. Returns (PIL.Image, GenerationMetadata).

        refs: paths to reference PNG/JPG images (character style sheets or ref
        packs). Passed as additional image content in the prompt for conditioning.
        """
        ref_paths = list(refs or [])
        size = _size_for(aspect_ratio, resolution)

        start = time.monotonic()

        if ref_paths:
            # Use the Responses API with image input for ref conditioning
            content: list = []
            for p in ref_paths:
                content.append({
                    "type": "input_image",
                    "image_url": f"data:{_mime(p)};base64,{_encode_image(p)}",
                })
            content.append({"type": "input_text", "text": prompt})

            response = self._client.responses.create(
                model=self.model,
                input=[{"role": "user", "content": content}],
                tools=[{
                    "type": "image_generation",
                    "size": size,
                    "quality": "medium",
                }],
            )
            # Extract image bytes from tool call output
            image_data: bytes | None = None
            for item in response.output:
                if getattr(item, "type", None) == "image_generation_call":
                    b64 = getattr(item, "result", None)
                    if b64:
                        image_data = base64.b64decode(b64)
                        break
        else:
            # Pure text-to-image via Images API
            # gpt-image-1 does not accept response_format — b64_json is the default
            response = self._client.images.generate(
                model=self.model,
                prompt=prompt,
                size=size,
                quality="medium",
                n=1,
            )
            b64 = response.data[0].b64_json
            image_data = base64.b64decode(b64) if b64 else None

        elapsed = time.monotonic() - start

        if not image_data:
            raise RuntimeError(
                f"OpenAI {self.model} returned no image data. "
                "Check your API key and quota."
            )

        produced_image = Image.open(io.BytesIO(image_data))

        meta = GenerationMetadata(
            model=self.model,
            prompt=prompt,
            ref_paths=[str(p) for p in ref_paths],
            aspect_ratio=aspect_ratio,
            resolution=resolution,
            generated_at=time.strftime("%Y-%m-%dT%H:%M:%S"),
            elapsed_seconds=elapsed,
            response_text="",
        )
        return produced_image, meta
