# WordPets Active Learning Loop + Reward World Design

**Date:** 2026-05-12
**Status:** Approved philosophy, ready for implementation planning after review
**Project:** `/Users/eliHome/projects/wordpets`
**Related spec:** `docs/superpowers/specs/2026-04-14-wordpets-companion-app-design.md`

---

## Product Thesis

WordPets is not just a homework companion and not a standalone mini-game app.
It is an active learning system for children who should not spend most of a
lesson waiting while one child reads, one child answers, and everyone else
drifts.

The core promise is:

> A teacher-guided literacy experience where every child is constantly doing,
> choosing, reading, sorting, dragging, saying, tracing, laughing, unlocking, or
> showing something.

The app should make live teaching and home practice more efficient by replacing
passive learning time with short, active learning loops. The teacher becomes
more powerful, not less important: she launches missions, watches the signal,
and intervenes where human teaching matters.

---

## The Old Model We Are Replacing

The old classroom and Zoom pattern is too passive:

1. Teacher opens a textbook or worksheet.
2. One child reads a sentence.
3. Other children wait.
4. Teacher asks a question.
5. One child answers.
6. Everyone else listens, distracts themselves, or disappears mentally.

This model is inefficient in person and worse on Zoom. Children are asked to pay
attention while not actually doing much. Homework often repeats the same problem:
static pages, low feedback, little delight, and no reason to come back tomorrow.

WordPets should be built against that failure mode.

---

## The New Model

WordPets turns literacy practice into repeated active loops:

```text
Teacher or app launches a short mission
-> child performs a focused learning action
-> app gives immediate feedback
-> child earns energy, stickers, coins, objects, or story progress
-> reward world reacts
-> teacher sees practice signal and struggle patterns
-> next mission adapts or reviews
```

The child should rarely be in a passive state. The expected rhythm is a new
interaction every few seconds and a complete micro-loop every 2 to 5 minutes.

---

## Product Layers

### 1. Teacher-Guided Learning Engine

This remains the core of WordPets.

The teacher assigns focus areas, launches practice, or reviews progress. The app
turns those goals into active child work: phonics, spelling, read-aloud, pattern
practice, and decodable content.

The teacher should not have to manually manage every second of practice. She
should use the app to see who is stuck, who is avoiding, who is guessing, and
which patterns need human follow-up.

### 2. Mini Learning Loops

These are the actual teaching activities. They must be pedagogically sound first
and game-like second.

Examples:

- Build the word from sound tiles.
- Drag the right grapheme into a word.
- Sort words by pattern.
- Tap phonemes and blend them.
- Trace a letter or word with a finger.
- Read a silly decodable sentence.
- Match a sentence to a picture.
- Find a pattern in a scene.
- Spell a word to unlock an object.

Each loop should produce observable evidence: accuracy, hint use, time, retries,
skips, rereads, or completion.

### 3. Reward World

The reward world is the retention engine. It makes children want to return and
gives emotional meaning to practice.

Examples:

- Pet energy.
- Stickers.
- Room objects.
- Food and care items.
- Small pet animations.
- Short songs or chants.
- Jokes.
- Silly decodable micro-stories.
- Comics.
- Pixel coloring.
- Pattern Hunt.
- Dr. Panda-style pretend-play moments.

Reward modules should support the learning loop, not compete with it. They are
earned through practice and should often reuse the same letters, words, sounds,
characters, and story world the child is learning.

### 4. Content Testing Ground

WordPets should become the lab for discovering what actually teaches.

The early test users are Eli's children and Ilana's students. We should use them
to learn:

- Which activities create real attention.
- Which rewards make children return.
- Which stories and jokes make children read willingly.
- Which mechanics produce skill gain instead of only tapping.
- Which loops feel babyish to older children.
- Which teacher signals are useful in real instruction.

The product should stay humble here. The goal is not to guess the perfect system
up front. The goal is to test many small loops and keep the ones children choose
and teachers trust.

---

## Standalone Decision

WordPets should not become a standalone pixel-coloring or sound-hunt app in
Phase 1.

Pixel Coloring, Pattern Hunt, songs, jokes, stories, stickers, and pet-world play
are supporting modules inside WordPets. They may feel like complete games to a
child, but strategically they are part of the WordPets learning-and-reward
system.

Future standalone paths are possible only after validation:

- A public parent app if kids return voluntarily and parents trust the learning.
- A teacher platform if Ilana's workflow proves repeatable for other teachers.
- A family play app if the reward world becomes unusually sticky on its own.

Until then, WordPets is the core product and the testing ground.

---

## Relationship To The Existing Companion App Spec

The 2026-04-14 companion-app spec remains the practical Phase 1a implementation
anchor. This document upgrades the product philosophy and gives stronger
direction for engagement, content testing, and future scope.

The existing Phase 1a shape should remain small:

- Teacher dashboard.
- Student onboarding.
- Phonics.
- Spelling.
- Read Aloud.
- Thin pet system.
- Practice tracking.
- Manual starter content.

The change is not "build a huge game world now." The change is how we design
each piece:

- Activities must be short, active, and feedback-rich.
- Pet rewards must feel immediate and emotionally alive.
- Content should be tested as loops, not static assignments.
- Teacher visibility should focus on useful intervention signals.
- Passive waiting should be treated as a product smell.

---

## Phase 1a Scope Adjustment

