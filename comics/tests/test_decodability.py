"""Unit tests for the decodability validator.

Covers tokenization edge cases, cumulative stage allowlists, character-name
gating, sight-word handling, SFX gating, and full-script validation.
"""

from __future__ import annotations

import pytest

from lib import decodability as d


# ---------------------------------------------------------------------------
# Tokenizer
# ---------------------------------------------------------------------------

class TestTokenize:
    def test_lowercases(self):
        assert d.tokenize("CAT Hat Mat") == ["cat", "hat", "mat"]

    def test_strips_punctuation(self):
        assert d.tokenize("The cat is on the mat.") == [
            "the", "cat", "is", "on", "the", "mat"
        ]

    def test_strips_apostrophes(self):
        # "sam's" → "sams" — intentionally fails downstream; contractions
        # aren't decodable at CVC stages.
        assert d.tokenize("Sam's hat.") == ["sams", "hat"]

    def test_collapses_whitespace(self):
        assert d.tokenize("  cat   hat  ") == ["cat", "hat"]

    def test_empty_string(self):
        assert d.tokenize("") == []

    def test_only_punctuation(self):
        assert d.tokenize("!!! ?? .") == []

    def test_handles_exclamation_caps(self):
        # SFX style — POW! → "pow"
        assert d.tokenize("POW!") == ["pow"]

    def test_handles_em_dash(self):
        # Long-form punctuation should split words
        assert d.tokenize("cat--hat") == ["cat", "hat"]

    def test_strips_quotes(self):
        assert d.tokenize('"cat" said the bat') == ["cat", "said", "the", "bat"]


# ---------------------------------------------------------------------------
# words_for_stage
# ---------------------------------------------------------------------------

class TestWordsForStage:
    def test_includes_drill_words(self):
        allowed = d.words_for_stage("cvc-short-a")
        for w in ["cat", "hat", "mat", "bat", "pan", "man"]:
            assert w in allowed

    def test_includes_sight_words(self):
        allowed = d.words_for_stage("cvc-short-a")
        for w in ["the", "a", "is", "on", "and"]:
            assert w in allowed, f"sight word '{w}' missing"

    def test_excludes_later_stage_drill_words(self):
        allowed = d.words_for_stage("cvc-short-a")
        assert "sit" not in allowed       # cvc-short-i
        assert "ship" not in allowed      # digraphs
        assert "frog" not in allowed      # blends

    def test_cumulative_includes_prior_stages(self):
        allowed_at = d.words_for_stage("cvc-short-a")
        allowed_it = d.words_for_stage("cvc-short-i")
        for w in allowed_at:
            assert w in allowed_it, f"cvc-short-a word '{w}' missing from cvc-short-i allowlist"
        # cvc-short-i adds its own drill words
        # `big` is also a sight word, so it is already allowed at short-a.
        for w in ["sit", "pig", "win", "lip", "kid"]:
            assert w in allowed_it
            assert w not in allowed_at

    def test_unknown_stage_raises(self):
        with pytest.raises(ValueError):
            d.words_for_stage("not-a-real-stage")

    def test_late_stage_includes_everything(self):
        allowed = d.words_for_stage("digraphs-wh-er")
        # All drill words from all stages
        assert "cat" in allowed
        assert "ship" in allowed
        assert "frog" in allowed


# ---------------------------------------------------------------------------
# Character name gating
# ---------------------------------------------------------------------------

class TestCharacterNames:
    def test_sam_at_cvc_at(self):
        assert "sam" in d.words_for_stage("cvc-short-a")

    def test_whiskers_blocked_at_early_stages(self):
        assert "whiskers" not in d.words_for_stage("cvc-short-a")
        assert "whiskers" not in d.words_for_stage("cvc-short-i")
        assert "whiskers" not in d.words_for_stage("digraphs-sh-ch")

    def test_whiskers_unlocked_at_wh_er_stage(self):
        assert "whiskers" in d.words_for_stage("digraphs-wh-er")

    def test_alex_blocked_until_blends_ending(self):
        assert "alex" not in d.words_for_stage("cvc-short-a")
        assert "alex" not in d.words_for_stage("beg-blends")
        assert "alex" in d.words_for_stage("end-blends")


# ---------------------------------------------------------------------------
# validate_text
# ---------------------------------------------------------------------------

