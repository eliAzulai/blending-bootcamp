# Non-Negotiable Rules

These are root rules that override design preference, content generation, and developer taste. If a rule conflicts with anything else in the docs, this file wins. Any change here requires explicit pedagogical justification.

## Audience framing

The app is **for English-speaking children ages 6-8 learning to read English**. The location of the household (often Israel) is incidental. We deliberately **do not adapt for ESL or for Hebrew L1 interference** — Ilana's experience shows immersion is more effective even for the occasional Hebrew-speaking child. Rules below treat the audience as native English speakers who are early readers, not as ESL learners.

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

All reading surfaces must be marked `dir="ltr"` explicitly on `<html>` rather than relying on browser defaults. Devices and OSes can be set to RTL locales (Hebrew, Arabic) which would inherit RTL for the document. Setting it explicitly is defense-in-depth.

## R5 — No italics in child-facing surfaces

Italic letterforms are harder to decode and differ from handwriting. Bold for emphasis, never italic. Teacher-facing surfaces may use italics (legitimate stylistic affordance for adults).

## R6 — No flashing animations faster than 3 Hz

Both photosensitivity protection and concentration. Animations that draw attention to a coin earned, a correct answer, etc. are fine — they should pulse at a calm rate, never strobe.

## R7 — Speech recordings are non-authoritative for passage read-aloud

Whisper transcribes read-aloud **passages** but does not pass/fail the child. This is in the design spec and is not a typography rule, but it lives here because it's commonly forgotten when adding new activities or scoring.

**Scoped exception (2026-07-02, pedagogically justified):** the adaptive engine's **single-word** read-aloud check (`docs/superpowers/specs/2026-07-02-wordpets-reading-cartridge-design.md`) is authoritative by design. Word-level matching against a strict exact-plus-accept-list rule is reliable in a way passage transcription is not, and word-level oral reading was chosen as the mastery signal in the approved 2026-06-05 engine spec. Passage read-aloud remains non-authoritative, and a technical transcription failure must never be recorded as a wrong read.

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

## R13 — Letter names and letter sounds must be visually and structurally distinguished

**Problem.** A child shown a `B` card and asked "what does this say?" will often answer with the letter *name* ("bee") instead of the *sound* (`/b/`). Whisper or fuzzy matching may accept "bee" as right, which trains the child to confuse name and sound — a known source of decoding failure (Reading Recovery; Orton-Gillingham canon).

**Rule.**

- Sounds rendered in text always appear between slashes and in a distinct color (e.g. teal `/b/`). Letter names appear as the plain glyph (`B`).
- TTS audio for a sound never says the letter name and vice versa. Audio assets are named `sound-b.mp3` vs `name-b.mp3` and never aliased.
- Generated content must declare `kind: "sound" | "name"` for any letter-only card.

This is a universal early-reading rule, not Hebrew-specific.

## R17 — Raw Whisper transcripts are never shown to the child

**Problem.** Whisper transcribing a 6-year-old reading "the cat sat" may return "duh cat sad." If we render that text back to the child, they internalize a wrong spelling. R7 says Whisper is non-authoritative for *scoring*; this extends to *display*.

**Rule.**

- The raw transcript field never appears on a `/student/*` surface.
- Teacher dashboards may show the transcript with an explicit "machine transcript, may be inaccurate" label.
- The child always sees the original passage and a generic positive acknowledgment ("Great reading!"), never their own (possibly wrong) words.

## R19 — Touch targets minimum 48×48 CSS px with 8 px gaps

WCAG 2.2 AA Target Size requires 24×24 minimum, but child motor research and Apple HIG for kids' apps recommend 48 px. Smaller targets cause misclicks that get logged as wrong answers, distorting the teacher dashboard.

**Rule.** All tappable elements on `/student/*` are minimum **48×48 CSS px** with **8 px spacing** between adjacent targets. Spelling letter boxes are at least 56×56. Use a Tailwind preset (`min-h-12 min-w-12`) when convenient.

## R21 — Passage typography: short line length, generous line height, ragged-right

**Problem.** Default web typography (long lines, tight line height, sometimes justified) is brutal for early readers. Justified text creates "rivers" of whitespace that disrupt left-to-right tracking. BDA (British Dyslexia Association) style guide, Bringhurst, and Hooked on Phonics readers all converge.

**Rule.** Passages on `/student/*` use:
- `max-width: 32ch` (about 45-55 characters per line)
- `line-height: 1.6`
- `text-align: left` (never `justify` and never `center` for paragraphs)
- Paragraph spacing at least `1em`

Enforce via a `.passage` class in `globals.css` applied by the read-aloud component.

## R24 — Teacher preview = byte-identical to student delivery

**Problem.** Companion-app failure mode: teacher previews an assigned activity, then the assigned student sees something different (because of randomization, A/B, on-the-fly substitution). Ilana can't intervene on what she didn't see.

