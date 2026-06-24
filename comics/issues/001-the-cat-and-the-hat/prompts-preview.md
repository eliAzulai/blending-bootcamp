# Prompt Preview — The Cat and the Hat

**Stage:** `cvc-short-a`  
**Issue:** `comic-cvc-short-a-001`  
**Generated from:** `issues/001-the-cat-and-the-hat/script.json`

✅ Decodability: PASS

---

> Edit `script.json` art_prompt fields and re-run to iterate.
> Edit `prompts/base-style.md` to change the global style.
> Edit `characters/<name>/canon.md` to update a character description.


────────────────────────────────────────────────────────────────────────
## Page 1 · Panel 1
────────────────────────────────────────────────────────────────────────

**Characters:** sam  
**Speech:** **sam:** "I have a hat."  
**SFX:** none  
**Refs:** 2 ref image(s): wordpets-sam-front-threequarter-01.png, wordpets-sam-front-threequarter-02.png

### Full prompt

```
# Base Style Prompt — WordPets Comics

Inject this at the head of every panel prompt. Do not edit casually — style
drift across issues breaks the whole project's "consistency-breeds-trust"
guarantee. If a change is needed, update this file once and re-run all
generations against the new baseline.

---

## STYLE

Clean WordPets educational-comic asset style. Use the local reference
`comics/style-references/wordpets-asset-style-target.jpeg` as the target for
character and scene rendering: rounded, friendly, vector-like animals and
simple child-safe environments with smooth color fills, soft minimal shading,
clear dark navy outlines, bright readable shapes, and a polished literacy
program feel.

The result should feel like a printed early-reader workbook or app asset, not
like watercolor storybook art. Keep surfaces clean, colors cheerful, and visual
details simple enough for ages 6-8 to scan quickly.

Use Image 1 only for comic-page structure, not for character style:
`comics/style-references/comic-layout-direction-bonnie-chester.jpeg` shows the
useful rhythm: title/masthead, clear panel borders, simple action beats, speech
bubbles, and a compact complete story.

## LAYOUT

Early-reader comic composition with clean rectangular panels, clear gutters,
large character silhouettes, and very readable action. One full page per call;
~2-4 panels average. Composition reads left-to-right, top-to-bottom. Leave
generous white space above each speech bubble area; bubbles will be typeset in
post.

## CHARACTERS

Inject character reference images per the "characters" field of the panel
script only when they match or intentionally support the WordPets asset style.
Maintain the silhouette, palette, and proportions defined in each character's
`canon.md`. Do not invent new outfits, fur patterns, or accessories unless
explicitly requested.

## TYPOGRAPHY (in-art lettering only)

If the art MUST contain visible written text (signs, labels, title cards),
use a simple sans-serif **with a single-story `a`** (the open `a`, like
hand-printing — NOT the typographic two-story `a` with a hook). This is
non-negotiable: early readers cannot map the two-story `a` to the lowercase
`a` they're learning. If the model can't enforce single-story reliably,
prefer to OMIT in-art lettering — the typesetter will add speech bubbles in
the Andika font in post-processing.

## NEGATIVE PROMPTS

Avoid: watercolor washes, Ghibli/Miyazaki cues, manga rendering, sketchy pencil
texture, photorealistic textures, over-detailed faces, painterly lighting,
dramatic cinematic shadows, anime sparkle effects, modern logos or brand
references.

## SAFETY

All depicted humans are children, drawn in a non-photorealistic rounded
educational-comic style. No gore, no realistic violence, no scary horror
imagery. Comedy is gentle and absurd, never cruel. The audience is 6-8 year
olds.


---

PANEL CONTEXT
Issue: The Cat and the Hat (stage cvc-short-a)
Page 1, panel 1.

CHARACTERS IN THIS PANEL: sam
=== SAM CANON ===
# Sam — Character Canon

**Type**: Kid (the protagonist)
**Origin**: New character introduced for the comic series. Phonologically chosen because "Sam" is decodable at `cvc-short-a` (s + a + m), the earliest stage in the curriculum. The wordpets app's fixture student is named "Alex" — but "Alex" requires the late `-ks` blend, so the comic uses "Sam" as the on-page name. Whether to rename the fixture student to match is an open question (see plan).
**Name unlock stage**: `cvc-short-a` (available from the very first issue).

---

## Visual canon (lock these)

- Approximately 7 years old.
- Light brown skin, dark brown short hair (slight cowlick at the crown).
- Round face, rosy cheeks. Eyes feel observant rather than wide-eyed-cute.
- Clothes: simple short-sleeved shirt + cuffed shorts. Earth-tone palette
  — sage green or muted ochre. NOT pure white, not bright primaries.
- Small, well-loved sneakers. Sometimes barefoot indoors.
- No glasses, no logos, no branded apparel.
- Render in the clean WordPets educational asset style: rounded shapes, crisp
  dark outline, smooth color fills, minimal shading, and easy-to-read
  expressions. Do not render Sam in watercolor, manga, or Ghibli style.

## Personality

- Curious and patient. Watches Cat watch the world.
- Easily delighted by small things (a hat that's too big, a sunbeam moving
  across the floor).
- Talks to Cat as if Cat understands. Cat may or may not — that's the joke.
- At early phonics stages, Sam's speech is hard-constrained by the validator,
  so his voice naturally feels deliberate, almost contemplative. Lean into
  this — don't fight the constraint, let it BE the voice.

## Catchphrase (per stage)

- `cvc-short-a`: "I have a hat." / "The cat is on the mat." — short observational statements.
- Future: longer, but always understated. Sam does not yell.

## Recurring poses

- Sitting cross-legged on a mat or floor.
- Holding something small (a hat, the cat) carefully.
- Looking sideways at Cat with a faint smile.
- Crouched, eye-level with Cat.

## Reference images

Same structure as Whiskers — `refs/` with 6-10 hand-curated images covering
headshots, full-body, expression sheet, outfit sheet. Generate via Gemini
3 Pro Image iterative refinement; commit once consistent, don't regenerate
casually.

Current pilot note: top-level `refs/` contains WordPets-style Sam sheets
generated from `comics/style-references/wordpets-asset-style-target.jpeg`.
Old watercolor placeholders were moved to `refs/old-style-placeholders/` and
should not be used for production generation.


ART DIRECTION:
Wide establishing shot. Sam stands in a sunny cozy room holding an enormous straw hat — the hat is almost as wide as Sam is tall. Wooden floor, a small woven mat in the foreground. Soft afternoon light through an off-frame window. Sam looks down at the hat with mild wonder.

LAYOUT:
- Frame this as one panel within a manga-style page.
- Leave blank space in the upper area for a speech bubble that will
  be typeset in post — DO NOT render speech text in the art.
- Maintain character appearance EXACTLY as in the reference images.

```


────────────────────────────────────────────────────────────────────────
## Page 1 · Panel 2
────────────────────────────────────────────────────────────────────────

**Characters:** sam  
**Speech:** **sam:** "The hat is on the mat."  
**SFX:** none  
**Refs:** 2 ref image(s): wordpets-sam-front-threequarter-01.png, wordpets-sam-front-threequarter-02.png

### Full prompt

```
# Base Style Prompt — WordPets Comics

Inject this at the head of every panel prompt. Do not edit casually — style
drift across issues breaks the whole project's "consistency-breeds-trust"
guarantee. If a change is needed, update this file once and re-run all
generations against the new baseline.

---

## STYLE

Clean WordPets educational-comic asset style. Use the local reference
`comics/style-references/wordpets-asset-style-target.jpeg` as the target for
character and scene rendering: rounded, friendly, vector-like animals and
simple child-safe environments with smooth color fills, soft minimal shading,
clear dark navy outlines, bright readable shapes, and a polished literacy
program feel.

The result should feel like a printed early-reader workbook or app asset, not
like watercolor storybook art. Keep surfaces clean, colors cheerful, and visual
details simple enough for ages 6-8 to scan quickly.

Use Image 1 only for comic-page structure, not for character style:
`comics/style-references/comic-layout-direction-bonnie-chester.jpeg` shows the
useful rhythm: title/masthead, clear panel borders, simple action beats, speech
bubbles, and a compact complete story.

## LAYOUT

Early-reader comic composition with clean rectangular panels, clear gutters,
large character silhouettes, and very readable action. One full page per call;
~2-4 panels average. Composition reads left-to-right, top-to-bottom. Leave
generous white space above each speech bubble area; bubbles will be typeset in
post.

## CHARACTERS

Inject character reference images per the "characters" field of the panel
script only when they match or intentionally support the WordPets asset style.
Maintain the silhouette, palette, and proportions defined in each character's
`canon.md`. Do not invent new outfits, fur patterns, or accessories unless
explicitly requested.

## TYPOGRAPHY (in-art lettering only)

If the art MUST contain visible written text (signs, labels, title cards),
use a simple sans-serif **with a single-story `a`** (the open `a`, like
hand-printing — NOT the typographic two-story `a` with a hook). This is
non-negotiable: early readers cannot map the two-story `a` to the lowercase
`a` they're learning. If the model can't enforce single-story reliably,
prefer to OMIT in-art lettering — the typesetter will add speech bubbles in
the Andika font in post-processing.

## NEGATIVE PROMPTS

Avoid: watercolor washes, Ghibli/Miyazaki cues, manga rendering, sketchy pencil
texture, photorealistic textures, over-detailed faces, painterly lighting,
dramatic cinematic shadows, anime sparkle effects, modern logos or brand
references.

## SAFETY

All depicted humans are children, drawn in a non-photorealistic rounded
educational-comic style. No gore, no realistic violence, no scary horror
imagery. Comedy is gentle and absurd, never cruel. The audience is 6-8 year
olds.


---

PANEL CONTEXT
Issue: The Cat and the Hat (stage cvc-short-a)
Page 1, panel 2.

CHARACTERS IN THIS PANEL: sam
=== SAM CANON ===
# Sam — Character Canon

**Type**: Kid (the protagonist)
**Origin**: New character introduced for the comic series. Phonologically chosen because "Sam" is decodable at `cvc-short-a` (s + a + m), the earliest stage in the curriculum. The wordpets app's fixture student is named "Alex" — but "Alex" requires the late `-ks` blend, so the comic uses "Sam" as the on-page name. Whether to rename the fixture student to match is an open question (see plan).
**Name unlock stage**: `cvc-short-a` (available from the very first issue).

---

## Visual canon (lock these)

- Approximately 7 years old.
- Light brown skin, dark brown short hair (slight cowlick at the crown).
- Round face, rosy cheeks. Eyes feel observant rather than wide-eyed-cute.
- Clothes: simple short-sleeved shirt + cuffed shorts. Earth-tone palette
  — sage green or muted ochre. NOT pure white, not bright primaries.
- Small, well-loved sneakers. Sometimes barefoot indoors.
- No glasses, no logos, no branded apparel.
- Render in the clean WordPets educational asset style: rounded shapes, crisp
  dark outline, smooth color fills, minimal shading, and easy-to-read
  expressions. Do not render Sam in watercolor, manga, or Ghibli style.

## Personality

- Curious and patient. Watches Cat watch the world.
- Easily delighted by small things (a hat that's too big, a sunbeam moving
  across the floor).
- Talks to Cat as if Cat understands. Cat may or may not — that's the joke.
- At early phonics stages, Sam's speech is hard-constrained by the validator,
  so his voice naturally feels deliberate, almost contemplative. Lean into
  this — don't fight the constraint, let it BE the voice.

## Catchphrase (per stage)

- `cvc-short-a`: "I have a hat." / "The cat is on the mat." — short observational statements.
- Future: longer, but always understated. Sam does not yell.

## Recurring poses

- Sitting cross-legged on a mat or floor.
- Holding something small (a hat, the cat) carefully.
- Looking sideways at Cat with a faint smile.
- Crouched, eye-level with Cat.

## Reference images

Same structure as Whiskers — `refs/` with 6-10 hand-curated images covering
headshots, full-body, expression sheet, outfit sheet. Generate via Gemini
3 Pro Image iterative refinement; commit once consistent, don't regenerate
casually.

Current pilot note: top-level `refs/` contains WordPets-style Sam sheets
generated from `comics/style-references/wordpets-asset-style-target.jpeg`.
Old watercolor placeholders were moved to `refs/old-style-placeholders/` and
should not be used for production generation.


ART DIRECTION:
Closer shot. Sam crouches and sets the hat carefully down on the woven mat. The hat looks even more comically large up close. Sam's expression: thoughtful, observational.

LAYOUT:
- Frame this as one panel within a manga-style page.
- Leave blank space in the upper area for a speech bubble that will
  be typeset in post — DO NOT render speech text in the art.
- Maintain character appearance EXACTLY as in the reference images.

```


