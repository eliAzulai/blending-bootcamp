# WordPets Pet Kitchen Spelling Game Implementation Plan

> **Current status as of 2026-05-27:** Historical/deferred. Do not execute this
> plan as-is. Pet Kitchen implementation/assets/tests were removed from current
> `main` during the source-of-truth reconciliation, and this plan still references
> older route shapes such as `/student/[id]`. Re-scope from the current
> `/student/practice` architecture before doing any Pet Kitchen work.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain Spelling practice screen with Pet Kitchen, where children spell words to cook snacks and feed their pet.

**Architecture:** Keep the existing content and tracker contracts. Add a small Pet Kitchen rules module, a dedicated `PetKitchenSpellingActivity` component based on the current tap-to-place spelling logic, and wire the existing spelling route to the new activity. The game remains a spelling activity, not a standalone mini-game route.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, existing `SessionTracker`, browser SpeechSynthesis through `speakWord`, Playwright smoke tests.

---

## Scope

Build one production Pet Kitchen scene for Phase 1a:

- Spelling route becomes Pet Kitchen.
- Child hears a word and taps letter ingredients into a tray.
- Correct spelling cooks a snack.
- Pet eats and reacts.
- Coins are earned per completed word.
- Incorrect first try gives a sound-position hint and retry.
- Incorrect second try records the struggle and moves on.

Do not build inventory, recipe books, unlockables, pet room, standalone mini-game navigation, or extra content systems.

## File Map

- Create `src/lib/pet-kitchen.ts`
  - Snack list, pet states, reward calculation, and hint copy.
- Create `src/components/activities/PetKitchenSpellingActivity.tsx`
  - Full Pet Kitchen spelling loop and tracker writes.
- Modify `src/components/PetDisplay.tsx`
  - Add optional activity-time reaction labels and animation.
- Modify `src/app/student/[id]/practice/spelling/page.tsx`
  - Use Pet Kitchen instead of the old `SpellingActivity`.
- Modify `src/app/student/[id]/page.tsx`
  - Make the primary mission card point to Spelling/Pet Kitchen.
- Create `tests/pet-kitchen.mjs`
  - Browser smoke for entering the kitchen and completing one simple word loop.
- Modify `package.json`
  - Add a Playwright script if none exists.

---

### Task 1: Add Pet Kitchen Rules

**Files:**
- Create: `src/lib/pet-kitchen.ts`

- [ ] **Step 1: Create the rules module**

```ts
// src/lib/pet-kitchen.ts
export type PetKitchenPetState =
  | "watching"
  | "sniffing"
  | "cheering"
  | "encouraging"
  | "eating"
  | "full";

export interface KitchenSnack {
  id: string;
  emoji: string;
  label: string;
}

export interface KitchenReward {
  coins: number;
  petState: PetKitchenPetState;
  message: string;
}

export const KITCHEN_SNACKS: KitchenSnack[] = [
  { id: "apple", emoji: "🍎", label: "apple" },
  { id: "cookie", emoji: "🍪", label: "cookie" },
  { id: "carrot", emoji: "🥕", label: "carrot" },
  { id: "sandwich", emoji: "🥪", label: "sandwich" },
  { id: "soup", emoji: "🥣", label: "soup" },
];

export function snackForWord(wordIndex: number): KitchenSnack {
  return KITCHEN_SNACKS[wordIndex % KITCHEN_SNACKS.length];
}

export function rewardForCorrectWord(attemptNumber: number, snack: KitchenSnack): KitchenReward {
  const firstTry = attemptNumber <= 1;
  return {
    coins: firstTry ? 2 : 1,
    petState: "eating",
    message: firstTry ? `Perfect! The ${snack.label} is ready.` : `Good fix! The ${snack.label} is ready.`,
  };
}

export function hintForAttempt(word: string, guess: string): string {
  if (!guess[0] || guess[0] !== word[0]) return "Listen for the first sound.";
  const middleIndex = Math.floor(word.length / 2);
  if (word.length > 2 && guess[middleIndex] !== word[middleIndex]) {
    return "Check the middle sound.";
  }
  return "Try the ending sound.";
}
```

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pet-kitchen.ts
git commit -m "feat: add pet kitchen rules"
```

---

### Task 2: Add Pet Reaction Support

**Files:**
- Modify: `src/components/PetDisplay.tsx`

- [ ] **Step 1: Import Pet Kitchen state**

Add:

```ts
import type { PetKitchenPetState } from "@/lib/pet-kitchen";
```

- [ ] **Step 2: Extend props**

Change `PetDisplayProps` to:

```ts
interface PetDisplayProps {
  petType: PetType;
  petName: string;
  mood: PetMood;
  coins: number;
  size?: "sm" | "lg";
  kitchenState?: PetKitchenPetState;
}
```

- [ ] **Step 3: Add kitchen labels and animation classes**

Add below `MOOD_BG`:

```ts
const KITCHEN_LABEL: Record<PetKitchenPetState, string> = {
  watching: "is watching the tray.",
  sniffing: "smells something cooking!",
  cheering: "liked that spelling!",
  encouraging: "is helping you try again.",
  eating: "is eating!",
  full: "is full and happy!",
};

