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

## R8 — Numerals must match handwriting forms

The same rule as R1 (letterforms) applied to digits. Geometric/grotesque fonts render digits in shapes children don't write:

- **`4`** — must be open-top (looks like a sail / chair). Geometric `4` with a closed triangle top is forbidden.
- **`1`** — must be a simple vertical stroke, optionally with a small upper-left serif. No flag-style top, no full serif foot.
- **`7`** — uncrossed `7` is the US/UK schoolbook form and is what we use. Crossed (European) `7` is fine for Israeli adults but children learning English use the uncrossed form.
- **`9`** — straight descender (no curl back). 
- **`0`** — round circle, no slash, no dot in the middle.

**Andika satisfies R8 by default** — it was designed specifically for primary readers. If we ever swap fonts, re-verify each digit visually before merging.

Use Tabular numerals (`font-variant-numeric: tabular-nums`) only on the teacher dashboard for alignment. Child-facing surfaces use proportional numerals.

## R9 — No ligatures, generous letter-spacing on child surfaces

Default browser text rendering applies ligatures (`fi`, `ff`, `fl`) that fuse adjacent letters into a single glyph. Early readers cannot map that fused glyph back to individual phonemes. They will literally try to sound out "fi" as a single letter.

**Rule on `<body>`:**
```css
font-variant-ligatures: none;
text-rendering: optimizeLegibility;
letter-spacing: 0.01em; /* slight tracking; readable but not sparse */
```

For wordlist letter boxes (Spelling activity), letter-spacing should be even more generous — the boxes themselves already separate letters, so internal letter-spacing should be `0`.

## R10 — Audio consistency: one accent per session

If TTS pronounces a word in US English on one session and UK English the next, the child re-learns the same word twice. Lock the TTS to a single voice for the entire app. Default: a US English child-friendly voice. Don't mix British/American within or across activities until Phase 2.

## R11 — Punctuation budget by difficulty

Generated passages and any child-facing prose must respect:

- **Beginner**: `. , ?` only. No exclamation marks until kids are comfortable with question marks. No quotation marks. No apostrophes (so no contractions: "can not" instead of "can't").
- **Intermediate**: above plus `!` and apostrophes in contractions.
- **Advanced**: above plus quotation marks for dialogue. Still no semicolons, em-dashes, colons, parentheses, ellipses.

If your output uses a forbidden mark, regenerate.

## R12 — No dark mode on child surfaces

Children learn to read on white/cream backgrounds with dark text — books, worksheets, the live whiteboard in Ilana's class. Inverting the contrast is unfamiliar and reduces transfer. The app must default to and lock into light mode for `/student/*` routes.

Teacher dashboard can support both light and dark (legitimate adult preference).

---

## Enforcement layers

| Layer | Mechanism |
|---|---|
| Typography (R1, R8, R9) | `next/font/google` Andika in root layout. CSS in `globals.css` body: `font-variant-ligatures: none`, `text-rendering: optimizeLegibility`, `letter-spacing: 0.01em`. No system-ui fallback anywhere. |
| Reading direction (R4) | `<html dir="ltr">` in root layout. |
| Dark mode lock (R12) | `<html lang="en" dir="ltr">` with no `dark:` Tailwind classes on `/student/*`. CSS `color-scheme: light` on child routes. |
| Content rules (R2, R3, R11) | `~/.claude/skills/wordpets-content/SKILL.md` Knowledge base section 0. Validation checklist Step 5. |
| Audio (R10) | Lock TTS voice in `src/lib/speech.ts`. |
| Code review | Any PR touching `globals.css`, `layout.tsx`, fixtures, or speech files that reintroduces forbidden patterns should be flagged. |
| Future: ESLint rule | `no-restricted-syntax` for `font-family: system-ui` strings; ban `dark:` Tailwind classes inside `src/app/student/`. |
