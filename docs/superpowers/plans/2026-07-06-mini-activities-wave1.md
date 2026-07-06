# Mini-Activities Wave 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three new game formats (Sound Hunt, Word Builder, Missing Word) rotate into the existing 3-slot practice session, with content flowing through the established fixtures → seed → `content` table pipeline.

**Architecture:** Server-side format pools pick which game fills each focus-area slot (`pool[(rotation + offset) % pool.length]`). Each game is a standalone client component with the existing `content + tracker + onComplete` contract. Drag interactions use a shared pointer-events hook (HTML5 DnD is broken on iOS Safari); sounds are WebAudio-synthesized (no asset files).

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4, TypeScript, Supabase (psql via `scripts/db.sh`), Web Speech API TTS.

**Spec:** `docs/superpowers/specs/2026-07-06-mini-activities-wave1-design.md`

**Testing note:** This repo has no JS/TS test framework (per CLAUDE.md) and the approved spec's verification plan is build + lint + preview-browser + DB checks. Tasks therefore verify with `npm run build` / `npm run lint` per task and a full interactive preview pass at the end, not unit tests. Run all commands from the repo worktree root.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `supabase/migration-2026-07-06-mini-activities.sql` | Create | Widen `content.type` CHECK; add `activity_attempts.format` |
| `supabase/schema-v2.sql` | Modify | Keep canonical schema in sync with migration |
| `src/lib/formats.ts` | Create | `ActivityFormat`, `FORMAT_POOLS`, `pickFormat`, `PracticeSlot` union |
| `src/lib/tracker.ts` | Modify | `format` field on `AttemptRecord` + insert |
| `src/lib/fixtures/student.ts` | Modify | New types + fixture content for word-match and cloze sets |
| `scripts/seed-content.ts` | Modify | Emit the two new content types |
| `src/lib/content.ts` | Modify | `getWordMatchContent`, `getClozeContent` pickers |
| `src/lib/shuffle.ts` | Create | Shared Fisher-Yates shuffle |
| `src/lib/sfx.ts` | Create | WebAudio pop/click/chime |
| `src/hooks/useTileDrag.ts` | Create | Pointer-events drag with zone hit-testing |
| `src/app/globals.css` | Modify | `tile-pop` keyframe + reduced-motion gate |
| `src/components/activities/SoundHuntActivity.tsx` | Create | Tap-the-word game |
| `src/components/activities/WordBuilderActivity.tsx` | Create | Drag-letter-tiles game |
| `src/components/activities/MissingWordActivity.tsx` | Create | Cloze sentence game |
| `src/app/student/practice/PracticeRunner.tsx` | Modify | Render by slot format instead of fixed trio |
| `src/app/student/practice/page.tsx` | Modify | Build `PracticeSlot[]` server-side; dev-only `?rot=` override |
| `~/.claude/skills/wordpets-content/SKILL.md` | Modify | Generation guidance for the 2 new types |
| `CLAUDE.md` | Modify | Document new components/content types |

---

### Task 1: Database migration

**Files:**
- Create: `supabase/migration-2026-07-06-mini-activities.sql`
- Modify: `supabase/schema-v2.sql` (content type CHECK ~line 146; activity_attempts columns ~line 121)

- [ ] **Step 1: Write the migration file**

```sql
-- Mini-activities wave 1: new content types + attempt format column.
-- Idempotent. Apply with:
--   scripts/db.sh -f supabase/migration-2026-07-06-mini-activities.sql
begin;

-- Postgres auto-names the inline CHECK on content.type "content_type_check".
alter table content drop constraint if exists content_type_check;
alter table content add constraint content_type_check
  check (type in ('wordlist', 'passage', 'word_match_set', 'cloze_sentence'));

-- Which game produced an attempt. activity_type keeps meaning the SLOT
-- (phonics/spelling/read_aloud) so existing teacher-dashboard queries are
-- untouched. null = legacy formats (blending/typing/read-aloud).
alter table activity_attempts add column if not exists format text;

commit;
```

- [ ] **Step 2: Apply it**

Run: `scripts/db.sh -f supabase/migration-2026-07-06-mini-activities.sql`
Expected: `BEGIN` / `ALTER TABLE` ×3 / `COMMIT`, no errors.

- [ ] **Step 3: Verify**

Run: `scripts/db.sh -c "select conname, pg_get_constraintdef(oid) from pg_constraint where conname = 'content_type_check'; select column_name from information_schema.columns where table_name='activity_attempts' and column_name='format';"`
Expected: constraint definition lists all four types; one row `format`.

- [ ] **Step 4: Sync `supabase/schema-v2.sql`**

Change the content type line to:
```sql
  type text not null check (type in ('wordlist', 'passage', 'word_match_set', 'cloze_sentence')),
```
And add after the `activity_type` line in `activity_attempts`:
```sql
  format text,
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migration-2026-07-06-mini-activities.sql supabase/schema-v2.sql
git commit -m "feat(db): mini-activities content types + attempt format column"
```

---

### Task 2: Format pools + tracker plumbing

**Files:**
- Create: `src/lib/formats.ts`
- Modify: `src/lib/tracker.ts`

- [ ] **Step 1: Create `src/lib/formats.ts`**

```ts
import type { FocusAreaType } from "@/types/database";
import type {
  PhonicsContent,
  SpellingContent,
  ReadAloudPassage,
  WordMatchContent,
  ClozeContent,
} from "@/lib/fixtures/student";

export type ActivityFormat =
  | "blending"
  | "typing"
  | "read_aloud"
  | "sound_hunt"
  | "word_builder"
  | "missing_word";

/**
 * Which formats can fill each focus-area slot. The format for a slot is
 * pool[(rotation + offset) % pool.length], so kids cycle through formats
 * deterministically as they complete sessions — no stored state.
 */
export const FORMAT_POOLS: Record<FocusAreaType, ActivityFormat[]> = {
  phonics: ["blending", "sound_hunt", "missing_word"],
  spelling: ["typing", "word_builder", "missing_word"],
  read_aloud: ["read_aloud"],
};

/**
 * The spelling slot is offset by 1 so phonics and spelling never both land
 * on "missing_word" in the same session (both pools have length 3 and
 * advance in lockstep). Revisit if pool lengths change.
 */
const SLOT_OFFSET: Record<FocusAreaType, number> = {
  phonics: 0,
  spelling: 1,
  read_aloud: 0,
};

export function pickFormat(area: FocusAreaType, rotation: number): ActivityFormat {
  const pool = FORMAT_POOLS[area];
  return pool[(rotation + SLOT_OFFSET[area]) % pool.length];
}

/** One slot of a practice session: the area it serves, the game format, and its content. */
export type PracticeSlot =
  | { area: "phonics"; format: "blending"; content: PhonicsContent }
  | { area: "phonics"; format: "sound_hunt"; content: WordMatchContent }
  | { area: "spelling"; format: "typing"; content: SpellingContent }
  | { area: "spelling"; format: "word_builder"; content: SpellingContent }
  | { area: "phonics" | "spelling"; format: "missing_word"; content: ClozeContent }
  | { area: "read_aloud"; format: "read_aloud"; content: ReadAloudPassage };
```

Note: `WordMatchContent`/`ClozeContent` don't exist until Task 3 — Tasks 2+3 build together; commit happens after Task 3. (Alternatively write Task 3 first; order here matches review flow.)

