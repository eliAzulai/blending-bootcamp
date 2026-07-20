# Letter-Sound Mini-Games — extracted from ideation

**Date:** 2026-07-06
**Source:** WhatsApp ideation (Eli Azulai × assistant), 2026-07-06 23:13–23:15.
**Status:** raw ideas → structured game concepts. NOT specs yet — feed into the activity-layer
brainstorm/spec (see `docs/superpowers/specs/2026-06-05-wordpets-adaptive-reading-engine-design.md`).

## How these fit the engine model
Each game is an **activity** in the reading cartridge's activity layer. The engine hands the
cartridge a `(conceptId, mode)` and consumes only `{ correct, score, authoritative }`. Each game
below is tagged **formative** (fun/practice, doesn't move mastery) or **authoritative-capable**
(reliable enough to move mastery). Activity mix target is ~50/50 authoritative/formative
(decision 2026-07-02 — the app reinforces Ilana's program, isn't the sole teacher).

Skill these target: **onset phoneme → grapheme** (hearing/knowing a letter's *sound*, and the
initial sound of words) — a distinct concept-graph strand from whole-word reading.

---

## Game A — "Letter Hunt" (find every picture that starts with the sound)  ★ core game
The strongest, most-developed idea in the transcript.

- **Mechanic:** show a target letter (e.g. **C**). A field of pictures sits on screen together.
  The child taps **every** picture whose name *starts with that sound* — tap the cat, car, cup;
  leave the rest. It's a **hunt** (static field), not a timed stream.
- **Feedback:** correct tap → cheer/animation; wrong tap → funny "wah-wah / mm-mm" sound + an **X**
  symbol. (In-the-moment, per-tap.)
- **Audio policy:** **sound OFF by default** — the child must commit to a guess. A **speaker
  button** on a picture reveals its spoken word (opt-in hint). This keeps the challenge honest
  instead of hand-holding. → reusable pattern (see Design Rules).
- **Anti-brute-force (KEY):** show a **target count** up front — "find **3** things that start with
  C." Without a count, a clever 4-year-old taps everything and lets the buzzer sort it out. A count
  makes each tap a real decision.
- **Classification:** tap/select = a **reliable, speech-free signal** → **authoritative-capable**
  for onset-recognition concepts. NB it tests *recognition*, not *production* (weaker proof than
  reading aloud) — decide per concept whether it counts toward mastery or stays formative.
- **Why the "hunt" framing matters:** an earlier "stream + hold back" version (go/no-go) had a hole
  — *correctly not tapping* got zero feedback, and "knowing when not to act" is the hardest thing to
  learn. The hunt dissolves this: ignoring non-matches is just the background state; the win is
  finding all matches.

**Open questions**
- Show the target count, or hide it? (Count = prevents brute-force + gives a finish line; hidden =
  forces genuine scan-and-decide on every picture.) Recommend **show the count** for ages 5-7.
- Authoritative or formative for mastery? (Recognition vs. production trade-off above.)
- Distractor design: how close should wrong pictures be (e.g. same shape vs. same sound-family)?

---

## Game B — "Build-a-Beast" (a letter's shape becomes an animal)
- **Mechanic:** a letter's strokes form parts of a creature. E.g. **O** = the eyes, a little nose,
  cheeks; **C** = the head, the ears, the body. The child assembles/traces the letter and the
  animal appears — the letter *is* the character.
- **Purpose:** letter-**form** recognition + a sticky **mnemonic** (shape → memorable image), and a
  natural path to stroke/handwriting later.
- **Classification:** **formative** (mnemonic + engagement; not a mastery check).

**Open questions**
- Is this recognition, tracing/handwriting, or pure mnemonic reveal? (Changes the interaction.)
- Which letters actually have good "beast" forms, and does forcing it hurt weaker fits?

---

## Game C — "Shape-Family Match" (match picture to letter, letters grouped by shape)
- **Mechanic:** cut-out picture cards matched to their letter. Letters are presented in **visual
  shape families** — small **c** and small **o** together because they share the same round-ish
  stroke ("a c is an o that didn't close").
- **Classification:** **formative.**
- **⚠️ Pedagogy tension (flagged in the transcript, unresolved):** grouping by visual similarity is
  **not neutral**. It can build a helpful "shape family" (see the underlying stroke) OR make
  near-identical letters *easier to confuse* — the classic **b/d/p/q** swap that happens precisely
  because they share a shape. Which effect wins is a **learning-science question** — do not fake it.
  The right grouping depends on the goal: fast recognition vs. handwriting vs. letter→sound.

**Open questions (resolve before building this one)**
- What's the exercise's actual goal — recognition, writing, or sound? "Pair by shape" fits one and
  is a trap for another.
- Which letter pairs are safe to group vs. dangerous (b/d/p/q, m/n/w, etc.)?
- → Validate against WordPets teaching principles (skill `teaching-principles` / `curriculum-lookup`).

---

## Game D — "Story Circle" (listen to a story, then mark what happened)  — PARK as separate mode
- **Mechanic:** hear a short story, then circle/tap the things that happened in it.
- **This is a DIFFERENT skill: listening comprehension, NOT letter-sounds.** Flagged in the
  transcript. Do **not** bolt it onto the phonics games. Park it as its own mode / future strand.
- **Classification:** out of scope for the letter-sound activity layer; note for a later
  comprehension strand.

---

## Cross-cutting design rules (reuse across games)
1. **Opt-in audio hint** — sound off by default; a speaker button reveals the word on demand. Keeps
   the challenge honest; applies to any "identify the picture" game.
2. **Give "doing nothing" a place** — prefer **hunt** (find-all in a static field) over **go/no-go
   streams**, so "correctly ignore" is the background state, not an unrewarded action.
3. **Bound the search** — a known target count ("find 3") converts brute-force tapping into real
   decisions.
4. **Feedback vocabulary** — correct = cheer/animation; wrong = funny "wah-wah/mm-mm" + an **X**.
   Keep it consistent across games so the signal is learnable.
5. **Shape-based grouping is an optimization, not a default** — pick it deliberately per goal; it
   can help stroke-families or cause b/d/p/q confusion.

## Suggested next step
Take **Game A (Letter Hunt)** into the activity-layer brainstorm → spec first (it's the most
complete and is authoritative-capable). Games B/C are formative fast-follows; D is a separate
strand. Validate C's shape-grouping against the WordPets teaching-principles KB before committing.
