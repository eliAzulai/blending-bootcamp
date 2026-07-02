# Reading Cartridge + Activity Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Plug the first subject (short-vowel CVC reading) into the merged adaptive engine: concept graph + item bank, three activities (blending, build-the-word, authoritative read-aloud), a `/student/adaptive` loop, and a gated builder feedback recorder.

**Architecture:** Pure-logic modules in `src/cartridges/reading/` (TDD, Vitest), thin client components over them, one small subject-agnostic sequencer change in `src/engine/`. Engine consumes only `{conceptId, correct, score, authoritative}` — the math-proof test must stay green. No practice-state writes to Supabase (piece 2); the standalone `feedback_notes` table is the single allowed write.

**Tech Stack:** TypeScript, Next.js 16 App Router, Vitest, existing speech pipeline (MediaRecorder → `/api/transcribe` Whisper), Web Speech TTS, Supabase (auth + `feedback_notes` only).

**Spec:** `docs/superpowers/specs/2026-07-02-wordpets-reading-cartridge-design.md` (contract ids C*/S*/P*/B*/A*/R*/F* below refer to it).

**Rules that apply to every child-facing surface:** `docs/non-negotiable-rules.md` — especially R1 (literacy font — components inherit it from the root layout; never set another font), R17 (never render a transcript to the child), R19 (≥48px targets; tiles/slots ≥56px), R25 (ban regex `missed|broken|lost|haven't|been a while|where have you|come back|tomorrow`), R26 (no idle animations during activities).

**Working directory:** the worktree `.claude/worktrees/spec+reading-cartridge` (branch `spec/reading-cartridge`; rename to `feat/reading-cartridge` in Task 1). All commands run from the worktree root.

---

## File structure

```
src/engine/sequencer.ts                      MODIFY  skip-rule (S1-S4)
src/engine/sequencer.test.ts                 MODIFY  update 1 test + add 3
src/lib/speech-recognition.ts                MODIFY  additive SpeechResult.error flag
src/cartridges/reading/types.ts              NEW     payload + item types
src/cartridges/reading/graph.ts              NEW     17-concept graph data (C1,C2)
src/cartridges/reading/words.ts              NEW     item bank + accept lists (C3)
src/cartridges/reading/strict-match.ts       NEW     authoritative matcher (A2)
src/cartridges/reading/policy.ts             NEW     SessionPolicy (P1-P6)
src/cartridges/reading/build-word-logic.ts   NEW     tiles + state machine (B2-B6)
src/cartridges/reading/read-aloud-logic.ts   NEW     attempt/failure machine (A3-A5)
src/cartridges/reading/cartridge.ts          NEW     Cartridge impl (buildActivity/runActivity)
src/cartridges/reading/*.test.ts             NEW     co-located tests for all of the above
src/components/adaptive/BuildWordActivity.tsx    NEW  thin UI (B1-B7)
src/components/adaptive/ReadAloudCheck.tsx       NEW  thin UI (A1-A6)
src/components/adaptive/BlendingRep.tsx          NEW  wraps BlendingExercise (P6)
src/components/adaptive/FeedbackButton.tsx       NEW  builder recorder (F1-F5)
src/app/student/adaptive/page.tsx            NEW     auth gate (R1 §2.6)
src/app/student/adaptive/AdaptiveRunner.tsx  NEW     loop + mic gate + done screen (R2-R5)
src/lib/feedback-notes.ts                    NEW     context stamp + localStorage queue (F3,F4)
src/lib/feedback-notes.test.ts               NEW
supabase/migrations/20260702_feedback_notes.sql  NEW  F2 table + RLS
```

---

### Task 1: Branch rename + sequencer skip-rule (S1-S4)

**Files:**
- Modify: `src/engine/sequencer.ts`
- Modify: `src/engine/sequencer.test.ts`

- [ ] **Step 1: Rename the branch** (spec commits stay on it; implementation continues on a feat/ name)

```bash
git branch -m spec/reading-cartridge feat/reading-cartridge
```

- [ ] **Step 2: Update the now-wrong test and add failing skip-rule tests**

In `src/engine/sequencer.test.ts`, REPLACE the final test `"re-offers a not-yet-due learning concept as a learn activity (never a review)"` with:

```ts
  it("skips a parked concept (learning, not due) and returns null when nothing else is eligible", () => {
    // S1/S3: after today's checkpoint the concept is parked; with a linear
    // graph nothing else is unlocked, so the session is over for today.
    const notDue: KnowledgeState = { ...blankState("at"), status: "learning", due: 10 * DAY };
    expect(selectNext(linearGraph, [notDue], 1 * DAY)).toBeNull();
  });

  it("skips a parked concept and learns an unparked sibling instead", () => {
    // Sibling graph: 'at' and 'an' have no prereqs.
    const siblings = {
      nodes: [
        { id: "at", subject: "reading", title: "-at" },
        { id: "an", subject: "reading", title: "-an" },
      ],
      edges: [],
    };
    const parkedAt: KnowledgeState = { ...blankState("at"), status: "learning", due: 10 * DAY };
    const pick = selectNext(siblings, [parkedAt], 1 * DAY);
    expect(pick).toEqual({ conceptId: "an", mode: "learn" });
  });

  it("still reviews a parked concept once it comes due", () => {
    const parked: KnowledgeState = { ...blankState("at"), status: "learning", due: 2 * DAY };
    expect(selectNext(linearGraph, [parked], 3 * DAY)).toEqual({ conceptId: "at", mode: "review" });
  });
```

- [ ] **Step 3: Run tests to verify the new ones fail**

Run: `npm test -- --run src/engine/sequencer.test.ts`
Expected: 2 FAIL (skip tests — current code returns `{conceptId:"at", mode:"learn"}` for parked concepts), rest PASS.

- [ ] **Step 4: Implement the skip-rule**

In `src/engine/sequencer.ts`, replace the learn phase (step 2 of the function):

```ts
  // 2. Otherwise learn the next frontier concept — skipping "parked" concepts
  // (learning with a future due date): their next exposure is the spaced
  // review, not more same-day checkpoints. Subject-agnostic scheduling logic.
  const parked = new Set(
    states
      .filter((s) => s.status === "learning" && s.due !== null && s.due > now)
      .map((s) => s.conceptId),
  );
  const frontier = computeFrontier(graph, states).filter((id) => !parked.has(id));
  if (frontier.length > 0) {
    return { conceptId: frontier[0], mode: "learn" };
  }

  // 3. Nothing owed, nothing new: today's session is complete.
  return null;
```

- [ ] **Step 5: Run the full suite (S4: math-proof test must stay green)**

Run: `npm test -- --run`
Expected: all pass (29 + 2 new = 32; the engine.test.ts math-proof test untouched and green).

- [ ] **Step 6: Commit**

```bash
git add src/engine/sequencer.ts src/engine/sequencer.test.ts
git commit -m "feat(engine): sequencer skips parked concepts in learn phase

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Cartridge types + concept graph data (C1, C2, C4)

**Files:**
- Create: `src/cartridges/reading/types.ts`
- Create: `src/cartridges/reading/graph.ts`
- Create: `src/cartridges/reading/graph.test.ts`

- [ ] **Step 1: Write the types file** (no test needed — types only)

```ts
// src/cartridges/reading/types.ts
/** Reading-cartridge internals. The ENGINE never imports from this file. */

export type ReadingActivityType = "blending" | "build_word" | "read_aloud_check";

export interface BankWord {
  word: string;
  phonemes: string[];
  /** Curated transcripts also accepted by the authoritative check (homophones). */
  accept: string[];
}

export interface BlendingPayload {
  kind: "blending";
  words: BankWord[];
}
export interface BuildWordPayload {
  kind: "build_word";
  word: string;
  tiles: string[];
}
export interface ReadAloudPayload {
  kind: "read_aloud_check";
  word: string;
  accept: string[];
}
export type ReadingPayload = BlendingPayload | BuildWordPayload | ReadAloudPayload;
```

- [ ] **Step 2: Write the failing graph test**

```ts
// src/cartridges/reading/graph.test.ts
import { describe, it, expect } from "vitest";
import { readingGraph, VOWEL_GROUPS } from "./graph";
import { validateGraph } from "@/engine/validate";