- [ ] **Step 2: Extend `src/lib/tracker.ts`**

Add to `AttemptRecord` (after `activityType`):

```ts
  /** Which game produced this attempt; null/omitted = legacy formats. */
  format?: string | null;
```

And in `SupabaseTracker.recordAttempt`, add to the insert object after `activity_type`:

```ts
      format: attempt.format ?? null,
```

---

### Task 3: Fixture types + starter content

**Files:**
- Modify: `src/lib/fixtures/student.ts` (append after the read-aloud section)

Content rules: every word/sentence must be decodable within its band (R2/R3 — beginner: CVC + basic sight words `the a I is on in my we can and of to`; intermediate: + blends/digraphs; advanced: + magic-e/long vowels). Every distractor must make the sentence clearly wrong, ungrammatical, or silly — never a defensible alternative answer. If you spot a distractor a reasonable kid could argue for, replace it.

- [ ] **Step 1: Append types + content to `src/lib/fixtures/student.ts`**

```ts
// ===========================================================================
// Sound Hunt (word_match_set) — tap the word you hear / that starts with a sound
// ===========================================================================

export interface WordMatchRound {
  target: string;
  /** Required when the set's promptKind is "starts_with". */
  sound?: string;
  distractors: string[];
}

export interface WordMatchContent {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  promptKind: "hear_word" | "starts_with";
  rounds: WordMatchRound[];
}

export const fixtureWordMatchContent: WordMatchContent[] = [
  // BEGINNER
  {
    id: "wordmatch-beg-short-a",
    title: "Listen and Find: Short A",
    difficulty: "beginner",
    promptKind: "hear_word",
    rounds: [
      { target: "cat", distractors: ["bat", "hat"] },
      { target: "man", distractors: ["map", "mat"] },
      { target: "pan", distractors: ["pat", "pad"] },
      { target: "bag", distractors: ["bat", "bad"] },
      { target: "ham", distractors: ["hat", "had"] },
    ],
  },
  {
    id: "wordmatch-beg-first-sounds",
    title: "First Sounds",
    difficulty: "beginner",
    promptKind: "starts_with",
    rounds: [
      { target: "sun", sound: "s", distractors: ["fun", "run"] },
      { target: "dog", sound: "d", distractors: ["log", "fog"] },
      { target: "pig", sound: "p", distractors: ["dig", "big"] },
      { target: "hen", sound: "h", distractors: ["ten", "pen"] },
      { target: "mop", sound: "m", distractors: ["top", "hop"] },
    ],
  },
  {
    id: "wordmatch-beg-short-i-o",
    title: "Listen and Find: Short I and O",
    difficulty: "beginner",
    promptKind: "hear_word",
    rounds: [
      { target: "pig", distractors: ["pin", "pit"] },
      { target: "sit", distractors: ["sip", "six"] },
      { target: "dog", distractors: ["dot", "dig"] },
      { target: "top", distractors: ["tip", "tap"] },
      { target: "win", distractors: ["wig", "fin"] },
    ],
  },
  // INTERMEDIATE
  {
    id: "wordmatch-int-digraphs",
    title: "Digraph Hunt",
    difficulty: "intermediate",
    promptKind: "starts_with",
    rounds: [
      { target: "ship", sound: "sh", distractors: ["chip", "slip"] },
      { target: "chat", sound: "ch", distractors: ["cat", "hat"] },
      { target: "thin", sound: "th", distractors: ["shin", "tin"] },
      { target: "shop", sound: "sh", distractors: ["chop", "stop"] },
      { target: "chest", sound: "ch", distractors: ["test", "rest"] },
    ],
  },
  {
    id: "wordmatch-int-blends",
    title: "Listen and Find: Blends",
    difficulty: "intermediate",
    promptKind: "hear_word",
    rounds: [
      { target: "frog", distractors: ["from", "fog"] },
      { target: "stop", distractors: ["step", "spot"] },
      { target: "clap", distractors: ["clip", "cap"] },
      { target: "swim", distractors: ["slim", "skim"] },
      { target: "hand", distractors: ["band", "sand"] },
    ],
  },
  {
    id: "wordmatch-int-end-sounds",
    title: "Listen and Find: End Sounds",
    difficulty: "intermediate",
    promptKind: "hear_word",
    rounds: [
      { target: "fast", distractors: ["fist", "last"] },
      { target: "milk", distractors: ["silk", "mill"] },
      { target: "jump", distractors: ["bump", "just"] },
      { target: "sing", distractors: ["ring", "sink"] },
      { target: "lamp", distractors: ["camp", "land"] },
    ],
  },
  // ADVANCED
  {
    id: "wordmatch-adv-magic-e",
    title: "Magic E Words",
    difficulty: "advanced",
    promptKind: "hear_word",
    rounds: [
      { target: "cake", distractors: ["lake", "came"] },
      { target: "bike", distractors: ["bake", "like"] },
      { target: "note", distractors: ["nose", "vote"] },
      { target: "cube", distractors: ["cute", "tube"] },
      { target: "plane", distractors: ["plan", "place"] },
    ],
  },
  {
    id: "wordmatch-adv-long-short",
    title: "Long or Short?",
    difficulty: "advanced",
    promptKind: "hear_word",
    rounds: [
      { target: "hope", distractors: ["hop", "rope"] },
      { target: "kite", distractors: ["kit", "bite"] },
      { target: "tape", distractors: ["tap", "cape"] },
      { target: "pine", distractors: ["pin", "nine"] },
      { target: "ride", distractors: ["rid", "hide"] },
    ],
  },
  {
    id: "wordmatch-adv-tricky-starts",
    title: "First Sounds: Tricky",
    difficulty: "advanced",
    promptKind: "starts_with",
    rounds: [
      { target: "shine", sound: "sh", distractors: ["chime", "spine"] },
      { target: "chase", sound: "ch", distractors: ["case", "base"] },
      { target: "white", sound: "wh", distractors: ["bite", "kite"] },
      { target: "brave", sound: "br", distractors: ["gave", "crave"] },
      { target: "smile", sound: "sm", distractors: ["mile", "slide"] },
    ],
  },
];

export function getDefaultWordMatchContent(): WordMatchContent {
  return fixtureWordMatchContent[0];
}

// ===========================================================================
// Missing Word (cloze_sentence) — drag the word into the gap
// ===========================================================================

export interface ClozeSentence {
  /** Contains exactly one "___" gap. */
  text: string;
  answer: string;
  distractors: string[];
}

export interface ClozeContent {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  /** Which slot this set leans toward. Wave 1 pickers ignore it (one pool). */
  intendedFor: "phonics" | "spelling";
  sentences: ClozeSentence[];
}

export const fixtureClozeContent: ClozeContent[] = [
  // BEGINNER
  {
    id: "cloze-beg-at-the-mat",
    title: "Finish It: At the Mat",
    difficulty: "beginner",
    intendedFor: "phonics",
    sentences: [
      { text: "The cat sat on the ___.", answer: "mat", distractors: ["map", "man"] },
      { text: "A pig can ___ in mud.", answer: "dig", distractors: ["dip", "big"] },
      { text: "The sun is ___.", answer: "hot", distractors: ["hop", "hat"] },
      { text: "The man got in his ___.", answer: "van", distractors: ["vat", "vet"] },
    ],
  },
  {
    id: "cloze-beg-pets",
    title: "Finish It: Pets",
    difficulty: "beginner",
    intendedFor: "phonics",
    sentences: [
      { text: "The dog sat in the ___.", answer: "sun", distractors: ["sub", "sad"] },
      { text: "My cat naps on the ___.", answer: "bed", distractors: ["bud", "bad"] },
      { text: "The hen is in a ___.", answer: "pen", distractors: ["pin", "peg"] },
      { text: "A pup can run and ___.", answer: "hop", distractors: ["hip", "hot"] },
    ],
  },
  {
    id: "cloze-beg-my-day",
    title: "Finish It: My Day",
    difficulty: "beginner",
    intendedFor: "spelling",
    sentences: [
      { text: "I sit on the ___.", answer: "rug", distractors: ["run", "rat"] },
      { text: "We had ham and ___.", answer: "jam", distractors: ["jab", "jog"] },
      { text: "The bug is in the ___.", answer: "mud", distractors: ["mad", "map"] },
      { text: "I can nap on the ___.", answer: "cot", distractors: ["cut", "can"] },
    ],
  },
  // INTERMEDIATE
  {
    id: "cloze-int-at-the-shop",
    title: "Finish It: At the Shop",
    difficulty: "intermediate",
    intendedFor: "phonics",
    sentences: [
      { text: "We went to the ___ to get fish.", answer: "shop", distractors: ["shut", "chip"] },
      { text: "The crab hid under a ___.", answer: "shell", distractors: ["smell", "spell"] },
      { text: "I can ring the ___.", answer: "bell", distractors: ["belt", "bent"] },
      { text: "The frog sat on a ___.", answer: "log", distractors: ["fog", "leg"] },
    ],
  },
  {
    id: "cloze-int-play-time",
    title: "Finish It: Play Time",
    difficulty: "intermediate",
    intendedFor: "phonics",
    sentences: [
      { text: "We ___ our hands to the song.", answer: "clap", distractors: ["clip", "crab"] },
      { text: "The kids can ___ in the pool.", answer: "swim", distractors: ["slim", "swam"] },
      { text: "Do not ___ on the wet step.", answer: "slip", distractors: ["slap", "ship"] },
      { text: "The wind made the flag ___.", answer: "flap", distractors: ["clap", "frog"] },
    ],
  },
  {
    id: "cloze-int-lunch",
    title: "Finish It: Lunch",
    difficulty: "intermediate",
    intendedFor: "spelling",
    sentences: [
      { text: "Please ___ the door.", answer: "shut", distractors: ["shot", "shop"] },
      { text: "The truck went up the ___.", answer: "hill", distractors: ["hit", "hip"] },
      { text: "We sang a ___ in class.", answer: "song", distractors: ["sang", "sing"] },
      { text: "I had chips and ___ for lunch.", answer: "fish", distractors: ["fist", "wish"] },
    ],
  },
  // ADVANCED
  {
    id: "cloze-adv-bake-sale",
    title: "Finish It: Bake Sale",
    difficulty: "advanced",
    intendedFor: "spelling",
    sentences: [
      { text: "We will ___ a cake for the sale.", answer: "bake", distractors: ["bike", "back"] },
      { text: "Jane gave me a ___ of cake.", answer: "slice", distractors: ["slide", "spice"] },
      { text: "The cake is on the ___.", answer: "plate", distractors: ["place", "plum"] },
      { text: "I hope the cake will ___ nice.", answer: "taste", distractors: ["tame", "toast"] },
    ],
  },
  {
    id: "cloze-adv-outside",
    title: "Finish It: Outside",
    difficulty: "advanced",
    intendedFor: "phonics",
    sentences: [
      { text: "The ___ flew high in the sky.", answer: "kite", distractors: ["kit", "bite"] },
      { text: "We rode our bikes down the ___.", answer: "lane", distractors: ["cane", "lime"] },
      { text: "The snake hid in a deep ___.", answer: "hole", distractors: ["hold", "pole"] },
      { text: "We could see the moon ___.", answer: "shine", distractors: ["shone", "spine"] },
    ],
  },
  {
    id: "cloze-adv-story-time",
    title: "Finish It: Story Time",
    difficulty: "advanced",
    intendedFor: "phonics",
    sentences: [
      { text: "The brave mouse ran to its ___.", answer: "home", distractors: ["dome", "hose"] },
      { text: "Dave made a ___ with his blocks.", answer: "cube", distractors: ["cub", "cape"] },
      { text: "The whale made a big ___.", answer: "splash", distractors: ["flash", "brush"] },
      { text: "Kate can ___ very fast.", answer: "skate", distractors: ["state", "slate"] },
    ],
  },
];

export function getDefaultClozeContent(): ClozeContent {
  return fixtureClozeContent[0];
}
```

