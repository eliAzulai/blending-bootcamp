# The Cat and the Hat - Pilot Production Brief

## Purpose

This issue is the canonical WordPets comics pilot. Refine this issue first; extract reusable workflow only after this pilot is coherent enough to serve as the template for future issues.

The pilot exists to prove the hardest series constraints at once:

- early-stage decodable speech
- a recurring Sam + Cat cast
- tight visual consistency across 10-20 frames
- simple visual comedy that does not depend on extra vocabulary
- a final My Words preview page
- reviewable output outside the app runtime

## Current Artifact

- Issue directory: `comics/issues/001-the-cat-and-the-hat/`
- Stage: `cvc-short-a`
- Current frame count: 11 panels across 6 pages
- My Words: `Sam`, `cat`, `hat`, `mat`
- Meta prompt (generates interview/render prompts): `comics/prompts/meta-story-prompt.md`
- Story interview (reusable, upstream): `comics/prompts/story-interview.md`
- Story brief (locked Hook/Heart/Joke seed): `00-story-brief.md`
- Story prompt (renders the brief): `00-story-prompt.md`
- Script-first file: `01-script.md`
- Visual direction and constraints: `02-visual-directions-and-constraints.md`
- Image-generation plan: `03-image-generation-plan.md`
- Rendered review output: `pages/page-01.png` through `pages/page-06.png`
- Existing PDF: `the-cat-and-the-hat.pdf`
- Manual consistency guide: `panel-prompts.md`
- Gateable script: `script.json`
- Active WordPets-style ref packs: `characters/sam/refs/` and `characters/whiskers/refs/`
- Archived old-style placeholders: `characters/*/refs/old-style-placeholders/`
- Style references: `comics/style-references/wordpets-asset-style-target.jpeg` and `comics/style-references/comic-layout-direction-bonnie-chester.jpeg`

## Format

- 10-20 comic frames total.
- Speech bubbles use only validator-approved decodable text.
- Art contains no speech text; bubbles are typeset in post.
- Sam is the recurring child protagonist.
- Cat is visually Whiskers, but the name "Whiskers" stays locked until the phonics stage allows it. At this stage, use "Cat", "the cat", or no name.
- Each issue uses one locked set.
- Each issue ends with one My Words preview page.

## Visual Direction

Use two different references for two different jobs:

- `comics/style-references/wordpets-asset-style-target.jpeg` is the asset style target. It is the WordPets-owned direction: clean, rounded, polished literacy-program visuals with simple color fills, crisp dark outlines, friendly animal proportions, and easy-to-scan backgrounds.
- `comics/style-references/comic-layout-direction-bonnie-chester.jpeg` is a comic structure reference only. Use it for page rhythm: compact title, rectangular panels, clear gutters, speech bubbles, simple action beats, and a complete short story. Do not copy its character designs.

The older watercolor pilot panels are now story/layout placeholders. They prove the sequence, but they are not the target style for production assets.

## Locked Pilot Set

Sam's room must remain stable across panels:

- pale warm cream walls
- honey-colored wooden plank floor
- round woven rug in the center
- short green-painted bookshelf against the left wall
- small potted green plant on the bookshelf
- one simple framed picture on the back wall
- one upper-right window with warm afternoon light

Only the camera angle, character positions, prop positions, and time-of-day light may change.

## Locked Character Identity

Sam:

- approximately 7 years old
- light brown skin
- dark brown short hair with slight cowlick
- round face, rosy cheeks, observant eyes
- sage-green shirt, muted ochre cuffed shorts, small sneakers
- no glasses, logos, or branded apparel

Cat:

- orange tabby with classic mackerel stripes
- white socks on the front paws only
- back paws full orange
- bright green slightly oversized eyes
- medium-chunky well-fed build
- small chip in the upper edge of his left ear
- no collar

## Consistency Workflow

Work in this order:

1. Refine `01-script.md` until the story, speech, and reading load are right.
   To build a story from scratch, run `comics/prompts/story-interview.md` as a
   conversation first — it produces `00-story-brief.md` (the locked
   Hook/Heart/Joke seed). Then use `00-story-prompt.md`, which renders that brief
   into the script.
2. Refine `02-visual-directions-and-constraints.md` until style, characters,
   set, prop, layout, and consistency rules are locked.
3. Only then move to `03-image-generation-plan.md`, generated panels, typeset
   pages, and review PDF output.

The current pilot has rendered old-style panels plus new WordPets-style `characters/<name>/refs/` packs generated from `wordpets-asset-style-target.jpeg`. The old watercolor placeholders are archived under `refs/old-style-placeholders/` so generation does not condition on the wrong look. Treat `panel-prompts.md` as the live manual workflow for now:

1. Attach `wordpets-asset-style-target.jpeg` as the style reference when the image tool supports it.
2. Use the old `page-01-panel-01.png` only as a temporary layout/room anchor until a new WordPets-style anchor panel exists.
3. Use the active Sam/Cat ref sheets for character identity, but replace or refine them if a better sheet is approved.
4. Keep the SET BIBLE block verbatim in manual prompts.
5. Generate or re-roll panels surgically; do not regenerate the full issue because one panel drifts.
6. Record any new locked prompt rule in `panel-prompts.md` before extracting it into a reusable skill.

Once the pilot is visually approved, the reusable skill should teach agents to follow this workflow before starting new issues.

## Pilot Success Criteria

- `script.json` passes `scripts/validate_script.py`.
- Every panel either uses a locked reference image pack or documents its manual anchor-reference workflow.
- New generated panels match the WordPets asset style reference, not the older watercolor placeholder style.
- Sam remains the same child across panels.
- Cat remains the same orange tabby across panels.
- Sam's room remains the same set across panels.
- No generated in-art speech text appears in panels.
- SFX is absent unless it is decodable, visually necessary, and deliberately approved.
- The final pages are reviewable without running the Next.js app.
- The issue can serve as the template for issue 002 without copying accidental one-off details.

## Refinement Policy

Do not start a new pilot while this one can still answer the series-format question. Prefer surgical edits:

- Edit `script.json` for story, speech, panel count, bubble text, and bubble anchors.
- Edit `panel-prompts.md` when manual image-generation instructions need to become clearer.
- Edit `characters/*/canon.md` only when a character identity decision changes.
- Edit `prompts/base-style.md` only when the entire series style changes.
- Re-render only pages or panels affected by the change.

## Ready For Skill Extraction

Extract or update the reusable WordPets comics skill only after this brief answers the current production question. The skill should point agents back to this pilot brief rather than duplicating the whole pilot in the skill body.
