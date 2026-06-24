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