────────────────────────────────────────────────────────────────────────
## Page 2 · Panel 1
────────────────────────────────────────────────────────────────────────

**Characters:** sam, whiskers  
**Speech:** _none_  
**SFX:** none  
**Refs:** 4 ref image(s): wordpets-sam-front-threequarter-01.png, wordpets-sam-front-threequarter-02.png, wordpets-cat-expression-sheet-01.png, wordpets-cat-poses-01.png

### Full prompt

```
# Base Style Prompt — WordPets Comics

Inject this at the head of every panel prompt. Do not edit casually — style
drift across issues breaks the whole project's "consistency-breeds-trust"
guarantee. If a change is needed, update this file once and re-run all
generations against the new baseline.

---

## STYLE

Clean WordPets educational-comic asset style. Use the local reference
`comics/style-references/wordpets-asset-style-target.jpeg` as the target for
character and scene rendering: rounded, friendly, vector-like animals and
simple child-safe environments with smooth color fills, soft minimal shading,
clear dark navy outlines, bright readable shapes, and a polished literacy
program feel.

The result should feel like a printed early-reader workbook or app asset, not
like watercolor storybook art. Keep surfaces clean, colors cheerful, and visual
details simple enough for ages 6-8 to scan quickly.

Use Image 1 only for comic-page structure, not for character style:
`comics/style-references/comic-layout-direction-bonnie-chester.jpeg` shows the
useful rhythm: title/masthead, clear panel borders, simple action beats, speech
bubbles, and a compact complete story.

## LAYOUT

Early-reader comic composition with clean rectangular panels, clear gutters,
large character silhouettes, and very readable action. One full page per call;
~2-4 panels average. Composition reads left-to-right, top-to-bottom. Leave
generous white space above each speech bubble area; bubbles will be typeset in
post.

## CHARACTERS

Inject character reference images per the "characters" field of the panel
script only when they match or intentionally support the WordPets asset style.
Maintain the silhouette, palette, and proportions defined in each character's
`canon.md`. Do not invent new outfits, fur patterns, or accessories unless
explicitly requested.

## TYPOGRAPHY (in-art lettering only)

If the art MUST contain visible written text (signs, labels, title cards),
use a simple sans-serif **with a single-story `a`** (the open `a`, like
hand-printing — NOT the typographic two-story `a` with a hook). This is
non-negotiable: early readers cannot map the two-story `a` to the lowercase
`a` they're learning. If the model can't enforce single-story reliably,
prefer to OMIT in-art lettering — the typesetter will add speech bubbles in
the Andika font in post-processing.

## NEGATIVE PROMPTS

Avoid: watercolor washes, Ghibli/Miyazaki cues, manga rendering, sketchy pencil
texture, photorealistic textures, over-detailed faces, painterly lighting,
dramatic cinematic shadows, anime sparkle effects, modern logos or brand
references.

## SAFETY

All depicted humans are children, drawn in a non-photorealistic rounded
educational-comic style. No gore, no realistic violence, no scary horror
imagery. Comedy is gentle and absurd, never cruel. The audience is 6-8 year
olds.


---

PANEL CONTEXT
Issue: The Cat and the Hat (stage cvc-short-a)
Page 2, panel 1.

CHARACTERS IN THIS PANEL: sam, whiskers
=== SAM CANON ===
# Sam — Character Canon

**Type**: Kid (the protagonist)
**Origin**: New character introduced for the comic series. Phonologically chosen because "Sam" is decodable at `cvc-short-a` (s + a + m), the earliest stage in the curriculum. The wordpets app's fixture student is named "Alex" — but "Alex" requires the late `-ks` blend, so the comic uses "Sam" as the on-page name. Whether to rename the fixture student to match is an open question (see plan).
**Name unlock stage**: `cvc-short-a` (available from the very first issue).

---

## Visual canon (lock these)

- Approximately 7 years old.
- Light brown skin, dark brown short hair (slight cowlick at the crown).
- Round face, rosy cheeks. Eyes feel observant rather than wide-eyed-cute.
- Clothes: simple short-sleeved shirt + cuffed shorts. Earth-tone palette
  — sage green or muted ochre. NOT pure white, not bright primaries.
- Small, well-loved sneakers. Sometimes barefoot indoors.
- No glasses, no logos, no branded apparel.
- Render in the clean WordPets educational asset style: rounded shapes, crisp
  dark outline, smooth color fills, minimal shading, and easy-to-read
  expressions. Do not render Sam in watercolor, manga, or Ghibli style.

## Personality

- Curious and patient. Watches Cat watch the world.
- Easily delighted by small things (a hat that's too big, a sunbeam moving
  across the floor).
- Talks to Cat as if Cat understands. Cat may or may not — that's the joke.
- At early phonics stages, Sam's speech is hard-constrained by the validator,
  so his voice naturally feels deliberate, almost contemplative. Lean into
  this — don't fight the constraint, let it BE the voice.

## Catchphrase (per stage)

- `cvc-short-a`: "I have a hat." / "The cat is on the mat." — short observational statements.
- Future: longer, but always understated. Sam does not yell.

## Recurring poses

- Sitting cross-legged on a mat or floor.
- Holding something small (a hat, the cat) carefully.
- Looking sideways at Cat with a faint smile.
- Crouched, eye-level with Cat.

## Reference images

Same structure as Whiskers — `refs/` with 6-10 hand-curated images covering
headshots, full-body, expression sheet, outfit sheet. Generate via Gemini
3 Pro Image iterative refinement; commit once consistent, don't regenerate
casually.

Current pilot note: top-level `refs/` contains WordPets-style Sam sheets
generated from `comics/style-references/wordpets-asset-style-target.jpeg`.
Old watercolor placeholders were moved to `refs/old-style-placeholders/` and
should not be used for production generation.

=== WHISKERS CANON ===
# Whiskers — Character Canon

**Type**: Cat (orange tabby)
**Origin**: Pre-existing fixture pet in `wordpets/src/lib/fixtures/student.ts` — Alex's pet. Already canonical in the WordPets app data model. The comic series adopts him as the recurring cat character.
**Name unlock stage**: `digraphs-wh-er` (kid must know wh- digraph AND -er ending before the name "Whiskers" can appear in any speech bubble or caption). Until then, characters refer to him as "the cat" or "Cat".

---

## Visual canon (lock these)

- Orange tabby coat, classic mackerel stripes (vertical bands along sides, rings on tail).
- White socks on both front paws (front-only — back paws are full orange).
- Bright green eyes, slightly oversized for stylized expressiveness.
- Slightly chunky build — not skinny, not obese. He's a well-fed house cat.
- Small chip in the upper edge of his **left** ear (story origin TBD in a later issue; visible from issue 1).
- No collar in v1. (May add a small mat-colored bandana in later arcs.)
- Render in the clean WordPets pet asset style shown in
  `comics/style-references/wordpets-asset-style-target.jpeg`: rounded body,
  crisp dark outline, smooth color fills, minimal shading, friendly readable
  expression. Do not render Cat/Whiskers in watercolor, manga, or Ghibli style.

## Personality

- Quietly opinionated. Watches before he acts.
- Loves warm spots: sunny windows, mats, hats, anything Sam sits on.
- Affectionate but on his own terms. Doesn't come when called; comes when he feels like it.
- Has a single-syllable catchphrase that varies by stage:
  - `cvc-short-a` and earlier: he doesn't speak. Reactions only via art.
  - `digraphs-wh-er` (his name reveal): "I am Whiskers." or similar — keep it short.

## Recurring poses / framing

- Curled-up sleeping silhouette (used at least once per issue as the "wordless drama panel" per `break-up-monotony.md`).
- Tail-flick of mild disapproval.
- Quizzical head tilt.
- Sitting upright on something he shouldn't (hat, book, Sam's lap mid-meal).

## Reference images

Live in `refs/`. Aim for 6-10 images, hand-curated:
- 3 headshots (different expressions: curious, sleepy, mischievous)
- 3 full-body (sitting, walking, curled up)
- 1 expression sheet — 2x4 grid: happy / sad / surprised / sleepy / scared / curious / proud / confused
- 1 outfit sheet (just one variant for now: standard orange tabby; placeholder for future)

Re-roll the ref pack via Gemini 3 Pro Image iterative refinement until visual consistency is unambiguous, then commit and DON'T regenerate casually — drift here breaks every downstream issue.

Current pilot note: top-level `refs/` contains WordPets-style Cat sheets
generated from `comics/style-references/wordpets-asset-style-target.jpeg`.
Old watercolor placeholders were moved to `refs/old-style-placeholders/` and
should not be used for production generation.


ART DIRECTION:
Side angle. The cat (orange tabby, white front socks, chipped left ear) creeps into frame from the right edge, low to the ground, eyes fixed on the hat. Sam is half-out-of-frame on the left, not yet noticing.

LAYOUT:
- Frame this as one panel within a manga-style page.
- Leave blank space in the upper area for a speech bubble that will
  be typeset in post — DO NOT render speech text in the art.
- Maintain character appearance EXACTLY as in the reference images.

```


────────────────────────────────────────────────────────────────────────
## Page 2 · Panel 2
────────────────────────────────────────────────────────────────────────

**Characters:** sam, whiskers  
**Speech:** _none_  
**SFX:** none  
**Refs:** 4 ref image(s): wordpets-sam-front-threequarter-01.png, wordpets-sam-front-threequarter-02.png, wordpets-cat-expression-sheet-01.png, wordpets-cat-poses-01.png

### Full prompt