- [ ] **Step 2: Build to type-check Tasks 2+3 together**

Run: `npm run build`
Expected: compiles clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/formats.ts src/lib/tracker.ts src/lib/fixtures/student.ts
git commit -m "feat(content): format pools, tracker format field, word-match + cloze fixtures"
```

---

### Task 4: Seed script + reseed DB

**Files:**
- Modify: `scripts/seed-content.ts`

- [ ] **Step 1: Widen the `Row` type and import the new fixtures**

```ts
import {
  fixturePhonicsContent,
  fixtureSpellingContent,
  fixtureReadAloudPassages,
  fixtureWordMatchContent,
  fixtureClozeContent,
} from "../src/lib/fixtures/student";

interface Row {
  type: "wordlist" | "passage" | "word_match_set" | "cloze_sentence";
  title: string;
  body: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  metadata: Record<string, unknown>;
}
```

- [ ] **Step 2: Add the two new loops (after the passages loop)**

```ts
for (const set of fixtureWordMatchContent) {
  rows.push({
    type: "word_match_set",
    title: set.title,
    body: set.rounds.map((r) => r.target).join(" "),
    difficulty: set.difficulty,
    metadata: {
      legacy_id: set.id,
      intended_for: "phonics",
      prompt_kind: set.promptKind,
      rounds: set.rounds,
    },
  });
}

for (const set of fixtureClozeContent) {
  rows.push({
    type: "cloze_sentence",
    title: set.title,
    body: set.sentences.map((s) => s.text.replace("___", s.answer)).join(" "),
    difficulty: set.difficulty,
    metadata: {
      legacy_id: set.id,
      intended_for: set.intendedFor,
      sentences: set.sentences,
    },
  });
}
```

- [ ] **Step 3: Reseed and verify**

Run: `scripts/db.sh -f <(npx tsx scripts/seed-content.ts)`
Expected: the built-in verify select shows, per difficulty, `word_match_set: 3` and `cloze_sentence: 3` alongside existing wordlist/passage counts.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-content.ts
git commit -m "feat(content): seed word_match_set + cloze_sentence rows"
```

---

### Task 5: Content pickers

**Files:**
- Modify: `src/lib/content.ts`

- [ ] **Step 1: Widen `ContentRow` and extend the fixture import**

`ContentRow.type` becomes `"wordlist" | "passage" | "word_match_set" | "cloze_sentence"`. Add to the metadata shape: `prompt_kind?: string; rounds?: unknown; sentences?: unknown;`. Extend the import from `./fixtures/student` with `getDefaultWordMatchContent, getDefaultClozeContent` and types `WordMatchContent, WordMatchRound, ClozeContent, ClozeSentence`.

