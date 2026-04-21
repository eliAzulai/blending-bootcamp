import os
from kb.scripts.extract_text import extract_pdf_text


FIXTURE = os.path.join(os.path.dirname(__file__), "fixtures", "sample.pdf")


def test_extract_pdf_text_returns_page_list():
    pages = extract_pdf_text(FIXTURE)
    assert isinstance(pages, list)
    assert len(pages) == 2
    assert "Hello world" in pages[0]
    assert "Second page content" in pages[1]


def test_extract_pdf_text_strips_empty_pages():
    pages = extract_pdf_text(FIXTURE)
    for p in pages:
        assert p == p.strip()
        assert p  # no empty strings