```
# Base Style Prompt — WordPets Comics

Inject this at the head of every panel prompt. Do not edit casually — style
drift across issues breaks the whole project's "consistency-breeds-trust"
guarantee. If a change is needed, update this file once and re-run all
generations against the new baseline.

---

## STYLE

Clean WordPets educational-comic asset style. Use the local reference
`comics/style-references/wordpets-asset-style-target.jpeg` as the target for
character and scene rendering: rounded, friendly, vector-like animals and
simple child-safe environments with smooth color fills, soft minimal shading,
clear dark navy outlines, bright readable shapes, and a polished literacy
program feel.

The result should feel like a printed early-reader workbook or app asset, not
like watercolor storybook art. Keep surfaces clean, colors cheerful, and visual
details simple enough for ages 6-8 to scan quickly.

Use Image 1 only for comic-page structure, not for character style:
`comics/style-references/comic-layout-direction-bonnie-chester.jpeg` shows the
useful rhythm: title/masthead, clear panel borders, simple action beats, speech
bubbles, and a compact complete story.

## LAYOUT

Early-reader comic composition with clean rectangular panels, clear gutters,
large character silhouettes, and very readable action. One full page per call;
~2-4 panels average. Composition reads left-to-right, top-to-bottom. Leave
generous white space above each speech bubble area; bubbles will be typeset in
post.

## CHARACTERS

Inject character reference images per the "characters" field of the panel
script only when they match or intentionally support the WordPets asset style.
Maintain the silhouette, palette, and proportions defined in each character's
`canon.md`. Do not invent new outfits, fur patterns, or accessories unless
explicitly requested.

## TYPOGRAPHY (in-art lettering only)

If the art MUST contain visible written text (signs, labels, title cards),
use a simple sans-serif **with a single-story `a`** (the open `a`, like
hand-printing — NOT the typographic two-story `a` with a hook). This is
non-negotiable: early readers cannot map the two-story `a` to the lowercase
`a` they're learning. If the model can't enforce single-story reliably,
prefer to OMIT in-art lettering — the typesetter will add speech bubbles in
the Andika font in post-processing.

## NEGATIVE PROMPTS

Avoid: watercolor washes, Ghibli/Miyazaki cues, manga rendering, sketchy pencil
texture, photorealistic textures, over-detailed faces, painterly lighting,
dramatic cinematic shadows, anime sparkle effects, modern logos or brand
references.

## SAFETY

All depicted humans are children, drawn in a non-photorealistic rounded
educational-comic style. No gore, no realistic violence, no scary horror
imagery. Comedy is gentle and absurd, never cruel. The audience is 6-8 year
olds.


---

PANEL CONTEXT
Issue: The Cat and the Hat (stage cvc-short-a)
Page 2, panel 2.

CHARACTERS IN THIS PANEL: sam, whiskers
=== SAM CANON ===
# Sam — Character Canon

**Type**: Kid (the protagonist)
**Origin**: New character introduced for the comic series. Phonologically chosen because "Sam" is decodable at `cvc-short-a` (s + a + m), the earliest stage in the curriculum. The wordpets app's fixture student is named "Alex" — but "Alex" requires the late `-ks` blend, so the comic uses "Sam" as the on-page name. Whether to rename the fixture student to match is an open question (see plan).
**Name unlock stage**: `cvc-short-a` (available from the very first issue).

---

## Visual canon (lock these)

- Approximately 7 years old.
- Light brown skin, dark brown short hair (slight cowlick at the crown).
- Round face, rosy cheeks. Eyes feel observant rather than wide-eyed-cute.
- Clothes: simple short-sleeved shirt + cuffed shorts. Earth-tone palette
  — sage green or muted ochre. NOT pure white, not bright primaries.
- Small, well-loved sneakers. Sometimes barefoot indoors.
- No glasses, no logos, no branded apparel.
- Render in the clean WordPets educational asset style: rounded shapes, crisp
  dark outline, smooth color fills, minimal shading, and easy-to-read
  expressions. Do not render Sam in watercolor, manga, or Ghibli style.

## Personality

- Curious and patient. Watches Cat watch the world.
- Easily delighted by small things (a hat that's too big, a sunbeam moving
  across the floor).
- Talks to Cat as if Cat understands. Cat may or may not — that's the joke.
- At early phonics stages, Sam's speech is hard-constrained by the validator,
  so his voice naturally feels deliberate, almost contemplative. Lean into
  this — don't fight the constraint, let it BE the voice.

## Catchphrase (per stage)

- `cvc-short-a`: "I have a hat." / "The cat is on the mat." — short observational statements.
- Future: longer, but always understated. Sam does not yell.

## Recurring poses

- Sitting cross-legged on a mat or floor.
- Holding something small (a hat, the cat) carefully.
- Looking sideways at Cat with a faint smile.
- Crouched, eye-level with Cat.

## Reference images

Same structure as Whiskers — `refs/` with 6-10 hand-curated images covering
headshots, full-body, expression sheet, outfit sheet. Generate via Gemini
3 Pro Image iterative refinement; commit once consistent, don't regenerate
casually.

Current pilot note: top-level `refs/` contains WordPets-style Sam sheets
generated from `comics/style-references/wordpets-asset-style-target.jpeg`.
Old watercolor placeholders were moved to `refs/old-style-placeholders/` and
should not be used for production generation.

=== WHISKERS CANON ===
# Whiskers — Character Canon

**Type**: Cat (orange tabby)
**Origin**: Pre-existing fixture pet in `wordpets/src/lib/fixtures/student.ts` — Alex's pet. Already canonical in the WordPets app data model. The comic series adopts him as the recurring cat character.
**Name unlock stage**: `digraphs-wh-er` (kid must know wh- digraph AND -er ending before the name "Whiskers" can appear in any speech bubble or caption). Until then, characters refer to him as "the cat" or "Cat".

---

## Visual canon (lock these)

- Orange tabby coat, classic mackerel stripes (vertical bands along sides, rings on tail).
- White socks on both front paws (front-only — back paws are full orange).
- Bright green eyes, slightly oversized for stylized expressiveness.
- Slightly chunky build — not skinny, not obese. He's a well-fed house cat.
- Small chip in the upper edge of his **left** ear (story origin TBD in a later issue; visible from issue 1).
- No collar in v1. (May add a small mat-colored bandana in later arcs.)
- Render in the clean WordPets pet asset style shown in
  `comics/style-references/wordpets-asset-style-target.jpeg`: rounded body,
  crisp dark outline, smooth color fills, minimal shading, friendly readable
  expression. Do not render Cat/Whiskers in watercolor, manga, or Ghibli style.

## Personality

- Quietly opinionated. Watches before he acts.
- Loves warm spots: sunny windows, mats, hats, anything Sam sits on.
- Affectionate but on his own terms. Doesn't come when called; comes when he feels like it.
- Has a single-syllable catchphrase that varies by stage:
  - `cvc-short-a` and earlier: he doesn't speak. Reactions only via art.
  - `digraphs-wh-er` (his name reveal): "I am Whiskers." or similar — keep it short.

## Recurring poses / framing

- Curled-up sleeping silhouette (used at least once per issue as the "wordless drama panel" per `break-up-monotony.md`).
- Tail-flick of mild disapproval.
- Quizzical head tilt.
- Sitting upright on something he shouldn't (hat, book, Sam's lap mid-meal).

## Reference images

Live in `refs/`. Aim for 6-10 images, hand-curated:
- 3 headshots (different expressions: curious, sleepy, mischievous)
- 3 full-body (sitting, walking, curled up)
- 1 expression sheet — 2x4 grid: happy / sad / surprised / sleepy / scared / curious / proud / confused
- 1 outfit sheet (just one variant for now: standard orange tabby; placeholder for future)

Re-roll the ref pack via Gemini 3 Pro Image iterative refinement until visual consistency is unambiguous, then commit and DON'T regenerate casually — drift here breaks every downstream issue.

Current pilot note: top-level `refs/` contains WordPets-style Cat sheets
generated from `comics/style-references/wordpets-asset-style-target.jpeg`.
Old watercolor placeholders were moved to `refs/old-style-placeholders/` and
should not be used for production generation.


ART DIRECTION:
The cat pauses one step from the hat, head tilted, ears forward. Tail held in a slow curl. Sam, in the background, has now noticed and watches with the start of a smile.

LAYOUT:
- Frame this as one panel within a manga-style page.
- Leave blank space in the upper area for a speech bubble that will
  be typeset in post — DO NOT render speech text in the art.
- Maintain character appearance EXACTLY as in the reference images.

```


────────────────────────────────────────────────────────────────────────
## Page 2 · Panel 3
────────────────────────────────────────────────────────────────────────

**Characters:** sam, whiskers  
**Speech:** **sam:** "The cat is on the hat!"  
**SFX:** none  
**Refs:** 4 ref image(s): wordpets-sam-front-threequarter-01.png, wordpets-sam-front-threequarter-02.png, wordpets-cat-expression-sheet-01.png, wordpets-cat-poses-01.png

### Full prompt