class TestValidateText:
    def test_pass_decodable_sentence(self):
        assert d.validate_text("The cat is on the mat.", "cvc-short-a") == []

    def test_pass_with_character_name(self):
        assert d.validate_text("Sam has a hat.", "cvc-short-a") == []

    def test_fail_undecoded_word(self):
        violations = d.validate_text("The cat jumped on the mat.", "cvc-short-a")
        assert len(violations) == 1
        assert violations[0].word == "jumped"

    def test_fail_multiple_words(self):
        violations = d.validate_text("Whiskers ran fast.", "cvc-short-a")
        words = sorted(v.word for v in violations)
        assert words == ["fast", "ran", "whiskers"]

    def test_locator_in_violation(self):
        violations = d.validate_text("zoo!", "cvc-short-a", locator="page 1, panel 2, sam")
        assert violations[0].locator == "page 1, panel 2, sam"
        assert violations[0].word == "zoo"

    def test_sfx_pass_when_allowed(self):
        # 'pat' is in APPROVED_SFX[cvc-short-a] but not in drill words
        assert d.validate_text("PAT!", "cvc-short-a", allow_sfx=True) == []

    def test_sfx_blocked_when_not_allowed(self):
        # Same word, but allow_sfx=False — should fail
        violations = d.validate_text("PAT!", "cvc-short-a", allow_sfx=False)
        assert len(violations) == 1
        assert violations[0].word == "pat"

    def test_unapproved_sfx_blocked_even_with_flag(self):
        # 'whoosh' isn't in cvc-short-a SFX list
        violations = d.validate_text("WHOOSH!", "cvc-short-a", allow_sfx=True)
        assert len(violations) == 1
        assert violations[0].word == "whoosh"

    def test_apostrophe_word_fails(self):
        # "sam's" → "sams", which is not in any allowlist
        violations = d.validate_text("Sam's hat.", "cvc-short-a")
        assert any(v.word == "sams" for v in violations)


# ---------------------------------------------------------------------------
# validate_script (structural)
# ---------------------------------------------------------------------------

def _good_script_cvc_short_a() -> dict:
    return {
        "issue_id": "comic-cvc-short-a-001",
        "stage_id": "cvc-short-a",
        "title": "The Cat and the Hat",
        "pages": [
            {
                "page": 1,
                "panels": [
                    {
                        "panel": 1,
                        "art_prompt": "Sam holds a big hat.",
                        "speech": [
                            {"speaker": "sam", "text": "I have a hat."}
                        ],
                        "captions": [],
                        "sfx": [],
                    },
                    {
                        "panel": 2,
                        "art_prompt": "Cat sits on the hat.",
                        "speech": [
                            {"speaker": "sam", "text": "The cat is on the hat!"}
                        ],
                        "captions": [],
                        "sfx": ["PAT!"],
                    },
                ],
            }
        ],
    }


class TestValidateScript:
    def test_pass_clean_script(self):
        result = d.validate_script(_good_script_cvc_short_a())
        assert result.ok, result.report()
        assert result.violations == []

    def test_fail_missing_stage(self):
        result = d.validate_script({"pages": []})
        assert not result.ok
        assert any("no stage_id" in v.word for v in result.violations)

    def test_fail_unknown_stage(self):
        result = d.validate_script({"stage_id": "nope", "pages": []})
        assert not result.ok

    def test_fail_undecoded_speech(self):
        script = _good_script_cvc_short_a()
        script["pages"][0]["panels"][0]["speech"][0]["text"] = "I jumped really high."
        result = d.validate_script(script)
        assert not result.ok
        words = {v.word for v in result.violations}
        assert "jumped" in words
        assert "really" in words
        assert "high" in words

    def test_fail_unapproved_sfx(self):
        script = _good_script_cvc_short_a()
        script["pages"][0]["panels"][1]["sfx"] = ["WHOOSH!"]
        result = d.validate_script(script)
        assert not result.ok
        assert any(v.word == "whoosh" for v in result.violations)

    def test_caption_text_validated(self):
        script = _good_script_cvc_short_a()
        script["pages"][0]["panels"][0]["captions"] = [
            {"text": "Sam jumped over the moon."}
        ]
        result = d.validate_script(script)
        assert not result.ok
        words = {v.word for v in result.violations}
        assert "jumped" in words
        assert "over" in words
        assert "moon" in words

    def test_locator_includes_page_panel_speaker(self):
        script = _good_script_cvc_short_a()
        script["pages"][0]["panels"][0]["speech"][0]["text"] = "I jumped."
        result = d.validate_script(script)
        assert not result.ok
        v = next(v for v in result.violations if v.word == "jumped")
        assert "page 1" in v.locator
        assert "panel 1" in v.locator
        assert "sam" in v.locator


# ---------------------------------------------------------------------------
# Stress: 50 known-good and 50 known-bad sentences at cvc-short-a
# (per the plan's verification spec)
# ---------------------------------------------------------------------------