const KITCHEN_ANIMATION: Record<PetKitchenPetState, string> = {
  watching: "",
  sniffing: "animate-pulse",
  cheering: "animate-bounce-subtle",
  encouraging: "animate-pulse",
  eating: "animate-bounce-subtle",
  full: "animate-star-spin",
};
```

- [ ] **Step 4: Apply the reaction in render**

Before the `return`, add:

```ts
const kitchenAnimation = kitchenState ? KITCHEN_ANIMATION[kitchenState] : "";
const petAnimation = isLarge ? `animate-bounce-subtle ${kitchenAnimation}` : kitchenAnimation;
```

Change the emoji span class to:

```tsx
className={isLarge ? `text-8xl ${petAnimation}` : `text-4xl ${petAnimation}`}
```

Below the existing mood label, add:

```tsx
{kitchenState && (
  <p className="text-sm font-bold text-purple-600 animate-fade-up">
    {petName} {KITCHEN_LABEL[kitchenState]}
  </p>
)}
```

- [ ] **Step 5: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/PetDisplay.tsx
git commit -m "feat: show pet kitchen reactions"
```

---

### Task 3: Build Pet Kitchen Activity

**Files:**
- Create: `src/components/activities/PetKitchenSpellingActivity.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/activities/PetKitchenSpellingActivity.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PetDisplay from "@/components/PetDisplay";
import {
  hintForAttempt,
  rewardForCorrectWord,
  snackForWord,
  type PetKitchenPetState,
} from "@/lib/pet-kitchen";
import { speakWord } from "@/lib/speech";
import type { PhonicsContent } from "@/lib/fixtures/student";
import type { PetMood, PetType } from "@/types/database";
import type { SessionTracker } from "@/lib/tracker";

interface PetKitchenSpellingActivityProps {
  content: PhonicsContent;
  tracker: SessionTracker;
  petType: PetType;
  petName: string;
  petMood: PetMood;
  startingCoins: number;
  onComplete: (result: { wordsCompleted: number; coinsEarned: number; durationSeconds: number }) => void;
}

type Stage = "playing" | "correct" | "retrying" | "revealing" | "done";

interface TrayLetter {
  letter: string;
  id: number;
  used: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeLetters(word: string): TrayLetter[] {
  return word.split("").map((letter, id) => ({ letter, id, used: false }));
}

export default function PetKitchenSpellingActivity({
  content,
  tracker,
  petType,
  petName,
  petMood,
  startingCoins,
  onComplete,
}: PetKitchenSpellingActivityProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [slots, setSlots] = useState<(TrayLetter | null)[]>([]);
  const [tray, setTray] = useState<TrayLetter[]>([]);
  const [stage, setStage] = useState<Stage>("playing");
  const [attemptCount, setAttemptCount] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [message, setMessage] = useState("Listen, then cook the word.");
  const [petState, setPetState] = useState<PetKitchenPetState>("watching");
  const startedAtRef = useRef<number>(0);
  const wordStartRef = useRef<number>(0);

  const currentWord = content.words[wordIndex]?.word ?? "";
  const snack = snackForWord(wordIndex);
  const allFilled = useMemo(() => slots.length > 0 && slots.every(Boolean), [slots]);
  const guess = useMemo(() => slots.map((slot) => slot?.letter ?? "").join(""), [slots]);

  useEffect(() => {
    if (startedAtRef.current === 0) startedAtRef.current = Date.now();
    wordStartRef.current = Date.now();
    setSlots(currentWord.split("").map(() => null));
    setTray(shuffle(makeLetters(currentWord)));
    setStage("playing");
    setAttemptCount(0);
    setMessage("Listen, then cook the word.");
    setPetState("watching");
    speakWord(currentWord);
  }, [currentWord]);

  const handleHearAgain = useCallback(() => {
    speakWord(currentWord);
    setPetState("sniffing");
  }, [currentWord]);

  const handleTrayTap = useCallback(
    (id: number) => {
      if (stage !== "playing") return;
      const letter = tray.find((item) => item.id === id);
      if (!letter || letter.used) return;
      const nextSlotIndex = slots.findIndex((slot) => slot === null);
      if (nextSlotIndex === -1) return;

      setPetState("sniffing");
      setTray((prev) => prev.map((item) => (item.id === id ? { ...item, used: true } : item)));
      setSlots((prev) => {
        const next = [...prev];
        next[nextSlotIndex] = letter;
        return next;
      });
    },
    [slots, stage, tray],
  );

  const handleSlotTap = useCallback(
    (slotIndex: number) => {
      if (stage !== "playing") return;
      const placed = slots[slotIndex];
      if (!placed) return;

      setSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = null;
        return next;
      });
      setTray((prev) => prev.map((item) => (item.id === placed.id ? { ...item, used: false } : item)));
      setPetState("watching");
    },
    [slots, stage],
  );

  useEffect(() => {
    if (stage !== "playing" || !allFilled) return;
    const nextAttemptCount = attemptCount + 1;
    setAttemptCount(nextAttemptCount);

    if (guess === currentWord) {
      const reward = rewardForCorrectWord(nextAttemptCount, snack);
      setStage("correct");
      setMessage(`${reward.message} +${reward.coins} coins`);
      setPetState(reward.petState);
      setEarnedCoins((coins) => coins + reward.coins);
      return;
    }

    if (nextAttemptCount >= 2) {
      setStage("revealing");
      setMessage(`It is ${currentWord}. Let's cook the next snack.`);
      setPetState("encouraging");
      return;
    }

    setStage("retrying");
    setMessage(hintForAttempt(currentWord, guess));
    setPetState("encouraging");
  }, [allFilled, attemptCount, currentWord, guess, snack, stage]);

  useEffect(() => {
    if (stage !== "correct" && stage !== "retrying" && stage !== "revealing") return;
    let cancelled = false;

    async function resolveStage() {
      if (stage === "retrying") {
        await new Promise((resolve) => setTimeout(resolve, 1100));
        if (cancelled) return;
        setSlots(currentWord.split("").map(() => null));
        setTray(shuffle(makeLetters(currentWord)));
        setStage("playing");
        setPetState("watching");
        return;
      }

      const wordDuration = Math.round((Date.now() - wordStartRef.current) / 1000);
      const score = stage === "correct" ? (attemptCount <= 1 ? 100 : 75) : 25;
      await tracker.recordAttempt({
        activityType: "spelling",
        contentRef: `${content.id}:${currentWord}`,
        score,
        durationSeconds: wordDuration,
      });

      await new Promise((resolve) => setTimeout(resolve, stage === "correct" ? 1300 : 1500));
      if (cancelled) return;

      const nextIndex = wordIndex + 1;
      if (nextIndex >= content.words.length) {
        const totalDuration = Math.round((Date.now() - startedAtRef.current) / 1000);
        setStage("done");
        setPetState("full");
        onComplete({
          wordsCompleted: content.words.length,
          coinsEarned: earnedCoins,
          durationSeconds: totalDuration,
        });
        return;
      }

      setWordIndex(nextIndex);
    }

    resolveStage();
    return () => {
      cancelled = true;
    };
  }, [attemptCount, content.id, content.words.length, currentWord, earnedCoins, onComplete, stage, tracker, wordIndex]);

  const slotClass = (index: number): string => {
    if (stage === "correct") return "border-emerald-500 bg-emerald-100";
    if (stage === "retrying" || stage === "revealing") {
      return slots[index]?.letter === currentWord[index]
        ? "border-emerald-500 bg-emerald-100"
        : "border-rose-500 bg-rose-100 animate-card-wobble";
    }
    return slots[index] ? "border-purple-400 bg-purple-100" : "border-purple-200 bg-white";
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <PetDisplay
            petType={petType}
            petName={petName}
            mood={petMood}
            coins={startingCoins + earnedCoins}
            size="sm"
            kitchenState={petState}
          />
          <div className="text-right">
            <p className="text-sm font-bold uppercase tracking-wide text-purple-500">
              Snack {wordIndex + 1} of {content.words.length}
            </p>
            <p className="mt-1 text-lg font-extrabold text-gray-800">{message}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-amber-100 p-5 shadow-inner">
        <div className="mb-4 flex items-center justify-center gap-3 text-5xl" aria-live="polite">
          <span className={stage === "correct" ? "animate-bounce-in" : ""}>{snack.emoji}</span>
          <span className="text-3xl">🍳</span>
        </div>

        <div className="flex items-center justify-center gap-2">
          {slots.map((slot, index) => (
            <button
              type="button"
              key={`slot-${index}`}
              onClick={() => handleSlotTap(index)}
              disabled={stage !== "playing" || !slot}
              className={`flex h-16 w-16 items-center justify-center rounded-2xl border-4 text-3xl font-extrabold transition-colors ${slotClass(index)}`}
              aria-label={slot ? `Remove ${slot.letter}` : `Empty letter slot ${index + 1}`}
            >
              {slot?.letter ?? ""}
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={handleHearAgain}
        className="rounded-full bg-purple-100 px-6 py-3 text-lg font-bold text-purple-700 shadow-sm transition-transform hover:scale-105 active:scale-95"
      >
        Hear it again
      </button>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {tray.map((letter) => (
          <button
            type="button"
            key={`ingredient-${letter.id}`}
            onClick={() => handleTrayTap(letter.id)}
            disabled={letter.used || stage !== "playing"}
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-2xl font-bold transition-all ${
              letter.used
                ? "border-gray-200 bg-gray-100 text-gray-300"
                : "border-amber-400 bg-white text-amber-900 shadow-sm hover:scale-110 active:scale-95"
            }`}
          >
            {letter.letter}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/activities/PetKitchenSpellingActivity.tsx
git commit -m "feat: build pet kitchen spelling activity"
```

---

### Task 4: Wire Spelling Route To Pet Kitchen

**Files:**
- Modify: `src/app/student/[id]/practice/spelling/page.tsx`

- [ ] **Step 1: Replace the activity import**

Replace:

```ts
import SpellingActivity from "@/components/activities/SpellingActivity";
```

With:

```ts
import PetKitchenSpellingActivity from "@/components/activities/PetKitchenSpellingActivity";
```

- [ ] **Step 2: Update the completion heading and copy**

In the `if (result)` branch, change:

```tsx
<h1 className="text-3xl font-extrabold text-gray-800">Great spelling!</h1>
```

To:

```tsx
<h1 className="text-3xl font-extrabold text-gray-800">{student.pet_name} is full!</h1>
```

Change:

```tsx
You spelled <span className="font-bold">{result.wordsCompleted}</span> words and earned{" "}
```

To:

```tsx
You cooked <span className="font-bold">{result.wordsCompleted}</span> snacks and earned{" "}
```

- [ ] **Step 3: Replace the active practice component**

Replace:

```tsx
<SpellingActivity
  content={content}
  tracker={tracker}
  onComplete={handleComplete}
/>
```

With:

```tsx
<PetKitchenSpellingActivity
  content={content}
  tracker={tracker}
  petType={student.pet_type}
  petName={student.pet_name}
  petMood={student.pet_mood}
  startingCoins={student.coins}
  onComplete={handleComplete}
/>
```

- [ ] **Step 4: Change route title copy**

Change the header title from `{content.title}` to:

```tsx
Pet Kitchen
```

- [ ] **Step 5: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add 'src/app/student/[id]/practice/spelling/page.tsx'
git commit -m "feat: route spelling practice to pet kitchen"
```

---

### Task 5: Update Student Home Mission Entry

**Files:**
- Modify: `src/app/student/[id]/page.tsx`

- [ ] **Step 1: Add a primary Pet Kitchen mission card**

Inside the `Today&apos;s practice` section, before the existing activity links, add:

```tsx
<Link
  href={`/student/${student.id}/practice/spelling`}
  className="block rounded-3xl bg-purple-600 p-5 text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
>
  <div className="flex items-center gap-4">
    <span className="text-5xl" aria-hidden>
      🍳
    </span>
    <div className="flex-1">
      <p className="text-xl font-extrabold">Pet Kitchen</p>
      <p className="text-sm font-semibold text-purple-100">
        Spell words to cook snacks for {student.pet_name}
      </p>
    </div>
    <span className="text-2xl" aria-hidden>
      ›
    </span>
  </div>
</Link>
```

- [ ] **Step 2: Update the existing Spelling card subtitle**

Change:

```tsx
<p className="text-sm text-gray-500">Hear it, tap the letters</p>
```

To:

```tsx
<p className="text-sm text-gray-500">Cook snacks with letters</p>
```

- [ ] **Step 3: Remove debug logs from student home**

Delete these lines:

```ts
console.log("[StudentHome] useEffect fired, id=", id);
console.log("[StudentHome] calling getStudent...");
console.log("[StudentHome] getStudent resolved:", s);
```

Keep `console.error("[StudentHome] getStudent threw:", err);`.

- [ ] **Step 4: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/student/[id]/page.tsx'
git commit -m "feat: add pet kitchen mission entry"
```

---

### Task 6: Add Pet Kitchen Browser Smoke Test

**Files:**
- Create: `tests/pet-kitchen.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add Playwright script if missing**

Add a repo-local Pet Kitchen smoke script:

```json
"test:e2e": "node tests/pet-kitchen.mjs"
```

- [ ] **Step 2: Create the smoke test**

```js
// tests/pet-kitchen.mjs
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectVisible(page, label, locator) {
  await locator.waitFor({ state: "visible", timeout: 15_000 });
  console.log(`  ✓ ${label}`);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();

await context.addInitScript(() => {
  const fakeSpeak = (utterance) => setTimeout(() => utterance.onend?.({}), 1);
  const stub = {
    speak: fakeSpeak,
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    getVoices: () => [],
    pending: false,
    speaking: false,
    paused: false,
    onvoiceschanged: null,
  };
  Object.defineProperty(window, "speechSynthesis", { value: stub, writable: false });
});

const page = await context.newPage();
page.setDefaultTimeout(15_000);

try {
  console.log(`Pet Kitchen smoke test against ${BASE}`);
  await page.goto(`${BASE}/student/fixture-student-1`, { waitUntil: "networkidle" });
  await expectVisible(page, "home shows Pet Kitchen", page.getByText("Pet Kitchen"));
  await page.getByText("Pet Kitchen").first().click();
  await expectVisible(page, "spelling route title is Pet Kitchen", page.getByText("Pet Kitchen"));
  await expectVisible(page, "first snack counter appears", page.getByText(/Snack 1 of/));
  await expectVisible(page, "hear again button appears", page.getByRole("button", { name: "Hear it again" }));
  await expectVisible(page, "first empty cooking slot appears", page.getByRole("button", { name: /Empty letter slot 1/ }));
  await expectVisible(page, "initial kitchen instruction appears", page.getByText("Listen, then cook the word."));

  const ingredientButtons = await page.getByRole("button", { name: /^[a-z]$/ }).count();
  assert(ingredientButtons >= 3, `Expected at least 3 letter ingredient buttons, found ${ingredientButtons}`);
  for (const letter of ["c", "a", "t"]) {
    await page.getByRole("button", { name: letter, exact: true }).first().click();
  }
  await expectVisible(page, "correct word cooks snack", page.getByText(/Perfect!|Good fix!/));
  await expectVisible(page, "coin reward appears", page.getByText(/\+2 coins|\+1 coins/));
  console.log("Pet Kitchen smoke test passed");
  process.exit(0);
} catch (err) {
  console.error("Pet Kitchen smoke test failed:", err.message);
  console.error("URL at failure:", page.url());
  process.exit(1);
} finally {
  await browser.close();
}
```

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Run smoke test**

Start the dev server:

```bash
npm run dev
```

Run:

```bash
npm run test:e2e
```

Expected: both tests PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json tests/pet-kitchen.mjs
git commit -m "test: cover pet kitchen smoke flow"
```

---

## Final Verification

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] `npm run test:e2e` passes with the dev server running.
- [ ] Manual check on `/student/fixture-student-1`: primary Pet Kitchen card opens the spelling game.
- [ ] Manual check on `/student/fixture-student-1/practice/spelling`: the first word can be completed by tapping letters into slots.
- [ ] Manual check: a correct word cooks a snack, changes pet state, and increments visible coins.
- [ ] Manual check: one wrong attempt gives a hint and no coins.

## Self-Review Notes

- Spec coverage: Covers the approved Pet Kitchen loop, pet reactions, cooking tray, letter ingredients, reward rules, and completion.
- Scope control: Does not add inventory, unlocks, recipe books, pet rooms, or standalone mini-game routing.
- Teaching control: No speed bonus, no reward for wrong attempts, and hints point back to word sounds.
- Data compatibility: Uses the existing `SessionTracker` and `activity_type: "spelling"`.
- Known follow-up: The first implementation stores final earned coins from the component result, so persisted coins match visible Pet Kitchen coins.