```
# Base Style Prompt — WordPets Comics

Inject this at the head of every panel prompt. Do not edit casually — style
drift across issues breaks the whole project's "consistency-breeds-trust"
guarantee. If a change is needed, update this file once and re-run all
generations against the new baseline.

---

## STYLE

Clean WordPets educational-comic asset style. Use the local reference
`comics/style-references/wordpets-asset-style-target.jpeg` as the target for
character and scene rendering: rounded, friendly, vector-like animals and
simple child-safe environments with smooth color fills, soft minimal shading,
clear dark navy outlines, bright readable shapes, and a polished literacy
program feel.

The result should feel like a printed early-reader workbook or app asset, not
like watercolor storybook art. Keep surfaces clean, colors cheerful, and visual
details simple enough for ages 6-8 to scan quickly.

Use Image 1 only for comic-page structure, not for character style:
`comics/style-references/comic-layout-direction-bonnie-chester.jpeg` shows the
useful rhythm: title/masthead, clear panel borders, simple action beats, speech
bubbles, and a compact complete story.

## LAYOUT

Early-reader comic composition with clean rectangular panels, clear gutters,
large character silhouettes, and very readable action. One full page per call;
~2-4 panels average. Composition reads left-to-right, top-to-bottom. Leave
generous white space above each speech bubble area; bubbles will be typeset in
post.

## CHARACTERS

Inject character reference images per the "characters" field of the panel
script only when they match or intentionally support the WordPets asset style.
Maintain the silhouette, palette, and proportions defined in each character's
`canon.md`. Do not invent new outfits, fur patterns, or accessories unless
explicitly requested.

## TYPOGRAPHY (in-art lettering only)

If the art MUST contain visible written text (signs, labels, title cards),
use a simple sans-serif **with a single-story `a`** (the open `a`, like
hand-printing — NOT the typographic two-story `a` with a hook). This is
non-negotiable: early readers cannot map the two-story `a` to the lowercase
`a` they're learning. If the model can't enforce single-story reliably,
prefer to OMIT in-art lettering — the typesetter will add speech bubbles in
the Andika font in post-processing.

## NEGATIVE PROMPTS

Avoid: watercolor washes, Ghibli/Miyazaki cues, manga rendering, sketchy pencil
texture, photorealistic textures, over-detailed faces, painterly lighting,
dramatic cinematic shadows, anime sparkle effects, modern logos or brand
references.

## SAFETY

All depicted humans are children, drawn in a non-photorealistic rounded
educational-comic style. No gore, no realistic violence, no scary horror
imagery. Comedy is gentle and absurd, never cruel. The audience is 6-8 year
olds.


---

PANEL CONTEXT
Issue: The Cat and the Hat (stage cvc-short-a)
Page 2, panel 3.

CHARACTERS IN THIS PANEL: sam, whiskers
=== SAM CANON ===
# Sam — Character Canon

**Type**: Kid (the protagonist)
**Origin**: New character introduced for the comic series. Phonologically chosen because "Sam" is decodable at `cvc-short-a` (s + a + m), the earliest stage in the curriculum. The wordpets app's fixture student is named "Alex" — but "Alex" requires the late `-ks` blend, so the comic uses "Sam" as the on-page name. Whether to rename the fixture student to match is an open question (see plan).
**Name unlock stage**: `cvc-short-a` (available from the very first issue).

---

## Visual canon (lock these)

- Approximately 7 years old.
- Light brown skin, dark brown short hair (slight cowlick at the crown).
- Round face, rosy cheeks. Eyes feel observant rather than wide-eyed-cute.
- Clothes: simple short-sleeved shirt + cuffed shorts. Earth-tone palette
  — sage green or muted ochre. NOT pure white, not bright primaries.
- Small, well-loved sneakers. Sometimes barefoot indoors.
- No glasses, no logos, no branded apparel.
- Render in the clean WordPets educational asset style: rounded shapes, crisp
  dark outline, smooth color fills, minimal shading, and easy-to-read
  expressions. Do not render Sam in watercolor, manga, or Ghibli style.

## Personality

- Curious and patient. Watches Cat watch the world.
- Easily delighted by small things (a hat that's too big, a sunbeam moving
  across the floor).
- Talks to Cat as if Cat understands. Cat may or may not — that's the joke.
- At early phonics stages, Sam's speech is hard-constrained by the validator,
  so his voice naturally feels deliberate, almost contemplative. Lean into
  this — don't fight the constraint, let it BE the voice.

## Catchphrase (per stage)

- `cvc-short-a`: "I have a hat." / "The cat is on the mat." — short observational statements.
- Future: longer, but always understated. Sam does not yell.

## Recurring poses

- Sitting cross-legged on a mat or floor.
- Holding something small (a hat, the cat) carefully.
- Looking sideways at Cat with a faint smile.
- Crouched, eye-level with Cat.

## Reference images

Same structure as Whiskers — `refs/` with 6-10 hand-curated images covering
headshots, full-body, expression sheet, outfit sheet. Generate via Gemini
3 Pro Image iterative refinement; commit once consistent, don't regenerate
casually.

Current pilot note: top-level `refs/` contains WordPets-style Sam sheets
generated from `comics/style-references/wordpets-asset-style-target.jpeg`.
Old watercolor placeholders were moved to `refs/old-style-placeholders/` and
should not be used for production generation.

=== WHISKERS CANON ===
# Whiskers — Character Canon

**Type**: Cat (orange tabby)
**Origin**: Pre-existing fixture pet in `wordpets/src/lib/fixtures/student.ts` — Alex's pet. Already canonical in the WordPets app data model. The comic series adopts him as the recurring cat character.
**Name unlock stage**: `digraphs-wh-er` (kid must know wh- digraph AND -er ending before the name "Whiskers" can appear in any speech bubble or caption). Until then, characters refer to him as "the cat" or "Cat".

---

## Visual canon (lock these)

- Orange tabby coat, classic mackerel stripes (vertical bands along sides, rings on tail).
- White socks on both front paws (front-only — back paws are full orange).
- Bright green eyes, slightly oversized for stylized expressiveness.
- Slightly chunky build — not skinny, not obese. He's a well-fed house cat.
- Small chip in the upper edge of his **left** ear (story origin TBD in a later issue; visible from issue 1).
- No collar in v1. (May add a small mat-colored bandana in later arcs.)
- Render in the clean WordPets pet asset style shown in
  `comics/style-references/wordpets-asset-style-target.jpeg`: rounded body,
  crisp dark outline, smooth color fills, minimal shading, friendly readable
  expression. Do not render Cat/Whiskers in watercolor, manga, or Ghibli style.

## Personality

- Quietly opinionated. Watches before he acts.
- Loves warm spots: sunny windows, mats, hats, anything Sam sits on.
- Affectionate but on his own terms. Doesn't come when called; comes when he feels like it.
- Has a single-syllable catchphrase that varies by stage:
  - `cvc-short-a` and earlier: he doesn't speak. Reactions only via art.
  - `digraphs-wh-er` (his name reveal): "I am Whiskers." or similar — keep it short.

## Recurring poses / framing

- Curled-up sleeping silhouette (used at least once per issue as the "wordless drama panel" per `break-up-monotony.md`).
- Tail-flick of mild disapproval.
- Quizzical head tilt.
- Sitting upright on something he shouldn't (hat, book, Sam's lap mid-meal).

## Reference images

Live in `refs/`. Aim for 6-10 images, hand-curated:
- 3 headshots (different expressions: curious, sleepy, mischievous)
- 3 full-body (sitting, walking, curled up)
- 1 expression sheet — 2x4 grid: happy / sad / surprised / sleepy / scared / curious / proud / confused
- 1 outfit sheet (just one variant for now: standard orange tabby; placeholder for future)

Re-roll the ref pack via Gemini 3 Pro Image iterative refinement until visual consistency is unambiguous, then commit and DON'T regenerate casually — drift here breaks every downstream issue.

Current pilot note: top-level `refs/` contains WordPets-style Cat sheets
generated from `comics/style-references/wordpets-asset-style-target.jpeg`.
Old watercolor placeholders were moved to `refs/old-style-placeholders/` and
should not be used for production generation.


ART DIRECTION:
The cat steps onto the hat and sits. The hat squashes flat under him with a clear visual crumple: bent brim, flattened crown, no in-art text. Cat is supremely comfortable. Sam grins.

LAYOUT:
- Frame this as one panel within a manga-style page.
- Leave blank space in the upper area for a speech bubble that will
  be typeset in post — DO NOT render speech text in the art.
- Maintain character appearance EXACTLY as in the reference images.

```


────────────────────────────────────────────────────────────────────────
## Page 3 · Panel 1
────────────────────────────────────────────────────────────────────────

**Characters:** whiskers  
**Speech:** _none_  
**SFX:** none  
**Refs:** 2 ref image(s): wordpets-cat-expression-sheet-01.png, wordpets-cat-poses-01.png

### Full prompt

```
# Base Style Prompt — WordPets Comics

Inject this at the head of every panel prompt. Do not edit casually — style
drift across issues breaks the whole project's "consistency-breeds-trust"
guarantee. If a change is needed, update this file once and re-run all
generations against the new baseline.

---

## STYLE

Clean WordPets educational-comic asset style. Use the local reference
`comics/style-references/wordpets-asset-style-target.jpeg` as the target for
character and scene rendering: rounded, friendly, vector-like animals and
simple child-safe environments with smooth color fills, soft minimal shading,
clear dark navy outlines, bright readable shapes, and a polished literacy
program feel.

The result should feel like a printed early-reader workbook or app asset, not
like watercolor storybook art. Keep surfaces clean, colors cheerful, and visual
details simple enough for ages 6-8 to scan quickly.

Use Image 1 only for comic-page structure, not for character style:
`comics/style-references/comic-layout-direction-bonnie-chester.jpeg` shows the
useful rhythm: title/masthead, clear panel borders, simple action beats, speech
bubbles, and a compact complete story.

## LAYOUT

Early-reader comic composition with clean rectangular panels, clear gutters,
large character silhouettes, and very readable action. One full page per call;
~2-4 panels average. Composition reads left-to-right, top-to-bottom. Leave
generous white space above each speech bubble area; bubbles will be typeset in
post.

## CHARACTERS

Inject character reference images per the "characters" field of the panel
script only when they match or intentionally support the WordPets asset style.
Maintain the silhouette, palette, and proportions defined in each character's
`canon.md`. Do not invent new outfits, fur patterns, or accessories unless
explicitly requested.

## TYPOGRAPHY (in-art lettering only)

If the art MUST contain visible written text (signs, labels, title cards),
use a simple sans-serif **with a single-story `a`** (the open `a`, like
hand-printing — NOT the typographic two-story `a` with a hook). This is
non-negotiable: early readers cannot map the two-story `a` to the lowercase
`a` they're learning. If the model can't enforce single-story reliably,
prefer to OMIT in-art lettering — the typesetter will add speech bubbles in
the Andika font in post-processing.

## NEGATIVE PROMPTS

Avoid: watercolor washes, Ghibli/Miyazaki cues, manga rendering, sketchy pencil
texture, photorealistic textures, over-detailed faces, painterly lighting,
dramatic cinematic shadows, anime sparkle effects, modern logos or brand
references.

## SAFETY

All depicted humans are children, drawn in a non-photorealistic rounded
educational-comic style. No gore, no realistic violence, no scary horror
imagery. Comedy is gentle and absurd, never cruel. The audience is 6-8 year
olds.


---

PANEL CONTEXT
Issue: The Cat and the Hat (stage cvc-short-a)
Page 3, panel 1.

CHARACTERS IN THIS PANEL: whiskers
=== WHISKERS CANON ===
# Whiskers — Character Canon

**Type**: Cat (orange tabby)
**Origin**: Pre-existing fixture pet in `wordpets/src/lib/fixtures/student.ts` — Alex's pet. Already canonical in the WordPets app data model. The comic series adopts him as the recurring cat character.
**Name unlock stage**: `digraphs-wh-er` (kid must know wh- digraph AND -er ending before the name "Whiskers" can appear in any speech bubble or caption). Until then, characters refer to him as "the cat" or "Cat".

---

## Visual canon (lock these)

- Orange tabby coat, classic mackerel stripes (vertical bands along sides, rings on tail).
- White socks on both front paws (front-only — back paws are full orange).
- Bright green eyes, slightly oversized for stylized expressiveness.
- Slightly chunky build — not skinny, not obese. He's a well-fed house cat.
- Small chip in the upper edge of his **left** ear (story origin TBD in a later issue; visible from issue 1).
- No collar in v1. (May add a small mat-colored bandana in later arcs.)
- Render in the clean WordPets pet asset style shown in
  `comics/style-references/wordpets-asset-style-target.jpeg`: rounded body,
  crisp dark outline, smooth color fills, minimal shading, friendly readable
  expression. Do not render Cat/Whiskers in watercolor, manga, or Ghibli style.

## Personality

- Quietly opinionated. Watches before he acts.
- Loves warm spots: sunny windows, mats, hats, anything Sam sits on.
- Affectionate but on his own terms. Doesn't come when called; comes when he feels like it.
- Has a single-syllable catchphrase that varies by stage:
  - `cvc-short-a` and earlier: he doesn't speak. Reactions only via art.
  - `digraphs-wh-er` (his name reveal): "I am Whiskers." or similar — keep it short.

## Recurring poses / framing

- Curled-up sleeping silhouette (used at least once per issue as the "wordless drama panel" per `break-up-monotony.md`).
- Tail-flick of mild disapproval.
- Quizzical head tilt.
- Sitting upright on something he shouldn't (hat, book, Sam's lap mid-meal).

## Reference images

Live in `refs/`. Aim for 6-10 images, hand-curated:
- 3 headshots (different expressions: curious, sleepy, mischievous)
- 3 full-body (sitting, walking, curled up)
- 1 expression sheet — 2x4 grid: happy / sad / surprised / sleepy / scared / curious / proud / confused
- 1 outfit sheet (just one variant for now: standard orange tabby; placeholder for future)

Re-roll the ref pack via Gemini 3 Pro Image iterative refinement until visual consistency is unambiguous, then commit and DON'T regenerate casually — drift here breaks every downstream issue.

Current pilot note: top-level `refs/` contains WordPets-style Cat sheets
generated from `comics/style-references/wordpets-asset-style-target.jpeg`.
Old watercolor placeholders were moved to `refs/old-style-placeholders/` and
should not be used for production generation.


ART DIRECTION:
Close-up of the cat sitting on the squashed hat, eyes half-closed, deeply pleased. Tail draped to one side.

LAYOUT:
- Frame this as one panel within a manga-style page.
- Leave blank space in the upper area for a speech bubble that will
  be typeset in post — DO NOT render speech text in the art.
- Maintain character appearance EXACTLY as in the reference images.

```


