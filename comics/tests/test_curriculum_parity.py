"""Curriculum parity test.

The validator's ACTIVE_STAGES must match the live wordpets fixtures
(`src/lib/fixtures/student.ts` -- the source the in-app phonics activity
reads). If Eli adds a phonics stage to the app and forgets to update the
comic validator (or vice versa), this test fails.

The fixture file is parsed via regex rather than imported. Running the TS
toolchain from a Python venv would add complexity for no real benefit; the
fixture content is simple JSON-ish data.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

from lib import decodability as d

REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURE_PATH = REPO_ROOT / "src" / "lib" / "fixtures" / "student.ts"


_ID_RE = re.compile(r'id:\s*"([^"]+)"')
_WORD_RE = re.compile(r'word:\s*"([^"]+)"')


def _parse_fixture_phonics_content() -> dict[str, list[str]]:
    """Extract `id` -> ordered word list from fixturePhonicsContent.

    Returns a dict like {"phonics-cvc-short-a": ["cat","hat",...]}.

    Implementation note: a naive regex like `words:\\s*\\[(.*?)\\]` mis-matches
    because the inner `phonemes: ["c","a","t"]` array closes its `]` before the
    outer `words: [...]` does. Instead, locate each `id:` occurrence and scan
    forward to the next `id:` (or EOF), then harvest every `word:` in that
    range. Robust to layout changes in the fixture file.
    """
    if not FIXTURE_PATH.exists():
        pytest.skip(f"Fixture file not found at {FIXTURE_PATH}; run from wordpets repo.")

    raw = FIXTURE_PATH.read_text()

    block_match = re.search(
        r"export const fixturePhonicsContent[^\[]*\[(.*?)^\];",
        raw,
        flags=re.DOTALL | re.MULTILINE,
    )
    if not block_match:
        pytest.fail("Could not locate fixturePhonicsContent in fixtures file")

    block = block_match.group(1)

    id_matches = list(_ID_RE.finditer(block))
    out: dict[str, list[str]] = {}
    for i, m in enumerate(id_matches):
        content_id = m.group(1)
        start = m.end()
        end = id_matches[i + 1].start() if i + 1 < len(id_matches) else len(block)
        entry_text = block[start:end]
        out[content_id] = [wm.group(1) for wm in _WORD_RE.finditer(entry_text)]
    return out


def test_fixture_parsing_finds_known_stages():
    fixtures = _parse_fixture_phonics_content()
    assert "phonics-cvc-short-a" in fixtures, "fixture parser regression"
    assert "phonics-cvc-short-i" in fixtures, "fixture parser regression"


@pytest.mark.parametrize("stage_id", sorted(d.ACTIVE_STAGES))
def test_active_stage_matches_fixture(stage_id: str):
    """Each ACTIVE_STAGE in the validator must word-for-word match the fixture."""
    fixture_slug = f"phonics-{stage_id}"
    fixtures = _parse_fixture_phonics_content()
    assert fixture_slug in fixtures, (
        f"Fixture {fixture_slug!r} not in fixtures file -- did the slug change?"
    )
    assert stage_id in d.ACTIVE_STAGES, (
        f"Validator's ACTIVE_STAGES is missing {stage_id!r}"
    )
    fixture_words = sorted(fixtures[fixture_slug])
    validator_words = sorted(d.ACTIVE_STAGES[stage_id])
    assert fixture_words == validator_words, (
        f"Drift detected for stage {stage_id!r}:\n"
        f"  fixture:   {fixture_words}\n"
        f"  validator: {validator_words}"
    )


def test_no_active_stages_missing_fixture():
    """Every ACTIVE_STAGE must have a corresponding fixture entry.

    This catches the case where the validator declares a stage active but the
    app fixture hasn't been updated.
    """
    fixtures = _parse_fixture_phonics_content()
    fixture_stage_keys = {
        slug.replace("phonics-", "") for slug in fixtures.keys()
    }
    for stage_id in d.ACTIVE_STAGES:
        assert stage_id in fixture_stage_keys, (
            f"Validator marks {stage_id!r} as active but no fixture row "
            f"`phonics-{stage_id}` was found"
        )
