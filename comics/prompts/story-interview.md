# Story Interview — WordPets Decodable Comic

A guide for **discovering** a story, not a brief for rendering one.

You (the agent) run this as a **conversation** with the author. You ask
questions one at a time and refuse to move on until each part is sharp. You
leave with three things defined well enough to write a script: a **Hook**, a
**Heart**, and a **Joke**.

This sits **upstream** of `00-story-prompt.md`. Its output is a per-issue
`00-story-brief.md`. The story prompt then *consumes* that brief — it does not
re-invent the story.

```
story-interview.md   (this file — a conversation that produces the seed)
  → 00-story-brief.md     (the locked Hook / Heart / Joke + beat spine)
  → 00-story-prompt.md    (renders the brief into a script)
  → 01-script.md → validate_script.py → ...
```

Repo context (cast, set, style, success criteria) lives in the issue's
`production-brief.md`. **Read it; do not duplicate it here.**

---

## The one rule

**Your job is to pull the idea out of the author, not to hand them a plot.**

You apply pressure. They supply invention. The most common failure is you
"helpfully" suggesting a complete story — that produces a competent, forgettable
comic. A 6-year-old does not laugh at competent. They laugh at *specific*.

So: ask, push back, raise the bar, and make the author reach for the second or
third idea. The first idea is almost always the one the word list hands everyone
for free.

---

## How to run the interview

1. **Gather the inputs** (below) before asking anything.
2. **One question at a time.** Wait for the answer. Never batch.
3. **Walk the three gates in order:** Hook → Heart → Joke.
4. **Do not pass a gate until its gate test passes.** If the answer is bland,
   stay on the gate and apply *constraint as fuel*.
5. **Reject the first obvious answer to the Joke gate.** Always run the twist
   test before accepting it.
6. When all three gates pass, **write `00-story-brief.md`** from the template at
   the bottom, read it back to the author in one short paragraph, and stop.

You are done when the author can picture the comic — and it is *not* the version
they'd have guessed at the start.

---

## Inputs — gather these first

- **Stage id** (e.g. `cvc-short-a`).
- **The word budget for that stage.** Source of truth is `lib/decodability.py`:
  - *Primary target words* — the 3-4 content words this issue teaches. These go
    on the **My Words** page and should recur. Confirm them with the author.
  - *Other allowed drill words* — same stage, usable only when they make the
    story clearer or warmer.
  - *Sight words* — the pragmatic K-1 list, available in any issue.
- **Available cast** — `CHARACTER_NAMES` gated at or before this stage. A
  character whose name isn't decodable yet appears by description only (at
  `cvc-short-a`, Whiskers is "Cat" / "the cat", never "Whiskers").

State the word budget back to the author in one block before you start. The
budget is not a constraint to apologize for — it is the engine you will use.

---

## The creativity engine: constraint as fuel

When an answer comes back flat, **do not** offer a menu of plot ideas. Turn the
word list itself into the prompt:

> "You have only `<primary words>` (plus `<drill words>` if they earn it). What
> is the funniest or strangest thing that can happen using *only* these? Give me
> one. Now give me a second one that's weirder."

The limited vocabulary is the comedy generator, not the obstacle. The fewer the
words, the more the *situation* has to carry the joke — which is exactly where
invention lives. A comic that needs a new content word to be funny isn't funny
yet; it's under-imagined. Push back into the existing words.

If the author is stuck, narrow further, don't widen: "Forget every word but two.
`cat` and `hat`. What is the most absurd relationship between a cat and a hat?"

---

## The three gates

### Gate 1 — HOOK · *why a kid leans in on page 1*

The hook is the **situation already loaded with curiosity or tension before any
words**. A young reader follows pictures first; page 1 has to make them wonder
what happens next without a caption explaining it.

Ask:
- "In a single picture, before anyone speaks — what makes a kid want to turn the
  page?"
- "What's *off*, surprising, or too-much about the opening? A normal cat in a
  normal room is not a hook."

**Gate test (all must be true to advance):**
- It's a *picture*, not a statement. ("Sam has a hat" fails; *a hat so big Sam
  can barely hold it* passes.)
- A 6-year-old would have a question in their head after seeing it.
- It uses the word budget — the hook is buildable from the allowed words.

If it fails → constraint as fuel.

### Gate 2 — HEART · *the small true feeling that makes it warm and safe*

Every WordPets story has one tiny real emotion. Someone *wants* something small;
the ending honors that want kindly. No moral, no lesson, no scolding — just a
feeling a child recognizes.

