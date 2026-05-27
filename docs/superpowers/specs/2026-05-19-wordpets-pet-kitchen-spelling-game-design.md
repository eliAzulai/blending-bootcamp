# WordPets Pet Kitchen Spelling Game Design

**Date:** 2026-05-19
**Status:** Historical/deferred concept — not current implementation scope
**Project:** `/Users/eliHome/projects/wordpets`
**Related specs:**
- `docs/superpowers/specs/2026-04-14-wordpets-companion-app-design.md`
- `docs/superpowers/specs/2026-05-12-wordpets-active-learning-loop-reward-world-design.md`

---

> **Current status as of 2026-05-27:** Pet Kitchen was explored as a possible
> Phase 1a spelling wrapper, but it is not active scope. The implementation,
> assets, and smoke tests were removed from current `main` during the
> source-of-truth reconciliation. Do not treat this document as an implementation
> directive unless Eli explicitly re-scopes Pet Kitchen against the current
> `/student/practice` architecture and Phase 1a validation metric.

## Product Decision

Pet Kitchen was proposed as a first production "game" for WordPets.

It is not a separate mini-game shelf, pet room, inventory system, or Phase 1b
reward world. It is the Phase 1a Spelling activity redesigned as a tight
learning-and-reward loop:

```text
hear word -> build word -> instant feedback -> cook snack -> pet reacts -> earn coins -> next word
```

The child feeds the pet by spelling. The learning action and the reward action
are the same loop.

## Why This Game

Pet Kitchen is a strong first game because it gives emotional meaning to a
spelling drill without weakening the teaching.

- The child is not spelling to reach a separate reward screen.
- The child spells because spelling is how food gets made.
- The pet reacts during practice, not only after the session.
- Each word produces a complete micro-loop in about 15 to 25 seconds.
- The mechanic reuses the existing tactile letter-building Spelling activity.

This follows the local WordPets principle: steal the game wrapper, keep the
pedagogy load-bearing.

## Target User

Phase 1a children: English-speaking children in Israel, ages 6-8, who speak
English fluently but struggle with reading and writing.

The game should feel cute, physical, and immediate. It should not feel like a
worksheet with decoration pasted on top.

## Core Loop

1. Pet appears hungry or curious.
2. The kitchen shows one empty cooking tray.
3. App speaks the target word.
4. Letter ingredients appear as large tappable tiles.
5. Child taps letters into the tray.
6. App checks the word once all slots are filled.
7. If correct, the tray cooks a snack.
8. Pet eats the snack and reacts.
9. Child earns coins.
10. Next snack-word begins.

The expected rhythm is one meaningful interaction every few seconds and one
completed word loop every 15 to 25 seconds.

## First Version Scope

### In Scope

- One kitchen scene inside the Spelling practice route.
- One pet visible during the activity.
- One cooking tray where letters are assembled.
- Letter ingredient tiles below the tray.
- A "Hear it again" control.
- Per-word pet reaction.
- Per-word coin tick.
- Gentle retry feedback.
- End-of-mission celebration.
- Existing practice tracking preserved.

### Out Of Scope

- Full pet room.
- Food inventory.
- Recipe book.
- Unlockable foods.
- Outfits, decorations, or multiple kitchens.
- Timers or speed pressure.
- Leaderboards.
- Standalone mini-game route.
- AI-generated food or content.

## Game Objects

### Pet

The pet is visible throughout the activity and reacts to the child.

Pet states:

- `watching`: default while the child builds the word.
- `sniffing`: after letters are placed.
- `cheering`: after a correct spelling.
- `encouraging`: after an incorrect spelling.
- `eating`: when the snack is cooked.
- `full`: mission complete.

The first version may express these states with emoji, CSS animation, and short
text. It does not need custom character art.

### Cooking Tray

The tray is the word-building area. It contains one slot per letter.

Slots should be large enough for iPad use and should not resize as letters move
in and out.

### Letter Ingredients

Letter tiles are the draggable or tappable ingredients. The first version may
use tap-to-place because it is already implemented and reliable on touch
devices.

Each tile represents one letter instance. Duplicate letters need unique ids so
words like `muffin` or `little` can work later.

### Snack

The snack is the visual payoff for completing a word.

The first version can use a small rotating set of emoji snacks:

- apple
- cookie
- carrot
- sandwich
- soup

