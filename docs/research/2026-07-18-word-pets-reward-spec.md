# Word Pets — Reward System Design Spec

*A retention and motivation architecture for a children's English-learning app, grounded in reward-prediction-error neuroscience, Self-Determination Theory, and behavioral incentive design.*

**Status:** v1 design reference
**Scope:** the reward/retention layer only — not curriculum, not content pipeline
**Design north star:** the system should aim at its own obsolescence — a child who ends up loving words more than the pet is the win condition, not a churned user.

---

## 0. The one principle everything hangs on

**Learning is the only currency. The words *are* the food.**

The pet does not grow because the child logged in, tapped a button, watched an ad, or waited a day. It grows *because the child learned something* and for no other reason. Every growth, every unlock, every delightful surprise traces back to a word learned, a sound mastered, a story read.

This single constraint is what dissolves the engagement-vs-learning tension. If care and learning are decoupled (classic Tamagotchi), you've built a compulsion loop with vocabulary bolted on — an external bribe, subject to the overjustification effect, that quietly erodes the intrinsic love of reading you're trying to build. If care and learning are *fused so they can't be pulled apart*, then a thriving pet is not a bribe — it's the natural, intrinsic consequence of learning. That is the whole design.

**Test to apply to every proposed feature:** *Can the child advance this without learning?* If yes, cut it or re-route it through a word.

---

## 1. Architecture: spine + layer

Two mechanics, not competing — stacked. Each covers a different Self-Determination Theory need.

| Layer | Mechanic | SDT need served | Role |
|---|---|---|---|
| **Spine** | The care loop (feed / grow / return-and-bloom) | Relatedness + Competence | The return-and-grow engine. The reason to come back. Built first. |
| **Enrichment** | The open world (spend, decorate, explore, choose) | Autonomy | Where earned progress is *spent* and *self-expressed*. Expands as pets grow. |