- [ ] **Step 2: Add the two pickers (bottom of file)**

```ts
async function fetchByType(
  supabase: SupabaseClient,
  type: "word_match_set" | "cloze_sentence",
  difficulty: DifficultyLevel,
): Promise<ContentRow[]> {
  const { data, error } = await supabase
    .from("content")
    .select("id, type, title, body, difficulty, metadata")
    .eq("type", type)
    .eq("difficulty", difficulty)
    .order("created_at");
  if (error) {
    console.warn(`[content] fetch ${type} failed`, error);
    return [];
  }
  return (data ?? []) as ContentRow[];
}

export async function getWordMatchContent(
  supabase: SupabaseClient,
  difficulty: DifficultyLevel,
  rotation: number,
): Promise<WordMatchContent> {
  const rows = await fetchByType(supabase, "word_match_set", difficulty);
  if (rows.length === 0) return getDefaultWordMatchContent();
  const row = rows[rotation % rows.length];
  return {
    id: (row.metadata.legacy_id as string) ?? row.id,
    title: row.title,
    difficulty: row.difficulty,
    promptKind:
      (row.metadata.prompt_kind as WordMatchContent["promptKind"]) ?? "hear_word",
    rounds: (row.metadata.rounds ?? []) as WordMatchRound[],
  };
}

// Wave 1 deliberately ignores metadata.intended_for: all cloze sets form one
// pool regardless of which slot (phonics/spelling) the format fills.
export async function getClozeContent(
  supabase: SupabaseClient,
  difficulty: DifficultyLevel,
  rotation: number,
): Promise<ClozeContent> {
  const rows = await fetchByType(supabase, "cloze_sentence", difficulty);
  if (rows.length === 0) return getDefaultClozeContent();
  const row = rows[rotation % rows.length];
  return {
    id: (row.metadata.legacy_id as string) ?? row.id,
    title: row.title,
    difficulty: row.difficulty,
    intendedFor:
      (row.metadata.intended_for as ClozeContent["intendedFor"]) ?? "phonics",
    sentences: (row.metadata.sentences ?? []) as ClozeSentence[],
  };
}
```

- [ ] **Step 3: Build + commit**

Run: `npm run build` — expected clean.

```bash
git add src/lib/content.ts
git commit -m "feat(content): DB pickers for word-match and cloze sets"
```

---

### Task 6: Shared shuffle + SFX

**Files:**
- Create: `src/lib/shuffle.ts`
- Create: `src/lib/sfx.ts`

- [ ] **Step 1: Create `src/lib/shuffle.ts`**

```ts
/** Fisher-Yates. Returns a new array; does not mutate the input. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
```

- [ ] **Step 2: Create `src/lib/sfx.ts`**

```ts
/**
 * Tiny synthesized sound effects via WebAudio — no audio asset files.
 * Every function silently no-ops when AudioContext is unavailable
 * (SSR, unsupported browsers, autoplay-blocked contexts).
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  durationMs: number,
  startDelayMs = 0,
  type: OscillatorType = "sine",
  gainPeak = 0.12,
): void {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime + startDelayMs / 1000;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + durationMs / 1000);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + durationMs / 1000 + 0.05);
}

/** Soft pop — tile picked up / placed. */
export function playPop(): void {
  tone(440, 90, 0, "triangle");
}

/** Gentle low click — wrong try. Deliberately soft, not a buzzer (R25). */
export function playClick(): void {
  tone(220, 80, 0, "sine", 0.08);
}

/** Two-note success chime (C5 → G5). */
export function playChime(): void {
  tone(523.25, 120);
  tone(783.99, 180, 110);
}
```

- [ ] **Step 3: Build + commit**

```bash
git add src/lib/shuffle.ts src/lib/sfx.ts
git commit -m "feat(lib): shared shuffle + WebAudio sfx"
```

---

### Task 7: Tile drag hook

**Files:**
- Create: `src/hooks/useTileDrag.ts`

- [ ] **Step 1: Create the hook**

```ts
"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Pointer-events drag for touch + mouse. HTML5 drag-and-drop is broken on
 * iOS Safari, so tiles use pointer capture and manual hit-testing instead.
 *
 * Tiles spread {...tileProps(id)} (includes touch-action: none). Drop zones
 * register with ref={zoneRef(id)}. On release, onDrop fires with the zone
 * under the pointer (or null) and whether the pointer actually moved —
 * a non-moved release is a tap, which consumers handle as tap-to-place.
 * The dragged tile's transform resets on release; consumers move tiles by
 * re-rendering state, never by keeping transforms.
 */

const TAP_THRESHOLD_PX = 8;

export interface DragState {
  tileId: string;
  dx: number;
  dy: number;
}

interface UseTileDragOptions {
  onDrop: (tileId: string, zoneId: string | null, moved: boolean) => void;
  onPickup?: (tileId: string) => void;
}

export function useTileDrag({ onDrop, onPickup }: UseTileDragOptions) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const originRef = useRef({ x: 0, y: 0 });
  const zonesRef = useRef(new Map<string, HTMLElement>());

  const update = useCallback((d: DragState | null) => {
    dragRef.current = d;
    setDrag(d);
  }, []);

  const zoneRef = useCallback(
    (zoneId: string) => (el: HTMLElement | null) => {
      if (el) zonesRef.current.set(zoneId, el);
      else zonesRef.current.delete(zoneId);
    },
    [],
  );

  const hitTest = useCallback((x: number, y: number): string | null => {
    for (const [zoneId, el] of zonesRef.current) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return zoneId;
      }
    }
    return null;
  }, []);

  const tileProps = useCallback(
    (tileId: string) => {
      const active = drag?.tileId === tileId;
      return {
        onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          originRef.current = { x: e.clientX, y: e.clientY };
          update({ tileId, dx: 0, dy: 0 });
          onPickup?.(tileId);
        },
        onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
          if (dragRef.current?.tileId !== tileId) return;
          update({
            tileId,
            dx: e.clientX - originRef.current.x,
            dy: e.clientY - originRef.current.y,
          });
        },
        onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
          const d = dragRef.current;
          if (d?.tileId !== tileId) return;
          const moved = Math.hypot(d.dx, d.dy) > TAP_THRESHOLD_PX;
          update(null);
          onDrop(tileId, hitTest(e.clientX, e.clientY), moved);
        },
        onPointerCancel: () => {
          if (dragRef.current?.tileId === tileId) update(null);
        },
        style: {
          touchAction: "none" as const,
          ...(active
            ? {
                transform: `translate(${drag.dx}px, ${drag.dy}px) scale(1.08)`,
                zIndex: 50,
                position: "relative" as const,
              }
            : {}),
        },
      };
    },
    [drag, hitTest, onDrop, onPickup, update],
  );

  return { drag, tileProps, zoneRef };
}
```

- [ ] **Step 2: Build + commit**

```bash
git add src/hooks/useTileDrag.ts
git commit -m "feat(hooks): pointer-events tile drag with zone hit-testing"
```

---

### Task 8: Tile CSS

**Files:**
- Modify: `src/app/globals.css` (after the pet-animation block, ~line 101)

- [ ] **Step 1: Add keyframe + gate**

