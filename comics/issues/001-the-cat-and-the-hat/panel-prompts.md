# Panel Prompts — Issue 001: The Cat and the Hat

> **v4 — WordPets style lock.** Image 1 is the comic-page/layout direction. Image 2 is
> the target asset style: clean, rounded, WordPets-owned literacy-program visuals. The
> older watercolor pilot panels remain useful as story/layout placeholders, but they are
> no longer the target rendering style.

Save each image to `panels/` as `page-01-panel-01.png` … `page-06-panel-01.png`.
When all 11 are in, run:
```
cd ~/projects/wordpets/comics
PYTHONPATH=. .venv/bin/python scripts/typeset_pages.py issues/001-the-cat-and-the-hat --force
```

---

## HOW TO GET CONSISTENCY (read first)

1. **Use the WordPets asset style reference.** Attach
   `comics/style-references/wordpets-asset-style-target.jpeg` whenever the image tool allows a
   style reference. This is the target style for characters, props, backgrounds, and polish.
2. **Use the comic layout direction only for structure.** The reference
   `comics/style-references/comic-layout-direction-bonnie-chester.jpeg` is useful for page rhythm:
   compact title area, rectangular panels, simple action beats, speech bubbles, and a complete
   short story. Do not copy its bird/hamster character style.
3. **Treat current pilot panels as layout placeholders, not final style refs.** The older
   watercolor panels helped prove story flow and consistency, but a new generation pass should
   move toward the clean WordPets asset style.
4. **Use an anchor reference image only after it matches the new style.** Once one panel is
   regenerated successfully in the WordPets style, make it the new anchor for Sam + the room.
   For Cat-heavy panels, also attach a good new-style Cat panel.
5. **The SET BIBLE block is identical in every prompt.** Do not paraphrase it — paste it verbatim.
   Vague room words are what caused the drift.
6. **Generate in order** and feed the previous good panel back in as a second reference when a
   tool allows two refs. Consistency compounds.
7. **No generated text in art.** Speech bubbles and the My Words page are typeset later in
   Andika. Do not ask the image model for SFX, signs, labels, or speech unless Eli explicitly
   approves that exception.
8. **Cat is a character even before his name unlocks.** Use the `whiskers` character refs for
   image consistency, but readable text must still say "Cat" or "the cat" at this stage.
9. **Active character refs are WordPets-style sheets.** Old watercolor placeholders are archived
   under `characters/*/refs/old-style-placeholders/` and should not be used for production
   generation. Refine or replace the active sheets only when the new candidate is clearly better.

---

## STYLE (prepend to every prompt)

> Clean WordPets educational-comic asset style matching
> `comics/style-references/wordpets-asset-style-target.jpeg`: rounded friendly characters, smooth
> color fills, simple minimal shading, crisp dark navy outlines, bright readable shapes, polished
> early-reader literacy-program look. NOT watercolor, NOT Ghibli, NOT manga. Ages 6-8. 4:3
> landscape panel.

## SET BIBLE — "Sam's room" (paste verbatim into every prompt)

> SAME ROOM EVERY TIME: a small cozy living room with pale warm cream walls. Honey-colored wooden
> plank floor. A round woven rug in the center. Against the LEFT wall: a short green-painted wooden
> bookshelf with a small potted green plant on top. On the back wall: one simple framed picture.
> One window on the upper-right letting in warm daylight. Render the room in the same clean
> WordPets asset style as the characters: simple shapes, rounded corners, no painterly texture.
> Keep furniture placement, wall color, floor, and rug identical in every panel — only the camera
> angle and characters change.

## CHARACTERS (paste verbatim)

> **Sam** — ~7yo kid in WordPets asset style. Light brown skin, dark brown short hair with a slight
> cowlick, round face, rosy cheeks, observant friendly eyes. Sage-green short-sleeved shirt, muted
> ochre cuffed shorts, small sneakers. Simple rounded shapes, crisp dark outline, no logos, no
> glasses.
>
> **The cat (Whiskers)** — orange tabby in the same rounded WordPets pet style as Luna/Rocky in the
> asset reference. Classic mackerel stripes. WHITE socks on the FRONT paws ONLY (back paws full
> orange). Bright green slightly-oversized eyes. Medium-chunky well-fed build (NOT skinny, NOT fat
> — keep the build identical across panels). A small visible chip in the upper edge of his LEFT
> ear. No collar.

---

## Page 1 — Panel 1 → `panels/page-01-panel-01.png`  ⚓ ANCHOR — keep, don't regenerate