# 50 known-good cvc-short-a sentences. Each uses only:
#   drill words (cat hat mat bat pan man),
#   sight words,
#   character names (sam),
#   no SFX.
KNOWN_GOOD_CVC_SHORT_A: list[str] = [
    "The cat is on the mat.",
    "The cat is on the hat.",
    "The bat is on the mat.",
    "The bat is on the hat.",
    "The pan is on the mat.",
    "The man is on the mat.",
    "Sam has a hat.",
    "Sam has a bat.",
    "Sam has a pan.",
    "Sam has a mat.",
    "I have a hat.",
    "I have a bat.",
    "I have a pan.",
    "I have a mat.",
    "I see a cat.",
    "I see a bat.",
    "I see a man.",
    "I see the pan.",
    "The cat has a hat.",
    "The man has a pan.",
    "The man has a hat.",
    "The man has a bat.",
    "The cat is a cat.",
    "The bat is a bat.",
    "The man is a man.",
    "Sam is a man.",
    "Sam is on the mat.",
    "Sam is on the hat.",
    "Sam is on the bat.",
    "The mat is on the pan.",
    "The hat is on the pan.",
    "The pan is on the hat.",
    "The bat is on the pan.",
    "The cat and the bat.",
    "The man and the cat.",
    "Sam and the man.",
    "I see Sam and the cat.",
    "I see the man and the pan.",
    "Sam has a cat and a bat.",
    "Sam has a hat and a mat.",
    "The cat has the hat.",
    "The bat has the hat.",
    "The man has the mat.",
    "The pan has a hat.",
    "Sam said the cat is on the mat.",
    "Sam said the man has a pan.",
    "The cat is on a mat.",
    "The bat is on a mat.",
    "The cat is on a hat.",
    "A man has a pan.",
]

# 50 known-bad cvc-short-a sentences. Each contains at least one word that isn't
# a cvc-short-a drill word, sight word, or known character name.
KNOWN_BAD_CVC_AT: list[str] = [
    "The dog is on the mat.",             # dog
    "The cat ran on the mat.",            # ran
    "The cat jumped on the mat.",         # jumped
    "Whiskers is on the mat.",            # whiskers (gated to wh-er)
    "Sam likes the cat.",                 # likes
    "The cat sleeps on the mat.",         # sleeps
    "The big dog is on the mat.",         # dog
    "The fast cat is on the mat.",        # fast
    "Sam plays with the cat.",            # plays, with — wait, with IS in sight
    "The cat is happy.",                  # happy
    "The cat is sad.",                    # sad
    "The frog is on the mat.",            # frog
    "I love the cat.",                    # love
    "Sam went to the shop.",              # went, shop
    "The kitten is on the mat.",          # kitten
    "The cat walks on the mat.",          # walks
    "The pony is on the mat.",            # pony
    "Sam threw the bat.",                 # threw
    "The cat is sleeping.",               # sleeping
    "The bear is on the mat.",            # bear
    "Sam and Alex are on the mat.",       # alex (gated late)
    "The cat looked at the bat.",         # looked
    "The cat ran to the mat.",            # ran
    "The hat fell on the mat.",           # fell
    "The cat is fluffy.",                 # fluffy
    "Sam ate the hat.",                   # ate
    "The cat smiled.",                    # smiled
    "The cat hopped.",                    # hopped
    "Sam laughed at the cat.",            # laughed
    "The cat purred.",                    # purred
    "The bat flew.",                      # flew
    "The mat is fluffy.",                 # fluffy
    "Sam went home.",                     # went, home
    "The hat is blue.",                   # blue
    "The cat is orange.",                 # orange
    "Sam fed the cat.",                   # fed
    "The cat played with the bat.",       # played
    "Sam pet the dog.",                   # pet — wait pet is NOT in allowlist; dog also
    "The cat purred loudly.",             # purred, loudly
    "The bat flapped.",                   # flapped
    "Sam ran fast.",                      # ran, fast
    "The cat licked the mat.",            # licked
    "Sam yelled hello.",                  # yelled, hello
    "The cat was scared.",                # scared
    "The bat was scared.",                # scared
    "Sam hopped on the mat.",             # hopped
    "Sam danced on the mat.",             # danced
    "The cat ate dinner.",                # ate, dinner
    "Sam wanted a cat.",                  # wanted
    "The cat needed a mat.",              # needed
]


class TestStressCvcAt:
    """50 good / 50 bad sentences at cvc-short-a — high-volume sanity check."""

    @pytest.mark.parametrize("sentence", KNOWN_GOOD_CVC_SHORT_A)
    def test_known_good(self, sentence: str):
        violations = d.validate_text(sentence, "cvc-short-a")
        assert violations == [], (
            f"Expected pass for: {sentence!r}, got violations: "
            f"{[str(v) for v in violations]}"
        )

    @pytest.mark.parametrize("sentence", KNOWN_BAD_CVC_AT)
    def test_known_bad(self, sentence: str):
        violations = d.validate_text(sentence, "cvc-short-a")
        assert len(violations) >= 1, (
            f"Expected fail for: {sentence!r}, got no violations"
        )

    def test_good_count(self):
        assert len(KNOWN_GOOD_CVC_SHORT_A) >= 50

    def test_bad_count(self):
        assert len(KNOWN_BAD_CVC_AT) >= 50
