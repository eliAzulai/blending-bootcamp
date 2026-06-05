# Adaptive Engine Core — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the subject-agnostic adaptive engine (concept-graph frontier, spaced-review scheduling, mastery model, next-activity sequencing) as pure in-memory TypeScript with full unit tests — no UI, no database.

**Architecture:** Pure functions + small interfaces in `src/engine/`. The engine consumes only `{ conceptId, correct, score, authoritative }` from a `Cartridge` and never inspects activity payloads (the boundary invariant). Persistence and UI arrive in later plans behind the `KnowledgeStore` interface defined here.

**Tech Stack:** TypeScript, Vitest (new to this repo). Scheduling uses a swappable `Scheduler` interface with a simple deterministic v0 implementation (interval-doubling) so the core takes no external dependency; production FSRS (`ts-fsrs`) can replace it later without touching the engine.

> **Spec:** `docs/superpowers/specs/2026-06-05-wordpets-adaptive-reading-engine-design.md`
> **Deliberate deviation from spec §5.1 (flag for reviewer):** spec names FSRS directly. This plan hides scheduling behind a `Scheduler` interface and ships a deterministic v0 stand-in, keeping the pure core dependency-free and tests deterministic. FSRS slots in later as one `Scheduler` implementation. If you want `ts-fsrs` from day one, say so and Task 5 changes.

**This plan is Plan 1 of a sequence.** Later plans (not in scope here): Supabase-backed `KnowledgeStore`, the reading cartridge + activity layer, the parent progress screen.

---

## File Structure

- `vitest.config.ts` — test runner config (new)
- `src/engine/types.ts` — all engine types + the `Cartridge`, `KnowledgeStore`, `Scheduler` interfaces
- `src/engine/frontier.ts` — `computeFrontier(graph, states)` pure graph traversal
- `src/engine/scheduler.ts` — `SimpleScheduler` v0 implementation of the `Scheduler` interface
- `src/engine/mastery.ts` — `applyResult(state, result, now, scheduler)` mastery transitions
- `src/engine/sequencer.ts` — `selectNext(graph, states, now)` review-before-new selection
- `src/engine/memory-store.ts` — in-memory `KnowledgeStore` for tests/dev
- `src/engine/engine.ts` — `createEngine(cartridge, store, scheduler, clock)` façade
- `src/engine/*.test.ts` — co-located unit tests
- `src/engine/test-helpers.ts` — `FakeCartridge` + graph fixtures used across tests

---

## Task 1: Test runner setup (Vitest)

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (scripts + devDependencies)
- Create: `src/engine/smoke.test.ts` (throwaway, deleted in Task 2)

- [ ] **Step 1: Install Vitest**

Run:
```bash
cd ~/projects/wordpets && npm install -D vitest@^2
```
Expected: `vitest` appears under devDependencies, exit 0.

- [ ] **Step 2: Add the config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 3: Add the test script**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write a smoke test**

Create `src/engine/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: PASS, 1 test passed.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/engine/smoke.test.ts
git commit -m "test: add vitest runner and smoke test"
```

---

## Task 2: Engine types & interfaces

**Files:**
- Create: `src/engine/types.ts`
- Delete: `src/engine/smoke.test.ts`

- [ ] **Step 1: Define the types**