────────────────────────────────────────────────────────────────────────
## Page 3 · Panel 2
────────────────────────────────────────────────────────────────────────

**Characters:** sam, whiskers  
**Speech:** **sam:** "I see the cat."  
**SFX:** none  
**Refs:** 4 ref image(s): wordpets-sam-front-threequarter-01.png, wordpets-sam-front-threequarter-02.png, wordpets-cat-expression-sheet-01.png, wordpets-cat-poses-01.png

### Full prompt

```
# Base Style Prompt — WordPets Comics

Inject this at the head of every panel prompt. Do not edit casually — style
drift across issues breaks the whole project's "consistency-breeds-trust"
guarantee. If a change is needed, update this file once and re-run all
generations against the new baseline.

---

## STYLE

Clean WordPets educational-comic asset style. Use the local reference
`comics/style-references/wordpets-asset-style-target.jpeg` as the target for
character and scene rendering: rounded, friendly, vector-like animals and
simple child-safe environments with smooth color fills, soft minimal shading,
clear dark navy outlines, bright readable shapes, and a polished literacy
program feel.

The result should feel like a printed early-reader workbook or app asset, not
like watercolor storybook art. Keep surfaces clean, colors cheerful, and visual
details simple enough for ages 6-8 to scan quickly.

Use Image 1 only for comic-page structure, not for character style:
`comics/style-references/comic-layout-direction-bonnie-chester.jpeg` shows the
useful rhythm: title/masthead, clear panel borders, simple action beats, speech
bubbles, and a compact complete story.

## LAYOUT

Early-reader comic composition with clean rectangular panels, clear gutters,
large character silhouettes, and very readable action. One full page per call;
~2-4 panels average. Composition reads left-to-right, top-to-bottom. Leave
generous white space above each speech bubble area; bubbles will be typeset in
post.

## CHARACTERS

Inject character reference images per the "characters" field of the panel
script only when they match or intentionally support the WordPets asset style.
Maintain the silhouette, palette, and proportions defined in each character's
`canon.md`. Do not invent new outfits, fur patterns, or accessories unless
explicitly requested.

## TYPOGRAPHY (in-art lettering only)

If the art MUST contain visible written text (signs, labels, title cards),
use a simple sans-serif **with a single-story `a`** (the open `a`, like
hand-printing — NOT the typographic two-story `a` with a hook). This is
non-negotiable: early readers cannot map the two-story `a` to the lowercase
`a` they're learning. If the model can't enforce single-story reliably,
prefer to OMIT in-art lettering — the typesetter will add speech bubbles in
the Andika font in post-processing.

## NEGATIVE PROMPTS

Avoid: watercolor washes, Ghibli/Miyazaki cues, manga rendering, sketchy pencil
texture, photorealistic textures, over-detailed faces, painterly lighting,
dramatic cinematic shadows, anime sparkle effects, modern logos or brand
references.

## SAFETY

All depicted humans are children, drawn in a non-photorealistic rounded
educational-comic style. No gore, no realistic violence, no scary horror
imagery. Comedy is gentle and absurd, never cruel. The audience is 6-8 year
olds.


---

PANEL CONTEXT
Issue: The Cat and the Hat (stage cvc-short-a)
Page 3, panel 2.

CHARACTERS IN THIS PANEL: sam, whiskers
=== SAM CANON ===
# Sam — Character Canon

**Type**: Kid (the protagonist)
**Origin**: New character introduced for the comic series. Phonologically chosen because "Sam" is decodable at `cvc-short-a` (s + a + m), the earliest stage in the curriculum. The wordpets app's fixture student is named "Alex" — but "Alex" requires the late `-ks` blend, so the comic uses "Sam" as the on-page name. Whether to rename the fixture student to match is an open question (see plan).
**Name unlock stage**: `cvc-short-a` (available from the very first issue).

---

## Visual canon (lock these)

- Approximately 7 years old.
- Light brown skin, dark brown short hair (slight cowlick at the crown).
- Round face, rosy cheeks. Eyes feel observant rather than wide-eyed-cute.
- Clothes: simple short-sleeved shirt + cuffed shorts. Earth-tone palette
  — sage green or muted ochre. NOT pure white, not bright primaries.
- Small, well-loved sneakers. Sometimes barefoot indoors.
- No glasses, no logos, no branded apparel.
- Render in the clean WordPets educational asset style: rounded shapes, crisp
  dark outline, smooth color fills, minimal shading, and easy-to-read
  expressions. Do not render Sam in watercolor, manga, or Ghibli style.

## Personality

- Curious and patient. Watches Cat watch the world.
- Easily delighted by small things (a hat that's too big, a sunbeam moving
  across the floor).
- Talks to Cat as if Cat understands. Cat may or may not — that's the joke.
- At early phonics stages, Sam's speech is hard-constrained by the validator,
  so his voice naturally feels deliberate, almost contemplative. Lean into
  this — don't fight the constraint, let it BE the voice.

## Catchphrase (per stage)

- `cvc-short-a`: "I have a hat." / "The cat is on the mat." — short observational statements.
- Future: longer, but always understated. Sam does not yell.

## Recurring poses

- Sitting cross-legged on a mat or floor.
- Holding something small (a hat, the cat) carefully.
- Looking sideways at Cat with a faint smile.
- Crouched, eye-level with Cat.

## Reference images

Same structure as Whiskers — `refs/` with 6-10 hand-curated images covering
headshots, full-body, expression sheet, outfit sheet. Generate via Gemini
3 Pro Image iterative refinement; commit once consistent, don't regenerate
casually.

Current pilot note: top-level `refs/` contains WordPets-style Sam sheets
generated from `comics/style-references/wordpets-asset-style-target.jpeg`.
Old watercolor placeholders were moved to `refs/old-style-placeholders/` and
should not be used for production generation.

=== WHISKERS CANON ===
# Whiskers — Character Canon

**Type**: Cat (orange tabby)
**Origin**: Pre-existing fixture pet in `wordpets/src/lib/fixtures/student.ts` — Alex's pet. Already canonical in the WordPets app data model. The comic series adopts him as the recurring cat character.
**Name unlock stage**: `digraphs-wh-er` (kid must know wh- digraph AND -er ending before the name "Whiskers" can appear in any speech bubble or caption). Until then, characters refer to him as "the cat" or "Cat".

---

## Visual canon (lock these)

- Orange tabby coat, classic mackerel stripes (vertical bands along sides, rings on tail).
- White socks on both front paws (front-only — back paws are full orange).
- Bright green eyes, slightly oversized for stylized expressiveness.
- Slightly chunky build — not skinny, not obese. He's a well-fed house cat.
- Small chip in the upper edge of his **left** ear (story origin TBD in a later issue; visible from issue 1).
- No collar in v1. (May add a small mat-colored bandana in later arcs.)
- Render in the clean WordPets pet asset style shown in
  `comics/style-references/wordpets-asset-style-target.jpeg`: rounded body,
  crisp dark outline, smooth color fills, minimal shading, friendly readable
  expression. Do not render Cat/Whiskers in watercolor, manga, or Ghibli style.

## Personality

- Quietly opinionated. Watches before he acts.
- Loves warm spots: sunny windows, mats, hats, anything Sam sits on.
- Affectionate but on his own terms. Doesn't come when called; comes when he feels like it.
- Has a single-syllable catchphrase that varies by stage:
  - `cvc-short-a` and earlier: he doesn't speak. Reactions only via art.
  - `digraphs-wh-er` (his name reveal): "I am Whiskers." or similar — keep it short.

## Recurring poses / framing

- Curled-up sleeping silhouette (used at least once per issue as the "wordless drama panel" per `break-up-monotony.md`).
- Tail-flick of mild disapproval.
- Quizzical head tilt.
- Sitting upright on something he shouldn't (hat, book, Sam's lap mid-meal).

## Reference images

Live in `refs/`. Aim for 6-10 images, hand-curated:
- 3 headshots (different expressions: curious, sleepy, mischievous)
- 3 full-body (sitting, walking, curled up)
- 1 expression sheet — 2x4 grid: happy / sad / surprised / sleepy / scared / curious / proud / confused
- 1 outfit sheet (just one variant for now: standard orange tabby; placeholder for future)

Re-roll the ref pack via Gemini 3 Pro Image iterative refinement until visual consistency is unambiguous, then commit and DON'T regenerate casually — drift here breaks every downstream issue.

Current pilot note: top-level `refs/` contains WordPets-style Cat sheets
generated from `comics/style-references/wordpets-asset-style-target.jpeg`.
Old watercolor placeholders were moved to `refs/old-style-placeholders/` and
should not be used for production generation.


ART DIRECTION:
Sam reaches a hand toward the cat to pet him. The hand is gentle, fingers slightly curled. Cat's expression shifts to a soft, accepting blink.

LAYOUT:
- Frame this as one panel within a manga-style page.
- Leave blank space in the upper area for a speech bubble that will
  be typeset in post — DO NOT render speech text in the art.
- Maintain character appearance EXACTLY as in the reference images.

```


────────────────────────────────────────────────────────────────────────
## Page 4 · Panel 1
────────────────────────────────────────────────────────────────────────

**Characters:** sam, whiskers  
**Speech:** **sam:** "Sam is on the mat. The cat is on the mat."  
**SFX:** none  
**Refs:** 4 ref image(s): wordpets-sam-front-threequarter-01.png, wordpets-sam-front-threequarter-02.png, wordpets-cat-expression-sheet-01.png, wordpets-cat-poses-01.png

### Full prompt

