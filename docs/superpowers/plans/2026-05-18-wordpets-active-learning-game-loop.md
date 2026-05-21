# WordPets Active Learning Game Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current student practice screens into a tight action -> feedback -> pet reaction -> reward loop without adding a separate mini-game system.

**Architecture:** Add a shared mission/reward layer used by Phonics and Spelling practice pages. Activities emit lightweight reward events after meaningful learning actions; the page shell renders live pet reactions, a small reward bank, and a focused mission frame while existing trackers continue to persist attempts and final coins.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, existing direct-REST Supabase tracker, Playwright for browser smoke checks.

---

## Scope Boundary

This plan implements the Phase 1a version of "games": short learning loops that feel game-like inside the existing practice flow.

It does not add a pet room, outfits, inventory, standalone mini-games, pixel coloring, Pattern Hunt scenes, or story/comic rewards. Those remain Play Lab candidates until child testing proves they improve return behavior or learning signal.

## Current Code Map

- `src/app/student/[id]/page.tsx` is the student home with pet display and practice cards.
- `src/app/student/[id]/practice/phonics/page.tsx` loads student/content, asks for mic, runs `PhonicsActivity`, then finishes the tracker.
- `src/app/student/[id]/practice/spelling/page.tsx` loads student/content, runs `SpellingActivity`, then finishes the tracker.
- `src/components/activities/PhonicsActivity.tsx` emits only final completion; it records each word attempt.
- `src/components/activities/SpellingActivity.tsx` has the tactile letter-tap loop; it records final word resolution.
- `src/components/PetDisplay.tsx` shows the pet but has no activity-time reaction state.
- `src/lib/tracker.ts` owns persistence; keep this API unchanged.

## Target File Structure

- Create `src/lib/reward-events.ts`
  - Owns the small, typed reward-event model used by all activities.
  - Keeps reward copy and coin/energy semantics out of page components.
- Create `src/components/student/MissionShell.tsx`
  - Activity page layout: compact pet display, mission progress, reward bank, and activity slot.
- Create `src/components/student/RewardToast.tsx`
  - Short animated event message such as `+2 energy` or `Whiskers liked that word`.
- Create `src/components/student/MissionComplete.tsx`
  - Shared completion screen for Phonics and Spelling.
- Modify `src/components/PetDisplay.tsx`
  - Add optional `reaction` and `compact` props while preserving current home usage.
- Modify `src/components/activities/PhonicsActivity.tsx`
  - Emit reward events after every completed word.
- Modify `src/components/activities/SpellingActivity.tsx`
  - Emit reward events after correct words and gentle retry events after incorrect attempts.
- Modify `src/app/student/[id]/practice/phonics/page.tsx`
  - Use `MissionShell`, pass pet data, show live rewards.
- Modify `src/app/student/[id]/practice/spelling/page.tsx`
  - Use `MissionShell`, pass pet data, show live rewards.
- Modify `src/app/student/[id]/page.tsx`
  - Add one primary "Start today's mission" action above individual activity cards.
- Create `tests/student-game-loop.spec.ts`
  - Browser smoke coverage for fixture student, mission shell, per-word reward UI, and final completion.
- Modify `package.json`
  - Add a `test:e2e` script for the Playwright smoke test.

---

### Task 1: Add Shared Reward Event Types

**Files:**
- Create: `src/lib/reward-events.ts`

- [ ] **Step 1: Create the reward event module**

```ts
// src/lib/reward-events.ts
export type RewardEventKind = "word-complete" | "retry" | "mission-complete";

export interface RewardEvent {
  id: string;
  kind: RewardEventKind;
  message: string;
  energyDelta: number;
  coinDelta: number;
  petReaction: "idle" | "cheer" | "encourage" | "celebrate";
}

export function createWordReward(word: string, index: number): RewardEvent {
  return {
    id: `word-${word}-${index}-${Date.now()}`,
    kind: "word-complete",
    message: `Nice reading: ${word}`,
    energyDelta: 1,
    coinDelta: 2,
    petReaction: "cheer",
  };
}

export function createRetryReward(word: string, index: number): RewardEvent {
  return {
    id: `retry-${word}-${index}-${Date.now()}`,
    kind: "retry",
    message: "Try that sound again",
    energyDelta: 0,
    coinDelta: 0,
    petReaction: "encourage",
  };
}

export function createMissionCompleteReward(activityName: string): RewardEvent {
  return {
    id: `mission-complete-${activityName}-${Date.now()}`,
    kind: "mission-complete",
    message: `${activityName} mission complete`,
    energyDelta: 0,
    coinDelta: 0,
    petReaction: "celebrate",
  };
}
```