Create `src/engine/types.ts`:
```ts
/** A single teachable concept (subject-tagged so the engine hosts any subject's graph). */
export interface ConceptNode {
  id: string;
  subject: string;
  title: string;
}

/** "conceptId requires requiresId to be mastered first." */
export interface PrereqEdge {
  conceptId: string;
  requiresId: string;
}

export interface ConceptGraph {
  nodes: ConceptNode[];
  edges: PrereqEdge[];
}

export type MasteryStatus = "unseen" | "learning" | "mastered";

/** Per-(child, concept) learning state. Scheduling fields are scheduler-owned. */
export interface KnowledgeState {
  conceptId: string;
  status: MasteryStatus;
  authoritativeAttempts: number;
  authoritativeCorrect: number;
  /** Epoch ms when this concept is next due for review; null = not scheduled. */
  due: number | null;
  /** Opaque scheduler bookkeeping (e.g. current interval in ms). */
  intervalMs: number;
  /** Epoch ms of last authoritative review; null = never. */
  lastReview: number | null;
}

/** What the engine asks the cartridge to render. Engine treats payload as OPAQUE. */
export interface ActivityRequest {
  conceptId: string;
  activityType: string;
  payload: unknown;
}

/** What an activity reports back. The ONLY thing the engine consumes. */
export interface ActivityResult {
  conceptId: string;
  correct: boolean;
  /** 0..1 */
  score: number;
  /** true = counts toward mastery; false = formative practice only. */
  authoritative: boolean;
  signals?: Record<string, unknown>;
}

export type ActivityMode = "learn" | "review";

/** A subject. The engine never looks inside payloads or activity internals. */
export interface Cartridge {
  conceptGraph(): ConceptGraph;
  /** Cartridge chooses the concrete activity (game vs authoritative check) for this concept+mode. */
  buildActivity(conceptId: string, mode: ActivityMode): ActivityRequest;
  runActivity(req: ActivityRequest): Promise<ActivityResult>;
}

/** Persistence boundary. In-memory now; Supabase later — engine doesn't care. */
export interface KnowledgeStore {
  get(childId: string, conceptId: string): Promise<KnowledgeState | null>;
  getAll(childId: string): Promise<KnowledgeState[]>;
  put(childId: string, state: KnowledgeState): Promise<void>;
}

/** Spaced-review scheduling, swappable (SimpleScheduler now, FSRS later). */
export interface Scheduler {
  /** Compute the next state's scheduling fields after an authoritative review. */
  schedule(state: KnowledgeState, correct: boolean, now: number): KnowledgeState;
}

/** Fresh state for a never-seen concept. */
export function blankState(conceptId: string): KnowledgeState {
  return {
    conceptId,
    status: "unseen",
    authoritativeAttempts: 0,
    authoritativeCorrect: 0,
    due: null,
    intervalMs: 0,
    lastReview: null,
  };
}
```

- [ ] **Step 2: Delete the smoke test**

Run: `rm src/engine/smoke.test.ts`

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 4: Commit**

```bash
git add src/engine/types.ts
git rm --cached src/engine/smoke.test.ts 2>/dev/null; true
git commit -m "feat(engine): add core types and interfaces"
```

---

## Task 3: Test helpers (FakeCartridge + fixtures)

**Files:**
- Create: `src/engine/test-helpers.ts`

- [ ] **Step 1: Write the helpers**

Create `src/engine/test-helpers.ts`:
```ts
import type {
  Cartridge,
  ConceptGraph,
  ActivityRequest,
  ActivityResult,
  ActivityMode,
} from "./types";

/**
 * A 3-concept linear reading-ish graph: at -> it -> op (each requires the previous).
 * Used to verify frontier/sequencing without any real subject.
 */
export const linearGraph: ConceptGraph = {
  nodes: [
    { id: "at", subject: "reading", title: "-at family" },
    { id: "it", subject: "reading", title: "-it family" },
    { id: "op", subject: "reading", title: "-op family" },
  ],
  edges: [
    { conceptId: "it", requiresId: "at" },
    { conceptId: "op", requiresId: "it" },
  ],
};

/**
 * A throwaway subject the engine drives in the boundary test. It carries a
 * deliberately weird payload to prove the engine never inspects it.
 */
export class FakeCartridge implements Cartridge {
  public built: ActivityRequest[] = [];

  constructor(
    private graph: ConceptGraph = linearGraph,
    /** What runActivity returns; default = authoritative correct. */
    private result: Partial<ActivityResult> = {},
  ) {}

  conceptGraph(): ConceptGraph {
    return this.graph;
  }

  buildActivity(conceptId: string, mode: ActivityMode): ActivityRequest {
    const req: ActivityRequest = {
      conceptId,
      activityType: mode === "review" ? "fake-check" : "fake-learn",
      payload: { secret: "engine must never read this", mode },
    };
    this.built.push(req);
    return req;
  }

  async runActivity(req: ActivityRequest): Promise<ActivityResult> {
    return {
      conceptId: req.conceptId,
      correct: this.result.correct ?? true,
      score: this.result.score ?? 1,
      authoritative: this.result.authoritative ?? true,
      signals: this.result.signals,
    };
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/engine/test-helpers.ts
git commit -m "test(engine): add FakeCartridge and graph fixtures"
```