```
# Base Style Prompt — WordPets Comics

Inject this at the head of every panel prompt. Do not edit casually — style
drift across issues breaks the whole project's "consistency-breeds-trust"
guarantee. If a change is needed, update this file once and re-run all
generations against the new baseline.

---

## STYLE

Clean WordPets educational-comic asset style. Use the local reference
`comics/style-references/wordpets-asset-style-target.jpeg` as the target for
character and scene rendering: rounded, friendly, vector-like animals and
simple child-safe environments with smooth color fills, soft minimal shading,
clear dark navy outlines, bright readable shapes, and a polished literacy
program feel.

The result should feel like a printed early-reader workbook or app asset, not
like watercolor storybook art. Keep surfaces clean, colors cheerful, and visual
details simple enough for ages 6-8 to scan quickly.

Use Image 1 only for comic-page structure, not for character style:
`comics/style-references/comic-layout-direction-bonnie-chester.jpeg` shows the
useful rhythm: title/masthead, clear panel borders, simple action beats, speech
bubbles, and a compact complete story.

## LAYOUT

Early-reader comic composition with clean rectangular panels, clear gutters,
large character silhouettes, and very readable action. One full page per call;
~2-4 panels average. Composition reads left-to-right, top-to-bottom. Leave
generous white space above each speech bubble area; bubbles will be typeset in
post.

## CHARACTERS

Inject character reference images per the "characters" field of the panel
script only when they match or intentionally support the WordPets asset style.
Maintain the silhouette, palette, and proportions defined in each character's
`canon.md`. Do not invent new outfits, fur patterns, or accessories unless
explicitly requested.

## TYPOGRAPHY (in-art lettering only)

If the art MUST contain visible written text (signs, labels, title cards),
use a simple sans-serif **with a single-story `a`** (the open `a`, like
hand-printing — NOT the typographic two-story `a` with a hook). This is
non-negotiable: early readers cannot map the two-story `a` to the lowercase
`a` they're learning. If the model can't enforce single-story reliably,
prefer to OMIT in-art lettering — the typesetter will add speech bubbles in
the Andika font in post-processing.

## NEGATIVE PROMPTS

Avoid: watercolor washes, Ghibli/Miyazaki cues, manga rendering, sketchy pencil
texture, photorealistic textures, over-detailed faces, painterly lighting,
dramatic cinematic shadows, anime sparkle effects, modern logos or brand
references.

## SAFETY

All depicted humans are children, drawn in a non-photorealistic rounded
educational-comic style. No gore, no realistic violence, no scary horror
imagery. Comedy is gentle and absurd, never cruel. The audience is 6-8 year
olds.


---

PANEL CONTEXT
Issue: The Cat and the Hat (stage cvc-short-a)
Page 4, panel 1.

CHARACTERS IN THIS PANEL: sam, whiskers
=== SAM CANON ===
# Sam — Character Canon

**Type**: Kid (the protagonist)
**Origin**: New character introduced for the comic series. Phonologically chosen because "Sam" is decodable at `cvc-short-a` (s + a + m), the earliest stage in the curriculum. The wordpets app's fixture student is named "Alex" — but "Alex" requires the late `-ks` blend, so the comic uses "Sam" as the on-page name. Whether to rename the fixture student to match is an open question (see plan).
**Name unlock stage**: `cvc-short-a` (available from the very first issue).

---

## Visual canon (lock these)

- Approximately 7 years old.
- Light brown skin, dark brown short hair (slight cowlick at the crown).
- Round face, rosy cheeks. Eyes feel observant rather than wide-eyed-cute.
- Clothes: simple short-sleeved shirt + cuffed shorts. Earth-tone palette
  — sage green or muted ochre. NOT pure white, not bright primaries.
- Small, well-loved sneakers. Sometimes barefoot indoors.
- No glasses, no logos, no branded apparel.
- Render in the clean WordPets educational asset style: rounded shapes, crisp
  dark outline, smooth color fills, minimal shading, and easy-to-read
  expressions. Do not render Sam in watercolor, manga, or Ghibli style.

## Personality

- Curious and patient. Watches Cat watch the world.
- Easily delighted by small things (a hat that's too big, a sunbeam moving
  across the floor).
- Talks to Cat as if Cat understands. Cat may or may not — that's the joke.
- At early phonics stages, Sam's speech is hard-constrained by the validator,
  so his voice naturally feels deliberate, almost contemplative. Lean into
  this — don't fight the constraint, let it BE the voice.

## Catchphrase (per stage)

- `cvc-short-a`: "I have a hat." / "The cat is on the mat." — short observational statements.
- Future: longer, but always understated. Sam does not yell.

## Recurring poses

- Sitting cross-legged on a mat or floor.
- Holding something small (a hat, the cat) carefully.
- Looking sideways at Cat with a faint smile.
- Crouched, eye-level with Cat.

## Reference images

Same structure as Whiskers — `refs/` with 6-10 hand-curated images covering
headshots, full-body, expression sheet, outfit sheet. Generate via Gemini
3 Pro Image iterative refinement; commit once consistent, don't regenerate
casually.

Current pilot note: top-level `refs/` contains WordPets-style Sam sheets
generated from `comics/style-references/wordpets-asset-style-target.jpeg`.
Old watercolor placeholders were moved to `refs/old-style-placeholders/` and
should not be used for production generation.

=== WHISKERS CANON ===
# Whiskers — Character Canon

**Type**: Cat (orange tabby)
**Origin**: Pre-existing fixture pet in `wordpets/src/lib/fixtures/student.ts` — Alex's pet. Already canonical in the WordPets app data model. The comic series adopts him as the recurring cat character.
**Name unlock stage**: `digraphs-wh-er` (kid must know wh- digraph AND -er ending before the name "Whiskers" can appear in any speech bubble or caption). Until then, characters refer to him as "the cat" or "Cat".

---

## Visual canon (lock these)

- Orange tabby coat, classic mackerel stripes (vertical bands along sides, rings on tail).
- White socks on both front paws (front-only — back paws are full orange).
- Bright green eyes, slightly oversized for stylized expressiveness.
- Slightly chunky build — not skinny, not obese. He's a well-fed house cat.
- Small chip in the upper edge of his **left** ear (story origin TBD in a later issue; visible from issue 1).
- No collar in v1. (May add a small mat-colored bandana in later arcs.)
- Render in the clean WordPets pet asset style shown in
  `comics/style-references/wordpets-asset-style-target.jpeg`: rounded body,
  crisp dark outline, smooth color fills, minimal shading, friendly readable
  expression. Do not render Cat/Whiskers in watercolor, manga, or Ghibli style.

## Personality

- Quietly opinionated. Watches before he acts.
- Loves warm spots: sunny windows, mats, hats, anything Sam sits on.
- Affectionate but on his own terms. Doesn't come when called; comes when he feels like it.
- Has a single-syllable catchphrase that varies by stage:
  - `cvc-short-a` and earlier: he doesn't speak. Reactions only via art.
  - `digraphs-wh-er` (his name reveal): "I am Whiskers." or similar — keep it short.

## Recurring poses / framing

- Curled-up sleeping silhouette (used at least once per issue as the "wordless drama panel" per `break-up-monotony.md`).
- Tail-flick of mild disapproval.
- Quizzical head tilt.
- Sitting upright on something he shouldn't (hat, book, Sam's lap mid-meal).

## Reference images

Live in `refs/`. Aim for 6-10 images, hand-curated:
- 3 headshots (different expressions: curious, sleepy, mischievous)
- 3 full-body (sitting, walking, curled up)
- 1 expression sheet — 2x4 grid: happy / sad / surprised / sleepy / scared / curious / proud / confused
- 1 outfit sheet (just one variant for now: standard orange tabby; placeholder for future)

Re-roll the ref pack via Gemini 3 Pro Image iterative refinement until visual consistency is unambiguous, then commit and DON'T regenerate casually — drift here breaks every downstream issue.

Current pilot note: top-level `refs/` contains WordPets-style Cat sheets
generated from `comics/style-references/wordpets-asset-style-target.jpeg`.
Old watercolor placeholders were moved to `refs/old-style-placeholders/` and
should not be used for production generation.


ART DIRECTION:
Sam sits cross-legged on the wooden floor next to the mat. The cat is now beside him on the mat (not on the hat anymore — the hat is set aside). Both are looking at each other.

LAYOUT:
- Frame this as one panel within a manga-style page.
- Leave blank space in the upper area for a speech bubble that will
  be typeset in post — DO NOT render speech text in the art.
- Maintain character appearance EXACTLY as in the reference images.

```


────────────────────────────────────────────────────────────────────────
## Page 4 · Panel 2
────────────────────────────────────────────────────────────────────────

**Characters:** sam, whiskers  
**Speech:** _none_  
**SFX:** none  
**Refs:** 4 ref image(s): wordpets-sam-front-threequarter-01.png, wordpets-sam-front-threequarter-02.png, wordpets-cat-expression-sheet-01.png, wordpets-cat-poses-01.png

### Full prompt

