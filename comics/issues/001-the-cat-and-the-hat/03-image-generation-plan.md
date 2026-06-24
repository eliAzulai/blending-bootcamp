# 03 Image Generation Plan

Use this only after `01-script.md` and `02-visual-directions-and-constraints.md`
are accepted. This file turns the approved script into image-generation tasks.

## Generation Order

1. Generate or approve a page 1 panel 1 anchor in the target WordPets style.
2. Generate page 1 panel 2 using the page 1 panel 1 anchor.
3. Generate page 2 panels in order, attaching the anchor plus cat refs where
   possible.
4. Generate page 3 cat and petting panels.
5. Generate page 4 calm companion panels.
6. Generate page 5 as the hero payoff panel.
7. Generate page 6 as a small My Words vignette only.
8. Typeset all pages.
9. Validate script, inspect pages, and rebuild the review PDF.

## Shared Prompt Prefix

Use the series style lock, Sam description, cat description, Sam's room set
bible, hat prop lock, and panel-layout constraints from
`02-visual-directions-and-constraints.md`.

Do not ask the image model to render speech bubbles, captions, page titles, SFX,
labels, signs, or word lists.

## Panel Image Tasks

### Page 1 Panel 1 - Anchor

Wide establishing shot. Sam stands in the sunny cozy room holding the oversized
tan woven straw sun hat. The hat is almost as wide as Sam is tall. Wooden floor,
round woven rug in the foreground, warm afternoon light. Sam looks at the hat
with mild wonder.

### Page 1 Panel 2

Closer shot. Sam crouches and sets the oversized tan woven straw sun hat
carefully down on the woven rug. The hat looks comically large up close. Sam is
thoughtful and observant.

### Page 2 Panel 1

Side angle. The orange tabby cat creeps into frame from the right edge, low to
the ground, eyes fixed on the oversized straw hat. Sam is half out of frame on
the left, not yet noticing.

### Page 2 Panel 2

The cat pauses one step from the hat, head tilted, ears forward, tail in a slow
curl. Sam watches from the background with the start of a smile.

### Page 2 Panel 3

The cat steps onto the oversized straw hat and sits. The hat squashes flat under
him with a clear visual crumple: bent brim, flattened crown, still visibly straw.
Cat is very comfortable. Sam grins.

### Page 3 Panel 1

Close-up of the cat sitting on the squashed oversized straw hat, eyes
half-closed, deeply pleased. Tail draped to one side. Chipped left ear and white
front socks visible.

### Page 3 Panel 2

Sam gently pets the cat while the cat remains seated on the squashed straw hat.
Sam's hand is gentle, fingers slightly curled. Cat has a soft accepting blink.
Leave clean space near the upper right for the bubble.

### Page 4 Panel 1

Sam sits cross-legged on the wooden floor next to the mat. The cat sits beside
him on the mat. The hat is set aside nearby, no longer under the cat. Sam and the
cat look at each other companionably. Leave clean space near the upper right for
the bubble.

### Page 4 Panel 2

Slightly wider shot. The afternoon light is warmer with longer shadows. Sam
yawns once. Cat blinks slowly beside him on the woven mat. The oversized straw
hat is set aside nearby.

### Page 5 Panel 1 - Hero

Wide quiet payoff shot. The cat is curled up asleep on the oversized straw hat on
the mat in a pool of golden late-afternoon sun. Sam dozes nearby, head tipped to
one side, eyes closed. The room is still and warm.

### Page 6 Panel 1 - My Words Vignette

Small simplified vignette for the corner of the My Words page. Sam and the cat
sit together on the round woven rug, both facing forward, peaceful. Plain warm
background, fewer details than the main panels. No text.

## Commands

Validate script:

```bash
cd /Users/eliHome/projects/wordpets/comics
PYTHONPATH=. .venv/bin/python scripts/validate_script.py issues/001-the-cat-and-the-hat/script.json
```

Generate or re-roll panels with Gemini:

```bash
cd /Users/eliHome/projects/wordpets/comics
PYTHONPATH=. .venv/bin/python scripts/generate_panels.py issues/001-the-cat-and-the-hat --panel P:N --provider gemini --style-ref style-references/wordpets-asset-style-target.jpeg
```

Typeset pages:

```bash
cd /Users/eliHome/projects/wordpets/comics
PYTHONPATH=. .venv/bin/python scripts/typeset_pages.py issues/001-the-cat-and-the-hat --force
```

Run tests:

```bash
cd /Users/eliHome/projects/wordpets/comics
PYTHONPATH=. .venv/bin/pytest -q
```