**Rule.** When a teacher previews a practice item, the rendered content is the same content the student will get. No randomization between preview and delivery; no per-render shuffles. The picker (`src/lib/content.ts`) is already deterministic given `(student_id, rotation_count, difficulty)` — preserve that contract. The preview surface (when built) must use the same render path with a synthetic student id.

## R25 — No streak shaming, no "you missed yesterday" copy

**Problem.** Streak mechanics work for adults; for 6-8 year olds whose practice depends on a parent putting an iPad in their hand, broken streaks punish the kid for the parent's day. Industry retention data on under-10s shows streak loss is a churn driver.

**Rule.** No UI surface in `/student/*` references missed days, broken streaks, or negative deltas. Pet "hunger" is a soft prompt to play, never a guilt cue. Positive framing only ("ready to play!" not "haven't seen you in 2 days"). Ban regex on copy review: `missed|broken|lost|haven't|been a while|where have you|come back|tomorrow`.

## R26 — Motion budget

**Problem.** Continuous animation competes with decoding attention. A pet wiggling in the corner of a Phonics activity is worse than a static pet — the child's eye is pulled off the phoneme card and onto the motion. The dyslexia literature is consistent on this.

**Rule.**

- `/student` (home): at most **one calm idle animation** on the pet (breathe). No bouncing pet. No coin animation. No streak fire flicker.
- `/student/practice/*` (any activity in progress): **no idle animation** anywhere. Triggered feedback only — pet bounces *after* a correct answer or session completion, never during a reading task.
- Activity transitions: prefer instant swap. If a transition is added later, it must be ≤200ms and fade-only (no slide, no scale).
- All animations pause under `prefers-reduced-motion: reduce` (already enforced for `.pet-breathe` and `.pet-bounce-once`).

Background motion (subtle gradient sway, etc.) is forbidden on child surfaces in Phase 1a.

## R27 — No game-economy framing

**Problem.** Pet apps drift into "currency dashboard" territory: total coins earned, daily yield, leaderboard, "your wealth", spending hubs, trade rooms. That's the wrong mental model for a literacy app — it teaches that practicing is a means to economic ends rather than a thing kids do for the pet.

**Rule.** **Coins as feedback are fine** — "+5 coins!" after a session is the spec'd reward. What is forbidden:

- Total-earnings dashboards or stats pages on `/student/*`.
- Leaderboards comparing children to each other.
- A "store" UI on the child surface (deferred to Phase 1b's optional pet outfits — and even then, framed as gifts, not purchases).
- Streak chips styled like an XP bar, level counter, or game HUD.
- Language like "wealth", "income", "spending", "earnings report" anywhere on child surfaces.

Plain coin counts and "+N coins!" feedback are explicitly allowed. The boundary is *dashboard vs feedback*.

---

## Enforcement layers

| Layer | Mechanism |
|---|---|
| Typography (R1, R8, R9) | `next/font/google` Andika in root layout. CSS in `globals.css` body: `font-variant-ligatures: none`, `text-rendering: optimizeLegibility`, `letter-spacing: 0.01em`. No system-ui fallback anywhere. |
| Passage typography (R21) | `.passage` class in `globals.css`: `max-width: 32ch; line-height: 1.6; text-align: left;`. Applied by `ReadAloudActivity`. |
| Touch targets (R19) | Tailwind preset `min-h-12 min-w-12` on tappable elements. Spelling boxes use `min-h-14 min-w-14`. |
| Reading direction (R4) | `<html dir="ltr">` in root layout. |
| Dark mode lock (R12) | No `dark:` Tailwind classes on `/student/*`. CSS `color-scheme: light` on body. |
| Content rules (R2, R3, R11, R13) | `~/.claude/skills/wordpets-content/SKILL.md` Knowledge base section 0. Validation checklist Step 5. |
| Audio (R10) | Lock TTS voice in `src/lib/speech.ts`. |
| Transcript scope (R17) | Code review: any component receiving a `transcript` prop or rendering `attempt.transcript` from `/student/*` is a violation. |
| Determinism (R24) | `src/lib/content.ts` picker functions take `(supabase, difficulty, rotation)` and return deterministic results. No `Math.random()` or per-render shuffles inside child render paths. |
| Streak copy (R25) | Code review on `PetDisplay`, mood-string maps, and any `/student/*` copy. Ban regex: `missed\|broken\|lost\|haven't\|come back\|tomorrow`. |
| Motion budget (R26) | Only `.pet-breathe` on `/student`. No idle animations on `/student/practice/*`. `prefers-reduced-motion` gates `.pet-breathe` and `.pet-bounce-once` in `globals.css`. |
| No game-economy framing (R27) | Code review on `/student/*`. Coins must be a plain count, not a chip pill / HUD / leaderboard / dashboard. |
| Code review | Any PR touching `globals.css`, `layout.tsx`, fixtures, speech, or pet/streak copy that reintroduces forbidden patterns should be flagged. |
| Future: ESLint rule | `no-restricted-syntax` for `font-family: system-ui` strings; ban `dark:` Tailwind classes inside `src/app/student/`; ban `transcript` references on `src/app/student/**`. |
