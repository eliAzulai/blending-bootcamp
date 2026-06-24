# 02 Visual Directions and Constraints

Use this file after the script is approved and before generating or re-rolling
images. It is the lock for style, cast, set, prop, and layout constraints.

## Reference Roles

- `comics/style-references/wordpets-asset-style-target.jpeg` is the style target.
  Use it for the owned WordPets look: clean literacy-program assets, rounded
  characters, simple fills, crisp outlines, friendly proportions, and polished
  early-reader clarity.
- `comics/style-references/comic-layout-direction-bonnie-chester.jpeg` is a page
  rhythm reference only. Use it for compact comic pacing, rectangular panels,
  gutters, speech-bubble readability, and simple action beats. Do not copy its
  character designs.

## Series Style Lock

Clean WordPets educational-comic asset style matching
`comics/style-references/wordpets-asset-style-target.jpeg`: rounded friendly
characters, smooth color fills, simple minimal shading, crisp dark navy outlines,
bright readable shapes, polished early-reader literacy-program look. Ages 6-8.

Avoid:

- watercolor texture
- Ghibli, manga, painterly, or storybook wash styles
- generated text inside the art
- complex backgrounds that compete with the speech bubbles
- camera angles that make the set impossible to recognize

## Sam

- About 7 years old.
- Light brown skin.
- Dark brown short hair with a slight cowlick.
- Round face, rosy cheeks, observant friendly eyes.
- Sage-green short-sleeved shirt.
- Muted ochre cuffed shorts.
- Small sneakers.
- No glasses, logos, or branded apparel.

## Cat

The cat is visually the recurring Whiskers character, but text calls him `cat`
until his name is decodable.

- Orange tabby.
- Classic mackerel stripes.
- White socks on the front paws only.
- Back paws full orange.
- Bright green slightly oversized eyes.
- Medium-chunky well-fed build.
- Small visible chip in the upper edge of his left ear.
- No collar.

## Sam's Room Set Bible

Keep this set stable across panels:

- small cozy living room
- pale warm cream walls
- honey-colored wooden plank floor
- round woven rug in the center
- short green-painted wooden bookshelf against the left wall
- small potted green plant on the bookshelf
- one simple framed picture on the back wall
- one upper-right window with warm afternoon light

Only these may change:

- camera angle
- character positions
- hat position
- time-of-day warmth
- expression and pose

## Hat Prop Lock

The hat is a central story prop and must stay recognizable.

- oversized tan woven straw sun hat
- very wide brim
- structured crown
- almost as wide as Sam is tall in early panels
- can squash under the cat but must remain visibly straw

Avoid:

- baseball cap
- cloth hat
- blanket
- basket
- pillow
- generic yellow blob

## Panel Layout Constraints

- Standard panels are 4:3 landscape.
- Art must leave natural low-detail space near the top for post-typeset bubbles.
- Do not draw panel borders, gutters, empty speech bubbles, captions, or text in
  the generated panel art.
- Speech bubbles are added later by `typeset_pages.py`.
- My Words page uses a small vignette only; word list is typeset in post.

## Consistency Constraints

- Use active character refs from `characters/sam/refs/` and
  `characters/whiskers/refs/`.
- Do not use old watercolor refs from `old-style-placeholders/` for production
  image generation.
- Generate or re-roll surgically; do not regenerate the full issue because one
  panel drifts.
- Once a better WordPets-style anchor panel is approved, use it as the room and
  Sam consistency anchor for later panels.