```css
/* =============================================
 * Mini-activity tile feedback (R26 — triggered feedback only)
 * ============================================= */

/* One-shot pulse when a tile/card lands correctly. */
@keyframes tile-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.12); }
  100% { transform: scale(1); }
}
.tile-pop {
  animation: tile-pop 0.35s ease-out 1;
}

@media (prefers-reduced-motion: reduce) {
  .tile-pop {
    animation: none;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(css): tile-pop feedback keyframe"
```

---

### Task 9: SoundHuntActivity

**Files:**
- Create: `src/components/activities/SoundHuntActivity.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WordMatchContent } from "@/lib/fixtures/student";
import type { SessionTracker } from "@/lib/tracker";
import {
  speakWord,
  speakSentence,
  speakPhoneme,
  cancelSpeech,
} from "@/lib/speech";
import { playChime, playClick } from "@/lib/sfx";
import { shuffle } from "@/lib/shuffle";

interface SoundHuntActivityProps {
  content: WordMatchContent;
  tracker: SessionTracker;
  onComplete: (result: { coinsEarned: number; durationSeconds: number }) => void;
}

const COINS_PER_ROUND = 2;

export default function SoundHuntActivity({
  content,
  tracker,
  onComplete,
}: SoundHuntActivityProps) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [wrongTries, setWrongTries] = useState(0);
  const [shakeWord, setShakeWord] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const startedAtRef = useRef(Date.now());
  const roundStartRef = useRef(Date.now());

  const round = content.rounds[roundIndex];
  const choices = useMemo(
    () => shuffle([round.target, ...round.distractors]),
    [round],
  );

  const sayPrompt = useCallback(async () => {
    cancelSpeech();
    if (content.promptKind === "starts_with" && round.sound) {
      await speakSentence("Which word starts with");
      await speakPhoneme(round.sound);
    } else {
      await speakSentence("Tap the word");
      await speakWord(round.target);
    }
  }, [content.promptKind, round]);

  useEffect(() => {
    roundStartRef.current = Date.now();
    setWrongTries(0);
    setSolved(false);
    void sayPrompt();
  }, [roundIndex, sayPrompt]);

  const handleTap = useCallback(
    async (word: string) => {
      if (solved) return;
      if (word === round.target) {
        setSolved(true);
        playChime();
        void speakWord(round.target);
        const duration = Math.round(
          (Date.now() - roundStartRef.current) / 1000,
        );
        await tracker.recordAttempt({
          activityType: "phonics",
          format: "sound_hunt",
          contentRef: `${content.id}:${round.target}`,
          score: Math.max(0, 100 - 40 * wrongTries),
          durationSeconds: duration,
        });
        setTimeout(() => {
          const next = roundIndex + 1;
          if (next >= content.rounds.length) {
            onComplete({
              coinsEarned: content.rounds.length * COINS_PER_ROUND,
              durationSeconds: Math.round(
                (Date.now() - startedAtRef.current) / 1000,
              ),
            });
          } else {
            setRoundIndex(next);
          }
        }, 1100);
      } else {
        playClick();
        setWrongTries((n) => n + 1);
        setShakeWord(word);
        setTimeout(() => setShakeWord(null), 450);
        // Speak the word they actually tapped — instructive, not punitive (R25).
        void speakWord(word);
      }
    },
    [solved, round, roundIndex, wrongTries, content, tracker, onComplete],
  );

  return (
    <div className="flex flex-col items-center gap-8 px-4 py-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Round {roundIndex + 1} of {content.rounds.length}
        </p>
        <p className="mt-1 text-lg font-bold text-gray-700">{content.title}</p>
      </div>

      <button
        onClick={() => void sayPrompt()}
        className="flex min-h-12 items-center gap-2 rounded-2xl bg-purple-100 px-6 py-4 text-xl font-bold text-purple-700 shadow-sm hover:bg-purple-200 active:scale-95 transition-transform"
        aria-label="Hear it again"
      >
        🔊 Hear it again
      </button>

      <div className="grid w-full max-w-sm grid-cols-1 gap-4">
        {choices.map((word) => {
          const isTarget = word === round.target;
          const showCorrect = solved && isTarget;
          return (
            <button
              key={word}
              onClick={() => void handleTap(word)}
              disabled={solved}
              className={`min-h-16 rounded-2xl border-2 px-6 py-4 text-3xl font-bold transition-colors ${
                showCorrect
                  ? "tile-pop border-green-400 bg-green-50 text-green-700"
                  : "border-purple-200 bg-white text-gray-800 hover:bg-purple-50"
              } ${shakeWord === word ? "animate-shake" : ""}`}
            >
              {word}
            </button>
          );
        })}
      </div>

      {solved && (
        <p className="text-2xl font-extrabold text-green-600">⭐ Yes!</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build + commit**

```bash
git add src/components/activities/SoundHuntActivity.tsx
git commit -m "feat(activities): Sound Hunt tap-the-word game"
```

---

### Task 10: WordBuilderActivity

**Files:**
- Create: `src/components/activities/WordBuilderActivity.tsx`

Logic: tray of shuffled letter tiles (plus 2 distractor letters on `advanced`), empty slots above (one per letter). Drag a tile to a slot, or tap a tile to drop it into the first empty slot. When every slot is filled the word auto-checks: correct → all lock green, chime, word spoken, next word; wrong → tiles in correct positions lock, wrong ones shake and return to the tray. Tap an unlocked placed tile to send it back to the tray.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SpellingContent } from "@/lib/fixtures/student";
import type { SessionTracker } from "@/lib/tracker";
import { speakWord } from "@/lib/speech";
import { useTileDrag } from "@/hooks/useTileDrag";
import { playChime, playClick, playPop } from "@/lib/sfx";
import { shuffle } from "@/lib/shuffle";

interface WordBuilderActivityProps {
  content: SpellingContent;
  difficulty?: string;
  tracker: SessionTracker;
  onComplete: (result: { coinsEarned: number; durationSeconds: number }) => void;
}

const COINS_PER_WORD = 3;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

interface Tile {
  id: string;
  letter: string;
}

function makeTiles(word: string, withDistractors: boolean): Tile[] {
  const letters = word.toLowerCase().split("");
  if (withDistractors) {
    const pool = ALPHABET.filter((l) => !letters.includes(l));
    const extras = shuffle(pool).slice(0, 2);
    letters.push(...extras);
  }
  return shuffle(letters.map((letter, i) => ({ id: `t${i}-${letter}`, letter })));
}

export default function WordBuilderActivity({
  content,
  difficulty,
  tracker,
  onComplete,
}: WordBuilderActivityProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const currentWord = content.words[wordIndex];
  const word = currentWord.word.toLowerCase();

  const tiles = useMemo(
    () => makeTiles(word, difficulty === "advanced"),
    [word, difficulty],
  );

  // placed[i] = tile id occupying slot i (or null); locked[i] = confirmed correct.
  const [placed, setPlaced] = useState<(string | null)[]>(() =>
    Array(word.length).fill(null),
  );
  const [locked, setLocked] = useState<boolean[]>(() =>
    Array(word.length).fill(false),
  );
  const [shakeSlots, setShakeSlots] = useState<number[]>([]);
  const [wrongChecks, setWrongChecks] = useState(0);
  const [done, setDone] = useState(false);
  const startedAtRef = useRef(Date.now());
  const wordStartRef = useRef(Date.now());

  useEffect(() => {
    setPlaced(Array(word.length).fill(null));
    setLocked(Array(word.length).fill(false));
    setShakeSlots([]);
    setWrongChecks(0);
    setDone(false);
    wordStartRef.current = Date.now();
    void speakWord(currentWord.audioHint ?? currentWord.word);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordIndex]);

  const tileById = useCallback(
    (id: string) => tiles.find((t) => t.id === id),
    [tiles],
  );

  const placeTile = useCallback(
    (tileId: string, slotIdx: number) => {
      setPlaced((prev) => {
        if (prev[slotIdx] !== null || locked[slotIdx]) return prev;
        const next = prev.map((p) => (p === tileId ? null : p));
        next[slotIdx] = tileId;
        playPop();
        return next;
      });
    },
    [locked],
  );

  const returnTile = useCallback(
    (tileId: string) => {
      setPlaced((prev) => {
        const idx = prev.indexOf(tileId);
        if (idx === -1 || locked[idx]) return prev;
        const next = [...prev];
        next[idx] = null;
        return next;
      });
    },
    [locked],
  );

  const handleDrop = useCallback(
    (tileId: string, zoneId: string | null, moved: boolean) => {
      if (done) return;
      const isPlaced = placed.includes(tileId);
      if (!moved) {
        // Tap: placed tile goes back to tray; tray tile fills first empty slot.
        if (isPlaced) {
          returnTile(tileId);
        } else {
          const firstEmpty = placed.findIndex((p, i) => p === null && !locked[i]);
          if (firstEmpty !== -1) placeTile(tileId, firstEmpty);
        }
        return;
      }
      if (zoneId?.startsWith("slot-")) {
        placeTile(tileId, Number(zoneId.slice(5)));
      } else if (isPlaced) {
        returnTile(tileId);
      }
    },
    [done, placed, locked, placeTile, returnTile],
  );

  const { tileProps, zoneRef } = useTileDrag({ onDrop: handleDrop });

  // Auto-check when every slot is filled.
  useEffect(() => {
    if (done || placed.some((p) => p === null)) return;
    const built = placed.map((id) => tileById(id!)?.letter ?? "");
    if (built.join("") === word) {
      setDone(true);
      setLocked(Array(word.length).fill(true));
      playChime();
      void speakWord(currentWord.audioHint ?? currentWord.word);
      const duration = Math.round((Date.now() - wordStartRef.current) / 1000);
      void tracker.recordAttempt({
        activityType: "spelling",
        format: "word_builder",
        contentRef: `${content.id}:${currentWord.word}`,
        score: Math.max(0, 100 - 40 * wrongChecks),
        durationSeconds: duration,
      });
      setTimeout(() => {
        const next = wordIndex + 1;
        if (next >= content.words.length) {
          onComplete({
            coinsEarned: content.words.length * COINS_PER_WORD,
            durationSeconds: Math.round(
              (Date.now() - startedAtRef.current) / 1000,
            ),
          });
        } else {
          setWordIndex(next);
        }
      }, 1300);
    } else {
      // Lock correct positions, bounce the wrong ones back to the tray.
      setWrongChecks((n) => n + 1);
      playClick();
      const wrongIdx = placed
        .map((id, i) => (tileById(id!)?.letter === word[i] ? -1 : i))
        .filter((i) => i !== -1);
      setShakeSlots(wrongIdx);
      setLocked((prev) => prev.map((l, i) => l || !wrongIdx.includes(i)));
      setTimeout(() => {
        setShakeSlots([]);
        setPlaced((prev) =>
          prev.map((id, i) => (wrongIdx.includes(i) ? null : id)),
        );
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed, done]);

  const trayTiles = tiles.filter((t) => !placed.includes(t.id));

  return (
    <div className="flex flex-col items-center gap-8 px-4 py-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Word {wordIndex + 1} of {content.words.length}
        </p>
        <p className="mt-1 text-lg font-bold text-gray-700">{content.title}</p>
      </div>

      <button
        onClick={() => void speakWord(currentWord.audioHint ?? currentWord.word)}
        className="flex min-h-12 items-center gap-2 rounded-2xl bg-purple-100 px-6 py-4 text-xl font-bold text-purple-700 shadow-sm hover:bg-purple-200 active:scale-95 transition-transform"
        aria-label="Hear the word again"
      >
        🔊 Hear the word
      </button>

      {/* Slots */}
      <div className="flex gap-2">
        {placed.map((tileId, i) => {
          const tile = tileId ? tileById(tileId) : null;
          return (
            <div
              key={i}
              ref={zoneRef(`slot-${i}`)}
              className={`flex h-16 w-14 items-center justify-center rounded-xl border-2 text-3xl font-bold ${
                done
                  ? "tile-pop border-green-400 bg-green-50 text-green-700"
                  : locked[i]
                    ? "border-green-400 bg-green-50 text-green-700"
                    : tile
                      ? "border-purple-400 bg-purple-50 text-purple-800"
                      : "border-dashed border-gray-300 bg-white"
              } ${shakeSlots.includes(i) ? "animate-shake" : ""}`}
            >
              {tile ? (
                locked[i] || done ? (
                  <span>{tile.letter}</span>
                ) : (
                  <button {...tileProps(tile.id)} className="h-full w-full">
                    {tile.letter}
                  </button>
                )
              ) : null}
            </div>
          );
        })}
      </div>

      {done && (
        <p className="text-2xl font-extrabold text-green-600">⭐ You built it!</p>
      )}

      {/* Tray */}
      <div
        ref={zoneRef("tray")}
        className="flex min-h-20 flex-wrap items-center justify-center gap-3 rounded-3xl bg-amber-100/60 px-6 py-4"
      >
        {trayTiles.map((tile) => (
          <button
            key={tile.id}
            {...tileProps(tile.id)}
            className="flex h-16 w-14 items-center justify-center rounded-xl border-2 border-amber-300 bg-white text-3xl font-bold text-gray-800 shadow-sm"
          >
            {tile.letter}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build + commit**

```bash
git add src/components/activities/WordBuilderActivity.tsx
git commit -m "feat(activities): Word Builder drag-tile game"
```

---

### Task 11: MissingWordActivity

**Files:**
- Create: `src/components/activities/MissingWordActivity.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClozeContent } from "@/lib/fixtures/student";
import type { SessionTracker } from "@/lib/tracker";
import { speakWord, speakSentence } from "@/lib/speech";
import { useTileDrag } from "@/hooks/useTileDrag";
import { playChime, playClick } from "@/lib/sfx";
import { shuffle } from "@/lib/shuffle";