- [ ] **Step 2: Run lint to confirm the new module is valid**

Run: `npm run lint`

Expected: PASS. Existing unrelated lint errors, if any appear, must be recorded before changing files outside this plan.

- [ ] **Step 3: Commit**

```bash
git add src/lib/reward-events.ts
git commit -m "feat: add reward event model"
```

---

### Task 2: Add Mission UI Components

**Files:**
- Create: `src/components/student/RewardToast.tsx`
- Create: `src/components/student/MissionShell.tsx`
- Create: `src/components/student/MissionComplete.tsx`
- Modify: `src/components/PetDisplay.tsx`

- [ ] **Step 1: Create `RewardToast`**

```tsx
// src/components/student/RewardToast.tsx
import type { RewardEvent } from "@/lib/reward-events";

interface RewardToastProps {
  event: RewardEvent | null;
}

export default function RewardToast({ event }: RewardToastProps) {
  if (!event) return null;

  return (
    <div
      key={event.id}
      className="pointer-events-none fixed left-1/2 top-24 z-20 -translate-x-1/2 rounded-full bg-white px-5 py-3 text-center text-base font-extrabold text-purple-700 shadow-lg ring-2 ring-purple-100 animate-bounce-in"
      aria-live="polite"
    >
      <span>{event.message}</span>
      {event.coinDelta > 0 && (
        <span className="ml-2 text-amber-600">+{event.coinDelta} coins</span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Extend `PetDisplay` without changing existing callers**

Update `src/components/PetDisplay.tsx` so the props include:

```ts
type PetReaction = "idle" | "cheer" | "encourage" | "celebrate";

interface PetDisplayProps {
  petType: PetType;
  petName: string;
  mood: PetMood;
  coins: number;
  size?: "sm" | "lg";
  reaction?: PetReaction;
  compact?: boolean;
}
```

Add these maps near the existing mood maps:

```ts
const REACTION_LABEL: Record<PetReaction, string> = {
  idle: "",
  cheer: "liked that!",
  encourage: "is helping you try again.",
  celebrate: "is celebrating!",
};

const REACTION_CLASS: Record<PetReaction, string> = {
  idle: "",
  cheer: "animate-bounce-subtle",
  encourage: "animate-pulse",
  celebrate: "animate-star-spin",
};
```

Apply `REACTION_CLASS[reaction]` to the emoji span in addition to the existing large-size bounce class. Show `REACTION_LABEL[reaction]` under the mood label only when `reaction !== "idle"`.

Use `compact` to hide the large mood sentence inside activity headers:

```tsx
{isLarge && !compact && (
  <p className="text-base text-gray-600">{MOOD_LABEL[mood]}</p>
)}
{reaction !== "idle" && (
  <p className="text-sm font-bold text-purple-600 animate-fade-up">
    {petName} {REACTION_LABEL[reaction]}
  </p>
)}
```

- [ ] **Step 3: Create `MissionShell`**

```tsx
// src/components/student/MissionShell.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import PetDisplay from "@/components/PetDisplay";
import RewardToast from "@/components/student/RewardToast";
import type { RewardEvent } from "@/lib/reward-events";
import type { PetMood, PetType } from "@/types/database";

interface MissionShellProps {
  studentId: string;
  petType: PetType;
  petName: string;
  petMood: PetMood;
  startingCoins: number;
  title: string;
  subtitle: string;
  progressLabel: string;
  earnedCoins: number;
  latestReward: RewardEvent | null;
  children: ReactNode;
}