```
# Base Style Prompt — WordPets Comics

Inject this at the head of every panel prompt. Do not edit casually — style
drift across issues breaks the whole project's "consistency-breeds-trust"
guarantee. If a change is needed, update this file once and re-run all
generations against the new baseline.

---

## STYLE

Clean WordPets educational-comic asset style. Use the local reference
`comics/style-references/wordpets-asset-style-target.jpeg` as the target for
character and scene rendering: rounded, friendly, vector-like animals and
simple child-safe environments with smooth color fills, soft minimal shading,
clear dark navy outlines, bright readable shapes, and a polished literacy
program feel.

The result should feel like a printed early-reader workbook or app asset, not
like watercolor storybook art. Keep surfaces clean, colors cheerful, and visual
details simple enough for ages 6-8 to scan quickly.

Use Image 1 only for comic-page structure, not for character style:
`comics/style-references/comic-layout-direction-bonnie-chester.jpeg` shows the
useful rhythm: title/masthead, clear panel borders, simple action beats, speech
bubbles, and a compact complete story.

## LAYOUT

Early-reader comic composition with clean rectangular panels, clear gutters,
large character silhouettes, and very readable action. One full page per call;
~2-4 panels average. Composition reads left-to-right, top-to-bottom. Leave
generous white space above each speech bubble area; bubbles will be typeset in
post.

## CHARACTERS

Inject character reference images per the "characters" field of the panel
script only when they match or intentionally support the WordPets asset style.
Maintain the silhouette, palette, and proportions defined in each character's
`canon.md`. Do not invent new outfits, fur patterns, or accessories unless
explicitly requested.

## TYPOGRAPHY (in-art lettering only)

If the art MUST contain visible written text (signs, labels, title cards),
use a simple sans-serif **with a single-story `a`** (the open `a`, like
hand-printing — NOT the typographic two-story `a` with a hook). This is
non-negotiable: early readers cannot map the two-story `a` to the lowercase
`a` they're learning. If the model can't enforce single-story reliably,
prefer to OMIT in-art lettering — the typesetter will add speech bubbles in
the Andika font in post-processing.

## NEGATIVE PROMPTS

Avoid: watercolor washes, Ghibli/Miyazaki cues, manga rendering, sketchy pencil
texture, photorealistic textures, over-detailed faces, painterly lighting,
dramatic cinematic shadows, anime sparkle effects, modern logos or brand
references.

## SAFETY

All depicted humans are children, drawn in a non-photorealistic rounded
educational-comic style. No gore, no realistic violence, no scary horror
imagery. Comedy is gentle and absurd, never cruel. The audience is 6-8 year
olds.


---

PANEL CONTEXT
Issue: The Cat and the Hat (stage cvc-short-a)
Page 4, panel 2.

CHARACTERS IN THIS PANEL: sam, whiskers
=== SAM CANON ===
# Sam — Character Canon

**Type**: Kid (the protagonist)
**Origin**: New character introduced for the comic series. Phonologically chosen because "Sam" is decodable at `cvc-short-a` (s + a + m), the earliest stage in the curriculum. The wordpets app's fixture student is named "Alex" — but "Alex" requires the late `-ks` blend, so the comic uses "Sam" as the on-page name. Whether to rename the fixture student to match is an open question (see plan).
**Name unlock stage**: `cvc-short-a` (available from the very first issue).

---

## Visual canon (lock these)

- Approximately 7 years old.
- Light brown skin, dark brown short hair (slight cowlick at the crown).
- Round face, rosy cheeks. Eyes feel observant rather than wide-eyed-cute.
- Clothes: simple short-sleeved shirt + cuffed shorts. Earth-tone palette
  — sage green or muted ochre. NOT pure white, not bright primaries.
- Small, well-loved sneakers. Sometimes barefoot indoors.
- No glasses, no logos, no branded apparel.
- Render in the clean WordPets educational asset style: rounded shapes, crisp
  dark outline, smooth color fills, minimal shading, and easy-to-read
  expressions. Do not render Sam in watercolor, manga, or Ghibli style.

## Personality

- Curious and patient. Watches Cat watch the world.
- Easily delighted by small things (a hat that's too big, a sunbeam moving
  across the floor).
- Talks to Cat as if Cat understands. Cat may or may not — that's the joke.
- At early phonics stages, Sam's speech is hard-constrained by the validator,
  so his voice naturally feels deliberate, almost contemplative. Lean into
  this — don't fight the constraint, let it BE the voice.

## Catchphrase (per stage)

- `cvc-short-a`: "I have a hat." / "The cat is on the mat." — short observational statements.
- Future: longer, but always understated. Sam does not yell.

## Recurring poses

- Sitting cross-legged on a mat or floor.
- Holding something small (a hat, the cat) carefully.
- Looking sideways at Cat with a faint smile.
- Crouched, eye-level with Cat.

## Reference images

Same structure as Whiskers — `refs/` with 6-10 hand-curated images covering
headshots, full-body, expression sheet, outfit sheet. Generate via Gemini
3 Pro Image iterative refinement; commit once consistent, don't regenerate
casually.

Current pilot note: top-level `refs/` contains WordPets-style Sam sheets
generated from `comics/style-references/wordpets-asset-style-target.jpeg`.
Old watercolor placeholders were moved to `refs/old-style-placeholders/` and
should not be used for production generation.

=== WHISKERS CANON ===
# Whiskers — Character Canon

**Type**: Cat (orange tabby)
**Origin**: Pre-existing fixture pet in `wordpets/src/lib/fixtures/student.ts` — Alex's pet. Already canonical in the WordPets app data model. The comic series adopts him as the recurring cat character.
**Name unlock stage**: `digraphs-wh-er` (kid must know wh- digraph AND -er ending before the name "Whiskers" can appear in any speech bubble or caption). Until then, characters refer to him as "the cat" or "Cat".

---

## Visual canon (lock these)

- Orange tabby coat, classic mackerel stripes (vertical bands along sides, rings on tail).
- White socks on both front paws (front-only — back paws are full orange).
- Bright green eyes, slightly oversized for stylized expressiveness.
- Slightly chunky build — not skinny, not obese. He's a well-fed house cat.
- Small chip in the upper edge of his **left** ear (story origin TBD in a later issue; visible from issue 1).
- No collar in v1. (May add a small mat-colored bandana in later arcs.)
- Render in the clean WordPets pet asset style shown in
  `comics/style-references/wordpets-asset-style-target.jpeg`: rounded body,
  crisp dark outline, smooth color fills, minimal shading, friendly readable
  expression. Do not render Cat/Whiskers in watercolor, manga, or Ghibli style.

## Personality

- Quietly opinionated. Watches before he acts.
- Loves warm spots: sunny windows, mats, hats, anything Sam sits on.
- Affectionate but on his own terms. Doesn't come when called; comes when he feels like it.
- Has a single-syllable catchphrase that varies by stage:
  - `cvc-short-a` and earlier: he doesn't speak. Reactions only via art.
  - `digraphs-wh-er` (his name reveal): "I am Whiskers." or similar — keep it short.

## Recurring poses / framing

- Curled-up sleeping silhouette (used at least once per issue as the "wordless drama panel" per `break-up-monotony.md`).
- Tail-flick of mild disapproval.
- Quizzical head tilt.
- Sitting upright on something he shouldn't (hat, book, Sam's lap mid-meal).

## Reference images

Live in `refs/`. Aim for 6-10 images, hand-curated:
- 3 headshots (different expressions: curious, sleepy, mischievous)
- 3 full-body (sitting, walking, curled up)
- 1 expression sheet — 2x4 grid: happy / sad / surprised / sleepy / scared / curious / proud / confused
- 1 outfit sheet (just one variant for now: standard orange tabby; placeholder for future)

Re-roll the ref pack via Gemini 3 Pro Image iterative refinement until visual consistency is unambiguous, then commit and DON'T regenerate casually — drift here breaks every downstream issue.

Current pilot note: top-level `refs/` contains WordPets-style Cat sheets
generated from `comics/style-references/wordpets-asset-style-target.jpeg`.
Old watercolor placeholders were moved to `refs/old-style-placeholders/` and
should not be used for production generation.


ART DIRECTION:
Slightly wider shot. The afternoon light is warmer now, longer shadows. Sam yawns once. Cat blinks slowly.

LAYOUT:
- Frame this as one panel within a manga-style page.
- Leave blank space in the upper area for a speech bubble that will
  be typeset in post — DO NOT render speech text in the art.
- Maintain character appearance EXACTLY as in the reference images.

```


────────────────────────────────────────────────────────────────────────
## Page 5 · Panel 1
────────────────────────────────────────────────────────────────────────

**Characters:** sam, whiskers  
**Speech:** _none_  
**SFX:** none  
**Refs:** 4 ref image(s): wordpets-sam-front-threequarter-01.png, wordpets-sam-front-threequarter-02.png, wordpets-cat-expression-sheet-01.png, wordpets-cat-poses-01.png

### Full prompt

```
# Base Style Prompt — WordPets Comics

Inject this at the head of every panel prompt. Do not edit casually — style
drift across issues breaks the whole project's "consistency-breeds-trust"
guarantee. If a change is needed, update this file once and re-run all
generations against the new baseline.

---

## STYLE

Clean WordPets educational-comic asset style. Use the local reference
`comics/style-references/wordpets-asset-style-target.jpeg` as the target for
character and scene rendering: rounded, friendly, vector-like animals and
simple child-safe environments with smooth color fills, soft minimal shading,
clear dark navy outlines, bright readable shapes, and a polished literacy
program feel.

The result should feel like a printed early-reader workbook or app asset, not
like watercolor storybook art. Keep surfaces clean, colors cheerful, and visual
details simple enough for ages 6-8 to scan quickly.

Use Image 1 only for comic-page structure, not for character style:
`comics/style-references/comic-layout-direction-bonnie-chester.jpeg` shows the
useful rhythm: title/masthead, clear panel borders, simple action beats, speech
bubbles, and a compact complete story.

## LAYOUT

Early-reader comic composition with clean rectangular panels, clear gutters,
large character silhouettes, and very readable action. One full page per call;
~2-4 panels average. Composition reads left-to-right, top-to-bottom. Leave
generous white space above each speech bubble area; bubbles will be typeset in
post.

## CHARACTERS

Inject character reference images per the "characters" field of the panel
script only when they match or intentionally support the WordPets asset style.
Maintain the silhouette, palette, and proportions defined in each character's
`canon.md`. Do not invent new outfits, fur patterns, or accessories unless
explicitly requested.

## TYPOGRAPHY (in-art lettering only)

If the art MUST contain visible written text (signs, labels, title cards),
use a simple sans-serif **with a single-story `a`** (the open `a`, like
hand-printing — NOT the typographic two-story `a` with a hook). This is
non-negotiable: early readers cannot map the two-story `a` to the lowercase
`a` they're learning. If the model can't enforce single-story reliably,
prefer to OMIT in-art lettering — the typesetter will add speech bubbles in
the Andika font in post-processing.

## NEGATIVE PROMPTS

Avoid: watercolor washes, Ghibli/Miyazaki cues, manga rendering, sketchy pencil
texture, photorealistic textures, over-detailed faces, painterly lighting,
dramatic cinematic shadows, anime sparkle effects, modern logos or brand
references.

## SAFETY

All depicted humans are children, drawn in a non-photorealistic rounded
educational-comic style. No gore, no realistic violence, no scary horror
imagery. Comedy is gentle and absurd, never cruel. The audience is 6-8 year
olds.


---

PANEL CONTEXT
Issue: The Cat and the Hat (stage cvc-short-a)
Page 5, panel 1.

CHARACTERS IN THIS PANEL: sam, whiskers
=== SAM CANON ===
# Sam — Character Canon

**Type**: Kid (the protagonist)
**Origin**: New character introduced for the comic series. Phonologically chosen because "Sam" is decodable at `cvc-short-a` (s + a + m), the earliest stage in the curriculum. The wordpets app's fixture student is named "Alex" — but "Alex" requires the late `-ks` blend, so the comic uses "Sam" as the on-page name. Whether to rename the fixture student to match is an open question (see plan).
**Name unlock stage**: `cvc-short-a` (available from the very first issue).

---

## Visual canon (lock these)

- Approximately 7 years old.
- Light brown skin, dark brown short hair (slight cowlick at the crown).
- Round face, rosy cheeks. Eyes feel observant rather than wide-eyed-cute.
- Clothes: simple short-sleeved shirt + cuffed shorts. Earth-tone palette
  — sage green or muted ochre. NOT pure white, not bright primaries.
- Small, well-loved sneakers. Sometimes barefoot indoors.
- No glasses, no logos, no branded apparel.
- Render in the clean WordPets educational asset style: rounded shapes, crisp
  dark outline, smooth color fills, minimal shading, and easy-to-read
  expressions. Do not render Sam in watercolor, manga, or Ghibli style.

## Personality

- Curious and patient. Watches Cat watch the world.
- Easily delighted by small things (a hat that's too big, a sunbeam moving
  across the floor).
- Talks to Cat as if Cat understands. Cat may or may not — that's the joke.
- At early phonics stages, Sam's speech is hard-constrained by the validator,
  so his voice naturally feels deliberate, almost contemplative. Lean into
  this — don't fight the constraint, let it BE the voice.

## Catchphrase (per stage)

- `cvc-short-a`: "I have a hat." / "The cat is on the mat." — short observational statements.
- Future: longer, but always understated. Sam does not yell.

## Recurring poses

- Sitting cross-legged on a mat or floor.
- Holding something small (a hat, the cat) carefully.
- Looking sideways at Cat with a faint smile.
- Crouched, eye-level with Cat.

## Reference images

Same structure as Whiskers — `refs/` with 6-10 hand-curated images covering
headshots, full-body, expression sheet, outfit sheet. Generate via Gemini
3 Pro Image iterative refinement; commit once consistent, don't regenerate
casually.

Current pilot note: top-level `refs/` contains WordPets-style Sam sheets
generated from `comics/style-references/wordpets-asset-style-target.jpeg`.
Old watercolor placeholders were moved to `refs/old-style-placeholders/` and
should not be used for production generation.

=== WHISKERS CANON ===
# Whiskers — Character Canon

**Type**: Cat (orange tabby)
**Origin**: Pre-existing fixture pet in `wordpets/src/lib/fixtures/student.ts` — Alex's pet. Already canonical in the WordPets app data model. The comic series adopts him as the recurring cat character.
**Name unlock stage**: `digraphs-wh-er` (kid must know wh- digraph AND -er ending before the name "Whiskers" can appear in any speech bubble or caption). Until then, characters refer to him as "the cat" or "Cat".

---

## Visual canon (lock these)

- Orange tabby coat, classic mackerel stripes (vertical bands along sides, rings on tail).
- White socks on both front paws (front-only — back paws are full orange).
- Bright green eyes, slightly oversized for stylized expressiveness.
- Slightly chunky build — not skinny, not obese. He's a well-fed house cat.
- Small chip in the upper edge of his **left** ear (story origin TBD in a later issue; visible from issue 1).
- No collar in v1. (May add a small mat-colored bandana in later arcs.)
- Render in the clean WordPets pet asset style shown in
  `comics/style-references/wordpets-asset-style-target.jpeg`: rounded body,
  crisp dark outline, smooth color fills, minimal shading, friendly readable
  expression. Do not render Cat/Whiskers in watercolor, manga, or Ghibli style.

## Personality

- Quietly opinionated. Watches before he acts.
- Loves warm spots: sunny windows, mats, hats, anything Sam sits on.
- Affectionate but on his own terms. Doesn't come when called; comes when he feels like it.
- Has a single-syllable catchphrase that varies by stage:
  - `cvc-short-a` and earlier: he doesn't speak. Reactions only via art.
  - `digraphs-wh-er` (his name reveal): "I am Whiskers." or similar — keep it short.

## Recurring poses / framing

- Curled-up sleeping silhouette (used at least once per issue as the "wordless drama panel" per `break-up-monotony.md`).
- Tail-flick of mild disapproval.
- Quizzical head tilt.
- Sitting upright on something he shouldn't (hat, book, Sam's lap mid-meal).

## Reference images

Live in `refs/`. Aim for 6-10 images, hand-curated:
- 3 headshots (different expressions: curious, sleepy, mischievous)
- 3 full-body (sitting, walking, curled up)
- 1 expression sheet — 2x4 grid: happy / sad / surprised / sleepy / scared / curious / proud / confused
- 1 outfit sheet (just one variant for now: standard orange tabby; placeholder for future)

Re-roll the ref pack via Gemini 3 Pro Image iterative refinement until visual consistency is unambiguous, then commit and DON'T regenerate casually — drift here breaks every downstream issue.

Current pilot note: top-level `refs/` contains WordPets-style Cat sheets
generated from `comics/style-references/wordpets-asset-style-target.jpeg`.
Old watercolor placeholders were moved to `refs/old-style-placeholders/` and
should not be used for production generation.


ART DIRECTION:
Wordless. Wide shot. The cat is curled up asleep on the hat, on the mat, in a pool of golden late-afternoon sun. Sam is dozing nearby, head tipped to one side, eyes closed. The room is still. This is the emotional payoff panel — let it breathe.

LAYOUT:
- Frame this as one panel within a manga-style page.
- Leave blank space in the upper area for a speech bubble that will
  be typeset in post — DO NOT render speech text in the art.
- Maintain character appearance EXACTLY as in the reference images.

```


