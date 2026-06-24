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
