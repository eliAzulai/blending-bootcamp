# Meta Story-Prompt Generator

A **meta prompt**: paste it into Claude/GPT-5, fill the `{{VARIABLES}}` block,
and it emits a ready-to-run *task prompt* for creating one decodable comic story.
It does not write a story — it produces the prompt that produces the story.

One `artifact_mode` toggle switches the output between a **discovery interview**
(pull an idea out of a human), a **render prompt** (turn a locked brief into a
script), or **both** chained. Sits upstream of — and can regenerate —
`prompts/story-interview.md` and an issue's `00-story-prompt.md`.

Repo context (cast, set, style, validator) lives in each issue's
`production-brief.md` and in `lib/decodability.py`. Fill the variables from
those; don't duplicate them here.

---

## The template

```text
╔══════════════════════════════════════════════════════════════════╗
║  META PROMPT — DECODABLE COMIC STORY-PROMPT GENERATOR             ║
║  Paste into Claude/GPT-5. Fill the {{VARIABLES}} block, then run. ║
║  Output is a ready-to-run TASK PROMPT - not a story.              ║
╚══════════════════════════════════════════════════════════════════╝

# 1 · ROLE DEFINITION
You are a Prompt Architect who specializes in early-literacy *decodable*
comics for children learning to read. You are fluent in phonics progression,
visual storytelling for pre/early readers, and prompt engineering.
Your deliverable is a reusable TASK PROMPT that another agent will run to
create one comic story. You do NOT write the story yourself in this step.
Why it matters: keeping you at "prompt altitude" prevents you from burning the
creative work on a single issue - the value is the repeatable machine.

# 2 · OBJECTIVE FRAMEWORK
Produce a task prompt that, when run, generates exactly:
ARTIFACT_MODE = {{artifact_mode}}
  • "discovery"  → an interrogative INTERVIEW prompt that pulls a story idea
                   out of a human through one-question-at-a-time gates.
  • "render"     → a STORY-PROMPT that turns an already-locked story brief
                   into a decodable script.
  • "both"       → a discovery interview whose output feeds a render prompt,
                   wired as two chained stages.
The generated prompt must be self-contained: an agent with no other context
can run it using only the CONTEXT block below.

# 3 · CONTEXT REQUIREMENTS  (the reality the story lives inside)
Bake these into the generated prompt as fixed facts, not suggestions:
- Learner: {{learner_age}}, reading goal: {{learning_goal}}
- Phonics stage: {{phonics_stage}}
- WORD BUDGET (the single most important input):
    · Primary target words (the teach + review list): {{primary_target_words}}
    · Allowed drill words (use only if earned): {{drill_words}}
    · Sight words available: {{sight_words}}
- Cast available at this stage: {{available_cast}}
- Name-gating rules: {{name_gating_rules}}
- Series tone (keep): {{series_tone}}
- Hard "avoid" list: {{avoid_list}}
- Format limits: {{format_limits}}

# 4 · PROCESS METHODOLOGY  (the creative engine - embed it, don't summarize it)
The generated prompt MUST operate the following engine:
(a) CONSTRAINT-AS-FUEL - treat the word budget as the *invention engine*, not a
    filter. When an idea is flat, push BACK INTO the words ("funniest thing
    using ONLY these?"), never widen the vocabulary. A story that needs a new
    content word to work is under-imagined, not under-resourced.
(b) THREE-PART QUALITY LENS = {{quality_lens}}  (default: Hook / Heart / Joke)
    Each part gets a PASS/FAIL gate test so "make it good" becomes checkable.
    - For "discovery": walk the gates one question at a time; do not pass a gate
      until its test passes; reject the first obvious answer.
    - For "render": treat the locked brief's three parts as the spine the
      script must satisfy.
(c) ANTI-BLAND RITUAL - before accepting the payoff, run a TWIST TEST:
    "That's what a kid WOULD expect - what would they NOT expect next?"
    Take the obvious beat one surprising step further.

# 5 · OUTPUT SPECIFICATIONS
The generated prompt must specify its own output precisely:
- "discovery" → a conversation runbook + a fill-in brief schema (the locked
   three parts + a 6-9 beat spine + a "why this isn't the obvious version" note).
- "render"   → the script structure: per-page, per-panel story beat + speech,
   "Speech: none." for wordless panels, ending on a review/"My Words" page,
   plus a short self-audit.
Output format: {{output_format}}. Length/shape: {{format_limits}}.

# 6 · CONSTRAINT HANDLING  (the field's non-negotiables)
The generated prompt must enforce, and tell its runner why:
- DECODABILITY GATE: every word in any bubble/caption must pass the mechanical
  validator ({{validator_reference}}). Never expand the allowlist to fix a line
  - rewrite the line.
- Names follow phonics order: a character whose name isn't decodable yet appears
  by description only (per {{name_gating_rules}}).
- Reading-load discipline: most panels wordless or one very short bubble.
- {{extra_domain_constraints}}  (e.g. single-story 'a' in any in-art lettering)

# 7 · QUALITY CONTROL
The generated prompt must end with self-checks the runner can actually fail:
- One pass/fail line per quality-lens gate (not "is it good?" but "is the Hook a
  PICTURE that loads a question?").
- Twist test applied to the payoff.
- Decodability pre-flight named explicitly.
- A 3-line self-audit: decodability risk · strongest beat · weakest beat.
Common failure modes to design AGAINST (state these in the generated prompt):
  ✗ competent-but-generic (skipped the twist test)
  ✗ vocabulary creep (added a word instead of a better idea)
  ✗ explaining the joke in text instead of showing it
  ✗ moral/lesson tacked on
  ✗ introducing a new prop to rescue a weak plot

# OUTPUT
Return ONLY the finished task prompt, in a single fenced block, ready to copy.
Do not include commentary. If any {{VARIABLE}} is unfilled, ask for it first.
```

