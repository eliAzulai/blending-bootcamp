"""Thin wrapper around google-genai for image generation with character refs.

Call site is `client.generate(prompt, refs=[...])`. Returns the produced PIL
image plus a metadata dict suitable for committing alongside the file.

Why a wrapper:
  - Single place to swap the model name when Google renames it again.
  - Single place to enforce the response_modalities=['TEXT','IMAGE'] config
    so callers can't forget and end up with a text-only response.
  - Centralizes ref-loading so the caller passes paths and we handle PIL.
"""

from __future__ import annotations

import io
import os
import time
from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image

# Imported lazily inside functions so secrets-loading errors are clearer than
# import errors when google-genai isn't installed.

DEFAULT_MODEL = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-image-preview")
DEFAULT_ASPECT = "4:3"
DEFAULT_RESOLUTION = "1K"


@dataclass
class GenerationMetadata:
    """Committable record of how a panel/ref was produced."""

    model: str
    prompt: str
    ref_paths: list[str] = field(default_factory=list)
    aspect_ratio: str = DEFAULT_ASPECT
    resolution: str = DEFAULT_RESOLUTION
    generated_at: str = ""
    elapsed_seconds: float = 0.0
    response_text: str = ""

    def to_dict(self) -> dict:
        return {
            "model": self.model,
            "prompt": self.prompt,
            "ref_paths": self.ref_paths,
            "aspect_ratio": self.aspect_ratio,
            "resolution": self.resolution,
            "generated_at": self.generated_at,
            "elapsed_seconds": round(self.elapsed_seconds, 2),
            "response_text": self.response_text,
        }


class GeminiImageClient:
    def __init__(
        self,
        api_key: str | None = None,
        model: str = DEFAULT_MODEL,
    ):
        from google import genai  # type: ignore

        self._genai = genai
        self.model = model
        self._client = genai.Client(api_key=api_key) if api_key else genai.Client()

    def generate(
        self,
        prompt: str,
        refs: list[Path] | None = None,
        aspect_ratio: str = DEFAULT_ASPECT,
        resolution: str = DEFAULT_RESOLUTION,
    ) -> tuple[Image.Image, GenerationMetadata]:
        """Generate one image. Returns (PIL.Image, metadata).

        `refs` are paths to reference images (PNG/JPG). Pass an empty list or
        None for pure text-to-image. Multiple refs condition the model to keep
        characters consistent across calls — pass the curated ref pack for any
        character appearing in the panel.
        """
        from google.genai import types  # type: ignore

        ref_paths = list(refs or [])
        contents: list = [prompt]
        for p in ref_paths:
            contents.append(Image.open(p))

        config = types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"],
            image_config=types.ImageConfig(
                aspect_ratio=aspect_ratio,
                image_size=resolution,
            ),
        )

        start = time.monotonic()
        response = self._client.models.generate_content(
            model=self.model,
            contents=contents,
            config=config,
        )
        elapsed = time.monotonic() - start

        produced_image: Image.Image | None = None
        text_chunks: list[str] = []
        for part in response.parts:
            if getattr(part, "text", None):
                text_chunks.append(part.text)
                continue
            # Newer SDK exposes part.as_image()
            as_image = getattr(part, "as_image", None)
            if callable(as_image):
                img = as_image()
                if img is not None:
                    produced_image = img
                    continue
            # Fallback: inline_data with raw bytes
            inline = getattr(part, "inline_data", None)
            if inline and getattr(inline, "data", None):
                produced_image = Image.open(io.BytesIO(inline.data))

        if produced_image is None:
            raise RuntimeError(
                "Gemini returned no image. "
                f"Text response: {' | '.join(text_chunks) or '<none>'}"
            )

        meta = GenerationMetadata(
            model=self.model,
            prompt=prompt,
            ref_paths=[str(p) for p in ref_paths],
            aspect_ratio=aspect_ratio,
            resolution=resolution,
            generated_at=time.strftime("%Y-%m-%dT%H:%M:%S"),
            elapsed_seconds=elapsed,
            response_text=" | ".join(text_chunks),
        )
        return produced_image, meta


def load_ref_pack(character_name: str, comics_root: Path) -> list[Path]:
    """Return the paths of ref PNGs for a character, sorted deterministically."""
    refs_dir = comics_root / "characters" / character_name / "refs"
    if not refs_dir.exists():
        return []
    return sorted(refs_dir.glob("*.png")) + sorted(refs_dir.glob("*.jpg"))


def load_text(path: Path) -> str:
    return path.read_text() if path.exists() else ""
