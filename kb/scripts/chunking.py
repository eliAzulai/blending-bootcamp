"""Sentence tokenization and sentence-window chunking."""

import re


def tokenize_sentences(text: str) -> list[str]:
    """Split text into sentences. Zero dependencies — regex-only."""
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    # Split on .!? followed by whitespace + capital letter (start of next sentence)
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z])", text)
    return [p.strip() for p in parts if p.strip()]


def rough_token_count(text: str) -> int:
    """Approximate token count as whitespace-delimited words."""
    return len(text.split())


def chunk_sentences(
    sentences: list[str],
    target_tokens: int = 500,
    overlap: int = 2,
    min_chars: int = 10,
) -> list[str]:
    """Sentence-window chunking with overlap and a soft token ceiling.

    Each window grows until adding the next sentence would exceed target_tokens,
    then slides forward by (window_length - overlap) sentences.
    """
    chunks: list[str] = []
    i = 0
    n = len(sentences)
    while i < n:
        window: list[str] = []
        tokens = 0
        j = i
        while j < n and tokens < target_tokens:
            window.append(sentences[j])
            tokens += rough_token_count(sentences[j])
            j += 1
        chunk = " ".join(window)
        if len(chunk) >= min_chars:
            chunks.append(chunk)
        # Advance by (window_length - overlap) but always make forward progress
        i = max(i + 1, j - overlap)
    return chunks