interface MissingWordActivityProps {
  content: ClozeContent;
  /** Which focus-area slot this game is filling (phonics or spelling). */
  area: "phonics" | "spelling";
  tracker: SessionTracker;
  onComplete: (result: { coinsEarned: number; durationSeconds: number }) => void;
}

const COINS_PER_SENTENCE = 3;

export default function MissingWordActivity({
  content,
  area,
  tracker,
  onComplete,
}: MissingWordActivityProps) {
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [wrongTries, setWrongTries] = useState(0);
  const [shakeTile, setShakeTile] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const startedAtRef = useRef(Date.now());
  const sentenceStartRef = useRef(Date.now());

  const sentence = content.sentences[sentenceIndex];
  const [before, after] = useMemo(
    () => sentence.text.split("___"),
    [sentence],
  );
  const choices = useMemo(
    () => shuffle([sentence.answer, ...sentence.distractors]),
    [sentence],
  );

  useEffect(() => {
    sentenceStartRef.current = Date.now();
    setWrongTries(0);
    setSolved(false);
  }, [sentenceIndex]);

  const tryWord = useCallback(
    async (word: string) => {
      if (solved) return;
      if (word === sentence.answer) {
        setSolved(true);
        playChime();
        // The reward: hear the sentence you built, read back in full.
        void speakSentence(sentence.text.replace("___", sentence.answer));
        const duration = Math.round(
          (Date.now() - sentenceStartRef.current) / 1000,
        );
        await tracker.recordAttempt({
          activityType: area,
          format: "missing_word",
          contentRef: `${content.id}:${sentence.answer}`,
          score: Math.max(0, 100 - 40 * wrongTries),
          durationSeconds: duration,
        });
        setTimeout(() => {
          const next = sentenceIndex + 1;
          if (next >= content.sentences.length) {
            onComplete({
              coinsEarned: content.sentences.length * COINS_PER_SENTENCE,
              durationSeconds: Math.round(
                (Date.now() - startedAtRef.current) / 1000,
              ),
            });
          } else {
            setSentenceIndex(next);
          }
        }, 2400);
      } else {
        playClick();
        setWrongTries((n) => n + 1);
        setShakeTile(word);
        setTimeout(() => setShakeTile(null), 450);
        void speakWord(word);
      }
    },
    [solved, sentence, sentenceIndex, wrongTries, area, content, tracker, onComplete],
  );

  const handleDrop = useCallback(
    (tileId: string, zoneId: string | null, moved: boolean) => {
      // Drag to the gap, or plain tap — both count as trying the word.
      if (!moved || zoneId === "gap") void tryWord(tileId);
    },
    [tryWord],
  );

  const { tileProps, zoneRef } = useTileDrag({ onDrop: handleDrop });

  return (
    <div className="flex flex-col items-center gap-8 px-4 py-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Sentence {sentenceIndex + 1} of {content.sentences.length}
        </p>
        <p className="mt-1 text-lg font-bold text-gray-700">{content.title}</p>
      </div>

      {/* Sentence with the gap (R21 passage typography via .passage) */}
      <p className="passage text-2xl font-bold leading-relaxed text-gray-800">
        {before}
        <span
          ref={zoneRef("gap")}
          className={`mx-1 inline-flex h-12 min-w-24 items-center justify-center rounded-xl border-2 px-3 align-middle ${
            solved
              ? "tile-pop border-green-400 bg-green-50 text-green-700"
              : "border-dashed border-purple-300 bg-purple-50/50"
          }`}
        >
          {solved ? sentence.answer : " "}
        </span>
        {after}
      </p>

      {solved && (
        <p className="text-2xl font-extrabold text-green-600">⭐ Yes!</p>
      )}

      {/* Word choices */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {choices.map((word) => {
          const hidden = solved && word === sentence.answer;
          return (
            <button
              key={word}
              {...tileProps(word)}
              disabled={solved}
              className={`min-h-14 rounded-2xl border-2 border-purple-200 bg-white px-6 py-3 text-2xl font-bold text-gray-800 shadow-sm ${
                hidden ? "invisible" : ""
              } ${shakeTile === word ? "animate-shake" : ""}`}
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

Note: tile ids for `useTileDrag` are the words themselves — they're unique within a round.

- [ ] **Step 2: Build + commit**

```bash
git add src/components/activities/MissingWordActivity.tsx
git commit -m "feat(activities): Missing Word cloze game"
```

---

### Task 12: Wire slots through page + PracticeRunner

**Files:**
- Modify: `src/app/student/practice/page.tsx`
- Modify: `src/app/student/practice/PracticeRunner.tsx`

- [ ] **Step 1: Rewrite `page.tsx` to build `PracticeSlot[]`**

Replace the content-fetch block (everything from `const rotation = ...` through the `return`) with:

```tsx
  // Dev-only override so all formats can be previewed without completing
  // sessions: /student/practice?rot=1
  const sp = await searchParams;
  const rotOverride = Number(sp?.rot);
  const rotation =
    process.env.NODE_ENV !== "production" && Number.isFinite(rotOverride)
      ? rotOverride
      : (completedCount ?? 0);

  const slots: PracticeSlot[] = [];
  for (const area of activities) {
    const difficulty = focusMap.get(area) ?? "beginner";
    const format = pickFormat(area, rotation);
    if (format === "blending") {
      slots.push({
        area: "phonics",
        format,
        content: await getPhonicsContent(supabase, difficulty, rotation),
      });
    } else if (format === "sound_hunt") {
      slots.push({
        area: "phonics",
        format,
        content: await getWordMatchContent(supabase, difficulty, rotation),
      });
    } else if (format === "typing") {
      slots.push({
        area: "spelling",
        format,
        content: await getSpellingContent(supabase, difficulty, rotation),
      });
    } else if (format === "word_builder") {
      slots.push({
        area: "spelling",
        format,
        content: await getSpellingContent(supabase, difficulty, rotation),
      });
    } else if (format === "missing_word") {
      slots.push({
        area: area as "phonics" | "spelling",
        format,
        content: await getClozeContent(supabase, difficulty, rotation),
      });
    } else {
      slots.push({
        area: "read_aloud",
        format: "read_aloud",
        content: await getReadAloudPassage(supabase, difficulty, rotation),
      });
    }
  }

  return <PracticeRunner student={student} slots={slots} />;
```

Function signature becomes:

```tsx
export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ rot?: string }>;
}) {
```

New imports: `getWordMatchContent, getClozeContent` from `@/lib/content`; `pickFormat` and type `PracticeSlot` from `@/lib/formats`. Keep the rest of the file (auth, student fetch, focus areas, completed count query) unchanged. Note the completed-count query must stay ABOVE this block since `rotation` falls back to it. The `focusMap`/`activities` derivation also stays. `difficulty` for word_builder passes through to the component via slot content? No — Word Builder needs the difficulty string for distractor letters: extend its slot push to keep using `difficulty`; PracticeRunner passes `difficulty` explicitly. Simplest: `WordBuilderActivity` receives `difficulty={slot.content.difficulty}` — `SpellingContent` already carries `difficulty`. Use that; no slot change needed.

- [ ] **Step 2: Rewrite `PracticeRunner.tsx`**

Props change to `{ student: Student; slots: PracticeSlot[] }`. Everything keyed off `activities` switches to `slots`; the activity area renders by `slot.format`:

```tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSessionTracker } from "@/lib/tracker";
import PhonicsActivity from "@/components/activities/PhonicsActivity";
import SpellingActivity from "@/components/activities/SpellingActivity";
import ReadAloudActivity from "@/components/activities/ReadAloudActivity";
import SoundHuntActivity from "@/components/activities/SoundHuntActivity";
import WordBuilderActivity from "@/components/activities/WordBuilderActivity";
import MissingWordActivity from "@/components/activities/MissingWordActivity";
import PetDisplay from "@/components/PetDisplay";
import type { PracticeSlot } from "@/lib/formats";
import type { Student } from "@/types/database";

interface PracticeRunnerProps {
  student: Student;
  slots: PracticeSlot[];
}

type PageState = "activity" | "complete";

export default function PracticeRunner({ student, slots }: PracticeRunnerProps) {
  const router = useRouter();

  const [activityIndex, setActivityIndex] = useState(0);
  const [pageState, setPageState] = useState<PageState>("activity");
  const [totalCoins, setTotalCoins] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  const trackerRef = useRef(createSessionTracker(student.id));

  const handleActivityComplete = useCallback(
    async (result: { coinsEarned?: number; durationSeconds?: number }) => {
      const coins = result.coinsEarned ?? 0;
      const duration = result.durationSeconds ?? 0;

      setTotalCoins((prev) => prev + coins);
      setTotalDuration((prev) => prev + duration);

      const nextIndex = activityIndex + 1;
      if (nextIndex >= slots.length) {
        const finalCoins = totalCoins + coins;
        const finalDuration = totalDuration + duration;
        await trackerRef.current.finish({
          coinsEarned: finalCoins,
          durationSeconds: finalDuration,
        });
        setPageState("complete");
      } else {
        setActivityIndex(nextIndex);
      }
    },
    [activityIndex, slots.length, totalCoins, totalDuration],
  );

  if (pageState === "complete") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-amber-50 px-4 py-10 gap-6">
        <div className="text-center">
          <div className="text-7xl mb-2">🎉</div>
          <h1 className="text-3xl font-extrabold text-purple-700">
            Practice done!
          </h1>
        </div>

        {/* Big coins number — clear and large per courtroom verdict.
          * Pet bounces once to react. No coin-fly animation. */}
        <p className="text-5xl font-extrabold text-amber-600">
          +{totalCoins} 🪙
        </p>

        <PetDisplay
          petType={student.pet_type}
          petName={student.pet_name}
          mood="excited"
          size="lg"
          bouncing
        />

        <p className="text-center text-base text-gray-600">
          {student.pet_name} loved that!
        </p>

        <button
          onClick={() => router.push("/student")}
          className="min-h-12 w-full max-w-xs rounded-2xl bg-purple-600 px-6 py-4 text-xl font-extrabold text-white shadow-lg hover:bg-purple-700 active:scale-95 transition-transform"
        >
          Back to Home 🏠
        </button>
      </div>
    );
  }

  const slot = slots[activityIndex];
  const progressPct = Math.round((activityIndex / slots.length) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-amber-50">
      {/* Progress bar */}
      <div className="h-2 bg-gray-200">
        <div
          className="h-2 bg-purple-500 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => router.push("/student")}
          className="min-h-12 min-w-12 px-3 text-sm font-semibold text-gray-400 hover:text-gray-600"
        >
          ← Home
        </button>
        <p className="text-sm font-bold text-gray-500">
          {activityIndex + 1} / {slots.length}
        </p>
        <div className="text-sm font-bold text-amber-600">
          🪙 {totalCoins}
        </div>
      </div>

      {/* Activity area */}
      <div className="flex-1">
        {slot.format === "blending" && (
          <PhonicsActivity
            content={slot.content}
            tracker={trackerRef.current}
            onComplete={handleActivityComplete}
          />
        )}
        {slot.format === "sound_hunt" && (
          <SoundHuntActivity
            content={slot.content}
            tracker={trackerRef.current}
            onComplete={handleActivityComplete}
          />
        )}
        {slot.format === "typing" && (
          <SpellingActivity
            content={slot.content}
            tracker={trackerRef.current}
            onComplete={handleActivityComplete}
          />
        )}
        {slot.format === "word_builder" && (
          <WordBuilderActivity
            content={slot.content}
            difficulty={slot.content.difficulty}
            tracker={trackerRef.current}
            onComplete={handleActivityComplete}
          />
        )}
        {slot.format === "missing_word" && (
          <MissingWordActivity
            content={slot.content}
            area={slot.area}
            tracker={trackerRef.current}
            onComplete={handleActivityComplete}
          />
        )}
        {slot.format === "read_aloud" && (
          <ReadAloudActivity
            passage={slot.content}
            tracker={trackerRef.current}
            onComplete={handleActivityComplete}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build + lint**

Run: `npm run build && npm run lint`
Expected: clean. If PhonicsActivity/ReadAloudActivity prop names differ from `content`/`passage`, match whatever the current file uses (they were untouched).

- [ ] **Step 4: Commit**

```bash
git add src/app/student/practice/page.tsx src/app/student/practice/PracticeRunner.tsx
git commit -m "feat(practice): format pools drive per-slot game selection"
```

---

### Task 13: Preview verification (iPad viewport)

No code — interactive verification per the spec.

- [ ] **Step 1:** Start the dev server (preview_start "wordpets", port 3000) and resize to 768×1024.
- [ ] **Step 2:** Log in as the existing test parent account and open `/student/practice?rot=0`, `?rot=1`, `?rot=2` in turn. Across the three rotations all six formats must appear (r0: blending + word_builder; r1: sound_hunt + missing_word; r2: missing_word + typing; read_aloud every time).
- [ ] **Step 3:** Play each new game to completion: verify TTS prompts fire, wrong answers shake + speak + allow retry, correct answers pop + chime, session completes and coins post.
- [ ] **Step 4:** Verify drag: pointer-drag a tile into a slot and into empty space; verify tap-to-place. Check console for errors (preview_console_logs).
- [ ] **Step 5:** DB check: `scripts/db.sh -c "select activity_type, format, score from activity_attempts order by created_at desc limit 12;"` — expect rows with format `sound_hunt` / `word_builder` / `missing_word` and slot-valued activity_type.
- [ ] **Step 6:** Fix anything broken (edit source, re-check), then screenshot each game for the user.

---

### Task 14: Extend the /wordpets-content skill

**Files:**
- Modify: `~/.claude/skills/wordpets-content/SKILL.md`

- [ ] **Step 1:** Read the skill file; append a section documenting the two new types, mirroring its existing per-type structure: the `WordMatchContent`/`ClozeContent` TS shapes (as in Task 3), the metadata JSON layout the seed script emits (as in Task 4), and authoring rules — decodability per band (R2/R3), distractors must make the sentence clearly wrong or silly (never a defensible alternative), 5 rounds per word-match set, 4 sentences per cloze set, `sound` required when `promptKind: "starts_with"`.
- [ ] **Step 2:** No commit (file lives outside the repo).

---

### Task 15: Docs

**Files:**
- Modify: `CLAUDE.md` (repo root)

- [ ] **Step 1:** In the Components section add the three new activity components + `useTileDrag`/`sfx`/`shuffle`/`formats` one-liners. In "Practice content pipeline" note the two new content types and that format selection is `pickFormat(area, rotation)` from `src/lib/formats.ts` with the dev-only `?rot=` override. Mention `activity_attempts.format`.
- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: mini-activities wave 1 architecture notes"
```

---

## Self-review notes

- Spec coverage: games (T9-T11), pools/rotation (T2, T12), content pipeline (T3-T5), migration (T1), tracking format (T2), SFX/drag primitives (T6-T7), CSS/reduced-motion (T8), verification/rollout (T13), skill (T14). Teacher dashboard: no changes needed (activity_type unchanged) — matches spec.
- Offset math: phonics `r%3` vs spelling `(r+1)%3` over length-3 pools never collide on missing_word (indices always differ).
- Type consistency: `PracticeSlot` in formats.ts matches page.tsx pushes and PracticeRunner narrowing; `format` strings match tracker inserts and DB column.