**Build order:** care loop is v1. The world starts as a single small space (the pet's home) and grows room by room, biome by biome, as an *earned* consequence of learning. Autonomy is meaningless before there's anything to be autonomous over — so the world earns its way into existence.

```
LEARN A WORD
    │
    ▼
pet consumes it ──► pet grows / learns to "say" it / gains a trait   (SPINE: competence + relatedness)
    │
    ▼
growth yields world-currency (seeds? stars? — TBD naming)
    │
    ▼
child spends it in the open world: new room, new decor,             (ENRICHMENT: autonomy)
a new animal wanders in, a biome unlocks
    │
    ▼
bigger world → more to care for → reason to learn the next word ──► loop
```

---

## 2. The decision matrix — engagement-maximizing vs. learning-serving

The mechanics that maximize raw engagement are largely the same ones used in slot machines. Some are usable in careful, detoxified forms; some are hard lines you do not cross in a children's product. This is the buildable version of that fork.

| Mechanic | Neuro / behavioral basis | Engagement power | Verdict for Word Pets | How to use it safely (or why not) |
|---|---|---|---|---|
| **Nurture / care loop** | Relatedness + loss aversion | High | ✅ **Core** | Fuse to learning (§0). Bloom, never decay (§3). |
| **Variable reward** | Dopamine peaks at ~50% uncertainty (Fiorillo); RPE | Very high | ⚠️ **Yes, detoxified** | Surprise *good* things on return (a trick learned, a visitor). Never variable *loss*. Never monetized randomness. |
| **Endowed progress** | Goal-gradient (Hull, Kivetz) | Medium | ✅ **Yes** | First pet is already partway grown. No empty progress bars, ever. |
| **Juice** (instant sensory feedback) | Immediate feedback tightens the learning loop; feedback *is* reward | High | ✅ **Core, esp. young ages** | The pet reacts the instant a word lands. For a 6yo this outweighs any point counter. |
| **Collection** | Completion drive + endowment | Medium-high | ✅ **Yes, gated by learning** | New animals arrive by learning, never by paying or by chance-you-buy. |
| **Streaks** | Commitment device + loss aversion | Very high | ⚠️ **Soft version only** | A gentle "your pets missed you" glow, not a punishing counter that resets to zero and shames. No streak-break guilt. |
| **XP / levels** | Chunked mastery, ceremonial milestone | Medium | ✅ **Yes** | The level-*up moment* (animation, sound, the pet's reaction) matters more than the number. Older kids only for visible numbers. |
| **Reward the attempt** | Competence signal for effort, not outcome | — | ✅ **Core** | Pet celebrates *trying*. Protects struggling readers from shame. |
| **Leaderboards / competition** | Relative status | High for top ~20% | ❌ **No** (for this age/purpose) | Demotivates the bottom 80%; punishes exactly the kids who need to stay. If social is wanted later, use cooperative/team framing. |
| **Neglect → suffering / death** | Loss aversion via punishment | Very high | ❌ **Hard no** | Manufactures guilt/anxiety in a young child. Dark pattern. See §3. |
| **Appointment pressure / decay timers** | Variable-interval compulsion | Very high | ❌ **Hard no in punitive form** | Re-route entirely into the positive bloom mechanic (§3). |
| **Gacha / loot boxes / pay-to-hatch** | VR schedule + monetized uncertainty | Very high | ❌ **Absolute line** | Predatory aimed at children. Never. |

---

## 3. The Tamagotchi inversion — keep the warmth, cut the cruelty

The thing that made Tamagotchi *sticky* was loss aversion via neglect: the pet suffers, dies, you feel guilty. That is precisely what must not go into a product for six-year-olds. It weaponizes a child's caregiving instinct to drive daily-active-users and manufactures anxiety in the kids you most want to keep.

**The inversion:** flip the appointment mechanic from *punitive* to *positive*. Same loss-aversion physics ("I've built something I don't want to lose"), opposite emotional valence.

| Tamagotchi (punitive) | Word Pets (positive) |
|---|---|
| Away too long → pet gets sick | Away → pet gets **sleepy** (rests, safe, fine) |
| Return → relief from guilt | Return → **delightful surprise** waiting (variable reward, good-valence) |
| Neglect → death, real loss | Neglect → nothing bad; the pet is always okay |
| Motivation = *dread of loss* | Motivation = *anticipation of reunion* |

The pet **blooms on return**, it does not rot in absence. Overnight/while-away, *good* things can accrue (it learned a trick, a new animal wandered into the world, a plant grew) — that's your dopamine-via-uncertainty hit, framed as reunion joy rather than escape from dread. You get the retention chemistry without the toxicity. A parent should never watch their kid feel guilt over a Word Pet.

---

## 4. Age scaling — the pet is constant, the shell scales

The pet is the invariant. Everything around it scales with the child. A naked care loop that delights a 6-year-old reads as babyish to an 11-year-old; the world/story/challenge layer is what carries the older end.

| | ~4–6 (early) | ~7–9 (mid) | ~10–12 (older) |
|---|---|---|---|
| **Primary hook** | The pet + juice | Pet + world-building | World, story, mastery |
| **Text load** | Near-zero; audio-first | Emerging reading | Real reading, stories |
| **Autonomy** | Low (choose pet, name it) | Medium (decorate, arrange) | High (explore, direct, express) |
| **Numbers visible?** | No — show growth *visually* | Light | Yes — XP, levels, collection % |
| **Challenge framing** | Play that hides learning | Games with visible skill | Mastery, self-set goals |
| **Care loop reads as** | Magical | Fun | Would read as babyish *alone* → must be wrapped in world/story |

If Word Pets spans this whole range, treat age as a **shell parameter**: same pet-and-learning core, different amounts of text, autonomy, visible numeric progression, and narrative wrapped around it.

---

## 5. Designing the fade — intrinsic hand-off

The endgame is not maximal lifetime engagement. It's a child who reads because reading is good, with the pet having been the scaffold that got them there. Build the fade in from day one:

- Make the **word games genuinely fun** as games (not fun *because* of the reward) — so play survives the pet.
- Make the **stories worth reading** on their own merits — so narrative pull replaces pet pull.
- Let the pet mature into a **companion** (a character in the stories, a co-reader) rather than a dependent that needs feeding — relatedness that doesn't require a compulsion loop.
- **Thin the extrinsic schedule as competence grows:** dense reward early to establish the habit, sparser and more effort-directed as the child's own reading confidence rises. Reward *effort and choice*, not just correct outcomes, so the signal points at intrinsic mastery.

This is the SDT-honest version of retention. It matches the TSG logic too: the target is *internalized* motivation, so a system that keeps the child externally pet-dependent forever is working against its own purpose.

---

## 6. Hard lines (the "do not ship" list)

1. No pet suffering, sickness-as-punishment, or death.
2. No guilt-based streaks that shame on break.
3. No gacha, loot boxes, pay-to-hatch, or any monetized randomness.
4. No leaderboards that rank one child below another at these ages.
5. No advancement path that bypasses learning (violates §0).
6. No manufactured time pressure / decay-timer anxiety.
7. No dark-pattern nagging notifications ("your pet is dying, come back!"). Notifications, if any, are warm and skippable ("Kooka learned to whistle — want to hear?").

---

## 7. Open decisions (need a call before build)

1. **Currency naming & model** — what does learning *yield* that the world *spends*? (seeds/stars/words-as-tokens?) One currency or two (a "grow" resource vs. a "spend" resource)?
2. **Age band for v1** — pick one band to nail first. I'd argue mid (7–9) is the safest center of gravity — old enough for the world to matter, young enough that the pet still enchants.
3. **One pet or many at once?** — a single deep bond vs. a growing collection. Affects how relatedness vs. collection-drive balance.
4. **Social layer y/n** — if ever, cooperative only (shared world, gifting), never competitive.
5. **Notification philosophy** — warm-and-rare, or none. Given the anti-dark-pattern stance, lean minimal.
6. **What "saying the word" means technically** — does the pet vocalize learned words (TTS/recorded)? That's a strong relatedness+competence signal but a real content/eng cost.

---

## Appendix — research provenance (one line each)

- **Reward prediction error (Schultz):** dopamine encodes *better-than-expected*, not pleasure → reward the surprise, learning is a TD signal.
- **Wanting ≠ liking (Berridge):** engagement lives in anticipation → the *return* and the *reunion* are where to invest.
- **Uncertainty amplifies dopamine (Fiorillo):** ~50% unpredictability peaks response → variable *good* surprises, never variable loss.
- **Reinforcement schedules (Skinner/Ferster):** dense to acquire, thin+variable to sustain, fade to release → §5.
- **Self-Determination Theory (Deci & Ryan):** autonomy + competence + relatedness → §1 mapping.
- **Overjustification effect (Deci):** external reward for an already-liked act erodes intrinsic drive → §0, the reason currency = learning.
- **Loss aversion / prospect theory (Kahneman–Tversky):** losses hurt ~2×; protect-what-you-built > earn-new → §3, inverted to positive valence.
- **Goal-gradient / endowed progress (Hull, Kivetz):** effort accelerates near completion; pre-loaded progress beats blank → never an empty bar.