---

## Task 4: Frontier computation

**Files:**
- Create: `src/engine/frontier.ts`
- Test: `src/engine/frontier.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/engine/frontier.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { computeFrontier } from "./frontier";
import { linearGraph } from "./test-helpers";
import { blankState, type KnowledgeState } from "./types";

function states(map: Record<string, KnowledgeState["status"]>): KnowledgeState[] {
  return Object.entries(map).map(([conceptId, status]) => ({
    ...blankState(conceptId),
    status,
  }));
}

describe("computeFrontier", () => {
  it("returns only roots when nothing is mastered", () => {
    const frontier = computeFrontier(linearGraph, states({}));
    expect(frontier).toEqual(["at"]); // 'it' and 'op' have unmet prereqs
  });

  it("advances the frontier as prereqs are mastered", () => {
    const frontier = computeFrontier(linearGraph, states({ at: "mastered" }));
    expect(frontier).toEqual(["it"]);
  });

  it("excludes already-mastered concepts", () => {
    const frontier = computeFrontier(
      linearGraph,
      states({ at: "mastered", it: "mastered" }),
    );
    expect(frontier).toEqual(["op"]);
  });

  it("is empty when everything is mastered", () => {
    const frontier = computeFrontier(
      linearGraph,
      states({ at: "mastered", it: "mastered", op: "mastered" }),
    );
    expect(frontier).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npm test -- frontier`
Expected: FAIL — `computeFrontier` is not defined / module not found.

- [ ] **Step 3: Implement**

Create `src/engine/frontier.ts`:
```ts
import type { ConceptGraph, KnowledgeState } from "./types";

/**
 * The frontier = concepts not yet mastered whose every prerequisite IS mastered.
 * Order follows graph.nodes order for determinism.
 */
export function computeFrontier(
  graph: ConceptGraph,
  states: KnowledgeState[],
): string[] {
  const statusOf = new Map(states.map((s) => [s.conceptId, s.status]));
  const isMastered = (id: string) => statusOf.get(id) === "mastered";

  const prereqs = new Map<string, string[]>();
  for (const node of graph.nodes) prereqs.set(node.id, []);
  for (const edge of graph.edges) {
    prereqs.get(edge.conceptId)?.push(edge.requiresId);
  }

  return graph.nodes
    .map((n) => n.id)
    .filter((id) => !isMastered(id))
    .filter((id) => (prereqs.get(id) ?? []).every(isMastered));
}
```

- [ ] **Step 4: Run it, verify pass**

Run: `npm test -- frontier`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/engine/frontier.ts src/engine/frontier.test.ts
git commit -m "feat(engine): add frontier computation"
```

---

## Task 5: SimpleScheduler (v0 spaced review)

**Files:**
- Create: `src/engine/scheduler.ts`
- Test: `src/engine/scheduler.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/engine/scheduler.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { SimpleScheduler } from "./scheduler";
import { blankState } from "./types";

const DAY = 24 * 60 * 60 * 1000;