describe("reading concept graph", () => {
  it("has exactly 17 reading concepts in the specced teaching order (C1)", () => {
    expect(readingGraph.nodes.map((n) => n.id)).toEqual([
      "at", "an", "ap", "ag",
      "it", "in", "ig", "ip",
      "op", "ot", "og",
      "ug", "un", "ut",
      "et", "en", "ed",
    ]);
    expect(readingGraph.nodes.every((n) => n.subject === "reading")).toBe(true);
  });

  it("gates every family on every family of the previous vowel group (C2)", () => {
    // -it (group 2) requires all four group-1 families; -at requires nothing.
    const requiresOf = (id: string) =>
      readingGraph.edges.filter((e) => e.conceptId === id).map((e) => e.requiresId).sort();
    expect(requiresOf("at")).toEqual([]);
    expect(requiresOf("it")).toEqual(["ag", "an", "ap", "at"]);
    expect(requiresOf("et")).toEqual(["ug", "un", "ut"]);
    // No edges between siblings.
    expect(requiresOf("an")).toEqual([]);
    // Edge count: 4*4 + 4*3 + 3*3 + 3*3 = 46
    expect(readingGraph.edges).toHaveLength(46);
  });

  it("passes engine validation — no cycles, no dangling edges (C4)", () => {
    expect(() => validateGraph(readingGraph)).not.toThrow();
  });

  it("exposes the vowel grouping used to build the edges", () => {
    expect(VOWEL_GROUPS.flat()).toHaveLength(17);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test -- --run src/cartridges/reading/graph.test.ts`
Expected: FAIL — cannot resolve `./graph`.

- [ ] **Step 4: Implement the graph**

```ts
// src/cartridges/reading/graph.ts
import type { ConceptGraph, ConceptNode, PrereqEdge } from "@/engine/types";

/** Teaching order per spec C1: short a → i → o → u → e. */
export const VOWEL_GROUPS: string[][] = [
  ["at", "an", "ap", "ag"],
  ["it", "in", "ig", "ip"],
  ["op", "ot", "og"],
  ["ug", "un", "ut"],
  ["et", "en", "ed"],
];

const nodes: ConceptNode[] = VOWEL_GROUPS.flat().map((rime) => ({
  id: rime,
  subject: "reading",
  title: `-${rime} family`,
}));

// C2: every family in group N+1 requires every family in group N. Siblings
// share no edges, keeping the frontier 3-4 wide.
const edges: PrereqEdge[] = [];
for (let g = 1; g < VOWEL_GROUPS.length; g++) {
  for (const conceptId of VOWEL_GROUPS[g]) {
    for (const requiresId of VOWEL_GROUPS[g - 1]) {
      edges.push({ conceptId, requiresId });
    }
  }
}

export const readingGraph: ConceptGraph = { nodes, edges };
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npm test -- --run src/cartridges/reading/graph.test.ts`
Expected: 4 PASS.

- [ ] **Step 6: Commit**

```bash
git add src/cartridges/reading/types.ts src/cartridges/reading/graph.ts src/cartridges/reading/graph.test.ts
git commit -m "feat(cartridge): reading concept graph — 17 CVC families, vowel-group gating

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Item bank (C3)

**Files:**
- Create: `src/cartridges/reading/words.ts`
- Create: `src/cartridges/reading/words.test.ts`

- [ ] **Step 1: Write the failing structural test** (mechanical enforcement of C3 + R2)

```ts
// src/cartridges/reading/words.test.ts
import { describe, it, expect } from "vitest";
import { ITEM_BANK } from "./words";
import { readingGraph } from "./graph";

describe("reading item bank", () => {
  const conceptIds = readingGraph.nodes.map((n) => n.id);

  it("covers every concept with 4-6 words (C3)", () => {
    expect(Object.keys(ITEM_BANK).sort()).toEqual([...conceptIds].sort());
    for (const id of conceptIds) {
      expect(ITEM_BANK[id].length).toBeGreaterThanOrEqual(4);
      expect(ITEM_BANK[id].length).toBeLessThanOrEqual(6);
    }
  });

  it("every word is a 3-letter word ending in its family rime (C3)", () => {
    for (const id of conceptIds) {
      for (const { word } of ITEM_BANK[id]) {
        expect(word).toMatch(/^[a-z]{3}$/);
        expect(word.endsWith(id)).toBe(true);
      }
    }
  });

  it("every word is beginner-decodable: single letters only, no digraph phonemes (R2)", () => {
    for (const id of conceptIds) {
      for (const { word, phonemes } of ITEM_BANK[id]) {
        expect(phonemes).toHaveLength(3);
        expect(phonemes.join("")).toBe(word);
        for (const p of phonemes) expect(p).toHaveLength(1);
      }
    }
  });

  it("has no duplicate words across the bank", () => {
    const all = Object.values(ITEM_BANK).flat().map((w) => w.word);
    expect(new Set(all).size).toBe(all.length);
  });

  it("accept lists never contain the word itself", () => {
    for (const words of Object.values(ITEM_BANK)) {
      for (const { word, accept } of words) expect(accept).not.toContain(word);
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- --run src/cartridges/reading/words.test.ts`
Expected: FAIL — cannot resolve `./words`.

- [ ] **Step 3: Implement the item bank** (words seeded from `src/lib/fixtures/student.ts` + standard decodable CVC lists; accept lists are curated genuine homophones only)

```ts
// src/cartridges/reading/words.ts
import type { BankWord } from "./types";

const w = (word: string, accept: string[] = []): BankWord => ({
  word,
  phonemes: word.split(""),
  accept,
});

/** Item bank: 4-6 decodable CVC words per family concept (spec C3). */
export const ITEM_BANK: Record<string, BankWord[]> = {
  at: [w("cat"), w("hat"), w("mat", ["matt"]), w("bat"), w("rat"), w("sat")],
  an: [w("man"), w("pan"), w("fan"), w("can"), w("van"), w("ran")],
  ap: [w("cap"), w("map"), w("nap"), w("tap"), w("lap")],
  ag: [w("bag"), w("tag"), w("rag"), w("wag"), w("sag")],
  it: [w("sit"), w("bit"), w("hit"), w("fit"), w("pit")],
  in: [w("pin"), w("win"), w("tin"), w("bin"), w("fin")],
  ig: [w("pig"), w("big"), w("dig"), w("wig"), w("fig")],
  ip: [w("lip"), w("hip"), w("dip"), w("rip"), w("sip"), w("zip")],
  op: [w("hop"), w("top"), w("mop"), w("pop"), w("cop")],
  ot: [w("hot"), w("pot"), w("dot"), w("not", ["knot"]), w("got")],
  og: [w("dog"), w("log"), w("fog"), w("hog"), w("jog")],
  ug: [w("bug"), w("hug"), w("rug"), w("mug"), w("jug"), w("tug")],
  un: [w("sun", ["son"]), w("run"), w("fun"), w("bun"), w("nun", ["none"])],
  ut: [w("cut"), w("nut"), w("hut"), w("but", ["butt"]), w("rut")],
  et: [w("pet"), w("wet"), w("net"), w("get"), w("jet"), w("vet")],
  en: [w("hen"), w("ten"), w("pen"), w("men"), w("den")],
  ed: [w("bed"), w("red", ["read"]), w("fed"), w("led", ["lead"]), w("wed")],
};
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- --run src/cartridges/reading/words.test.ts`
Expected: 5 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cartridges/reading/words.ts src/cartridges/reading/words.test.ts
git commit -m "feat(cartridge): CVC item bank with curated homophone accept lists

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Strict word matcher (A2)

**Files:**
- Create: `src/cartridges/reading/strict-match.ts`
- Create: `src/cartridges/reading/strict-match.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/cartridges/reading/strict-match.test.ts
import { describe, it, expect } from "vitest";
import { matchWordStrict } from "./strict-match";

describe("matchWordStrict", () => {
  it("passes an exact token match with score 1.0", () => {
    expect(matchWordStrict("cat", [], ["cat"])).toEqual({ matched: true, score: 1.0 });
    expect(matchWordStrict("cat", [], ["the cat"])).toEqual({ matched: true, score: 1.0 });
  });

  it("normalizes case and punctuation", () => {
    expect(matchWordStrict("cat", [], ["Cat!"])).toEqual({ matched: true, score: 1.0 });
  });

  it("passes an accept-list entry with score 0.9", () => {
    expect(matchWordStrict("sun", ["son"], ["son"])).toEqual({ matched: true, score: 0.9 });
  });

  it("REJECTS near-misses that lenient matchWord would pass", () => {
    // Levenshtein distance 1 — a wrong reading, must fail (spec §3).
    expect(matchWordStrict("cat", [], ["bat"]).matched).toBe(false);
    // Substring inside another word is not a token match.
    expect(matchWordStrict("at", [], ["that"]).matched).toBe(false);
    // Child-substitution variants must fail.
    expect(matchWordStrict("red", [], ["wed"]).matched).toBe(false);
  });

  it("rejects empty and non-matching transcripts with score 0", () => {
    expect(matchWordStrict("cat", [], [])).toEqual({ matched: false, score: 0 });
    expect(matchWordStrict("cat", [], ["dog"])).toEqual({ matched: false, score: 0 });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- --run src/cartridges/reading/strict-match.test.ts`
Expected: FAIL — cannot resolve `./strict-match`.

- [ ] **Step 3: Implement**

```ts
// src/cartridges/reading/strict-match.ts
/**
 * Authoritative word matcher (spec A2). Deliberately strict: exact token or
 * curated accept-list ONLY. No edit distance, no child substitutions, no
 * accept-any tier — on 3-letter words those pass wrong readings ("bat" for
 * "cat") and poison the mastery signal. The lenient matcher in
 * src/lib/phoneme-matching.ts stays untouched for Phase 1a activities.
 */

export interface StrictMatch {
  matched: boolean;
  /** 1.0 exact, 0.9 accept-list, 0 otherwise. */
  score: number;
}

export function matchWordStrict(
  expected: string,
  accept: string[],
  transcripts: string[],
): StrictMatch {
  const target = expected.toLowerCase().trim();
  const acceptSet = new Set(accept.map((a) => a.toLowerCase().trim()));

  for (const raw of transcripts) {
    const tokens = raw
      .toLowerCase()
      .replace(/[^a-z' ]/g, "")
      .split(/\s+/)
      .filter(Boolean);
    if (tokens.includes(target)) return { matched: true, score: 1.0 };
    if (tokens.some((t) => acceptSet.has(t))) return { matched: true, score: 0.9 };
  }
  return { matched: false, score: 0 };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- --run src/cartridges/reading/strict-match.test.ts`
Expected: 5 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cartridges/reading/strict-match.ts src/cartridges/reading/strict-match.test.ts
git commit -m "feat(cartridge): strict authoritative word matcher — exact + accept-list only

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: `SpeechResult.error` flag (enables A5)

**Files:**
- Modify: `src/lib/speech-recognition.ts`

Background: `listenForSpeech` currently returns `{transcripts: [], confidence: 0}` both for silence AND for a failed `/api/transcribe` call. Spec A5 requires a transcription *failure* to not count as an attempt. Additive change only — existing callers ignore the new field, so Phase 1a behavior is unchanged.

- [ ] **Step 1: Add the field to the interface**

In `src/lib/speech-recognition.ts`, change `SpeechResult`:

```ts
export interface SpeechResult {
  transcripts: string[];
  confidence: number;
  /** true when /api/transcribe errored (network / non-2xx) — distinct from silence. */
  error?: boolean;
}
```

- [ ] **Step 2: Set it at the failure sites**

Inside `recorder.onstop`'s `try/catch` around the `/api/transcribe` fetch (near the bottom of `listenForSpeech`): where the code currently settles the empty result after a fetch error or a non-OK response, settle `{ transcripts: [], confidence: 0, error: true }` instead. Silence paths (tiny blob, no transcript text) stay exactly as they are (no `error` field). Read the function before editing; there are typically two failure settle sites (catch block, and `!res.ok`).

- [ ] **Step 3: Verify no behavior change**

Run: `npm test -- --run && npx tsc --noEmit 2>&1 | grep -v '.next/' | head -20`
Expected: all tests pass; no type errors under `src/**`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/speech-recognition.ts
git commit -m "feat(speech): flag transcription failures distinctly from silence

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: SessionPolicy (P1-P6)

**Files:**
- Create: `src/cartridges/reading/policy.ts`
- Create: `src/cartridges/reading/policy.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/cartridges/reading/policy.test.ts
import { describe, it, expect } from "vitest";
import { SessionPolicy } from "./policy";

describe("SessionPolicy", () => {
  it("cycles blending → build_word → read_aloud_check in learn mode (P2)", () => {
    const p = new SessionPolicy({ ttsAvailable: true, micAvailable: true });
    expect(p.activityFor("at", "learn")).toBe("blending");
    p.recordCompleted("at");
    expect(p.activityFor("at", "learn")).toBe("build_word");
    p.recordCompleted("at");
    expect(p.activityFor("at", "learn")).toBe("read_aloud_check");
  });

  it("counts reps per concept independently", () => {
    const p = new SessionPolicy({ ttsAvailable: true, micAvailable: true });
    p.recordCompleted("at");
    expect(p.activityFor("at", "learn")).toBe("build_word");
    expect(p.activityFor("an", "learn")).toBe("blending");
  });

  it("always picks the authoritative check in review mode (P1)", () => {
    const p = new SessionPolicy({ ttsAvailable: true, micAvailable: true });
    expect(p.activityFor("at", "review")).toBe("read_aloud_check");
  });

  it("does not advance the cycle until an activity completes (P2)", () => {
    const p = new SessionPolicy({ ttsAvailable: true, micAvailable: true });
    expect(p.activityFor("at", "learn")).toBe("blending");
    expect(p.activityFor("at", "learn")).toBe("blending"); // buildActivity may be re-called
  });

  it("substitutes blending when TTS is unavailable (P4: no build_word)", () => {
    const p = new SessionPolicy({ ttsAvailable: false, micAvailable: true });
    p.recordCompleted("at");
    expect(p.activityFor("at", "learn")).toBe("blending");
  });

  it("substitutes blending for checks when the mic is unavailable (P4)", () => {
    const p = new SessionPolicy({ ttsAvailable: true, micAvailable: false });
    p.recordCompleted("at");
    p.recordCompleted("at");
    expect(p.activityFor("at", "learn")).toBe("blending");
    expect(p.activityFor("at", "review")).toBe("blending");
  });

  it("resets the cycle after an abandoned checkpoint (P5)", () => {
    const p = new SessionPolicy({ ttsAvailable: true, micAvailable: true });
    p.recordCompleted("at");
    p.recordCompleted("at");
    expect(p.activityFor("at", "learn")).toBe("read_aloud_check");
    p.resetCycle("at");
    expect(p.activityFor("at", "learn")).toBe("blending");
  });

  it("picks words deterministically by rotation (P6)", () => {
    const p = new SessionPolicy({ ttsAvailable: true, micAvailable: true });
    const bank = ["cat", "hat", "mat", "bat"];
    expect(p.wordIndexFor("at", bank.length)).toBe(0);
    p.recordCompleted("at");
    expect(p.wordIndexFor("at", bank.length)).toBe(1);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- --run src/cartridges/reading/policy.test.ts`
Expected: FAIL — cannot resolve `./policy`.

- [ ] **Step 3: Implement**

```ts
// src/cartridges/reading/policy.ts
import type { ActivityMode } from "@/engine/types";
import type { ReadingActivityType } from "./types";

export interface DeviceCaps {
  ttsAvailable: boolean;
  micAvailable: boolean;
}

/**
 * Session-scoped activity selection (spec P1-P6). Counters live in memory for
 * one page visit; cross-day pacing comes from the engine's parked/review
 * scheduling, not from here.
 */
export class SessionPolicy {
  private reps = new Map<string, number>();

  constructor(private caps: DeviceCaps) {}

  activityFor(conceptId: string, mode: ActivityMode): ReadingActivityType {
    if (mode === "review") {
      return this.caps.micAvailable ? "read_aloud_check" : "blending";
    }
    const rep = this.reps.get(conceptId) ?? 0;
    if (rep % 3 === 2) {
      return this.caps.micAvailable ? "read_aloud_check" : "blending";
    }
    if (rep % 3 === 1) {
      return this.caps.ttsAvailable ? "build_word" : "blending";
    }
    return "blending";
  }

  /** Call once per produced ActivityResult (P2). */
  recordCompleted(conceptId: string): void {
    this.reps.set(conceptId, (this.reps.get(conceptId) ?? 0) + 1);
  }

  /** Abandoned checkpoint (transcription failure, A5/P5): two more games first. */
  resetCycle(conceptId: string): void {
    this.reps.set(conceptId, 0);
  }

  /** Deterministic word rotation within a concept (P6). */
  wordIndexFor(conceptId: string, bankSize: number): number {
    return (this.reps.get(conceptId) ?? 0) % bankSize;
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- --run src/cartridges/reading/policy.test.ts`
Expected: 8 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cartridges/reading/policy.ts src/cartridges/reading/policy.test.ts
git commit -m "feat(cartridge): session activity policy — 2 games then daily checkpoint

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Build-the-word logic (B2-B6)

**Files:**
- Create: `src/cartridges/reading/build-word-logic.ts`
- Create: `src/cartridges/reading/build-word-logic.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/cartridges/reading/build-word-logic.test.ts
import { describe, it, expect } from "vitest";
import {
  makeTiles,
  initBuildWord,
  placeTile,
  clearSlot,
  checkWord,
  buildWordResult,
} from "./build-word-logic";

describe("makeTiles (B2)", () => {
  it("returns the word letters plus exactly 2 distractors, deterministically", () => {
    const tiles = makeTiles("cat");
    expect(tiles).toHaveLength(5);
    expect(makeTiles("cat")).toEqual(tiles); // deterministic
    for (const l of ["c", "a", "t"]) expect(tiles).toContain(l);
    const distractors = tiles.filter((l) => !"cat".includes(l));
    expect(distractors).toHaveLength(2);
  });

  it("never picks a distractor already in the word", () => {
    for (const word of ["sun", "bed", "pig"]) {
      const distractors = makeTiles(word).filter((l) => !word.includes(l));
      expect(distractors).toHaveLength(2);
    }
  });
});

describe("build-word state machine (B3-B5)", () => {
  it("places a tapped tile in the leftmost empty slot and can return it", () => {
    let s = initBuildWord("cat");
    const tileId = s.tray.find((t) => t.letter === "t")!.id;
    s = placeTile(s, tileId);
    expect(s.slots[0]).toEqual({ tileId, letter: "t" });
    s = clearSlot(s, 0);
    expect(s.slots[0]).toBeNull();
    expect(s.tray.find((t) => t.id === tileId)!.used).toBe(false);
  });

  it("solves on a correct check", () => {
    let s = initBuildWord("cat");
    for (const letter of ["c", "a", "t"]) {
      s = placeTile(s, s.tray.find((t) => t.letter === letter && !t.used)!.id);
    }
    const r = checkWord(s);
    expect(r.outcome).toBe("solved");
  });

  it("returns all tiles on a wrong check and scaffolds after the 2nd (B4, B5)", () => {
    let s = initBuildWord("cat");
    const fillWrong = (st: typeof s) => {
      let x = st;
      for (const letter of ["t", "a", "c"]) {
        x = placeTile(x, x.tray.find((t) => t.letter === letter && !t.used)!.id);
      }
      return x;
    };
    let r = checkWord(fillWrong(s));
    expect(r.outcome).toBe("wrong");
    expect(r.state.slots.every((slot) => slot === null)).toBe(true);
    expect(r.state.scaffold).toBe(false);
    r = checkWord(fillWrong(r.state));
    expect(r.state.scaffold).toBe(true); // ghost letters now shown
  });
});

describe("buildWordResult (B6)", () => {
  it("scores 1.0 / 0.7 / 0.4 by first-check / second-check / scaffold", () => {
    expect(buildWordResult("at", 1, false)).toEqual({
      conceptId: "at", correct: true, score: 1.0, authoritative: false,
    });
    expect(buildWordResult("at", 2, false)).toEqual({
      conceptId: "at", correct: true, score: 0.7, authoritative: false,
    });
    expect(buildWordResult("at", 3, true)).toEqual({
      conceptId: "at", correct: false, score: 0.4, authoritative: false,
    });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- --run src/cartridges/reading/build-word-logic.test.ts`
Expected: FAIL — cannot resolve `./build-word-logic`.

- [ ] **Step 3: Implement**

```ts
// src/cartridges/reading/build-word-logic.ts
import type { ActivityResult } from "@/engine/types";

/** Deterministic tile generation (B2). No Math.random — rule R24. */
const DISTRACTOR_PREFERENCE = "srmpbtnlgdhcfwkjv".split("");

export function makeTiles(word: string): string[] {
  const letters = word.split("");
  const distractors = DISTRACTOR_PREFERENCE.filter((l) => !word.includes(l)).slice(0, 2);
  const all = [...letters, ...distractors];
  // Deterministic shuffle seeded by the word (simple LCG).
  let seed = 0;
  for (const ch of word) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  for (let i = all.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const j = seed % (i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

export interface TrayTile { id: number; letter: string; used: boolean }
export interface SlotFill { tileId: number; letter: string }
export interface BuildWordState {
  word: string;
  slots: (SlotFill | null)[];
  tray: TrayTile[];
  checks: number;
  scaffold: boolean;
}

export function initBuildWord(word: string): BuildWordState {
  return {
    word,
    slots: word.split("").map(() => null),
    tray: makeTiles(word).map((letter, id) => ({ id, letter, used: false })),
    checks: 0,
    scaffold: false,
  };
}

/** Tap a tray tile: fills the leftmost empty slot (B3). */
export function placeTile(state: BuildWordState, tileId: number): BuildWordState {
  const tile = state.tray.find((t) => t.id === tileId);
  const slotIndex = state.slots.findIndex((s) => s === null);
  if (!tile || tile.used || slotIndex === -1) return state;
  const slots = [...state.slots];
  slots[slotIndex] = { tileId, letter: tile.letter };
  const tray = state.tray.map((t) => (t.id === tileId ? { ...t, used: true } : t));
  return { ...state, slots, tray };
}

/** Tap a filled slot: returns its tile to the tray (B3). */
export function clearSlot(state: BuildWordState, slotIndex: number): BuildWordState {
  const fill = state.slots[slotIndex];
  if (!fill) return state;
  const slots = [...state.slots];
  slots[slotIndex] = null;
  const tray = state.tray.map((t) => (t.id === fill.tileId ? { ...t, used: false } : t));
  return { ...state, slots, tray };
}

export function checkWord(
  state: BuildWordState,
): { state: BuildWordState; outcome: "solved" | "wrong" | "incomplete" } {
  if (state.slots.some((s) => s === null)) return { state, outcome: "incomplete" };
  const spelled = state.slots.map((s) => s!.letter).join("");
  const checks = state.checks + 1;
  if (spelled === state.word) {
    return { state: { ...state, checks }, outcome: "solved" };
  }
  // Wrong: return all tiles; scaffold from the 2nd wrong check (B4, B5).
  const cleared: BuildWordState = {
    ...state,
    checks,
    scaffold: checks >= 2,
    slots: state.slots.map(() => null),
    tray: state.tray.map((t) => ({ ...t, used: false })),
  };
  return { state: cleared, outcome: "wrong" };
}

/** B6. `checks` = number of check presses used when finally solved. */
export function buildWordResult(
  conceptId: string,
  checks: number,
  scaffold: boolean,
): ActivityResult {
  const score = scaffold ? 0.4 : checks <= 1 ? 1.0 : 0.7;
  return { conceptId, correct: !scaffold && checks <= 1, score, authoritative: false };
}
```

**Correction to the sketch above (apply it):** spec B6 sets `correct: false` only for the scaffold case, so the return line must be

```ts
  return { conceptId, correct: !scaffold, score, authoritative: false };
```

(`correct` = solved without scaffold; `score` distinguishes first/second check.) The Step 1 test — `correct: true` at `checks: 2, scaffold: false` — encodes this correctly; do not "fix" the test.

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- --run src/cartridges/reading/build-word-logic.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cartridges/reading/build-word-logic.ts src/cartridges/reading/build-word-logic.test.ts
git commit -m "feat(cartridge): build-the-word tile logic and state machine

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Read-aloud attempt machine (A3-A5)

**Files:**
- Create: `src/cartridges/reading/read-aloud-logic.ts`
- Create: `src/cartridges/reading/read-aloud-logic.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/cartridges/reading/read-aloud-logic.test.ts
import { describe, it, expect } from "vitest";
import { initReadAloud, applyListen } from "./read-aloud-logic";

const ok = (t: string) => ({ transcripts: [t], confidence: 1 });
const silence = { transcripts: [], confidence: 0 };
const apiError = { transcripts: [], confidence: 0, error: true };

describe("read-aloud attempt machine", () => {
  it("completes immediately on a match (A4)", () => {
    const r = applyListen(initReadAloud("at", "cat", []), ok("cat"));
    expect(r.kind).toBe("done");
    if (r.kind === "done") {
      expect(r.result).toEqual({
        conceptId: "at", correct: true, score: 1.0, authoritative: true,
        signals: { transcript: "cat" },
      });
    }
  });

  it("scores 0.9 for an accept-list match (A4)", () => {
    const r = applyListen(initReadAloud("un", "sun", ["son"]), ok("son"));
    expect(r.kind).toBe("done");
    if (r.kind === "done") expect(r.result.score).toBe(0.9);
  });

  it("offers one retry on a first no-match, fails authoritatively on the second (A3)", () => {
    const s0 = initReadAloud("at", "cat", []);
    const r1 = applyListen(s0, ok("bat"));
    expect(r1.kind).toBe("retry");
    if (r1.kind !== "retry") throw new Error("expected retry");
    const r2 = applyListen(r1.state, ok("bat"));
    expect(r2.kind).toBe("done");
    if (r2.kind === "done") {
      expect(r2.result).toEqual({
        conceptId: "at", correct: false, score: 0, authoritative: true,
        signals: { transcript: "bat" },
      });
    }
  });

  it("treats silence as a no-match attempt, not a failure", () => {
    const r = applyListen(initReadAloud("at", "cat", []), silence);
    expect(r.kind).toBe("retry");
  });

  it("a transcription failure is NOT an attempt; two aborts the activity (A5)", () => {
    const s0 = initReadAloud("at", "cat", []);
    const r1 = applyListen(s0, apiError);
    expect(r1.kind).toBe("tech-retry");
    if (r1.kind !== "tech-retry") throw new Error("expected tech-retry");
    const r2 = applyListen(r1.state, apiError);
    expect(r2.kind).toBe("aborted");
    // A failure doesn't consume a read attempt: after ONE failure, a wrong
    // read still gets its normal retry.
    const r3 = applyListen(r1.state, ok("bat"));
    expect(r3.kind).toBe("retry");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- --run src/cartridges/reading/read-aloud-logic.test.ts`
Expected: FAIL — cannot resolve `./read-aloud-logic`.

- [ ] **Step 3: Implement**

```ts
// src/cartridges/reading/read-aloud-logic.ts
import type { ActivityResult } from "@/engine/types";
import type { SpeechResult } from "@/lib/speech-recognition";
import { matchWordStrict } from "./strict-match";

export interface ReadAloudState {
  conceptId: string;
  word: string;
  accept: string[];
  attempts: number;         // completed read attempts (max 2, A3)
  consecutiveFailures: number; // transcription failures in a row (max 2, A5)
}

export type ReadAloudStep =
  | { kind: "done"; result: ActivityResult }
  | { kind: "retry"; state: ReadAloudState }       // wrong read, attempt 2 available
  | { kind: "tech-retry"; state: ReadAloudState }  // transcription failed, try again
  | { kind: "aborted" };                            // 2 failures: NO result recorded

export function initReadAloud(
  conceptId: string,
  word: string,
  accept: string[],
): ReadAloudState {
  return { conceptId, word, accept, attempts: 0, consecutiveFailures: 0 };
}

export function applyListen(state: ReadAloudState, heard: SpeechResult): ReadAloudStep {
  if (heard.error) {
    const failures = state.consecutiveFailures + 1;
    if (failures >= 2) return { kind: "aborted" };
    return { kind: "tech-retry", state: { ...state, consecutiveFailures: failures } };
  }

  const match = matchWordStrict(state.word, state.accept, heard.transcripts);
  const transcript = heard.transcripts[0] ?? "";
  if (match.matched) {
    return {
      kind: "done",
      result: {
        conceptId: state.conceptId, correct: true, score: match.score,
        authoritative: true, signals: { transcript },
      },
    };
  }

  const attempts = state.attempts + 1;
  if (attempts >= 2) {
    return {
      kind: "done",
      result: {
        conceptId: state.conceptId, correct: false, score: 0,
        authoritative: true, signals: { transcript },
      },
    };
  }
  return { kind: "retry", state: { ...state, attempts, consecutiveFailures: 0 } };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- --run src/cartridges/reading/read-aloud-logic.test.ts`
Expected: 5 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cartridges/reading/read-aloud-logic.ts src/cartridges/reading/read-aloud-logic.test.ts
git commit -m "feat(cartridge): read-aloud attempt machine — failures never record a miss

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Cartridge assembly + full-loop integration test

**Files:**
- Create: `src/cartridges/reading/cartridge.ts`
- Create: `src/cartridges/reading/cartridge.test.ts`

- [ ] **Step 1: Write the failing test** (drives the REAL engine + REAL cartridge with a fake presenter and fake clock — proves the whole day-1 flow of the spec)

```ts
// src/cartridges/reading/cartridge.test.ts
import { describe, it, expect } from "vitest";
import { createEngine } from "@/engine/engine";
import { MemoryStore } from "@/engine/memory-store";
import { SimpleScheduler } from "@/engine/scheduler";
import type { ActivityRequest, ActivityResult } from "@/engine/types";
import { createReadingCartridge } from "./cartridge";
import { SessionPolicy } from "./policy";
import type { ReadingPayload } from "./types";

const DAY = 24 * 60 * 60 * 1000;

function autoPresenter(): (req: ActivityRequest) => Promise<ActivityResult> {
  // Fake UI: always succeeds — formative games solved first try,
  // read-aloud checks read correctly.
  return async (req) => {
    const p = req.payload as ReadingPayload;
    if (p.kind === "read_aloud_check") {
      return {
        conceptId: req.conceptId, correct: true, score: 1.0, authoritative: true,
      };
    }
    return { conceptId: req.conceptId, correct: true, score: 1.0, authoritative: false };
  };
}

describe("reading cartridge — full loop", () => {
  it("day 1: serves blending, build_word, then checkpoint per family, then parks it", async () => {
    let now = 0;
    const policy = new SessionPolicy({ ttsAvailable: true, micAvailable: true });
    const cartridge = createReadingCartridge(policy, autoPresenter());
    const engine = createEngine(cartridge, new MemoryStore(), new SimpleScheduler(), () => now);

    const served: string[] = [];
    for (let i = 0; i < 12; i++) {
      const req = await engine.nextActivity("kid", "reading");
      if (!req) break;
      served.push(`${req.conceptId}:${req.activityType}`);
      const result = await cartridge.runActivity(req);
      await engine.recordResult("kid", result);
    }

    // 4 short-a siblings × (blending, build_word, read_aloud_check)
    expect(served).toEqual([
      "at:blending", "at:build_word", "at:read_aloud_check",
      "an:blending", "an:build_word", "an:read_aloud_check",
      "ap:blending", "ap:build_word", "ap:read_aloud_check",
      "ag:blending", "ag:build_word", "ag:read_aloud_check",
    ]);
    // Everything parked → session over (S3).
    expect(await engine.nextActivity("kid", "reading")).toBeNull();
  });

  it("day 2+: reviews come back authoritative-only and mastery lands on day 3", async () => {
    let now = 0;
    const policy = new SessionPolicy({ ttsAvailable: true, micAvailable: true });
    const cartridge = createReadingCartridge(policy, autoPresenter());
    const engine = createEngine(cartridge, new MemoryStore(), new SimpleScheduler(), () => now);

    // Day 1: run the full session (12 activities).
    for (let i = 0; i < 12; i++) {
      const req = await engine.nextActivity("kid", "reading");
      const result = await cartridge.runActivity(req!);
      await engine.recordResult("kid", result);
    }
    // Day 2 (+25h): first pick is a review, and it is the authoritative check.
    now = 25 * 60 * 60 * 1000;
    const review = await engine.nextActivity("kid", "reading");
    expect(review!.activityType).toBe("read_aloud_check");
    // Clear all 4 reviews (2nd authoritative correct each).
    for (let i = 0; i < 4; i++) {
      const req = i === 0 ? review : await engine.nextActivity("kid", "reading");
      await engine.recordResult("kid", await cartridge.runActivity(req!));
    }
    // Day 4 (+2d interval): 3rd correct → mastered; short-i unlocks.
    now = 4 * DAY;
    for (let i = 0; i < 4; i++) {
      const req = await engine.nextActivity("kid", "reading");
      expect(req!.activityType).toBe("read_aloud_check");
      await engine.recordResult("kid", await cartridge.runActivity(req!));
    }
    const view = await engine.masteryState("kid", "reading");
    expect(view.mastered.sort()).toEqual(["ag", "an", "ap", "at"]);
    const next = await engine.nextActivity("kid", "reading");
    expect(["it", "in", "ig", "ip"]).toContain(next!.conceptId);
  });

  it("payloads carry what each activity needs", async () => {
    const policy = new SessionPolicy({ ttsAvailable: true, micAvailable: true });
    const cartridge = createReadingCartridge(policy, autoPresenter());
    const blending = cartridge.buildActivity("at", "learn");
    const bp = blending.payload as ReadingPayload;
    expect(bp.kind).toBe("blending");
    if (bp.kind === "blending") expect(bp.words).toHaveLength(2); // P6: 2 words per rep
    policy.recordCompleted("at");
    const bw = cartridge.buildActivity("at", "learn").payload as ReadingPayload;
    expect(bw.kind).toBe("build_word");
    if (bw.kind === "build_word") expect(bw.tiles).toHaveLength(5);
    policy.recordCompleted("at");
    const ra = cartridge.buildActivity("at", "learn").payload as ReadingPayload;
    expect(ra.kind).toBe("read_aloud_check");
    if (ra.kind === "read_aloud_check") expect(typeof ra.word).toBe("string");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- --run src/cartridges/reading/cartridge.test.ts`
Expected: FAIL — cannot resolve `./cartridge`.

- [ ] **Step 3: Implement**

```ts
// src/cartridges/reading/cartridge.ts
import type {
  ActivityMode,
  ActivityRequest,
  ActivityResult,
  Cartridge,
  ConceptGraph,
} from "@/engine/types";
import { readingGraph } from "./graph";
import { ITEM_BANK } from "./words";
import { makeTiles } from "./build-word-logic";
import type { SessionPolicy } from "./policy";
import type { ReadingPayload } from "./types";

export type Presenter = (req: ActivityRequest) => Promise<ActivityResult>;

/**
 * The reading cartridge. The engine sees only the Cartridge interface;
 * rendering is delegated to the injected presenter (the runner in the app,
 * a fake in tests). The presenter promise resolving IS the activity ending.
 */
export function createReadingCartridge(
  policy: SessionPolicy,
  present: Presenter,
): Cartridge {
  return {
    conceptGraph(): ConceptGraph {
      return readingGraph;
    },

    buildActivity(conceptId: string, mode: ActivityMode): ActivityRequest {
      const bank = ITEM_BANK[conceptId];
      const activityType = policy.activityFor(conceptId, mode);
      const i = policy.wordIndexFor(conceptId, bank.length);
      let payload: ReadingPayload;
      if (activityType === "blending") {
        payload = {
          kind: "blending",
          words: [bank[i], bank[(i + 1) % bank.length]],
        };
      } else if (activityType === "build_word") {
        payload = { kind: "build_word", word: bank[i].word, tiles: makeTiles(bank[i].word) };
      } else {
        payload = { kind: "read_aloud_check", word: bank[i].word, accept: bank[i].accept };
      }
      return { conceptId, activityType, payload };
    },

    async runActivity(req: ActivityRequest): Promise<ActivityResult> {
      const result = await present(req);
      policy.recordCompleted(req.conceptId);
      return result;
    },
  };
}
```

- [ ] **Step 4: Run the full suite**

Run: `npm test -- --run`
Expected: all PASS (this is the spec's core proof: policy + skip-rule + engine produce spaced, sibling-rotating sessions).

- [ ] **Step 5: Commit**

```bash
git add src/cartridges/reading/cartridge.ts src/cartridges/reading/cartridge.test.ts
git commit -m "feat(cartridge): assemble reading cartridge; full-loop integration test

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: feedback_notes migration (F2)

**Files:**
- Create: `supabase/migrations/20260702_feedback_notes.sql`

- [ ] **Step 1: Write the migration** (matches the house raw-SQL style in `supabase/schema-v2.sql`)

```sql
-- supabase/migrations/20260702_feedback_notes.sql
-- Builder feedback notes (dev prototype requirements loop; spec 2026-07-02 §2.7).
-- Standalone by design: references NO practice schema (piece-2 boundary).
-- Transcript text only — audio is never stored.

create table if not exists feedback_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  transcript text not null,
  context jsonb not null default '{}',
  created_at timestamptz default now() not null
);

alter table feedback_notes enable row level security;

create policy "Owners insert own notes" on feedback_notes
  for insert with check (auth.uid() = user_id);
create policy "Owners read own notes" on feedback_notes
  for select using (auth.uid() = user_id);
```

- [ ] **Step 2: Commit** (applying to the live DB happens at integration time via `scripts/db.sh -f supabase/migrations/20260702_feedback_notes.sql` — do NOT run it from this task; note it in the task report)

```bash
git add supabase/migrations/20260702_feedback_notes.sql
git commit -m "feat(db): feedback_notes table with owner-only RLS

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: Feedback capture logic (F3, F4)

**Files:**
- Create: `src/lib/feedback-notes.ts`
- Create: `src/lib/feedback-notes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/feedback-notes.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { SessionEventLog, FeedbackQueue, type NoteSaver } from "./feedback-notes";

describe("SessionEventLog (F3)", () => {
  it("keeps only the last 5 activity results", () => {
    const log = new SessionEventLog();
    for (let i = 0; i < 7; i++) {
      log.record({ conceptId: `c${i}`, activityType: "blending", correct: true, score: 1, authoritative: false });
    }
    const ctx = log.context("/student/adaptive", { conceptId: "c6", activityType: "blending", mode: "learn", rep: 2 });
    expect(ctx.recentResults).toHaveLength(5);
    expect(ctx.recentResults[0].conceptId).toBe("c2");
    expect(ctx.route).toBe("/student/adaptive");
    expect(ctx.active).toEqual({ conceptId: "c6", activityType: "blending", mode: "learn", rep: 2 });
  });
});

describe("FeedbackQueue (F4)", () => {
  // In-memory storage stub (tests run in node, no real localStorage).
  let store: Record<string, string>;
  const storage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
  };
  beforeEach(() => { store = {}; });

  it("saves directly when the saver succeeds", async () => {
    const saved: unknown[] = [];
    const saver: NoteSaver = async (n) => { saved.push(n); };
    const q = new FeedbackQueue(saver, storage);
    await q.submit({ transcript: "too easy", context: { route: "/x" } });
    expect(saved).toHaveLength(1);
    expect(storage.getItem("wp-feedback-queue")).toBeNull();
  });

  it("queues to storage on failure and flushes later (a note is never lost)", async () => {
    let failing = true;
    const saved: unknown[] = [];
    const saver: NoteSaver = async (n) => {
      if (failing) throw new Error("offline");
      saved.push(n);
    };
    const q = new FeedbackQueue(saver, storage);
    await q.submit({ transcript: "note 1", context: {} });
    expect(saved).toHaveLength(0);
    expect(JSON.parse(storage.getItem("wp-feedback-queue")!)).toHaveLength(1);
    failing = false;
    await q.submit({ transcript: "note 2", context: {} }); // next note triggers flush
    expect(saved).toHaveLength(2);
    expect(storage.getItem("wp-feedback-queue")).toBeNull();
  });

  it("flush() alone drains the queue (page-load retry)", async () => {
    const saved: unknown[] = [];
    storage.setItem("wp-feedback-queue", JSON.stringify([{ transcript: "old", context: {} }]));
    const q = new FeedbackQueue(async (n) => { saved.push(n); }, storage);
    await q.flush();
    expect(saved).toHaveLength(1);
    expect(storage.getItem("wp-feedback-queue")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- --run src/lib/feedback-notes.test.ts`
Expected: FAIL — cannot resolve `./feedback-notes`.

- [ ] **Step 3: Implement**

```ts
// src/lib/feedback-notes.ts
/**
 * Builder feedback capture support (spec §2.7). Pure logic — no React, no
 * Supabase import; the saver and storage are injected so tests use stubs.
 */

export interface ActivityEvent {
  conceptId: string;
  activityType: string;
  correct: boolean;
  score: number;
  authoritative: boolean;
}

export interface ActiveActivity {
  conceptId: string;
  activityType: string;
  mode: "learn" | "review";
  rep: number;
}

export interface NoteContext {
  route: string;
  active: ActiveActivity | null;
  recentResults: ActivityEvent[];
}

export interface FeedbackNote {
  transcript: string;
  context: Record<string, unknown>;
}

export class SessionEventLog {
  private events: ActivityEvent[] = [];

  record(event: ActivityEvent): void {
    this.events.push(event);
    if (this.events.length > 5) this.events.shift();
  }

  context(route: string, active: ActiveActivity | null): NoteContext {
    return { route, active, recentResults: [...this.events] };
  }
}

export type NoteSaver = (note: FeedbackNote) => Promise<void>;

interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

const QUEUE_KEY = "wp-feedback-queue";

/** F4: failed saves land in storage and retry on the next submit or flush. */
export class FeedbackQueue {
  constructor(private saver: NoteSaver, private storage: StorageLike) {}

  private readQueue(): FeedbackNote[] {
    try {
      return JSON.parse(this.storage.getItem(QUEUE_KEY) ?? "[]") as FeedbackNote[];
    } catch {
      return [];
    }
  }

  private writeQueue(notes: FeedbackNote[]): void {
    if (notes.length === 0) this.storage.removeItem(QUEUE_KEY);
    else this.storage.setItem(QUEUE_KEY, JSON.stringify(notes));
  }

  async flush(): Promise<void> {
    const pending = this.readQueue();
    const stillPending: FeedbackNote[] = [];
    for (const note of pending) {
      try {
        await this.saver(note);
      } catch {
        stillPending.push(note);
      }
    }
    this.writeQueue(stillPending);
  }

  async submit(note: FeedbackNote): Promise<void> {
    await this.flush();
    try {
      await this.saver(note);
    } catch {
      this.writeQueue([...this.readQueue(), note]);
    }
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- --run src/lib/feedback-notes.test.ts`
Expected: 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/feedback-notes.ts src/lib/feedback-notes.test.ts
git commit -m "feat(feedback): event log, context stamping, never-lose-a-note queue

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: Activity UI components (B1-B7, A1-A6, blending wrapper)

No unit tests (spec constraint: no jsdom/RTL in this piece — all decision logic already lives in the tested modules). Gate: `npx tsc --noEmit` + `npm run lint` + `npm run build`. Every child-facing string must survive the R25 ban regex `missed|broken|lost|haven't|been a while|where have you|come back|tomorrow`; no idle animations (R26); tappables ≥56px (R19); never render transcripts (R17).

**Files:**
- Create: `src/components/adaptive/BuildWordActivity.tsx`
- Create: `src/components/adaptive/ReadAloudCheck.tsx`
- Create: `src/components/adaptive/BlendingRep.tsx`

- [ ] **Step 1: BuildWordActivity**

```tsx
// src/components/adaptive/BuildWordActivity.tsx
"use client";

import { useEffect, useState } from "react";
import { speakWord } from "@/lib/speech";
import type { ActivityResult } from "@/engine/types";
import type { BuildWordPayload } from "@/cartridges/reading/types";
import {
  initBuildWord,
  placeTile,
  clearSlot,
  checkWord,
  buildWordResult,
  type BuildWordState,
} from "@/cartridges/reading/build-word-logic";

interface Props {
  conceptId: string;
  payload: BuildWordPayload;
  onResult: (result: ActivityResult) => void;
}

export default function BuildWordActivity({ conceptId, payload, onResult }: Props) {
  const [state, setState] = useState<BuildWordState>(() => initBuildWord(payload.word));
  const [shake, setShake] = useState(false);
  const [solved, setSolved] = useState(false);

  // B1: speak the word once on start.
  useEffect(() => {
    speakWord(payload.word).catch(() => {});
  }, [payload.word]);

  const allFilled = state.slots.every((s) => s !== null);

  function handleCheck() {
    const { state: next, outcome } = checkWord(state);
    if (outcome === "solved") {
      setState(next);
      setSolved(true);
      setTimeout(() => onResult(buildWordResult(conceptId, next.checks, next.scaffold)), 900);
    } else {
      setState(next);
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <button
        onClick={() => speakWord(payload.word).catch(() => {})}
        className="min-h-14 min-w-14 rounded-full bg-purple-100 text-3xl"
        aria-label="Hear the word again"
      >
        🔊
      </button>
      <p className="text-xl text-purple-900">Tap the letters to build the word</p>

      <div className={`flex gap-2 ${shake ? "animate-shake" : ""}`}>
        {state.slots.map((fill, i) => (
          <button
            key={i}
            onClick={() => fill && setState(clearSlot(state, i))}
            className="relative flex h-16 w-16 items-center justify-center rounded-xl border-4 border-purple-300 bg-white text-4xl font-bold lowercase"
          >
            {/* B5: ghost scaffold letters after 2 wrong checks */}
            {!fill && state.scaffold && (
              <span className="absolute text-purple-200">{payload.word[i]}</span>
            )}
            {fill?.letter}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {state.tray.map((tile) => (
          <button
            key={tile.id}
            disabled={tile.used || solved}
            onClick={() => setState(placeTile(state, tile.id))}
            className={`h-16 w-16 rounded-xl text-4xl font-bold lowercase shadow ${
              tile.used ? "invisible" : "bg-amber-100"
            }`}
          >
            {tile.letter}
          </button>
        ))}
      </div>

      {solved ? (
        <p className="text-2xl font-bold text-green-600">You built it! 🎉</p>
      ) : (
        <button
          onClick={handleCheck}
          disabled={!allFilled}
          className="min-h-14 rounded-full bg-purple-600 px-8 text-xl font-bold text-white disabled:opacity-40"
        >
          Check
        </button>
      )}
    </div>
  );
}
```

Add the shake keyframes to `src/app/globals.css` (calm, single 400ms run — R6/R26 compliant):

```css
@keyframes wp-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}
.animate-shake { animation: wp-shake 0.4s ease-in-out 1; }
```

(If a `.animate-shake`/shake keyframe already exists in `globals.css`, reuse it instead of adding a duplicate.)

- [ ] **Step 2: ReadAloudCheck**

```tsx
// src/components/adaptive/ReadAloudCheck.tsx
"use client";

import { useState } from "react";
import { listenForSpeech } from "@/lib/speech-recognition";
import type { ActivityResult } from "@/engine/types";
import type { ReadAloudPayload } from "@/cartridges/reading/types";
import {
  initReadAloud,
  applyListen,
  type ReadAloudState,
} from "@/cartridges/reading/read-aloud-logic";

interface Props {
  conceptId: string;
  payload: ReadAloudPayload;
  onResult: (result: ActivityResult) => void;
  /** A5: two transcription failures — abort WITHOUT a result. */
  onAbort: () => void;
}

type Phase = "ready" | "listening" | "retry" | "tech-retry" | "done";

export default function ReadAloudCheck({ conceptId, payload, onResult, onAbort }: Props) {
  const [machine, setMachine] = useState<ReadAloudState>(() =>
    initReadAloud(conceptId, payload.word, payload.accept),
  );
  const [phase, setPhase] = useState<Phase>("ready");

  async function listen() {
    setPhase("listening");
    const heard = await listenForSpeech({ timeoutMs: 3000 });
    const step = applyListen(machine, heard);
    if (step.kind === "done") {
      setPhase("done");
      // R17: never show the transcript; generic positive acknowledgment only.
      setTimeout(() => onResult(step.result), 900);
    } else if (step.kind === "aborted") {
      onAbort();
    } else {
      setMachine(step.state);
      setPhase(step.kind); // "retry" | "tech-retry"
    }
  }

  const prompt =
    phase === "retry"
      ? "Good try! Say it nice and loud!"
      : phase === "tech-retry"
        ? "Hmm, my ears glitched. One more time!"
        : "Read this word out loud";

  return (
    <div className="flex flex-col items-center gap-8 p-6">
      <p className="text-xl text-purple-900">{prompt}</p>
      <p className="text-7xl font-bold lowercase text-gray-900">{payload.word}</p>
      {phase === "done" ? (
        <p className="text-2xl font-bold text-green-600">Great reading!</p>
      ) : (
        <button
          onClick={listen}
          disabled={phase === "listening"}
          className="min-h-16 min-w-16 rounded-full bg-orange-500 px-8 py-4 text-2xl font-bold text-white"
        >
          {phase === "listening" ? "Listening…" : "🎤 Read it!"}
        </button>
      )}
    </div>
  );
}
```

Note: "done" shows "Great reading!" for BOTH correct and incorrect authoritative outcomes — warm, forward-looking feedback per A6; the engine records the truth, the child gets encouragement. Do not add a red/wrong state.

- [ ] **Step 3: BlendingRep** (thin wrapper: N words through the existing `BlendingExercise`, then one formative result)

```tsx
// src/components/adaptive/BlendingRep.tsx
"use client";

import { useState } from "react";
import BlendingExercise from "@/components/BlendingExercise";
import type { ActivityResult } from "@/engine/types";
import type { BlendingPayload } from "@/cartridges/reading/types";

interface Props {
  conceptId: string;
  payload: BlendingPayload;
  onResult: (result: ActivityResult) => void;
}

export default function BlendingRep({ conceptId, payload, onResult }: Props) {
  const [index, setIndex] = useState(0);

  function handleComplete() {
    if (index + 1 < payload.words.length) {
      setIndex(index + 1);
    } else {
      // Formative: participation is the signal (existing mechanic is lenient
      // by design); the engine ignores formative results for mastery.
      onResult({ conceptId, correct: true, score: 1.0, authoritative: false });
    }
  }

  const item = payload.words[index];
  return (
    <BlendingExercise
      key={item.word}
      word={item.word}
      phonemes={item.phonemes}
      onComplete={handleComplete}
      speechEnabled
    />
  );
}
```

- [ ] **Step 4: Gate**

Run: `npx tsc --noEmit 2>&1 | grep -v '.next/' | head -20 && npm run lint`
Expected: no errors under `src/**`; lint clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/adaptive/ src/app/globals.css
git commit -m "feat(adaptive): build-word, read-aloud check, blending rep components

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 13: Runner + route + feedback button (§2.6 R1-R5, §2.7 F1-F5)

**Files:**
- Create: `src/app/student/adaptive/page.tsx`
- Create: `src/app/student/adaptive/AdaptiveRunner.tsx`
- Create: `src/components/adaptive/FeedbackButton.tsx`

- [ ] **Step 1: Server page (auth gate, same pattern as `/student/practice`)**

```tsx
// src/app/student/adaptive/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Student } from "@/types/database";
import AdaptiveRunner from "./AdaptiveRunner";

export default async function AdaptivePage({
  searchParams,
}: {
  searchParams: Promise<{ builder?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: studentData } = await supabase
    .from("students")
    .select("*")
    .eq("parent_id", user.id)
    .single();
  if (!studentData) redirect("/student");

  const student = studentData as Student;
  const { builder } = await searchParams;

  return <AdaptiveRunner studentId={student.id} builderMode={builder === "1"} />;
}
```

- [ ] **Step 2: AdaptiveRunner** (client loop; presenter-as-render; mic gate; cap 10; done screen)

```tsx
// src/app/student/adaptive/AdaptiveRunner.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createEngine, type Engine } from "@/engine/engine";
import { MemoryStore } from "@/engine/memory-store";
import { SimpleScheduler } from "@/engine/scheduler";
import type { ActivityRequest, ActivityResult } from "@/engine/types";
import { createReadingCartridge } from "@/cartridges/reading/cartridge";
import { SessionPolicy } from "@/cartridges/reading/policy";
import type { ReadingPayload } from "@/cartridges/reading/types";
import { requestMicPermission } from "@/lib/speech-recognition";
import { SessionEventLog } from "@/lib/feedback-notes";
import BuildWordActivity from "@/components/adaptive/BuildWordActivity";
import ReadAloudCheck from "@/components/adaptive/ReadAloudCheck";
import BlendingRep from "@/components/adaptive/BlendingRep";
import FeedbackButton from "@/components/adaptive/FeedbackButton";

type Phase = "intro" | "running" | "done";
const FORMATIVE_ONLY_CAP = 10; // §2.6 R2

interface Props {
  studentId: string;
  builderMode: boolean;
}

export default function AdaptiveRunner({ studentId, builderMode }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [micGranted, setMicGranted] = useState(false);
  const [current, setCurrent] = useState<ActivityRequest | null>(null);
  const [servedCount, setServedCount] = useState(0);

  const engineRef = useRef<Engine | null>(null);
  const policyRef = useRef<SessionPolicy | null>(null);
  const eventLogRef = useRef(new SessionEventLog());
  // The presenter resolves when the rendered activity reports a result.
  const resolverRef = useRef<((r: ActivityResult) => void) | null>(null);

  const advance = useCallback(async (count: number, mic: boolean) => {
    const engine = engineRef.current!;
    if (!mic && count >= FORMATIVE_ONLY_CAP) {
      setPhase("done");
      return;
    }
    const req = await engine.nextActivity(studentId, "reading");
    if (!req) {
      setPhase("done");
      return;
    }
    setCurrent(req);
  }, [studentId]);

  async function start() {
    const granted = await requestMicPermission();
    setMicGranted(granted);
    const ttsAvailable = typeof window !== "undefined" && "speechSynthesis" in window;
    const policy = new SessionPolicy({ ttsAvailable, micAvailable: granted });
    policyRef.current = policy;
    const cartridge = createReadingCartridge(policy, (req) => {
      // Presenter: rendering is driven by `current`; the promise resolves
      // when the on-screen activity calls handleResult.
      void req;
      return new Promise<ActivityResult>((resolve) => {
        resolverRef.current = resolve;
      });
    });
    engineRef.current = createEngine(
      cartridge, new MemoryStore(), new SimpleScheduler(), () => Date.now(),
    );
    setPhase("running");
    await advance(0, granted);
  }

  async function handleResult(result: ActivityResult) {
    const engine = engineRef.current!;
    eventLogRef.current.record({
      conceptId: result.conceptId,
      activityType: current?.activityType ?? "",
      correct: result.correct,
      score: result.score,
      authoritative: result.authoritative,
    });
    policyRef.current!.recordCompleted(result.conceptId);
    await engine.recordResult(studentId, result);
    resolverRef.current = null;
    const count = servedCount + 1;
    setServedCount(count);
    setCurrent(null);
    await advance(count, micGranted);
  }

  // A5/P5: checkpoint aborted on transcription failure — no result recorded.
  async function handleAbort() {
    if (current) policyRef.current!.resetCycle(current.conceptId);
    resolverRef.current = null;
    setCurrent(null);
    await advance(servedCount, micGranted);
  }

  // NOTE: we intentionally do NOT call cartridge.runActivity from the runner
  // (its recordCompleted bookkeeping is done in handleResult instead) — the
  // rendered component IS the presenter. cartridge.runActivity exists for the
  // engine-facing interface and headless tests.

  useEffect(() => () => { resolverRef.current = null; }, []);

  return (
    <main className="min-h-screen bg-amber-50 px-4 py-8">
      {phase === "intro" && (
        <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
          <h1 className="text-3xl font-bold text-purple-900">Word Practice</h1>
          <p className="text-lg text-gray-700">
            Play word games and read words out loud!
          </p>
          <button
            onClick={start}
            className="min-h-14 rounded-full bg-purple-600 px-10 py-4 text-2xl font-bold text-white"
          >
            Start
          </button>
        </div>
      )}

      {phase === "running" && (
        <div className="mx-auto max-w-lg">
          {!micGranted && (
            <p className="mb-4 rounded-xl bg-purple-100 p-3 text-center text-purple-900">
              Reading checks need the microphone — playing games for now!
            </p>
          )}
          {current && renderActivity(current, handleResult, handleAbort)}
        </div>
      )}

      {phase === "done" && (
        <div className="mx-auto flex max-w-md flex-col items-center gap-6 pt-16 text-center">
          <p className="text-6xl">🎉</p>
          <h1 className="text-3xl font-bold text-purple-900">You did it! All done!</h1>
          <p className="text-lg text-gray-700">Great word work today!</p>
        </div>
      )}

      {builderMode && (
        <FeedbackButton
          eventLog={eventLogRef.current}
          active={
            current
              ? {
                  conceptId: current.conceptId,
                  activityType: current.activityType,
                  mode: "learn",
                  rep: servedCount,
                }
              : null
          }
        />
      )}
    </main>
  );
}

function renderActivity(
  req: ActivityRequest,
  onResult: (r: ActivityResult) => void,
  onAbort: () => void,
) {
  const payload = req.payload as ReadingPayload;
  if (payload.kind === "build_word") {
    return (
      <BuildWordActivity
        key={`${req.conceptId}-${payload.word}`}
        conceptId={req.conceptId}
        payload={payload}
        onResult={onResult}
      />
    );
  }
  if (payload.kind === "read_aloud_check") {
    return (
      <ReadAloudCheck
        key={`${req.conceptId}-${payload.word}`}
        conceptId={req.conceptId}
        payload={payload}
        onResult={onResult}
        onAbort={onAbort}
      />
    );
  }
  return (
    <BlendingRep
      key={`${req.conceptId}-${payload.words[0].word}`}
      conceptId={req.conceptId}
      payload={payload}
      onResult={onResult}
    />
  );
}
```

**Implementation note for the worker:** the runner records policy/rep bookkeeping in `handleResult`, so the presenter passed to `createReadingCartridge` is only used by headless paths; if double-counting appears (rep advancing by 2), check that `cartridge.runActivity` is NOT also being invoked by the runner. Task 9's cartridge calls `policy.recordCompleted` inside `runActivity`; the runner deliberately bypasses `runActivity` and must therefore do its own `recordCompleted` (as shown). Keep exactly one bookkeeping path.

**`mode` in the FeedbackButton context:** `ActivityRequest` doesn't carry mode. Accept the simplification: report `"learn"`; F3's value is concept/activity/result context. (Adding mode to the request would touch the engine contract — out of scope.)

- [ ] **Step 3: FeedbackButton** (F1 gating happens in page/runner via `builderMode`; this component records → transcribes → saves)

```tsx
// src/components/adaptive/FeedbackButton.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createClient, supabaseIsConfigured } from "@/lib/supabase/client";
import {
  FeedbackQueue,
  SessionEventLog,
  type ActiveActivity,
  type FeedbackNote,
} from "@/lib/feedback-notes";

interface Props {
  eventLog: SessionEventLog;
  active: ActiveActivity | null;
}

async function transcribeBlob(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", blob, "note.webm");
  const res = await fetch("/api/transcribe", { method: "POST", body: form });
  if (!res.ok) throw new Error(`transcribe failed: ${res.status}`);
  const data = (await res.json()) as { text?: string };
  return data.text ?? "";
}

function makeSaver() {
  return async (note: FeedbackNote) => {
    if (!supabaseIsConfigured()) throw new Error("supabase not configured");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("not signed in");
    const { error } = await supabase.from("feedback_notes").insert({
      user_id: user.id,
      transcript: note.transcript,
      context: note.context,
    });
    if (error) throw new Error(error.message);
  };
}

export default function FeedbackButton({ eventLog, active }: Props) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const contextRef = useRef<Record<string, unknown>>({});
  const queueRef = useRef<FeedbackQueue | null>(null);

  useEffect(() => {
    queueRef.current = new FeedbackQueue(makeSaver(), window.localStorage);
    void queueRef.current.flush(); // F4: page-load retry
  }, []);

  async function toggle() {
    if (busy) return;
    if (!recording) {
      // F3: stamp context at note START.
      contextRef.current = { ...eventLog.context(window.location.pathname, active) };
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setBusy(true);
        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          const transcript = await transcribeBlob(blob);
          if (transcript.trim()) {
            await queueRef.current!.submit({ transcript, context: contextRef.current });
          }
        } catch {
          // transcription itself failed — nothing to queue (no transcript, and
          // we never store audio); the builder simply re-records.
        } finally {
          setBusy(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } else {
      recorderRef.current?.stop();
      recorderRef.current = null;
      setRecording(false);
    }
  }

  return (
    <button
      onClick={toggle}
      className={`fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg ${
        recording ? "bg-red-500" : "bg-gray-800"
      } text-2xl text-white`}
      aria-label={recording ? "Stop note" : "Record a builder note"}
    >
      {busy ? "…" : recording ? "■" : "🎙️"}
    </button>
  );
}
```

**F5 note:** the runner renders activities and the FeedbackButton as siblings; a read-aloud recording and a note recording could contend for the mic. Add the F5 guard: pass `disabled={/* current activity is read_aloud_check AND its phase is listening */}`. Simplest compliant version: in `AdaptiveRunner`, don't render `FeedbackButton` while `current?.activityType === "read_aloud_check"` — one mic consumer at a time by construction. Implement it that way (change the `builderMode && …` condition to `builderMode && current?.activityType !== "read_aloud_check" && …`).

- [ ] **Step 4: Gate + smoke check**

Run: `npm test -- --run && npx tsc --noEmit 2>&1 | grep -v '.next/' | head -20 && npm run lint && npm run build`
Expected: tests pass; no `src/**` type errors; lint and build clean.

- [ ] **Step 5: R25 ban-regex check on the new surfaces**

Run: `grep -riE "missed|broken|lost|haven't|been a while|where have you|come back|tomorrow" src/app/student/adaptive/ src/components/adaptive/`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/app/student/adaptive/ src/components/adaptive/FeedbackButton.tsx
git commit -m "feat(adaptive): /student/adaptive loop with mic gate and builder feedback

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 14: Final verification + docs

**Files:**
- Modify: `CLAUDE.md` (routes list + adaptive section pointer)

- [ ] **Step 1: Full gate**

```bash
npm test -- --run
npx tsc --noEmit 2>&1 | grep -v '.next/' | head -20
npm run lint
npm run build
```
Expected: everything green (~55+ tests).

- [ ] **Step 2: Manual browser verification** (needs `.env.local` via `npm run pull-secrets`; NOTE: the Infisical `blending-bootcamp` OPENAI_API_KEY may be out of credits — read-aloud/notes transcription will 500 until topped up; verify the failure path still behaves per A5 in that case)

Start `npm run dev`, then verify at `http://localhost:3000/student/adaptive?builder=1` (sign in as the test parent):
1. Mic prompt appears on Start; grant it.
2. First activity is blending on an `-at` word; second is build-the-word (word is SPOKEN, not shown; 5 tiles; tap-to-place; wrong spelling shakes; scaffold after 2 misses); third is the read-aloud check (word shown large).
3. After all four short-a families: "You did it! All done!" screen.
4. 🎙️ button records a note; check the `feedback_notes` row in Supabase has transcript + context. Reload → button only with `?builder=1`.
5. Deny mic (fresh browser profile): banner appears, only games serve, session ends after 10.

- [ ] **Step 3: Update `CLAUDE.md`** — in the "Routes (Phase 1a — current)" list add:

```markdown
- `/student/adaptive` — adaptive reading loop (engine + reading cartridge; dev prototype, MemoryStore-backed). `?builder=1` reveals the feedback recorder. Spec: `docs/superpowers/specs/2026-07-02-wordpets-reading-cartridge-design.md`.
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: register /student/adaptive route and reading-cartridge spec

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Post-plan integration

When all tasks are done and green: use **superpowers:finishing-a-development-branch**. Merge target is `main` (Plan 1 used merge-to-main). Applying `supabase/migrations/20260702_feedback_notes.sql` to the live DB (`scripts/db.sh -f …`) happens at integration, before the feature is used on a real device.