export default function MissionShell({
  studentId,
  petType,
  petName,
  petMood,
  startingCoins,
  title,
  subtitle,
  progressLabel,
  earnedCoins,
  latestReward,
  children,
}: MissionShellProps) {
  return (
    <main className="min-h-screen bg-amber-50 px-4 py-6">
      <RewardToast event={latestReward} />
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <header className="flex items-center justify-between">
          <Link
            href={`/student/${studentId}`}
            className="text-sm font-semibold text-purple-600 hover:text-purple-800"
          >
            Back
          </Link>
          <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
            {progressLabel}
          </p>
        </header>

        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <PetDisplay
              petType={petType}
              petName={petName}
              mood={petMood}
              coins={startingCoins + earnedCoins}
              size="sm"
              compact
              reaction={latestReward?.petReaction ?? "idle"}
            />
            <div className="min-w-0 flex-1 text-right">
              <h1 className="text-xl font-extrabold text-gray-800">{title}</h1>
              <p className="text-sm font-semibold text-gray-500">{subtitle}</p>
              <p className="mt-2 text-base font-extrabold text-amber-600">
                +{earnedCoins} coins banked
              </p>
            </div>
          </div>
        </section>

        {children}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Create `MissionComplete`**

```tsx
// src/components/student/MissionComplete.tsx
import Link from "next/link";
import PetDisplay from "@/components/PetDisplay";
import type { PetMood, PetType } from "@/types/database";

interface MissionCompleteProps {
  studentId: string;
  petType: PetType;
  petName: string;
  petMood: PetMood;
  coins: number;
  activityLabel: string;
  wordsCompleted: number;
  coinsEarned: number;
}

export default function MissionComplete({
  studentId,
  petType,
  petName,
  petMood,
  coins,
  activityLabel,
  wordsCompleted,
  coinsEarned,
}: MissionCompleteProps) {
  return (
    <main className="min-h-screen bg-amber-50 px-4 py-12">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <PetDisplay
          petType={petType}
          petName={petName}
          mood={petMood}
          coins={coins + coinsEarned}
          reaction="celebrate"
        />
        <h1 className="text-3xl font-extrabold text-gray-800">
          {activityLabel} complete
        </h1>
        <p className="text-lg text-gray-600">
          You finished <span className="font-bold">{wordsCompleted}</span> words and earned{" "}
          <span className="font-bold text-amber-600">+{coinsEarned} coins</span>.
        </p>
        <Link
          href={`/student/${studentId}`}
          className="rounded-full bg-purple-600 px-8 py-4 text-lg font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          Back to {petName}
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/PetDisplay.tsx src/components/student/RewardToast.tsx src/components/student/MissionShell.tsx src/components/student/MissionComplete.tsx
git commit -m "feat: add mission reward UI"
```

---

### Task 3: Retrofit Phonics With Live Rewards

**Files:**
- Modify: `src/components/activities/PhonicsActivity.tsx`
- Modify: `src/app/student/[id]/practice/phonics/page.tsx`

- [ ] **Step 1: Add reward callback to `PhonicsActivity` props**

Add the imports:

```ts
import { createWordReward } from "@/lib/reward-events";
import type { RewardEvent } from "@/lib/reward-events";
```

Extend props:

```ts
onReward?: (event: RewardEvent) => void;
onProgressChange?: (progress: { current: number; total: number }) => void;
```

In the component parameters, include `onReward` and `onProgressChange`.

- [ ] **Step 2: Emit progress and per-word rewards**

Add this effect below the existing `useEffect` that updates `wordStartRef`:

```ts
useEffect(() => {
  onProgressChange?.({ current: wordIndex + 1, total: content.words.length });
}, [content.words.length, onProgressChange, wordIndex]);
```

Inside `handleWordComplete`, after `tracker.recordAttempt(...)`, add:

```ts
onReward?.(createWordReward(currentWord.word, wordIndex));
```

Keep `coinsEarned = content.words.length * COINS_PER_WORD` unchanged so persistence remains compatible with the current tracker.

- [ ] **Step 3: Update the phonics page reward state**

In `src/app/student/[id]/practice/phonics/page.tsx`, add imports:

```ts
import MissionShell from "@/components/student/MissionShell";
import MissionComplete from "@/components/student/MissionComplete";
import type { RewardEvent } from "@/lib/reward-events";
```

Add state:

```ts
const [latestReward, setLatestReward] = useState<RewardEvent | null>(null);
const [earnedCoins, setEarnedCoins] = useState(0);
const [progress, setProgress] = useState({ current: 1, total: 1 });
```

Add handler:

```ts
function handleReward(event: RewardEvent) {
  setLatestReward(event);
  setEarnedCoins((coins) => coins + event.coinDelta);
  window.setTimeout(() => {
    setLatestReward((current) => (current?.id === event.id ? null : current));
  }, 1400);
}
```

- [ ] **Step 4: Replace the phonics completion screen**

Replace the existing `if (result)` return with:

```tsx
if (result) {
  return (
    <MissionComplete
      studentId={student.id}
      petType={student.pet_type}
      petName={student.pet_name}
      petMood={student.pet_mood}
      coins={student.coins}
      activityLabel="Phonics mission"
      wordsCompleted={result.wordsCompleted}
      coinsEarned={result.coinsEarned}
    />
  );
}
```

- [ ] **Step 5: Wrap active phonics practice in `MissionShell`**

Replace the final active-practice return with:

```tsx
return (
  <MissionShell
    studentId={student.id}
    petType={student.pet_type}
    petName={student.pet_name}
    petMood={student.pet_mood}
    startingCoins={student.coins}
    title="Sound mission"
    subtitle={content.title}
    progressLabel={`Word ${progress.current} of ${progress.total}`}
    earnedCoins={earnedCoins}
    latestReward={latestReward}
  >
    <PhonicsActivity
      content={content}
      tracker={tracker}
      speechEnabled={micGranted}
      onReward={handleReward}
      onProgressChange={setProgress}
      onComplete={handleComplete}
    />
  </MissionShell>
);
```

- [ ] **Step 6: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/activities/PhonicsActivity.tsx 'src/app/student/[id]/practice/phonics/page.tsx'
git commit -m "feat: add live phonics rewards"
```

---

### Task 4: Retrofit Spelling With Live Rewards

**Files:**
- Modify: `src/components/activities/SpellingActivity.tsx`
- Modify: `src/app/student/[id]/practice/spelling/page.tsx`

- [ ] **Step 1: Add reward callback to `SpellingActivity` props**

Add the imports:

```ts
import { createRetryReward, createWordReward } from "@/lib/reward-events";
import type { RewardEvent } from "@/lib/reward-events";
```

Extend props:

```ts
onReward?: (event: RewardEvent) => void;
onProgressChange?: (progress: { current: number; total: number }) => void;
```

In the component parameters, include `onReward` and `onProgressChange`.

- [ ] **Step 2: Emit progress**

Add this effect after the word-reset effect:

```ts
useEffect(() => {
  onProgressChange?.({ current: wordIndex + 1, total: content.words.length });
}, [content.words.length, onProgressChange, wordIndex]);
```

- [ ] **Step 3: Emit spelling rewards only after meaningful outcomes**

Inside the stage-transition effect, after `const isFinalForWord = ...`, add:

```ts
if (stage === "checking-correct") {
  onReward?.(createWordReward(currentWord, wordIndex));
} else if (stage === "checking-wrong" && attemptCount < 2) {
  onReward?.(createRetryReward(currentWord, wordIndex));
}
```

Keep persisted `coinsEarned = content.words.length * COINS_PER_WORD` unchanged for this pass. The visual reward loop becomes immediate while the database behavior stays stable.

- [ ] **Step 4: Update the spelling page reward state**

In `src/app/student/[id]/practice/spelling/page.tsx`, add imports:

```ts
import MissionShell from "@/components/student/MissionShell";
import MissionComplete from "@/components/student/MissionComplete";
import type { RewardEvent } from "@/lib/reward-events";
```

Add state and handler:

```ts
const [latestReward, setLatestReward] = useState<RewardEvent | null>(null);
const [earnedCoins, setEarnedCoins] = useState(0);
const [progress, setProgress] = useState({ current: 1, total: 1 });

function handleReward(event: RewardEvent) {
  setLatestReward(event);
  setEarnedCoins((coins) => coins + event.coinDelta);
  window.setTimeout(() => {
    setLatestReward((current) => (current?.id === event.id ? null : current));
  }, 1400);
}
```

- [ ] **Step 5: Replace spelling completion and active practice returns**

Use `MissionComplete` for the result branch:

```tsx
if (result) {
  return (
    <MissionComplete
      studentId={student.id}
      petType={student.pet_type}
      petName={student.pet_name}
      petMood={student.pet_mood}
      coins={student.coins}
      activityLabel="Spelling mission"
      wordsCompleted={result.wordsCompleted}
      coinsEarned={result.coinsEarned}
    />
  );
}
```

Use `MissionShell` for the active branch:

```tsx
return (
  <MissionShell
    studentId={student.id}
    petType={student.pet_type}
    petName={student.pet_name}
    petMood={student.pet_mood}
    startingCoins={student.coins}
    title="Spelling mission"
    subtitle={content.title}
    progressLabel={`Word ${progress.current} of ${progress.total}`}
    earnedCoins={earnedCoins}
    latestReward={latestReward}
  >
    <SpellingActivity
      content={content}
      tracker={tracker}
      onReward={handleReward}
      onProgressChange={setProgress}
      onComplete={handleComplete}
    />
  </MissionShell>
);
```

- [ ] **Step 6: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/activities/SpellingActivity.tsx 'src/app/student/[id]/practice/spelling/page.tsx'
git commit -m "feat: add live spelling rewards"
```

---

### Task 5: Make Student Home Prefer A Daily Mission

**Files:**
- Modify: `src/app/student/[id]/page.tsx`

- [ ] **Step 1: Add a primary mission card above the activity list**

Inside the `Today&apos;s practice` section, before the existing individual activity links, add:

```tsx
<Link
  href={`/student/${student.id}/practice/phonics`}
  className="block rounded-3xl bg-purple-600 p-5 text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
>
  <div className="flex items-center gap-4">
    <span className="text-5xl" aria-hidden>
      ⭐
    </span>
    <div className="flex-1">
      <p className="text-xl font-extrabold">Start today's mission</p>
      <p className="text-sm font-semibold text-purple-100">
        Practice words, help {student.pet_name}, earn coins
      </p>
    </div>
    <span className="text-2xl" aria-hidden>
      ›
    </span>
  </div>
</Link>
```

- [ ] **Step 2: Keep individual cards as secondary choices**

Change the existing Phonics and Spelling link classes from `bg-white p-5 shadow-md` to:

```tsx
className="block rounded-3xl bg-white p-4 shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
```

This keeps direct activity access while making the intended loop obvious.

- [ ] **Step 3: Remove noisy student-home console logs**

Delete these console calls from `src/app/student/[id]/page.tsx`:

```ts
console.log("[StudentHome] useEffect fired, id=", id);
console.log("[StudentHome] calling getStudent...");
console.log("[StudentHome] getStudent resolved:", s);
```

Keep the `console.error` inside the catch block because it helps debug broken links.

- [ ] **Step 4: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/student/[id]/page.tsx'
git commit -m "feat: emphasize daily mission entry"
```

---

### Task 6: Add Browser Smoke Coverage

**Files:**
- Create: `tests/student-game-loop.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the Playwright script**

In `package.json`, add:

```json
"test:e2e": "playwright test"
```

The scripts block should include:

```json
"scripts": {
  "pull-secrets": "node ~/projects/infisical/pull-env.js 2423b7fc-bb02-4075-aba8-d7d04aacc820 prod .env.local",
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test:e2e": "playwright test"
}
```

- [ ] **Step 2: Create the smoke test**

```ts
// tests/student-game-loop.spec.ts
import { expect, test } from "@playwright/test";

test("fixture student can enter the phonics mission", async ({ page }) => {
  await page.goto("/student/fixture-student-1");

  await expect(page.getByText("Start today's mission")).toBeVisible();
  await page.getByText("Start today's mission").click();

  await expect(page.getByText("Ready to practice?")).toBeVisible();
  await page.getByText("Just tap, no voice").click();

  await expect(page.getByText("Sound mission")).toBeVisible();
  await expect(page.getByText(/Word 1 of/)).toBeVisible();
});

test("fixture student can enter the spelling mission", async ({ page }) => {
  await page.goto("/student/fixture-student-1");

  await page.getByText("Spelling").click();

  await expect(page.getByText("Spelling mission")).toBeVisible();
  await expect(page.getByText(/Word 1 of/)).toBeVisible();
  await expect(page.getByText("Hear it again")).toBeVisible();
});
```

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 4: Run production build**

Run: `npm run build`

Expected: PASS and all App Router routes compile.

- [ ] **Step 5: Run the browser smoke tests**

Start the dev server:

```bash
npm run dev
```

In another terminal:

```bash
npm run test:e2e -- --base-url=http://localhost:3000 tests/student-game-loop.spec.ts
```

Expected: both tests PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json tests/student-game-loop.spec.ts
git commit -m "test: cover student mission loop"
```

---

## Verification Checklist

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] `npm run dev` serves the app on `http://localhost:3000`.
- [ ] `npm run test:e2e -- --base-url=http://localhost:3000 tests/student-game-loop.spec.ts` passes.
- [ ] Manual fixture smoke: open `/student/fixture-student-1`, start the mission, skip mic, complete at least one Phonics word, and see a reward toast plus pet reaction.
- [ ] Manual spelling smoke: open `/student/fixture-student-1/practice/spelling`, complete one word, and see a reward toast plus pet reaction.

## Self-Review

- Spec coverage: Implements the May 12 recommendation to make Phonics feel like a short mission, make rewards immediate, make the pet react during learning, and keep Spelling tactile. Read Aloud is not included because the production route does not exist yet and this pass targets the two built activities.
- Scope check: The plan deliberately avoids pet room, inventory, standalone mini-games, and Play Lab candidates.
- Pedagogy check: Reward events do not interrupt or replace the teaching action. Incorrect spelling attempts trigger encouragement, not coins, so the loop does not reward shallow tapping.
- Data check: Tracker persistence stays unchanged; final coins still flow through `tracker.finish`.
- Type check: `RewardEvent.petReaction` matches the new optional `PetDisplay.reaction` prop.
