from unittest.mock import MagicMock
from kb.scripts.extract_vision import (
    prompt_for_domain,
    describe_image,
    pdf_page_to_png_bytes,
)
import os

FIXTURE = os.path.join(os.path.dirname(__file__), "fixtures", "sample.pdf")


def test_prompt_for_domain_curriculum_mentions_phonics():
    prompt = prompt_for_domain("curriculum")
    assert "phonics" in prompt.lower()
    assert "letter" in prompt.lower() or "sound" in prompt.lower()


def test_prompt_for_domain_activity_mentions_activity():
    prompt = prompt_for_domain("activity")
    assert "activity" in prompt.lower()
    assert "skill" in prompt.lower() or "age" in prompt.lower()


def test_prompt_for_domain_unknown_raises():
    import pytest
    with pytest.raises(ValueError):
        prompt_for_domain("bogus")


def test_pdf_page_to_png_bytes_returns_png():
    png = pdf_page_to_png_bytes(FIXTURE, page_index=0)
    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    assert len(png) > 100


def test_describe_image_passes_prompt_and_returns_text():
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content="A picture of the letter C."))]
    )
    result = describe_image(
        client=mock_client,
        png_bytes=b"fake-png-data",
        prompt="Describe the phonics content.",
    )
    assert result == "A picture of the letter C."
    call = mock_client.chat.completions.create.call_args
    messages = call.kwargs["messages"]
    assert any("phonics" in str(m).lower() for m in messages)
    assert any("image_url" in str(m) for m in messages)