describe("SimpleScheduler", () => {
  const sched = new SimpleScheduler();

  it("sets a 1-day interval on first correct review", () => {
    const next = sched.schedule(blankState("at"), true, 0);
    expect(next.intervalMs).toBe(DAY);
    expect(next.due).toBe(DAY);
    expect(next.lastReview).toBe(0);
  });

  it("doubles the interval on subsequent correct reviews", () => {
    const first = sched.schedule(blankState("at"), true, 0);
    const second = sched.schedule(first, true, first.due!);
    expect(second.intervalMs).toBe(2 * DAY);
    expect(second.due).toBe(first.due! + 2 * DAY);
  });

  it("resets the interval to 1 day on an incorrect review", () => {
    const grown = { ...blankState("at"), intervalMs: 8 * DAY, due: 8 * DAY };
    const next = sched.schedule(grown, false, 8 * DAY);
    expect(next.intervalMs).toBe(DAY);
    expect(next.due).toBe(9 * DAY);
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npm test -- scheduler`
Expected: FAIL — `SimpleScheduler` not defined.

- [ ] **Step 3: Implement**

Create `src/engine/scheduler.ts`:
```ts
import type { KnowledgeState, Scheduler } from "./types";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Deterministic v0 scheduler: interval doubles on success, resets to 1 day on
 * failure. Swappable for FSRS (ts-fsrs) later via the Scheduler interface.
 */
export class SimpleScheduler implements Scheduler {
  schedule(state: KnowledgeState, correct: boolean, now: number): KnowledgeState {
    const nextInterval = correct
      ? state.intervalMs === 0
        ? DAY
        : state.intervalMs * 2
      : DAY;
    return {
      ...state,
      intervalMs: nextInterval,
      due: now + nextInterval,
      lastReview: now,
    };
  }
}
```

- [ ] **Step 4: Run it, verify pass**

Run: `npm test -- scheduler`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/engine/scheduler.ts src/engine/scheduler.test.ts
git commit -m "feat(engine): add SimpleScheduler v0 spaced review"
```

---

## Task 6: Mastery model

**Files:**
- Create: `src/engine/mastery.ts`
- Test: `src/engine/mastery.test.ts`

Mastery rule (v0): a concept becomes `mastered` after **3 authoritative correct** reviews; any authoritative attempt moves `unseen` → `learning`. **Formative results never change mastery or scheduling.**

- [ ] **Step 1: Write the failing test**

Create `src/engine/mastery.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { applyResult, MASTERY_THRESHOLD } from "./mastery";
import { SimpleScheduler } from "./scheduler";
import { blankState, type ActivityResult } from "./types";

const sched = new SimpleScheduler();

function authoritative(correct: boolean): ActivityResult {
  return { conceptId: "at", correct, score: correct ? 1 : 0, authoritative: true };
}

describe("applyResult", () => {
  it("ignores formative results entirely", () => {
    const before = blankState("at");
    const after = applyResult(before, { ...authoritative(true), authoritative: false }, 0, sched);
    expect(after).toEqual(before);
  });

  it("moves unseen -> learning on first authoritative attempt", () => {
    const after = applyResult(blankState("at"), authoritative(true), 0, sched);
    expect(after.status).toBe("learning");
    expect(after.authoritativeAttempts).toBe(1);
    expect(after.authoritativeCorrect).toBe(1);
    expect(after.due).not.toBeNull();
  });

  it("masters after THRESHOLD correct authoritative reviews", () => {
    let s = blankState("at");
    let now = 0;
    for (let i = 0; i < MASTERY_THRESHOLD; i++) {
      s = applyResult(s, authoritative(true), now, sched);
      now = s.due!;
    }
    expect(s.status).toBe("mastered");
    expect(s.authoritativeCorrect).toBe(MASTERY_THRESHOLD);
  });

  it("does not count incorrect attempts toward mastery", () => {
    let s = applyResult(blankState("at"), authoritative(true), 0, sched);
    s = applyResult(s, authoritative(false), s.due!, sched);
    expect(s.authoritativeCorrect).toBe(1);
    expect(s.authoritativeAttempts).toBe(2);
    expect(s.status).toBe("learning");
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npm test -- mastery`
Expected: FAIL — `applyResult` not defined.

- [ ] **Step 3: Implement**

Create `src/engine/mastery.ts`:
```ts
import type { ActivityResult, KnowledgeState, Scheduler } from "./types";

export const MASTERY_THRESHOLD = 3;

/**
 * Apply an activity result to a concept's state.
 * - Formative results (authoritative === false) are ignored: returns state unchanged.
 * - Authoritative results update counters, scheduling, and mastery status.
 */
export function applyResult(
  state: KnowledgeState,
  result: ActivityResult,
  now: number,
  scheduler: Scheduler,
): KnowledgeState {
  if (!result.authoritative) return state;

  const attempts = state.authoritativeAttempts + 1;
  const correct = state.authoritativeCorrect + (result.correct ? 1 : 0);

  const scheduled = scheduler.schedule(state, result.correct, now);

  const status =
    correct >= MASTERY_THRESHOLD ? "mastered" : "learning";

  return {
    ...scheduled,
    authoritativeAttempts: attempts,
    authoritativeCorrect: correct,
    status,
  };
}
```

- [ ] **Step 4: Run it, verify pass**

Run: `npm test -- mastery`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/engine/mastery.ts src/engine/mastery.test.ts
git commit -m "feat(engine): add mastery model"
```

---

## Task 7: Sequencer (review-before-new)

**Files:**
- Create: `src/engine/sequencer.ts`
- Test: `src/engine/sequencer.test.ts`

Selection rule: if any concept is **due for review** (status `learning`, `due !== null`, `due <= now`), return the earliest-due one in `review` mode. Otherwise return the first **frontier** concept in `learn` mode. Otherwise `null` (nothing to do right now).

- [ ] **Step 1: Write the failing test**

Create `src/engine/sequencer.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { selectNext } from "./sequencer";
import { linearGraph } from "./test-helpers";
import { blankState, type KnowledgeState } from "./types";

const DAY = 24 * 60 * 60 * 1000;

describe("selectNext", () => {
  it("picks the first frontier concept to learn when nothing is due", () => {
    const pick = selectNext(linearGraph, [], 0);
    expect(pick).toEqual({ conceptId: "at", mode: "learn" });
  });

  it("prefers a due review over learning something new", () => {
    const learningAt: KnowledgeState = {
      ...blankState("at"),
      status: "learning",
      due: 1 * DAY,
    };
    const pick = selectNext(linearGraph, [learningAt], 2 * DAY);
    expect(pick).toEqual({ conceptId: "at", mode: "review" });
  });

  it("returns the earliest-due review when several are due", () => {
    const a: KnowledgeState = { ...blankState("at"), status: "learning", due: 3 * DAY };
    const b: KnowledgeState = { ...blankState("it"), status: "learning", due: 1 * DAY };
    const pick = selectNext(linearGraph, [a, b], 5 * DAY);
    expect(pick).toEqual({ conceptId: "it", mode: "review" });
  });

  it("returns null when nothing is due and all concepts are mastered", () => {
    const mastered = ["at", "it", "op"].map((id) => ({
      ...blankState(id),
      status: "mastered" as const,
    }));
    expect(selectNext(linearGraph, mastered, 99 * DAY)).toBeNull();
  });

  it("re-offers a not-yet-due learning concept as a learn activity (never a review)", () => {
    const notDue: KnowledgeState = { ...blankState("at"), status: "learning", due: 10 * DAY };
    // 'at' is learning but not yet due, so it is NOT a review. It is still on the
    // frontier (not mastered, no unmet prereqs), so the child keeps practising it.
    // 'it'/'op' stay blocked because 'at' isn't mastered.
    const pick = selectNext(linearGraph, [notDue], 1 * DAY);
    expect(pick).toEqual({ conceptId: "at", mode: "learn" });
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npm test -- sequencer`
Expected: FAIL — `selectNext` not defined.

- [ ] **Step 3: Implement**

Create `src/engine/sequencer.ts`:
```ts
import type { ActivityMode, ConceptGraph, KnowledgeState } from "./types";
import { computeFrontier } from "./frontier";

export interface NextPick {
  conceptId: string;
  mode: ActivityMode;
}

export function selectNext(
  graph: ConceptGraph,
  states: KnowledgeState[],
  now: number,
): NextPick | null {
  // 1. Reviews owed: learning + due.
  const due = states
    .filter((s) => s.status === "learning" && s.due !== null && s.due <= now)
    .sort((a, b) => (a.due! - b.due!));
  if (due.length > 0) {
    return { conceptId: due[0].conceptId, mode: "review" };
  }

  // 2. Otherwise learn the next frontier concept.
  const frontier = computeFrontier(graph, states);
  if (frontier.length > 0) {
    return { conceptId: frontier[0], mode: "learn" };
  }

  // 3. Nothing owed, nothing new.
  return null;
}
```

- [ ] **Step 4: Run it, verify pass**

Run: `npm test -- sequencer`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/engine/sequencer.ts src/engine/sequencer.test.ts
git commit -m "feat(engine): add review-before-new sequencer"
```

---

## Task 8: In-memory KnowledgeStore

**Files:**
- Create: `src/engine/memory-store.ts`
- Test: `src/engine/memory-store.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/engine/memory-store.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { MemoryStore } from "./memory-store";
import { blankState } from "./types";

describe("MemoryStore", () => {
  it("returns null for an unknown concept", async () => {
    const store = new MemoryStore();
    expect(await store.get("child1", "at")).toBeNull();
  });

  it("puts and gets state scoped by child", async () => {
    const store = new MemoryStore();
    await store.put("child1", { ...blankState("at"), status: "learning" });
    expect((await store.get("child1", "at"))?.status).toBe("learning");
    expect(await store.get("child2", "at")).toBeNull();
  });

  it("getAll returns only that child's states", async () => {
    const store = new MemoryStore();
    await store.put("child1", blankState("at"));
    await store.put("child1", blankState("it"));
    await store.put("child2", blankState("op"));
    const all = await store.getAll("child1");
    expect(all.map((s) => s.conceptId).sort()).toEqual(["at", "it"]);
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npm test -- memory-store`
Expected: FAIL — `MemoryStore` not defined.

- [ ] **Step 3: Implement**

Create `src/engine/memory-store.ts`:
```ts
import type { KnowledgeState, KnowledgeStore } from "./types";

/** In-memory store for tests and dev. Real Supabase store comes in a later plan. */
export class MemoryStore implements KnowledgeStore {
  private byChild = new Map<string, Map<string, KnowledgeState>>();

  async get(childId: string, conceptId: string): Promise<KnowledgeState | null> {
    return this.byChild.get(childId)?.get(conceptId) ?? null;
  }

  async getAll(childId: string): Promise<KnowledgeState[]> {
    return [...(this.byChild.get(childId)?.values() ?? [])];
  }

  async put(childId: string, state: KnowledgeState): Promise<void> {
    let m = this.byChild.get(childId);
    if (!m) {
      m = new Map();
      this.byChild.set(childId, m);
    }
    m.set(state.conceptId, state);
  }
}
```

- [ ] **Step 4: Run it, verify pass**

Run: `npm test -- memory-store`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/engine/memory-store.ts src/engine/memory-store.test.ts
git commit -m "feat(engine): add in-memory KnowledgeStore"
```

---

## Task 9: Engine façade + the boundary ("math-proof") test

**Files:**
- Create: `src/engine/engine.ts`
- Test: `src/engine/engine.test.ts`

This is the keystone: `createEngine` wires store + scheduler + cartridge + clock into `nextActivity` / `recordResult` / `masteryState`, and the test drives it end-to-end with the `FakeCartridge` to prove the engine never needs subject-specific knowledge.

- [ ] **Step 1: Write the failing test**

Create `src/engine/engine.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { createEngine } from "./engine";
import { MemoryStore } from "./memory-store";
import { SimpleScheduler } from "./scheduler";
import { FakeCartridge, linearGraph } from "./test-helpers";
import { MASTERY_THRESHOLD } from "./mastery";

function mutableClock(start = 0) {
  let t = start;
  return { now: () => t, set: (v: number) => (t = v) };
}

describe("createEngine (boundary / math-proof)", () => {
  it("hands out the first frontier concept as a learn activity", async () => {
    const clock = mutableClock();
    const cart = new FakeCartridge();
    const engine = createEngine(cart, new MemoryStore(), new SimpleScheduler(), clock.now);

    const req = await engine.nextActivity("child1", "reading");
    expect(req?.conceptId).toBe("at");
    // Engine asked the cartridge to build it; engine never built a payload itself.
    expect(cart.built).toHaveLength(1);
  });

  it("records authoritative results and advances mastery without reading payloads", async () => {
    const clock = mutableClock();
    const store = new MemoryStore();
    const cart = new FakeCartridge(); // default: authoritative correct
    const engine = createEngine(cart, store, new SimpleScheduler(), clock.now);

    // Master 'at' by completing THRESHOLD authoritative-correct activities.
    for (let i = 0; i < MASTERY_THRESHOLD; i++) {
      const req = await engine.nextActivity("child1", "reading");
      const result = await cart.runActivity(req!);
      await engine.recordResult("child1", result);
      clock.set(clock.now() + 100 * 24 * 60 * 60 * 1000); // jump past any due date
    }

    const mastery = await engine.masteryState("child1", "reading");
    expect(mastery.mastered).toContain("at");
  });

  it("never advances mastery from formative-only results", async () => {
    const clock = mutableClock();
    const store = new MemoryStore();
    const cart = new FakeCartridge(linearGraph, { authoritative: false });
    const engine = createEngine(cart, store, new SimpleScheduler(), clock.now);

    for (let i = 0; i < 10; i++) {
      const req = await engine.nextActivity("child1", "reading");
      const result = await cart.runActivity(req!);
      await engine.recordResult("child1", result);
    }
    const mastery = await engine.masteryState("child1", "reading");
    expect(mastery.mastered).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npm test -- engine`
Expected: FAIL — `createEngine` not defined.

- [ ] **Step 3: Implement**

Create `src/engine/engine.ts`:
```ts
import type {
  ActivityRequest,
  ActivityResult,
  Cartridge,
  KnowledgeStore,
  Scheduler,
} from "./types";
import { blankState } from "./types";
import { selectNext } from "./sequencer";
import { applyResult } from "./mastery";

export interface MasteryView {
  mastered: string[];
  learning: string[];
  frontierNext: string | null;
}

export interface Engine {
  nextActivity(childId: string, subject: string): Promise<ActivityRequest | null>;
  recordResult(childId: string, result: ActivityResult): Promise<void>;
  masteryState(childId: string, subject: string): Promise<MasteryView>;
}

export function createEngine(
  cartridge: Cartridge,
  store: KnowledgeStore,
  scheduler: Scheduler,
  clock: () => number,
): Engine {
  const graph = cartridge.conceptGraph();

  return {
    async nextActivity(childId) {
      const states = await store.getAll(childId);
      const pick = selectNext(graph, states, clock());
      if (!pick) return null;
      // Cartridge owns activity construction. Engine passes only concept + mode.
      return cartridge.buildActivity(pick.conceptId, pick.mode);
    },

    async recordResult(childId, result) {
      const existing =
        (await store.get(childId, result.conceptId)) ?? blankState(result.conceptId);
      const updated = applyResult(existing, result, clock(), scheduler);
      await store.put(childId, updated);
    },

    async masteryState(childId) {
      const states = await store.getAll(childId);
      const mastered = states.filter((s) => s.status === "mastered").map((s) => s.conceptId);
      const learning = states.filter((s) => s.status === "learning").map((s) => s.conceptId);
      const pick = selectNext(graph, states, clock());
      return {
        mastered,
        learning,
        frontierNext: pick && pick.mode === "learn" ? pick.conceptId : null,
      };
    },
  };
}
```

- [ ] **Step 4: Run it, verify pass**

Run: `npm test -- engine`
Expected: PASS, 3 tests.

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS — all engine tests green (frontier, scheduler, mastery, sequencer, memory-store, engine).

- [ ] **Step 6: Commit**

```bash
git add src/engine/engine.ts src/engine/engine.test.ts
git commit -m "feat(engine): add engine facade and boundary test"
```

---

## Done criteria
- `npm test` passes; `src/engine/` contains a working, subject-agnostic adaptive engine driven entirely through the `Cartridge` interface.
- The boundary test proves a second subject (math) needs zero engine changes: the engine only ever calls `conceptGraph()`, `buildActivity()`, and consumes `ActivityResult` — it never reads a payload.
- No persistence/UI yet — those are later plans behind `KnowledgeStore` and the cartridge/activity layer.
```