[STYLE] [SET BIBLE] [CHARACTERS] Wide establishing shot. Sam stands holding an enormous straw hat —
almost as wide as Sam is tall — looking down at it with mild wonder. The woven rug is in the
foreground. Soft golden afternoon light. No text in image.

## Page 1 — Panel 2 → `panels/page-01-panel-02.png`
*(attach anchor: page-01-panel-01.png)*

[STYLE] [SET BIBLE] [CHARACTERS] Same room, camera a little lower and closer. Sam crouches and sets
the enormous straw hat carefully down on the round woven rug. Hat is comically large against Sam's
small frame. Sam's expression: thoughtful, observational. No text in image.

---

## Page 2 — Panel 1 → `panels/page-02-panel-01.png`
*(attach anchor: page-01-panel-01.png)*

[STYLE] [SET BIBLE] [CHARACTERS] Side-angle view of the same room. The orange tabby cat creeps in
from the RIGHT edge, low to the ground, eyes fixed on the straw hat sitting on the rug. Sam is half
out-of-frame on the LEFT, not yet noticing. The green bookshelf with its plant is visible behind.
No text in image.

## Page 2 — Panel 2 → `panels/page-02-panel-02.png`
*(attach anchor: page-01-panel-01.png + a cat ref)*

[STYLE] [SET BIBLE] [CHARACTERS] The cat pauses one step from the straw hat, head tilted, ears
forward, tail in a slow curl, studying it. Sam watches from the background with the start of a
smile. Same room, same warm light. No text in image.

## Page 2 — Panel 3 → `panels/page-02-panel-03.png`
*(attach anchor: page-01-panel-01.png + a cat ref)*

[STYLE] [SET BIBLE] [CHARACTERS] The cat sits triumphantly on the straw hat, which has squashed flat
under his weight on the rug — brim crumpling out around him in a soft visual squish (NO text). Cat
looks supremely comfortable. Sam grins in the background. No text in image.

---

## Page 3 — Panel 1 → `panels/page-03-panel-01.png`
*(attach a cat ref)*

[STYLE] [CHARACTERS] Close-up of the orange tabby cat sitting on the squashed straw hat, eyes
half-closed, deeply pleased. White front socks visible, chipped LEFT ear visible, tail draped to one
side. Soft golden light, the cream wall and edge of the woven rug behind. No text in image.

## Page 3 — Panel 2 → `panels/page-03-panel-02.png`
*(attach anchor + cat ref)*

[STYLE] [SET BIBLE] [CHARACTERS] Sam's gentle hand reaches toward the cat on the squashed hat —
fingers slightly curled, a careful tender gesture. The cat's expression softens to an accepting
blink. Same warm room light. No text in image.

---

## Page 4 — Panel 1 → `panels/page-04-panel-01.png`
*(attach anchor + cat ref)*

[STYLE] [SET BIBLE] [CHARACTERS] Sam sits cross-legged on the wooden floor next to the round woven
rug. The cat sits beside him on the rug. The straw hat is set off to one side (no longer squashed
under the cat). Sam and the cat look at each other companionably. Green bookshelf behind. No text.

## Page 4 — Panel 2 → `panels/page-04-panel-02.png`
*(attach anchor + cat ref)*

[STYLE] [SET BIBLE] [CHARACTERS] Same room, slightly wider. The afternoon light is warmer now with
longer shadows. Sam yawns once, still seated on the floor. The cat blinks slowly beside him on the
rug. A quiet, drowsy moment. No text in image.

---

## Page 5 — Panel 1 → `panels/page-05-panel-01.png`  ⭐ HERO — most care
*(attach anchor + cat ref)*

[STYLE] [SET BIBLE] [CHARACTERS] WIDE establishing shot of the same room in late afternoon. The cat
is curled up asleep on the straw hat, on the round woven rug, in a pool of golden sunlight from the
upper-right window. Sam dozes nearby on the floor, head tipped to one side, eyes closed. The room is
completely still — long warm shadows, golden-hour light, faint dust motes in the air. The green
bookshelf, framed picture, and window are all visible and match the other panels. No text in image.

---

## Page 6 — Panel 1 → `panels/page-06-panel-01.png`  (corner vignette only — small, square)
*(attach anchor + cat ref)*

[STYLE] [CHARACTERS] Small simplified vignette for the corner of a "My Words" page. Sam and the cat
sitting together on the round woven rug, both facing forward, peaceful. Simplified style — fewer
background details than the main panels, plain warm background. Soft watercolor border. No text.