────────────────────────────────────────────────────────────────────────
## Page 6 · Panel 1
────────────────────────────────────────────────────────────────────────

**Characters:** sam, whiskers  
**Speech:** _none_  
**SFX:** none  
**Refs:** 4 ref image(s): wordpets-sam-front-threequarter-01.png, wordpets-sam-front-threequarter-02.png, wordpets-cat-expression-sheet-01.png, wordpets-cat-poses-01.png

### Full prompt

```
# Base Style Prompt — WordPets Comics

Inject this at the head of every panel prompt. Do not edit casually — style
drift across issues breaks the whole project's "consistency-breeds-trust"
guarantee. If a change is needed, update this file once and re-run all
generations against the new baseline.

---

## STYLE

Clean WordPets educational-comic asset style. Use the local reference
`comics/style-references/wordpets-asset-style-target.jpeg` as the target for
character and scene rendering: rounded, friendly, vector-like animals and
simple child-safe environments with smooth color fills, soft minimal shading,
clear dark navy outlines, bright readable shapes, and a polished literacy
program feel.

The result should feel like a printed early-reader workbook or app asset, not
like watercolor storybook art. Keep surfaces clean, colors cheerful, and visual
details simple enough for ages 6-8 to scan quickly.

Use Image 1 only for comic-page structure, not for character style:
`comics/style-references/comic-layout-direction-bonnie-chester.jpeg` shows the
useful rhythm: title/masthead, clear panel borders, simple action beats, speech
bubbles, and a compact complete story.

## LAYOUT

Early-reader comic composition with clean rectangular panels, clear gutters,
large character silhouettes, and very readable action. One full page per call;
~2-4 panels average. Composition reads left-to-right, top-to-bottom. Leave
generous white space above each speech bubble area; bubbles will be typeset in
post.

## CHARACTERS

Inject character reference images per the "characters" field of the panel
script only when they match or intentionally support the WordPets asset style.
Maintain the silhouette, palette, and proportions defined in each character's
`canon.md`. Do not invent new outfits, fur patterns, or accessories unless
explicitly requested.

## TYPOGRAPHY (in-art lettering only)

If the art MUST contain visible written text (signs, labels, title cards),
use a simple sans-serif **with a single-story `a`** (the open `a`, like
hand-printing — NOT the typographic two-story `a` with a hook). This is
non-negotiable: early readers cannot map the two-story `a` to the lowercase
`a` they're learning. If the model can't enforce single-story reliably,
prefer to OMIT in-art lettering — the typesetter will add speech bubbles in
the Andika font in post-processing.

## NEGATIVE PROMPTS

Avoid: watercolor washes, Ghibli/Miyazaki cues, manga rendering, sketchy pencil
texture, photorealistic textures, over-detailed faces, painterly lighting,
dramatic cinematic shadows, anime sparkle effects, modern logos or brand
references.

## SAFETY

All depicted humans are children, drawn in a non-photorealistic rounded
educational-comic style. No gore, no realistic violence, no scary horror
imagery. Comedy is gentle and absurd, never cruel. The audience is 6-8 year
olds.


---

PANEL CONTEXT
Issue: The Cat and the Hat (stage cvc-short-a)
Page 6, panel 1.

CHARACTERS IN THIS PANEL: sam, whiskers
=== SAM CANON ===
# Sam — Character Canon

**Type**: Kid (the protagonist)
**Origin**: New character introduced for the comic series. Phonologically chosen because "Sam" is decodable at `cvc-short-a` (s + a + m), the earliest stage in the curriculum. The wordpets app's fixture student is named "Alex" — but "Alex" requires the late `-ks` blend, so the comic uses "Sam" as the on-page name. Whether to rename the fixture student to match is an open question (see plan).
**Name unlock stage**: `cvc-short-a` (available from the very first issue).

---

## Visual canon (lock these)

- Approximately 7 years old.
- Light brown skin, dark brown short hair (slight cowlick at the crown).
- Round face, rosy cheeks. Eyes feel observant rather than wide-eyed-cute.
- Clothes: simple short-sleeved shirt + cuffed shorts. Earth-tone palette
  — sage green or muted ochre. NOT pure white, not bright primaries.
- Small, well-loved sneakers. Sometimes barefoot indoors.
- No glasses, no logos, no branded apparel.
- Render in the clean WordPets educational asset style: rounded shapes, crisp
  dark outline, smooth color fills, minimal shading, and easy-to-read
  expressions. Do not render Sam in watercolor, manga, or Ghibli style.

## Personality

- Curious and patient. Watches Cat watch the world.
- Easily delighted by small things (a hat that's too big, a sunbeam moving
  across the floor).
- Talks to Cat as if Cat understands. Cat may or may not — that's the joke.
- At early phonics stages, Sam's speech is hard-constrained by the validator,
  so his voice naturally feels deliberate, almost contemplative. Lean into
  this — don't fight the constraint, let it BE the voice.

## Catchphrase (per stage)

- `cvc-short-a`: "I have a hat." / "The cat is on the mat." — short observational statements.
- Future: longer, but always understated. Sam does not yell.

## Recurring poses

- Sitting cross-legged on a mat or floor.
- Holding something small (a hat, the cat) carefully.
- Looking sideways at Cat with a faint smile.
- Crouched, eye-level with Cat.

## Reference images

Same structure as Whiskers — `refs/` with 6-10 hand-curated images covering
headshots, full-body, expression sheet, outfit sheet. Generate via Gemini
3 Pro Image iterative refinement; commit once consistent, don't regenerate
casually.

Current pilot note: top-level `refs/` contains WordPets-style Sam sheets
generated from `comics/style-references/wordpets-asset-style-target.jpeg`.
Old watercolor placeholders were moved to `refs/old-style-placeholders/` and
should not be used for production generation.

=== WHISKERS CANON ===
# Whiskers — Character Canon

**Type**: Cat (orange tabby)
**Origin**: Pre-existing fixture pet in `wordpets/src/lib/fixtures/student.ts` — Alex's pet. Already canonical in the WordPets app data model. The comic series adopts him as the recurring cat character.
**Name unlock stage**: `digraphs-wh-er` (kid must know wh- digraph AND -er ending before the name "Whiskers" can appear in any speech bubble or caption). Until then, characters refer to him as "the cat" or "Cat".

---

## Visual canon (lock these)

- Orange tabby coat, classic mackerel stripes (vertical bands along sides, rings on tail).
- White socks on both front paws (front-only — back paws are full orange).
- Bright green eyes, slightly oversized for stylized expressiveness.
- Slightly chunky build — not skinny, not obese. He's a well-fed house cat.
- Small chip in the upper edge of his **left** ear (story origin TBD in a later issue; visible from issue 1).
- No collar in v1. (May add a small mat-colored bandana in later arcs.)
- Render in the clean WordPets pet asset style shown in
  `comics/style-references/wordpets-asset-style-target.jpeg`: rounded body,
  crisp dark outline, smooth color fills, minimal shading, friendly readable
  expression. Do not render Cat/Whiskers in watercolor, manga, or Ghibli style.

## Personality

- Quietly opinionated. Watches before he acts.
- Loves warm spots: sunny windows, mats, hats, anything Sam sits on.
- Affectionate but on his own terms. Doesn't come when called; comes when he feels like it.
- Has a single-syllable catchphrase that varies by stage:
  - `cvc-short-a` and earlier: he doesn't speak. Reactions only via art.
  - `digraphs-wh-er` (his name reveal): "I am Whiskers." or similar — keep it short.

## Recurring poses / framing

- Curled-up sleeping silhouette (used at least once per issue as the "wordless drama panel" per `break-up-monotony.md`).
- Tail-flick of mild disapproval.
- Quizzical head tilt.
- Sitting upright on something he shouldn't (hat, book, Sam's lap mid-meal).

## Reference images

Live in `refs/`. Aim for 6-10 images, hand-curated:
- 3 headshots (different expressions: curious, sleepy, mischievous)
- 3 full-body (sitting, walking, curled up)
- 1 expression sheet — 2x4 grid: happy / sad / surprised / sleepy / scared / curious / proud / confused
- 1 outfit sheet (just one variant for now: standard orange tabby; placeholder for future)

Re-roll the ref pack via Gemini 3 Pro Image iterative refinement until visual consistency is unambiguous, then commit and DON'T regenerate casually — drift here breaks every downstream issue.

Current pilot note: top-level `refs/` contains WordPets-style Cat sheets
generated from `comics/style-references/wordpets-asset-style-target.jpeg`.
Old watercolor placeholders were moved to `refs/old-style-placeholders/` and
should not be used for production generation.


ART DIRECTION:
MY WORDS preview page. NOT illustrated like the rest of the comic — this is a typeset page with a small framing illustration in the top corner (Sam and Cat sitting on the mat, simplified). Below: the My Words list rendered in Andika font in post. The art panel itself is just the corner vignette and a clean rounded WordPets-style border. The word list is added by the typesetter, not the AI.

LAYOUT:
- Frame this as one panel within a manga-style page.
- Leave blank space in the upper area for a speech bubble that will
  be typeset in post — DO NOT render speech text in the art.
- Maintain character appearance EXACTLY as in the reference images.

```