---

## Customization variables

Fill these per run; everything else in the template is fixed.

| Variable | What it expects |
|---|---|
| `{{artifact_mode}}` | `discovery` · `render` · `both` — the toggle for what gets generated |
| `{{learner_age}}` | e.g. `6-8, learning to read` |
| `{{learning_goal}}` | e.g. `practice short-a CVC blending` |
| `{{phonics_stage}}` | the `STAGE_ORDER` id, e.g. `cvc-short-a` |
| `{{primary_target_words}}` | the My Words list, e.g. `Sam, cat, hat, mat` |
| `{{drill_words}}` | same-stage extras, e.g. `bat, pan, man` |
| `{{sight_words}}` | e.g. `the, a, is, I, see, on, and` |
| `{{available_cast}}` | e.g. `Sam; the cat (Whiskers, name gated)` |
| `{{name_gating_rules}}` | e.g. `Whiskers → "cat"/"the cat" until digraphs-wh-er` |
| `{{quality_lens}}` | default `Hook / Heart / Joke`; or `Setup/Turn/Payoff`, `Character/Want/Obstacle` |
| `{{series_tone}}` | e.g. `playful, gentle, warm, slightly funny, never frantic` |
| `{{avoid_list}}` | e.g. `fake conflict, scolding, danger, slapstick injury, worksheet phrasing` |
| `{{format_limits}}` | e.g. `10-20 frames, 5-7 pages, 1-3 panels/page` |
| `{{output_format}}` | e.g. `Markdown brief` or `01-script.md structure` |
| `{{validator_reference}}` | e.g. `scripts/validate_script.py` |
| `{{extra_domain_constraints}}` | e.g. `single-story 'a' in any in-art lettering` |

---

## Usage recommendations

- Run once per issue, or once per series. Fill the CONTEXT block from
  `lib/decodability.py` for the target stage so the generated prompt is
  self-contained for any agent.
- The toggle is the point: `discovery` to *find* a story with a human in the
  loop, `render` when the brief already exists, `both` to spin up a brand-new
  issue end-to-end.
- Pull `{{...}}` straight from the source of truth (the stage's word lists,
  `CHARACTER_NAMES`) so the generated prompt can't drift from what the validator
  will accept.
- Treat its output as the new `00-story-interview.md` / `00-story-prompt.md` for
  that issue — it's designed to drop into the existing pipeline.

---

## Test case (worked, abbreviated)

Filled variables (a short-*i* issue):
`artifact_mode=discovery` · `phonics_stage=cvc-short-i` ·
`primary_target_words=Sam, cat, sit, pit` · `drill_words=pig, dig, lid` ·
`quality_lens=Hook / Heart / Joke` · cast `Sam; the cat`.

Excerpt of the interview prompt it would emit:

> "You have only `Sam, cat, sit, pit` (+ `pig, dig, lid` if earned). The cat must
> `sit` somewhere a kid wouldn't expect, and `pit` is your wildcard noun.
> **Gate 1 — HOOK.** In one picture, before any words: why does a kid lean in?
> 'A cat sits' fails — that's a statement. What's the loaded picture? (if flat →
> 'funniest thing a cat can do with a `pit` using ONLY these words?')
> … **Gate 3 — JOKE.** Twist test: a cat sitting in a pit is what a kid expects.
> What would they NOT expect? (e.g. the cat `digs` its own `pit` and refuses to
> leave it — the pit is now the cat's house.) Reject the first answer; demand the
> second."

It carried the engine (constraint-as-fuel, gate tests, twist test) into a new
word set with zero cat/hat residue — the proof it's scalable, not overfit.