Ask:
- "What does the main character *want* — something small and concrete?"
- "When the surprise lands, what do they *feel*? And does the ending treat that
  feeling gently?"

**Gate test:**
- There is a named, small desire (not "to be happy" — too vague; "to keep the
  hat for himself" passes).
- The ending is kind and emotionally safe. No fake conflict, no danger, no
  punishment, no explaining the feeling in text.
- The heart is *shown* through action/picture, not narrated.

### Gate 3 — JOKE · *the specific visual payoff a kid won't see coming*

The joke is one **visual** turn that flips the meaning of the hook. It should be
fundamentally a *picture* a child reads, not a line of dialogue.

Ask:
- "What's the funny picture the whole comic is building toward?"
- Then **reject the first answer** and run the twist test (below).

**Gate test:**
- The payoff is visual — it works with the sound off.
- It *re-uses* the hook's elements in a new way (the hat from gate 1 becomes
  something else), rather than introducing a new prop.
- It survives the twist test.
- It's buildable from the word budget — the speech (if any) is decodable.

---

## The twist test (run before accepting any Joke)

Before you accept the Joke, ask the author:

> "That's the version a kid *would* expect. What would they NOT expect next?"

Take the obvious payoff and push one step past it. The obvious payoff is the
literal one the words suggest. The good one is the literal one plus a small,
surprising consequence or attitude.

- Obvious: *the cat sits on the hat.*
- Twisted: *the cat decides the squashed hat is the greatest bed ever built and
  refuses to be moved — the hat finally has an owner, just not the one anyone
  expected.*

Same words. One is an event; the other is a joke. Do not accept the event.

---

## Good vs bland — calibration (built from the pilot's own word set)

Use these to set the bar out loud with the author. Same words, sharper choice.

| Part  | Bland (reject)            | Sharp (the bar)                                                                 |
|-------|---------------------------|---------------------------------------------------------------------------------|
| Hook  | "Sam has a hat."          | A hat so big Sam can barely hold it — *nobody* could actually wear this thing.   |
| Heart | "Sam likes his cat."      | Sam wanted the hat to be *his* — and gives it up gladly the moment it makes the cat happy. |
| Joke  | "The cat sits on the hat."| The cat claims the squashed hat as the world's best bed and won't budge; the hat finally has an owner. |

The bland column isn't *wrong* — it's just the first thing the words hand you.
The interview exists to get to the right column.

---

## Exit check

Do not write the brief until **all** are true:

- [ ] Hook is a picture that loads a question, built from the word budget.
- [ ] Heart is one small concrete want with a kind ending, shown not told.
- [ ] Joke is visual, re-uses the hook, and passed the twist test.
- [ ] None of the three needs a content word outside the budget to work.
- [ ] The author can describe the comic — and it isn't the obvious version.

---

## Output — write `00-story-brief.md`

Write to `issues/<NNN>-<slug>/00-story-brief.md` using this structure, then read
the one-paragraph synopsis back to the author and stop. The script step
(`00-story-prompt.md`) takes over from here.

```markdown
# 00 Story Brief — <Working Title>

## Issue
- Stage: <stage-id>
- Slug: <slug>
- Working title: <title>

## Word budget
- Primary target words (My Words): <word, word, word>
- Other allowed drill words: <word, word> (use only if they earn it)
- Sight words available: <short list>
- Cast available at this stage: <Sam; the cat (Whiskers, name gated); ...>

## The three parts
- **Hook:** <one sentence — the loaded opening picture>
- **Heart:** <one sentence — the small want + the kind ending>
- **Joke:** <one sentence — the visual payoff that flips the hook>
  - Twist (why a kid won't expect it): <one sentence>

## Beat spine (6-9 beats)
1. <beat>
2. <beat>
...

## Why this isn't the obvious version
<2-3 sentences naming the bland version we rejected and what we did instead.>

## Risks / words to verify in the validator
- <any word you're unsure passes `scripts/validate_script.py` at this stage>
```

---

## Swapping the lens (future)

This interview uses the **Hook / Heart / Joke** lens. The gate structure is
designed so other lenses can slot in as sibling gate-sets, selected by one line
at the top:

- **Setup / Turn / Payoff** — the dramatic spine (ordinary → surprise → warm
  resolution).
- **Character / Want / Obstacle** — the story engine (who → tiny desire → the
  thing, often the pet, that complicates it).

Ship Hook/Heart/Joke first. Add another lens only after it earns its place
against a real issue. When extracting this into a reusable skill, point the
skill back at the pilot's `production-brief.md` rather than copying repo context.
