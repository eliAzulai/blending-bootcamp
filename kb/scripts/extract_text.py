"""PDF text extraction via PyMuPDF."""

import fitz


def extract_pdf_text(path: str) -> list[str]:
    """Return per-page text. Strips whitespace and drops fully-empty pages."""
    pages: list[str] = []
    doc = fitz.open(path)
    try:
        for page in doc:
            text = page.get_text().strip()
            if text:
                pages.append(text)
    finally:
        doc.close()
    return pages
