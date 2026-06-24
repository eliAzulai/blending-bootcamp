# 00 Story Prompt - WordPets Decodable Comic

Use this prompt to write or refine the story layer before visual directions or
image generation. The output should become `01-script.md` first, then
`script.json` after approval.

## Inputs (source of truth)

Read **`00-story-brief.md`** in this issue directory before writing anything. The
brief is the locked creative seed — it defines the **Hook**, **Heart**, **Joke**,
the **beat spine**, the **word budget** (primary targets, drill words, sight
words), and the **cast**. Your job is to *render that brief into a script*, not
to invent a different story.

If `00-story-brief.md` is missing, stop and run `prompts/story-interview.md`
first — that conversation produces the brief.

## Prompt

You are writing a short WordPets decodable comic for English-speaking children
ages 6-8 who are learning to read.

Write the story script only. Do not write image-generation prompts. Do not
describe art style. Do not include final panel-rendering instructions. Focus on
story beats, speech bubbles, and reading load.

Stay faithful to the brief: the Hook is your page 1, the Heart governs the
ending, and the Joke is the visual turn the panels build toward.

## Comic Goal

Create a simple, funny, emotionally warm comic with a beginning, middle, tiny
surprise, and gentle ending. The story should be easy for a young reader to
follow from pictures, even if the speech bubbles are very short.

The story should feel like a real mini-comic, not a worksheet. Use visual comedy,
clear character intention, and a small payoff.

## Reading Constraints

The stage and full **word budget** come from `00-story-brief.md` (primary target
words, other allowed drill words, sight words, available cast).

- Use the brief's primary target words repeatedly — they are the My Words page.
- Use other allowed drill words only when they make the story clearer or warmer.
  Do not introduce a new content word just because it is allowed.
- A character whose name isn't decodable at this stage appears by description
  only (at `cvc-short-a` the recurring cat is `cat` / `the cat`, never
  `Whiskers`). The brief states which names are gated.
- Speech bubbles must be extremely short and must pass the mechanical validator:
  `scripts/validate_script.py`.

## Format Constraints

- 10-20 comic frames total.
- 5-7 pages.
- 1-3 panels per page.
- Most panels should be wordless or have one short speech bubble.
- No captions unless absolutely necessary.
- No SFX for this pilot.
- End with a `My Words` page listing the target words.

## Story Constraints

Characters, props, desires, and the visual turn all come from
`00-story-brief.md`. Honor them:

- Use props **physically**, not just by mention — the reader should see them act
  in the panels (a prop placed, claimed, transformed).
- Each main character carries the tiny desire named in the brief's **Heart**.
- The story **turn is visual** — it is the brief's **Joke**, the picture the
  panels build toward, not a line of dialogue.

## Desired Story Shape

Follow the **beat spine** in `00-story-brief.md`, expanding each beat into one or
more panels. End with the My Words review page.

The story should not teach a moral. It should simply show the protagonist
responding kindly to a small surprise (the brief's Heart).

## Tone

- playful
- gentle
- clear
- slightly funny
- emotionally safe
- not frantic
- not sarcastic

The humor should come from the brief's **Joke** — the visual payoff — not from
dialogue or narration.

Avoid:

- fake conflict
- scolding
- danger
- slapstick injury
- long dialogue
- explaining the joke in text
- worksheet phrasing such as "Can you read the word?"
- adding new props to make the plot work

## Output Format

Return the script in this Markdown structure:

```markdown
# 01 Script - <Title>

## Issue Metadata

- Stage:
- Title:
- Frame count:
- Target words:
- Sight words:

## Page 1

### Panel 1

Story beat:

Speech:

- Speaker: "Text."
```

For wordless panels, write:

```markdown
Speech: none.
```

For the final review page, write:

```markdown
## Page N

### Panel 1 - My Words

Story beat:

Words:

- word
- word
```

## Quality Bar

Before finalizing, check:

- Does every speech bubble obey the reading constraints?
- Does every speech bubble earn its place?
- Is the story understandable without captions?
- Is there a small visual joke or surprise?
- Does the ending feel warm?
- Are there enough panels for action to breathe?
- Are there any unnecessary words that can be removed?
- Is this a comic script, not an image prompt?

Then include a short self-audit:

```markdown
## Self-Audit

- Decodability risk:
- Strongest story beat:
- Weakest story beat:
- Any words to verify in the validator:
```

## Current Pilot Example

This is the current approved story shape for the pilot. Use it as a calibration
example for brevity and tone, not as the only possible story.

```markdown
# 01 Script - The Cat and the Hat

## Issue Metadata

- Stage: cvc-short-a
- Title: The Cat and the Hat
- Frame count: 11 panels across 6 pages
- Target words: Sam, cat, hat, mat
- Sight words: the, a, is, I

## Page 1

### Panel 1

Story beat: Sam finds an oversized straw hat.

Speech:

- Sam: "I have a hat."

### Panel 2

Story beat: Sam puts the hat on the mat.

Speech:

- Sam: "The hat is on the mat."

## Page 2

### Panel 1

Story beat: The cat creeps in and notices the hat.

Speech: none.

### Panel 2

Story beat: The cat studies the hat while Sam notices him.

Speech: none.

### Panel 3

Story beat: The cat sits on the hat and squashes it.

Speech:

- Sam: "The cat is on the hat!"

## Page 3

### Panel 1

Story beat: The cat sits happily on the squashed hat.

Speech: none.

### Panel 2

Story beat: Sam gently pets the cat.

Speech:

- Sam: "I see the cat."

## Page 4

### Panel 1

Story beat: Sam sits on the mat with the cat nearby.

Speech:

- Sam: "Sam is on the mat."

### Panel 2

Story beat: Sam yawns. The cat blinks sleepily.

Speech: none.

## Page 5

### Panel 1

Story beat: The cat sleeps on the hat. Sam dozes nearby.

Speech: none.

## Page 6

### Panel 1 - My Words

Story beat: Review page.

Words:

- Sam
- cat
- hat
- mat
```