Phase 1a should be framed as:

> Can WordPets make 6-8 year-old students practice literacy more consistently by
> combining teacher-guided assignments, active learning loops, and a thin but
> emotionally satisfying pet reward?

### Keep In Phase 1a

- Three learning activities: Phonics, Spelling, Read Aloud.
- One daily practice flow lasting about 7 to 10 minutes.
- Pet reactions, mood, feeding, and simple celebration.
- Coins or energy earned from practice.
- Teacher dashboard showing practice consistency and struggle signals.
- Manual content library grounded in Ilana's teaching principles.
- Local family playtesting of extra reward concepts outside the core build.

### Add As Design Pressure, Not Big Scope

- Every activity should have clear active steps.
- Each session should include at least one immediate reward moment.
- The pet should react during learning, not only after learning.
- Read Aloud should use short, decodable, funny text where possible.
- Spelling and phonics should avoid worksheet feeling.
- Teacher signals should answer: who practiced, who got stuck, and on what.

### Defer Until Phase 1b Or Play Lab Validation

- Full pet room.
- Outfits and inventory.
- Pixel-coloring engine.
- Pattern Hunt scenes.
- Song library.
- Joke/comic library inside the app.
- AI-generated content.
- Parent summaries.
- Public app distribution.
- Ages 9-12 visual mode.

---

## WordPets Play Lab

The family experiments should be treated as a separate validation lane, not as
the production scope.

Play Lab candidates:

- Pixel Coloring with letter/sound palettes.
- Pattern Hunt instead of basic initial-sound hunting.
- Segmenting Mission.
- Pet kitchen.
- Pet room decoration.
- Sticker book.
- Silly decodable joke cards.
- Micro songs and chants.
- Story/comic rewards.

Each candidate should be tested with children before being promoted into the
main app. A module earns promotion only if it supports at least one of these:

- More voluntary return behavior.
- More successful repetitions of a target skill.
- Better teacher insight.
- Lower frustration.
- Stronger child pride or show-and-tell value.

---

## Teaching Principles

The product should follow these local WordPets principles:

### Steal The Wrapper, Not The Teaching

Game design should motivate practice, but it must not weaken instruction. If a
reward mechanic causes rushing, guessing, or shallow tapping, the mechanic loses.

### Break Up Monotony

Repetition is necessary, but it should be broken into short varied loops. Pet
interactions, jokes, tracing, tiny scenes, and visual puzzles act as palate
cleansers between practice rounds.

### Systematic Review

Every new sound or pattern should review prior material. Review should feel like
part of the mission, not a separate quiz.

### Decodable Preview

Before children read, show target words and patterns. Let them tap, hear, and
notice what is coming so the reading task feels possible.

### Movement And Multisensory Cues

Use sound, visual cues, gestures, tracing, and character animations to help
children remember. The app cannot fully replace a teacher's body cues, but it can
make the cue visible and repeatable.

---

## Metrics

The existing Phase 1a success metric remains:

> After 4 weeks, at least 60% of Ilana's students complete practice 4+ days per
> week.

Additional learning-loop metrics:

- Daily session completion.
- Return within 48 hours.
- Activity abandonment.
- Hint use.
- Repeated mistakes by sound, word, or pattern.
- Time on task.
- Voluntary replay.
- Child asks for another activity.
- Teacher says the data changed what she did next.

Reward-world metrics:

- Child spends earned reward without being prompted.
- Child talks about pet, stickers, story, joke, or object later.
- Child asks to unlock something specific.
- Reward interaction does not prevent returning to practice.

---

## Key Risks And Holes To Watch

### 1. Engagement Can Hide Weak Learning

A child may love the game but learn little. Every learning loop needs an
instructional signal, not only completion.

### 2. Rewards Can Overpower Practice

If children rush through practice only to reach the reward world, the loop is
misbalanced. Rewards should reinforce the skill, not distract from it.

### 3. Teacher Workflow Can Become Heavy

If Ilana must constantly prepare content or interpret noisy data, the system
fails. Phase 1 must stay guided-autopilot.

### 4. Content Can Become The Bottleneck

The hard part may be making enough good decodable, funny, skill-aligned content.
The system should prioritize reusable formats and small content packs.

### 5. Live Class And Home Practice May Need Different Rhythms

A loop that works alone at home may not work in a group Zoom class. We should
test both, but not assume they are identical.

### 6. Older Children May Reject The Tone

The pet/reward world may work for ages 6-8 and feel babyish for 10-11. Do not
let older-child preferences distort Phase 1a, but use them to detect future
visual-mode needs.

---

## First Execution Recommendation

Do not build the whole reward world first.

Build the smallest version of the active loop philosophy inside the current
Phase 1a companion app:

1. Make the existing Phonics flow feel like a short mission.
2. Add clear coins or energy earned from completion.
3. Make the pet react before, during, and after practice.
4. Make Spelling a tactile drag/build loop, not a worksheet.
5. Make Read Aloud use short, funny, decodable text where possible.
6. Track enough data for Ilana to know what to do next.

In parallel, keep the Play Lab lightweight and paper-first for reward modules.
Pixel Coloring and Pattern Hunt should graduate only if children prove they are
sticky and instructionally useful.

---

## One-Sentence North Star

WordPets helps teachers turn passive literacy practice into active, joyful,
high-signal learning loops that children want to repeat.