Snack choice does not affect scoring. It exists to make each completed word feel
like a tiny reward.

## Feedback Rules

### Correct First Try

- Tray glows.
- Snack appears or "cooks."
- Pet eats and celebrates.
- Child earns `+2` coins.
- Attempt score records as `100`.

### Correct After Retry

- Snack still cooks.
- Pet eats and celebrates.
- Child earns `+1` visual coin for the word.
- Attempt score records according to the existing scoring logic.

The database can continue storing session-level coins as the current Spelling
activity does in the first implementation pass. A later pass can align persisted
coins exactly with first-try versus retry rewards.

### Incorrect First Try

- Correct letters glow.
- Incorrect letters wobble or hop back.
- Pet encourages the child.
- No coins awarded.
- Child retries the same word.

Hint copy should be sound-focused, for example:

- "Listen for the first sound."
- "Check the middle sound."
- "Try the ending sound."

### Incorrect Second Try

- Show the correct word.
- Move to the next word after a short pause.
- No coin tick for that word.
- Record a lower score.

This avoids trapping a child in frustration while still giving Ilana a useful
struggle signal.

## Teaching Rules

Pet Kitchen must not reward random tapping.

- No coin tick for incorrect attempts.
- No speed bonus.
- No streak punishment.
- No loud failure state.
- Hints should point back to sounds and letter positions.
- The word should always remain the center of the task.

The child should feel helped, not judged.

## Activity Data

Pet Kitchen uses the existing Spelling content shape for the first pass:

```ts
interface PhonicsWord {
  word: string;
  phonemes: string[];
}
```

The activity only needs `word` initially. Later, `phonemes` can power better
sound-position hints.

Practice tracking should continue to record:

- `activity_type`: `spelling`
- `content_ref`: content id plus word
- `score`: word score
- `duration_seconds`: word duration

Future tracking can add hint count or attempt count if the schema is expanded.

## Screen Design

### Student Home

The student sees a primary mission card:

> Start today's mission

The card can route to Pet Kitchen when spelling is the current selected game.
Individual activity cards can remain beneath it.

### Pet Kitchen Activity

Top:

- Back link.
- Word progress, for example `Snack 2 of 5`.
- Compact pet and coin bank.

Middle:

- Pet on one side or above the tray on mobile.
- Cooking tray with letter slots.
- Snack/cooking feedback area.

Bottom:

- "Hear it again" button.
- Letter ingredient tiles.

### Completion

The completion screen shows the pet full and happy:

> Whiskers is full!

It summarizes words completed and coins earned, then returns to the student
home.

## Implementation Direction

Pet Kitchen should wrap and evolve the current `SpellingActivity`, not replace
it with a separate game engine.

Recommended component split:

- `PetKitchenMission`: scene wrapper and reward state.
- `SpellingActivity`: letter-building logic and tracker writes.
- `PetDisplay`: reusable pet reaction display.
- `RewardToast`: short reward feedback.

This keeps the teaching mechanic testable and lets future games reuse the same
reward shell.

## Success Criteria

The first version is successful if:

- A child can understand what to do without reading instructions.
- Each word produces immediate feedback.
- The pet reacts during the word loop.
- Correct spelling feels like feeding the pet.
- Incorrect spelling gives a clear retry path.
- The session still records useful spelling attempts.
- The activity remains short and does not become a separate reward detour.

## Risks

### Game Wrapper Hides Weak Teaching

If children tap letters randomly to make food appear, the game has failed.
Rewards must follow successful spelling, not activity noise.

### Too Much Visual Motion

Animations should make the pet feel alive, but the letter task must stay clear.
The tray and tiles should remain visually stable.

### Reward Accounting Drift

Visual per-word rewards may diverge from persisted session coins if not handled
carefully. The first pass may preserve current persistence, but the UI should
avoid promising more than the session awards.

### Babyish Tone

For ages 6-8, cute kitchen play is acceptable. Avoid toddler copy like "num num"
or overly babyish pet speech.

## Approved First Build

Build one Pet Kitchen spelling mission using fixture/live spelling content:

1. Child opens Spelling.
2. Pet Kitchen scene appears.
3. App speaks the word.
4. Child taps letters into a cooking tray.
5. Correct word cooks a snack.
6. Pet eats and reacts.
7. Coins tick immediately.
8. Repeat through the word list.
9. Pet is full on completion.

That is the whole first game.
