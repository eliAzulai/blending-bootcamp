# Non-Negotiable Rules

These are root rules that override design preference, content generation, and developer taste. If a rule conflicts with anything else in the docs, this file wins. Any change here requires explicit pedagogical justification.

## R1 — Letterforms must match what children handwrite

**Problem.** Most computer fonts render `a` and `g` as double-storey shapes (looped). Israeli children learning English handwriting are taught single-storey `a` (round bowl + simple stem) and single-storey `g` (round bowl + simple descender). A child cannot match what they see on screen to what their hand produces.

**Rule.**

- The app body font **must be a primary-type / literacy font** with single-storey `a` and single-storey `g`. Default: **Andika** (Google Fonts). Acceptable alternates: Sassoon Primary, ABeeZee, Comic Neue.
- `system-ui`, `-apple-system`, Inter, Roboto, Geist, Open Sans, San Francisco, Segoe UI are **forbidden** in any rendering surface a child sees (passages, phoneme cards, spelling letter boxes, activity prompts).
- The `<html>` and `<body>` elements must set `font-family` to the literacy font with no fallback to system-ui.
- Headings, marketing copy, and teacher-only surfaces may use a contrasting font, but child-facing surfaces always use the literacy font.

**Why this is non-negotiable.** This is the rule that fails silently — adults reading the same screen don't notice the letterform difference and assume it's fine. A 6-year-old's recognition stalls without any visible error.

See also: `kb/extracted/principles/never-use-squiggly-a.md`.

## R2 — Every passage word must be decodable at its stated difficulty

A read-aloud passage tagged `beginner` may not contain a digraph, blend, magic-e, or vowel team. A passage tagged `intermediate` may not contain magic-e or vowel teams. Only `advanced` passages can use long vowels.

**Why.** The child is reading aloud against Whisper. Words they can't decode either get skipped (Whisper guesses) or break their flow. Worse, it teaches them that "reading" means "memorize this string" — which is what we're trying to fix.

See: `kb/extracted/principles/decodable-word-preview.md`.

## R3 — No new spelling rule inside a difficulty band

A `beginner` set cannot introduce a digraph for the first time. An `intermediate` set cannot introduce magic-e. New rules belong in the difficulty band above.

**Why.** Consistency breeds trust. Kids tolerate hard work if the rules don't change mid-stream.

See: `kb/extracted/principles/consistency-breeds-trust.md`.

## R4 — Reading direction is left-to-right with explicit dir="ltr"

These children also read Hebrew (RTL). The app must explicitly mark all reading surfaces as `dir="ltr"` (HTML attribute) rather than relying on browser defaults, because their devices may have Hebrew as the system language with RTL defaults.

## R5 — No italics in child-facing surfaces

Italic letterforms are harder to decode and differ from handwriting. Bold for emphasis, never italic. Teacher-facing surfaces may use italics (legitimate stylistic affordance for adults).

## R6 — No flashing animations faster than 3 Hz

Both photosensitivity protection and concentration. Animations that draw attention to a coin earned, a correct answer, etc. are fine — they should pulse at a calm rate, never strobe.

## R7 — Speech recordings are non-authoritative for read-aloud (Phase 1a)

Whisper transcribes read-aloud passages but does not pass/fail the child. This is in the design spec and is not a typography rule, but it lives here because it's commonly forgotten when adding new activities or scoring.

---

## Enforcement layers

| Layer | Mechanism |
|---|---|
| Typography | `next/font/google` import of Andika at the root layout; CSS `font-family` cascades from `<body>`. No component overrides this with a system font. |
| Content generation | `~/.claude/skills/wordpets-content/SKILL.md` Step 4 references this file as a hard constraint. |
| Code review | Any PR touching `globals.css`, `layout.tsx`, or fixtures that reintroduces system fonts or violates R2/R3 should be flagged. |
| Future: ESLint rule | `no-restricted-syntax` on `font-family: system-ui` strings in CSS. |
