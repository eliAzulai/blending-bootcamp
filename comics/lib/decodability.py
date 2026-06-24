"""Decodability validator for WordPets Comics.

Every word in every speech bubble of every comic must be decodable at the
issue's phonics stage. This module is the mechanical gate that enforces it.

A token is allowed at stage X iff it is in:
  - the cumulative drill word lists for stage X and all prior stages, OR
  - the SIGHT_WORDS set, OR
  - a character name whose introduction stage is <= X, OR
  - (only when allow_sfx=True) the APPROVED_SFX list for stage X.

The stage definitions are parity-tested against the live wordpets fixtures so
the comic and the app cannot drift. See tests/test_curriculum_parity.py.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# ---------------------------------------------------------------------------
# Stage definitions
# ---------------------------------------------------------------------------
# Each stage lists ONLY the new drill words taught at that stage. The
# cumulative allowlist is built by walking STAGE_ORDER from the start.
#
# ACTIVE_STAGES must match src/lib/fixtures/student.ts exactly. The fixtures
# feed the seed script and runtime fallback, so this is the app-facing content
# source of truth.
#
# PLANNED_STAGES are comic-only anchors that are not yet part of the app
# fixture set. Keep them out of ACTIVE_STAGES until the app has matching
# `phonics-*` content rows.

ACTIVE_STAGES: dict[str, list[str]] = {
    "cvc-short-a": ["cat", "hat", "mat", "bat", "pan", "man"],
    "cvc-short-i": ["sit", "pig", "big", "win", "lip", "kid"],
    "cvc-short-o": ["hop", "top", "dog", "hot", "fox", "pot"],
    "cvc-short-u": ["cup", "sun", "run", "bug", "hug", "mud"],
    "cvc-short-e": ["bed", "red", "pet", "wet", "hen", "ten"],
    "cvc-mixed": ["fan", "tin", "log", "jug", "net", "rat"],
    "beg-blends": ["stop", "trip", "drop", "frog", "plug", "swim"],
    "end-blends": ["jump", "lamp", "fast", "hand", "sand", "milk"],
    "digraphs-sh-ch": ["ship", "shop", "fish", "chop", "chip", "much"],
    "digraphs-th": ["this", "that", "them", "then", "with", "bath"],
    "magic-e": ["make", "bike", "rope", "cute", "name", "cake"],
    "vowel-teams": ["tree", "feet", "read", "boat", "rain", "play"],
}

PLANNED_STAGES: dict[str, list[str]] = {
    # Empty wordlist — exists purely for character-name gating. "Whiskers" needs
    # both wh- and -er to be decodable; this stage marks when both are taught.
    "digraphs-wh-er": [],
}

ALL_STAGES: dict[str, list[str]] = {**ACTIVE_STAGES, **PLANNED_STAGES}

STAGE_ORDER: list[str] = [
    "cvc-short-a",
    "cvc-short-i",
    "cvc-short-o",
    "cvc-short-u",
    "cvc-short-e",
    "cvc-mixed",
    "beg-blends",
    "end-blends",
    "digraphs-sh-ch",
    "digraphs-th",
    "magic-e",
    "vowel-teams",
    "digraphs-wh-er",
]

# Pragmatic K-1 sight word list — words that reasonably-progressed early
# readers handle by memorization rather than letter-by-letter sounding-out.
# Includes common "free pass" words that appear in Ilana's existing day-10
# decodable texts (`on`, `has`, `can`) but aren't drilled words.
#
# Marked with asterisks in the in-app Word Preview screen per
# `kb/extracted/principles/decodable-word-preview.md`.
SIGHT_WORDS: frozenset[str] = frozenset({
    # Articles
    "a", "an", "the",
    # Verbs of being / common helpers
    "am", "is", "are", "was", "were", "be", "been",
    "has", "had", "have", "do", "does", "did",
    # Pronouns
    "i", "me", "my", "mine",
    "we", "us", "our",
    "you", "your", "yours",
    "he", "him", "his",
    "she", "her", "hers",
    "it", "its",
    "they", "them", "their",
    # Common function words / prepositions
    "and", "or", "but", "so", "if",
    "to", "for", "of", "with",
    "in", "on", "at", "by", "from",
    "off", "out", "up", "down",
    "as", "than",
    # Common high-frequency verbs / adjectives
    "said", "go", "see", "look", "come", "get", "got",
    "can", "let", "make", "take", "give",
    "this", "that", "these", "those",
    "yes", "no", "not", "now", "too",
    "all", "one", "two",
    "big", "little",
})

# Character names enter the cast in phonics-progression order. A name is
# allowed once the gating stage is <= the issue's current stage. The whole
# point: kids "earn" each new friend by mastering their phonics.
CHARACTER_NAMES: dict[str, str] = {
    "sam": "cvc-short-a",          # s + a + m, all known by cvc-short-a
    "alex": "end-blends",  # x = /ks/ blend, late
    "whiskers": "digraphs-wh-er",  # needs both wh- and -er
}

# Per-stage decodable sound effects. Each must tokenize to letters known at
# this stage. SFX appear in art-baked all-caps lettering ("POW!") and double
# as bonus phonics drill (`multisensory-letter-introduction.md`).
APPROVED_SFX: dict[str, list[str]] = {
    "cvc-short-a": ["pat", "tap", "zap"],
    "cvc-short-i": ["pat", "tap", "zap", "zip", "tip", "pip"],
    "cvc-short-o": ["pat", "tap", "zap", "pop", "top", "hop"],
    "cvc-short-u": ["pat", "tap", "zap", "pop", "tug", "hum"],
    "cvc-short-e": ["pat", "tap", "zap", "pop", "hem", "peep"],
    "cvc-mixed": ["pat", "tap", "zap", "pop", "rub", "zip"],
    "beg-blends": ["pat", "tap", "zap", "pop", "stop", "snap", "clap"],
    "end-blends": ["pat", "tap", "zap", "thump", "bump", "crash"],
    "digraphs-sh-ch": ["pat", "tap", "zap", "shh", "chomp"],
    "digraphs-th": ["pat", "tap", "zap", "shh", "chomp", "thud"],
    "magic-e": ["pat", "tap", "zap", "shh", "chomp", "whoa"],
    "vowel-teams": ["pat", "tap", "zap", "shh", "chomp", "cheep"],
    "digraphs-wh-er": ["pat", "tap", "zap", "shh", "chomp", "whir"],
}


# ---------------------------------------------------------------------------
# Tokenization
# ---------------------------------------------------------------------------

_NON_WORD_RE = re.compile(r"[^a-z\s']")


def tokenize(text: str) -> list[str]:
    """Lowercase, strip punctuation, drop apostrophes, split on whitespace.

    Apostrophes are dropped (so "sam's" becomes "sams"), which intentionally
    fails the validator on contractions/possessives — those aren't decodable
    at CVC stages and should be rewritten by the author.
    """
    lowered = text.lower()
    cleaned = _NON_WORD_RE.sub(" ", lowered).replace("'", "")
    return [t for t in cleaned.split() if t]


# ---------------------------------------------------------------------------
# Allowlist computation
# ---------------------------------------------------------------------------


def _stage_index(stage_id: str) -> int:
    if stage_id not in STAGE_ORDER:
        raise ValueError(
            f"Unknown stage_id {stage_id!r}. Known stages: {STAGE_ORDER}"
        )
    return STAGE_ORDER.index(stage_id)


def words_for_stage(stage_id: str) -> set[str]:
    """The full allowlist for narrative text at this stage.

    Includes drill words from this and all prior stages, plus sight words,
    plus character names whose gating stage is <= this stage. Does NOT
    include SFX — pass those tokens through validate_text(..., allow_sfx=True).
    """
    idx = _stage_index(stage_id)
    cumulative: set[str] = set()
    for sid in STAGE_ORDER[: idx + 1]:
        cumulative.update(ALL_STAGES[sid])
    cumulative.update(SIGHT_WORDS)
    for name, gate in CHARACTER_NAMES.items():
        if _stage_index(gate) <= idx:
            cumulative.add(name)
    return cumulative


def approved_sfx_for(stage_id: str) -> set[str]:
    return set(APPROVED_SFX.get(stage_id, []))


# ---------------------------------------------------------------------------
# Validation result + functions
# ---------------------------------------------------------------------------


@dataclass
class Violation:
    word: str
    locator: str

    def __str__(self) -> str:
        return f"{self.locator}: '{self.word}' not in stage allowlist"


@dataclass
class ValidationResult:
    ok: bool
    stage_id: str
    violations: list[Violation] = field(default_factory=list)

    def report(self) -> str:
        if self.ok:
            return f"OK -- stage {self.stage_id}, no violations."
        lines = [f"FAIL -- stage {self.stage_id}, {len(self.violations)} violation(s):"]
        for v in self.violations:
            lines.append(f"  {v}")
        return "\n".join(lines)


def validate_text(
    text: str,
    stage_id: str,
    locator: str = "",
    *,
    allow_sfx: bool = False,
) -> list[Violation]:
    """Validate one chunk of text against a stage. Returns violations (empty = ok)."""
    allowed = words_for_stage(stage_id)
    if allow_sfx:
        allowed = allowed | approved_sfx_for(stage_id)
    return [
        Violation(word=tok, locator=locator)
        for tok in tokenize(text)
        if tok not in allowed
    ]


def validate_script(script: dict) -> ValidationResult:
    """Validate a full script.json against its declared stage_id.

    Walks every page → panel → speech/captions/sfx and accumulates violations.
    """
    stage_id = script.get("stage_id")
    if not stage_id:
        return ValidationResult(
            ok=False,
            stage_id="<missing>",
            violations=[Violation(word="<no stage_id>", locator="root")],
        )
    if stage_id not in STAGE_ORDER:
        return ValidationResult(
            ok=False,
            stage_id=stage_id,
            violations=[Violation(word=f"<unknown stage {stage_id}>", locator="root")],
        )

    violations: list[Violation] = []
    for page in script.get("pages", []):
        page_no = page.get("page", "?")
        for panel in page.get("panels", []):
            panel_no = panel.get("panel", "?")
            for bubble in panel.get("speech", []) or []:
                speaker = bubble.get("speaker", "?")
                text = bubble.get("text", "")
                loc = f"page {page_no}, panel {panel_no}, {speaker}"
                violations.extend(validate_text(text, stage_id, loc))
            for caption in panel.get("captions", []) or []:
                text = caption.get("text", "") if isinstance(caption, dict) else str(caption)
                loc = f"page {page_no}, panel {panel_no}, caption"
                violations.extend(validate_text(text, stage_id, loc))
            for sfx in panel.get("sfx", []) or []:
                text = sfx if isinstance(sfx, str) else sfx.get("text", "")
                loc = f"page {page_no}, panel {panel_no}, sfx"
                violations.extend(validate_text(text, stage_id, loc, allow_sfx=True))
    return ValidationResult(
        ok=len(violations) == 0,
        stage_id=stage_id,
        violations=violations,
    )
