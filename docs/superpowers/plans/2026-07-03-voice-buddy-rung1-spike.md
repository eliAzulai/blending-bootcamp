# Voice Buddy Rung-1 Spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a guided "reading buddy" session (Magic Ears-style pre-queued routine) that a child reads aloud to, and measure — with adult ground-truth grading — whether Whisper-class ASR can reliably detect a child's decoding errors. This answers the gating question for the whole AI-avatar-lesson ladder.

**Architecture:** Deterministic code directs, audio performs. A pure-TS routine engine queues every step of the session before it starts (greeting → sound warm-up → sentence-by-sentence reading → praise), exactly like Magic Ears queues courseware before class. Browser TTS (`src/lib/speech.ts`) is the buddy's voice; the existing MediaRecorder→`/api/transcribe`→Whisper pipeline is its ears. A word-level alignment scorer classifies each target word as read/misread/skipped; an adult review screen captures ground truth; a CLI computes detection-rate and false-alarm-rate against decision gates.

**Tech Stack:** Next.js 16 App Router (existing app), TypeScript, vitest (already wired: `npm test`), browser Web Speech API TTS, MediaRecorder + OpenAI Whisper via existing `/api/transcribe`. **No new dependencies. No LLM calls besides Whisper. No Supabase writes.**

---

## Decisions locked in (fork visibility)

1. **No Realtime API / LLM conversation in rung 1.** The prior discussion pitched a "Realtime-API voice agent." For the *validation spike*, deterministic TTS + Whisper answers the gating question (can ASR hear a child decode?) at near-zero cost. Conversational voice is rung 1.5+, gated on this spike's results.
2. **Routes live at `/spike/buddy`, not `/student/*`.** The adult grading screen must display raw transcripts; R17 forbids transcripts on any `/student/*` surface. The child-facing session screen still follows all child rules (R1 font is global, R5 no italics, R7 non-authoritative, R11 punctuation in displayed text, R19 touch targets, R25 positive copy, R26 no idle animation).
3. **No tracker / Supabase writes.** Spike sessions must not pollute `practice_sessions`. Data leaves the browser only via explicit JSON download on the grading screen. Audio clips stay in browser memory (playback for grading) and are never uploaded anywhere except the existing transcribe→Whisper path already covered by parent consent.
4. **Warm-up echoes are not recorded.** Phonemes are too short for reliable ASR (already established in `useSpeechRecognition.ts`). The warm-up is ritual/routine only — the measurement lives entirely in the sentence reads.
5. **Passages come from existing fixtures + a custom-paste box.** Fixtures are age-7 CVC; the custom box lets Ilana paste grade-3-6-level text for the launch band without new fixture work.

## Prerequisites (verify before running with a child)

- `OPENAI_API_KEY` in `.env.local` **with credits**. Known issue: the Infisical `blending-bootcamp` project key has been out of credits since 2026-04-23 (see `CLAUDE.md` Env Vars). Top up or rotate first — the spike is dead without Whisper.
- A signed-in account (`/api/transcribe` is auth-gated). Log in as the teacher account on the test iPad.
- Execute on a fresh branch off `main` (current `comics` checkout carries local-only work — do not build on it): `git checkout main && git pull && git checkout -b voice-buddy-spike`.

## File structure

| File | Responsibility |
|---|---|
| `src/lib/buddy/alignment.ts` (+ `.test.ts`) | Tokenization + word-level alignment: target sentence × transcript → per-word verdict. The measurement core. |
| `src/lib/buddy/routine.ts` (+ `.test.ts`) | Sentence splitting, warm-up picking, `buildRoutine()` — the pre-queued session script. |
| `src/lib/buddy/metrics.ts` (+ `.test.ts`) | Session export types, flattening, detection/false-alarm computation. |
| `src/lib/buddy/recorder.ts` | Manual start/stop clip recorder that returns `{blob, transcript}` (existing `listenForSpeech` discards the blob; grading needs it). |
| `src/app/spike/buddy/page.tsx` | Server component: auth gate, renders client component. |
| `src/components/buddy/BuddySpike.tsx` | Client: setup form + phase state machine + session runner. |
| `src/components/buddy/BuddyReview.tsx` | Client: adult grading screen + JSON export. |
| `scripts/buddy-metrics.ts` | CLI: aggregate downloaded session JSONs → metrics table. |
| `docs/spikes/2026-07-voice-buddy-rung1.md` | Run protocol, sample-size targets, decision gates, privacy notes. |

---

### Task 1: Alignment scorer (the measurement core)

**Files:**
- Create: `src/lib/buddy/alignment.ts`
- Test: `src/lib/buddy/alignment.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/buddy/alignment.test.ts
import { describe, expect, it } from "vitest";
import { alignWords, normalizeWord, tokenize } from "./alignment";

describe("normalizeWord", () => {
  it("lowercases and strips punctuation, keeping apostrophes", () => {
    expect(normalizeWord("Cat!")).toBe("cat");
    expect(normalizeWord("don't")).toBe("don't");
    expect(normalizeWord("mat.")).toBe("mat");
  });
});

describe("tokenize", () => {
  it("splits on whitespace and drops empty tokens", () => {
    expect(tokenize("The cat sat.  ")).toEqual(["the", "cat", "sat"]);
  });
});

describe("alignWords", () => {
  it("marks every word read when transcript matches exactly", () => {
    const result = alignWords("The cat sat on the mat.", "the cat sat on the mat");
    expect(result).toHaveLength(6);
    expect(result.every((w) => w.verdict === "read")).toBe(true);
  });

  it("marks a substituted word as misread with the heard token", () => {
    const result = alignWords("I see a ship.", "i see a sip");
    expect(result[3]).toEqual({ word: "ship", verdict: "misread", heard: "sip" });
    expect(result[0].verdict).toBe("read");
  });

  it("marks a missing word as skipped", () => {
    const result = alignWords("The big red hat.", "the red hat");
    expect(result[1]).toEqual({ word: "big", verdict: "skipped", heard: null });
    expect(result[2].verdict).toBe("read");
  });

  it("ignores extra inserted words in the transcript", () => {
    const result = alignWords("The cat sat.", "um the cat sat");
    expect(result.map((w) => w.verdict)).toEqual(["read", "read", "read"]);
  });

  it("handles an empty transcript as all skipped", () => {
    const result = alignWords("Run fox run.", "");
    expect(result.every((w) => w.verdict === "skipped")).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/buddy/alignment.test.ts`
Expected: FAIL — cannot resolve `./alignment`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/buddy/alignment.ts
/**
 * Word-level alignment between a target sentence and an ASR transcript.
 * Classic edit-distance DP with backtrace. Insertions in the transcript
 * (filler words, "um") are ignored; only target words get verdicts.
 */

export type WordVerdict = "read" | "misread" | "skipped";

export interface AlignedWord {
  /** Normalized target word */
  word: string;
  verdict: WordVerdict;
  /** Transcript token aligned to this word (null when skipped) */
  heard: string | null;
}

export function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z']/g, "");
}

export function tokenize(text: string): string[] {
  return text.split(/\s+/).map(normalizeWord).filter(Boolean);
}

export function alignWords(target: string, transcript: string): AlignedWord[] {
  const t = tokenize(target);
  const h = tokenize(transcript);
  const n = t.length;
  const m = h.length;

  // dp[i][j] = min edits aligning first i target words with first j heard words
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const subCost = t[i - 1] === h[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + subCost, // match / substitute
        dp[i - 1][j] + 1, // target word skipped
        dp[i][j - 1] + 1, // transcript insertion
      );
    }
  }

  // Backtrace, preferring diagonal moves (match/substitute) on ties.
  const out: AlignedWord[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const subCost = i > 0 && j > 0 && t[i - 1] === h[j - 1] ? 0 : 1;
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + subCost) {
      out.unshift({
        word: t[i - 1],
        verdict: subCost === 0 ? "read" : "misread",
        heard: h[j - 1],
      });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      out.unshift({ word: t[i - 1], verdict: "skipped", heard: null });
      i--;
    } else {
      j--; // transcript insertion — ignore
    }
  }
  return out;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/buddy/alignment.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/buddy/alignment.ts src/lib/buddy/alignment.test.ts
git commit -m "feat(buddy): word-level alignment scorer for read-aloud ASR validation"
```

---

### Task 2: Routine engine (Magic Ears-style pre-queued session)

**Files:**
- Create: `src/lib/buddy/routine.ts`
- Test: `src/lib/buddy/routine.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/buddy/routine.test.ts
import { describe, expect, it } from "vitest";
import { buildRoutine, pickWarmupSounds, splitSentences } from "./routine";

const PASSAGE =
  "The cat sat on the mat. The cat had a big hat. The hat was red and fat. The cat likes the hat a lot!";

describe("splitSentences", () => {
  it("splits a fixture passage into its sentences", () => {
    const s = splitSentences(PASSAGE);
    expect(s).toHaveLength(4);
    expect(s[0]).toBe("The cat sat on the mat.");
    expect(s[3]).toBe("The cat likes the hat a lot!");
  });

  it("handles a single sentence without trailing whitespace", () => {
    expect(splitSentences("Run fox run.")).toEqual(["Run fox run."]);
  });
});

describe("pickWarmupSounds", () => {
  it("picks the first three distinct starting letters", () => {
    expect(pickWarmupSounds(PASSAGE)).toEqual(["t", "c", "s"]);
  });
});

describe("buildRoutine", () => {
  const routine = buildRoutine({
    childName: "Maya",
    passageText: PASSAGE,
    warmupSounds: ["t", "c", "s"],
  });

  it("queues greeting, warmups, one step per sentence, and finish", () => {
    expect(routine.map((s) => s.type)).toEqual([
      "greeting",
      "warmup_sound",
      "warmup_sound",
      "warmup_sound",
      "read_sentence",
      "read_sentence",
      "read_sentence",
      "read_sentence",
      "finish",
    ]);
  });

  it("only read_sentence steps record", () => {
    for (const step of routine) {
      expect(step.records).toBe(step.type === "read_sentence");
    }
  });

  it("read_sentence steps carry the sentence text and index", () => {
    const reads = routine.filter((s) => s.type === "read_sentence");
    expect(reads[0].target).toBe("The cat sat on the mat.");
    expect(reads[0].sentenceIndex).toBe(0);
    expect(reads[3].sentenceIndex).toBe(3);
  });

  it("greets and praises the child by name", () => {
    expect(routine[0].buddyLine).toContain("Maya");
    expect(routine[routine.length - 1].buddyLine).toContain("Maya");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/buddy/routine.test.ts`
Expected: FAIL — cannot resolve `./routine`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/buddy/routine.ts
/**
 * Pre-queued buddy session routine (Magic Ears model: all courseware queued
 * before class; the live session just walks the queue). Deterministic — the
 * whole session script exists before the first word is spoken.
 */
import { tokenize } from "./alignment";

export type BuddyStepType =
  | "greeting"
  | "warmup_sound"
  | "read_sentence"
  | "finish";

export interface BuddyStep {
  type: BuddyStepType;
  /** What the buddy says aloud (TTS). Audio-only — never rendered as child-facing text. */
  buddyLine: string;
  /** warmup_sound: the phoneme to echo. read_sentence: the sentence text. */
  target?: string;
  /** Whether this step records the child */
  records: boolean;
  /** Index of sentence within passage (read_sentence only) */
  sentenceIndex?: number;
}

export interface BuddyRoutineConfig {
  childName: string;
  passageText: string;
  warmupSounds: string[];
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** First three distinct starting letters of the passage's words. */
export function pickWarmupSounds(passageText: string): string[] {
  const seen: string[] = [];
  for (const w of tokenize(passageText)) {
    const first = w[0];
    if (first && !seen.includes(first)) seen.push(first);
    if (seen.length === 3) break;
  }
  return seen;
}

export function buildRoutine(config: BuddyRoutineConfig): BuddyStep[] {
  const steps: BuddyStep[] = [];

  steps.push({
    type: "greeting",
    buddyLine: `Hi ${config.childName}! I am Pip, your reading buddy. Today we will read a story together. Ready?`,
    records: false,
  });

  for (const sound of config.warmupSounds) {
    steps.push({
      type: "warmup_sound",
      buddyLine: "Say this sound after me!",
      target: sound,
      records: false,
    });
  }

  splitSentences(config.passageText).forEach((sentence, i) => {
    steps.push({
      type: "read_sentence",
      buddyLine:
        i === 0
          ? "Now the story! Read this out loud when you are ready."
          : "Your turn! Read the next one.",
      target: sentence,
      sentenceIndex: i,
      records: true,
    });
  });

  steps.push({
    type: "finish",
    buddyLine: `You did it, ${config.childName}! Amazing reading today!`,
    records: false,
  });

  return steps;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/buddy/routine.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/buddy/routine.ts src/lib/buddy/routine.test.ts
git commit -m "feat(buddy): pre-queued session routine engine (Magic Ears model)"
```

---

### Task 3: Metrics — session export types + detection/false-alarm math

**Files:**
- Create: `src/lib/buddy/metrics.ts`
- Test: `src/lib/buddy/metrics.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/buddy/metrics.test.ts
import { describe, expect, it } from "vitest";
import {
  computeMetrics,
  wordsFromSessions,
  type GradedWord,
  type SessionExport,
} from "./metrics";

const words: GradedWord[] = [
  // adult says error, ASR flagged → detected
  { word: "ship", asrVerdict: "misread", adultVerdict: "error" },
  { word: "big", asrVerdict: "skipped", adultVerdict: "error" },
  // adult says error, ASR said read → missed
  { word: "was", asrVerdict: "read", adultVerdict: "error" },
  // adult says correct, ASR flagged → false alarm
  { word: "the", asrVerdict: "misread", adultVerdict: "correct" },
  // adult says correct, ASR agrees → true negative
  { word: "cat", asrVerdict: "read", adultVerdict: "correct" },
  { word: "sat", asrVerdict: "read", adultVerdict: "correct" },
];

describe("computeMetrics", () => {
  const m = computeMetrics(words);

  it("counts totals and adult-marked errors", () => {
    expect(m.totalWords).toBe(6);
    expect(m.adultErrors).toBe(3);
  });

  it("computes detection: detected, missed, detectionRate", () => {
    expect(m.detected).toBe(2);
    expect(m.missed).toBe(1);
    expect(m.detectionRate).toBeCloseTo(2 / 3);
  });

  it("computes false alarms against correctly-read words", () => {
    expect(m.falseAlarms).toBe(1);
    expect(m.falseAlarmRate).toBeCloseTo(1 / 3);
  });

  it("returns null rates when denominators are zero", () => {
    const empty = computeMetrics([]);
    expect(empty.detectionRate).toBeNull();
    expect(empty.falseAlarmRate).toBeNull();
  });
});

describe("wordsFromSessions", () => {
  it("flattens all sentences from all sessions", () => {
    const session: SessionExport = {
      childAlias: "M",
      passageId: "read-aloud-cat-hat",
      date: "2026-07-06",
      sentences: [
        {
          sentenceIndex: 0,
          target: "The cat sat.",
          transcript: "the cat sat",
          words: [
            { word: "the", heard: "the", asrVerdict: "read", adultVerdict: "correct" },
            { word: "cat", heard: "cat", asrVerdict: "read", adultVerdict: "correct" },
            { word: "sat", heard: "sat", asrVerdict: "read", adultVerdict: "correct" },
          ],
        },
      ],
    };
    expect(wordsFromSessions([session, session])).toHaveLength(6);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/buddy/metrics.test.ts`
Expected: FAIL — cannot resolve `./metrics`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/buddy/metrics.ts
/**
 * Spike measurement: how well does ASR verdict agree with adult ground truth?
 * detectionRate  = of the words the adult marked as real errors, how many did ASR flag?
 * falseAlarmRate = of the words the adult marked correctly read, how many did ASR wrongly flag?
 */
import type { WordVerdict } from "./alignment";

export interface GradedWord {
  word: string;
  asrVerdict: WordVerdict;
  /** Ground truth from the adult grader */
  adultVerdict: "correct" | "error";
}

export interface ExportedWord extends GradedWord {
  heard: string | null;
}

export interface SessionExport {
  /** Initials only — never a full name (privacy) */
  childAlias: string;
  passageId: string;
  date: string;
  sentences: {
    sentenceIndex: number;
    target: string;
    transcript: string;
    words: ExportedWord[];
  }[];
}

export interface SpikeMetrics {
  totalWords: number;
  adultErrors: number;
  detected: number;
  missed: number;
  falseAlarms: number;
  detectionRate: number | null;
  falseAlarmRate: number | null;
}

export function wordsFromSessions(sessions: SessionExport[]): GradedWord[] {
  return sessions.flatMap((s) => s.sentences.flatMap((sen) => sen.words));
}

export function computeMetrics(words: GradedWord[]): SpikeMetrics {
  const totalWords = words.length;
  const flagged = (w: GradedWord) => w.asrVerdict !== "read";
  const adultErrors = words.filter((w) => w.adultVerdict === "error").length;
  const adultCorrect = totalWords - adultErrors;
  const detected = words.filter(
    (w) => w.adultVerdict === "error" && flagged(w),
  ).length;
  const falseAlarms = words.filter(
    (w) => w.adultVerdict === "correct" && flagged(w),
  ).length;
  return {
    totalWords,
    adultErrors,
    detected,
    missed: adultErrors - detected,
    falseAlarms,
    detectionRate: adultErrors > 0 ? detected / adultErrors : null,
    falseAlarmRate: adultCorrect > 0 ? falseAlarms / adultCorrect : null,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/buddy/metrics.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/buddy/metrics.ts src/lib/buddy/metrics.test.ts
git commit -m "feat(buddy): spike metrics — detection and false-alarm rates vs adult grading"
```

---

### Task 4: Clip recorder (keeps the blob for grading playback)

The existing `listenForSpeech()` in `src/lib/speech-recognition.ts` auto-stops on a timer and discards the audio blob. Grading needs manual stop (a sentence takes as long as it takes) and the blob (adult must replay the clip). This is a small parallel module, not a modification — `listenForSpeech` keeps its contract for PhonicsActivity.

**Files:**
- Create: `src/lib/buddy/recorder.ts`

No unit test — this is thin glue over browser `MediaRecorder`/`fetch`, verified in Task 7's browser pass. All logic that can be pure lives in Tasks 1–3.

- [ ] **Step 1: Write the module**

```ts
// src/lib/buddy/recorder.ts
/**
 * Manual start/stop clip recorder for the buddy spike.
 * Unlike listenForSpeech(), this keeps the audio blob (needed for adult
 * grading playback) and stops on user action, not a timer.
 * Transcription goes through the existing auth-gated /api/transcribe route.
 */

export interface ClipResult {
  blob: Blob | null;
  transcript: string;
}

let _recorder: MediaRecorder | null = null;
let _chunks: Blob[] = [];

export async function startClip(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
    _chunks = [];
    _recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    _recorder.ondataavailable = (e) => {
      if (e.data.size > 0) _chunks.push(e.data);
    };
    _recorder.start(100);
    return true;
  } catch {
    return false;
  }
}

export async function stopClip(): Promise<ClipResult> {
  const recorder = _recorder;
  _recorder = null;
  if (!recorder || recorder.state !== "recording") {
    return { blob: null, transcript: "" };
  }

  await new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
    recorder.stop();
    recorder.stream.getTracks().forEach((t) => t.stop());
  });

  const blob = new Blob(_chunks, { type: recorder.mimeType || "audio/webm" });
  if (blob.size < 1000) return { blob: null, transcript: "" };

  try {
    const form = new FormData();
    form.append("audio", blob, "audio.webm");
    const res = await fetch("/api/transcribe", { method: "POST", body: form });
    if (!res.ok) return { blob, transcript: "" };
    const data = await res.json();
    return { blob, transcript: (data.text ?? "").trim() };
  } catch {
    return { blob, transcript: "" };
  }
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors in `src/lib/buddy/recorder.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/buddy/recorder.ts
git commit -m "feat(buddy): manual clip recorder that retains audio for grading"
```

---

### Task 5: Session UI — setup form + routine runner

**Files:**
- Create: `src/app/spike/buddy/page.tsx`
- Create: `src/components/buddy/BuddySpike.tsx`
- Create: `src/components/buddy/BuddyReview.tsx` (stub in this task, full build in Task 6)

Child-facing rules that apply here even though we're outside `/student/*`: buddy lines are **audio-only** (never rendered — sidesteps R11 punctuation and keeps on-screen text to the passage itself), sentence display uses the `.passage` class (R21), buttons are ≥48px (R19), copy is positive-only (R25), no idle animation (R26), no transcript ever shown during the session (R7/R17 spirit), no italics (R5).

- [ ] **Step 1: Server page with auth gate**

```tsx
// src/app/spike/buddy/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BuddySpike from "@/components/buddy/BuddySpike";

export default async function BuddySpikePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <BuddySpike />;
}
```

- [ ] **Step 2: Stub BuddyReview (full build next task)**

```tsx
// src/components/buddy/BuddyReview.tsx
"use client";

import type { AlignedWord } from "@/lib/buddy/alignment";

export interface RecordedSentence {
  sentenceIndex: number;
  target: string;
  transcript: string;
  blobUrl: string | null;
  words: AlignedWord[];
}

interface BuddyReviewProps {
  passageId: string;
  sentences: RecordedSentence[];
}

export default function BuddyReview({ sentences }: BuddyReviewProps) {
  return (
    <p className="text-gray-500">
      Review screen — built in Task 6. Recorded {sentences.length} sentences.
    </p>
  );
}
```

- [ ] **Step 3: Build BuddySpike**

```tsx
// src/components/buddy/BuddySpike.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { fixtureReadAloudPassages } from "@/lib/fixtures/student";
import { alignWords } from "@/lib/buddy/alignment";
import {
  buildRoutine,
  pickWarmupSounds,
  type BuddyStep,
} from "@/lib/buddy/routine";
import { startClip, stopClip } from "@/lib/buddy/recorder";
import { cancelSpeech, speakPhoneme, speakSentence } from "@/lib/speech";
import BuddyReview, { type RecordedSentence } from "./BuddyReview";

type Phase = "setup" | "session" | "gate" | "review";
type RecState = "waiting" | "recording" | "processing";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function BuddySpike() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [childName, setChildName] = useState("");
  const [passageId, setPassageId] = useState(fixtureReadAloudPassages[0].id);
  const [customText, setCustomText] = useState("");
  const [steps, setSteps] = useState<BuddyStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [recState, setRecState] = useState<RecState>("waiting");
  const [micError, setMicError] = useState(false);
  const recordedRef = useRef<RecordedSentence[]>([]);

  const passageText =
    customText.trim() ||
    fixtureReadAloudPassages.find((p) => p.id === passageId)?.text ||
    fixtureReadAloudPassages[0].text;
  const exportPassageId = customText.trim() ? "custom" : passageId;

  /** Speak and auto-advance through non-recording steps, stop at recording ones. */
  const runFrom = useCallback(
    async (queue: BuddyStep[], from: number) => {
      let i = from;
      while (i < queue.length && !queue[i].records) {
        const step = queue[i];
        setStepIndex(i);
        await speakSentence(step.buddyLine);
        if (step.type === "warmup_sound" && step.target) {
          await speakPhoneme(step.target);
          await delay(1800); // pause for the child's echo (not recorded)
        }
        if (step.type === "finish") {
          setPhase("gate");
          return;
        }
        i++;
      }
      if (i < queue.length) {
        setStepIndex(i);
        await speakSentence(queue[i].buddyLine);
        setRecState("waiting");
      }
    },
    [],
  );

  const handleStart = useCallback(async () => {
    const name = childName.trim() || "friend";
    const routine = buildRoutine({
      childName: name,
      passageText,
      warmupSounds: pickWarmupSounds(passageText),
    });
    recordedRef.current = [];
    setSteps(routine);
    setPhase("session");
    await runFrom(routine, 0);
  }, [childName, passageText, runFrom]);

  const handleRecord = useCallback(async () => {
    const ok = await startClip();
    if (!ok) {
      setMicError(true);
      return;
    }
    setRecState("recording");
  }, []);

  const handleDone = useCallback(async () => {
    setRecState("processing");
    const step = steps[stepIndex];
    const { blob, transcript } = await stopClip();
    recordedRef.current.push({
      sentenceIndex: step.sentenceIndex ?? 0,
      target: step.target ?? "",
      transcript,
      blobUrl: blob ? URL.createObjectURL(blob) : null,
      words: alignWords(step.target ?? "", transcript),
    });
    // R7: always positive, never a verdict, regardless of what ASR heard.
    await speakSentence("Great reading!");
    await runFrom(steps, stepIndex + 1);
  }, [steps, stepIndex, runFrom]);

  const currentStep = steps[stepIndex];

  if (phase === "setup") {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-5 px-6 py-10">
        <h1 className="text-2xl font-extrabold text-purple-700">
          Reading Buddy (spike)
        </h1>
        <label className="flex flex-col gap-1 text-sm font-bold text-gray-600">
          Child first name (spoken only, never saved)
          <input
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            className="rounded-xl border border-gray-300 px-4 py-3 text-lg"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-gray-600">
          Passage
          <select
            value={passageId}
            onChange={(e) => setPassageId(e.target.value)}
            className="rounded-xl border border-gray-300 px-4 py-3 text-lg"
          >
            {fixtureReadAloudPassages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.difficulty})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-gray-600">
          Or paste a custom passage (overrides the pick above)
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={4}
            className="rounded-xl border border-gray-300 px-4 py-3 text-lg"
          />
        </label>
        <button
          onClick={handleStart}
          className="min-h-12 rounded-2xl bg-purple-600 px-8 py-4 text-xl font-extrabold text-white shadow-lg hover:bg-purple-700 active:scale-95 transition-transform"
        >
          Start session
        </button>
      </main>
    );
  }

  if (phase === "session") {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center gap-8 px-6 py-10">
        <div className="text-7xl" aria-hidden>
          🐣
        </div>
        {currentStep?.records ? (
          <>
            <div className="w-full rounded-2xl bg-white px-6 py-5 shadow-sm">
              <p className="passage text-2xl font-semibold text-gray-800">
                {currentStep.target}
              </p>
            </div>
            {recState === "waiting" && (
              <button
                onClick={handleRecord}
                className="min-h-12 rounded-2xl bg-red-500 px-8 py-5 text-xl font-extrabold text-white shadow-lg hover:bg-red-600 active:scale-95 transition-transform"
              >
                🎙 Start Reading
              </button>
            )}
            {recState === "recording" && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 rounded-full bg-red-100 px-4 py-2">
                  <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-bold text-red-600">
                    Listening
                  </span>
                </div>
                <button
                  onClick={handleDone}
                  className="min-h-12 rounded-2xl bg-purple-600 px-8 py-5 text-xl font-extrabold text-white shadow-lg hover:bg-purple-700 active:scale-95 transition-transform"
                >
                  ✅ Done Reading
                </button>
              </div>
            )}
            {recState === "processing" && (
              <p className="text-sm text-gray-400 animate-pulse">
                One moment
              </p>
            )}
            {micError && (
              <p className="text-sm font-bold text-red-500">
                Microphone not available — ask a grown-up for help
              </p>
            )}
          </>
        ) : (
          <p className="text-lg font-bold text-gray-500">
            {currentStep?.type === "warmup_sound" ? "Listen and echo!" : "…"}
          </p>
        )}
      </main>
    );
  }

  if (phase === "gate") {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-8 px-6 py-10">
        <p className="text-3xl font-extrabold text-green-700">
          ⭐ All done! Great job!
        </p>
        <p className="text-lg font-bold text-gray-600">
          Hand the iPad to a grown-up.
        </p>
        <button
          onClick={() => {
            cancelSpeech();
            setPhase("review");
          }}
          className="min-h-12 rounded-2xl bg-gray-700 px-6 py-4 text-lg font-bold text-white hover:bg-gray-800"
        >
          Grown-up review
        </button>
      </main>
    );
  }

  return (
    <BuddyReview passageId={exportPassageId} sentences={recordedRef.current} />
  );
}
```

- [ ] **Step 4: Type-check, lint, and run the full suite**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: clean; existing engine + new buddy tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/spike/buddy/page.tsx src/components/buddy/BuddySpike.tsx src/components/buddy/BuddyReview.tsx
git commit -m "feat(buddy): guided session UI with pre-queued routine runner"
```

---

### Task 6: Adult grading screen + JSON export

**Files:**
- Modify: `src/components/buddy/BuddyReview.tsx` (replace the Task 5 stub entirely)

Grading model: every target word starts with `adultVerdict` derived from the ASR verdict (`read` → `correct`, otherwise `error`). The adult replays each clip and **taps any word the ASR got wrong** to flip it. Export downloads a `SessionExport` JSON (initials only, no audio).

- [ ] **Step 1: Replace the stub with the full component**

```tsx
// src/components/buddy/BuddyReview.tsx
"use client";

import { useMemo, useState } from "react";
import type { AlignedWord } from "@/lib/buddy/alignment";
import type { SessionExport } from "@/lib/buddy/metrics";

export interface RecordedSentence {
  sentenceIndex: number;
  target: string;
  transcript: string;
  blobUrl: string | null;
  words: AlignedWord[];
}

interface BuddyReviewProps {
  passageId: string;
  sentences: RecordedSentence[];
}

const VERDICT_STYLE: Record<string, string> = {
  read: "bg-green-100 text-green-800 border-green-300",
  misread: "bg-orange-100 text-orange-800 border-orange-300",
  skipped: "bg-red-100 text-red-800 border-red-300",
};

export default function BuddyReview({ passageId, sentences }: BuddyReviewProps) {
  const [childAlias, setChildAlias] = useState("");
  // adultCorrect[sentenceIdx][wordIdx] = did the child ACTUALLY read it correctly
  const [adultCorrect, setAdultCorrect] = useState<boolean[][]>(() =>
    sentences.map((s) => s.words.map((w) => w.verdict === "read")),
  );

  const toggle = (si: number, wi: number) => {
    setAdultCorrect((prev) =>
      prev.map((row, i) =>
        i === si ? row.map((v, j) => (j === wi ? !v : v)) : row,
      ),
    );
  };

  const exportJson = useMemo(() => {
    const data: SessionExport = {
      childAlias: childAlias.trim() || "?",
      passageId,
      date: new Date().toISOString().slice(0, 10),
      sentences: sentences.map((s, si) => ({
        sentenceIndex: s.sentenceIndex,
        target: s.target,
        transcript: s.transcript,
        words: s.words.map((w, wi) => ({
          word: w.word,
          heard: w.heard,
          asrVerdict: w.verdict,
          adultVerdict: adultCorrect[si][wi] ? ("correct" as const) : ("error" as const),
        })),
      })),
    };
    return JSON.stringify(data, null, 2);
  }, [childAlias, passageId, sentences, adultCorrect]);

  const download = () => {
    const blob = new Blob([exportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buddy-session-${childAlias.trim() || "x"}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-extrabold text-gray-800">
        Grown-up review
      </h1>
      <p className="text-sm text-gray-500">
        Machine transcripts below may be inaccurate. Replay each clip. A word
        chip shows what the machine decided — tap any chip the machine got
        wrong. Green = machine heard it read correctly; orange = machine heard
        a different word; red = machine heard nothing for it. A tapped chip
        flips your verdict (ring = you marked it as actually read correctly).
      </p>

      {sentences.map((s, si) => (
        <section key={si} className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="passage text-lg font-semibold text-gray-800">
            {s.target}
          </p>
          {s.blobUrl ? (
            <audio controls src={s.blobUrl} className="mt-3 w-full" />
          ) : (
            <p className="mt-3 text-sm text-red-500">No audio captured</p>
          )}
          <p className="mt-2 text-xs text-gray-400">
            Machine transcript: {s.transcript || "(empty)"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {s.words.map((w, wi) => (
              <button
                key={wi}
                onClick={() => toggle(si, wi)}
                className={`min-h-12 rounded-xl border-2 px-3 py-2 text-sm font-bold ${VERDICT_STYLE[w.verdict]} ${
                  adultCorrect[si][wi] ? "ring-2 ring-blue-500" : ""
                }`}
                title={w.heard ? `machine heard: ${w.heard}` : "machine heard nothing"}
              >
                {w.word}
                {w.heard && w.verdict === "misread" ? ` → ${w.heard}` : ""}
              </button>
            ))}
          </div>
        </section>
      ))}

      <label className="flex flex-col gap-1 text-sm font-bold text-gray-600">
        Child initials for the export (never a full name)
        <input
          value={childAlias}
          onChange={(e) => setChildAlias(e.target.value)}
          maxLength={3}
          className="w-24 rounded-xl border border-gray-300 px-4 py-3 text-lg"
        />
      </label>
      <button
        onClick={download}
        className="min-h-12 rounded-2xl bg-purple-600 px-6 py-4 text-lg font-extrabold text-white shadow-md hover:bg-purple-700"
      >
        Download session JSON
      </button>
      <p className="text-xs text-gray-400">
        Audio is not saved — it lives only in this browser tab. The JSON
        contains words and verdicts only.
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Type-check, lint, full suite**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/buddy/BuddyReview.tsx
git commit -m "feat(buddy): adult grading screen with ground-truth toggles and JSON export"
```

---

### Task 7: Browser verification pass

No new files. Verify the whole loop in a real browser before any child sees it.

- [ ] **Step 1: Start the dev server** (`npm run dev`, port 3000; use preview tools if available)

- [ ] **Step 2: Walk the flow, checking each item**

1. Visit `http://localhost:3000/spike/buddy` while signed out → redirected to `/login`. Sign in, return.
2. Setup: pick "The Cat and the Hat", enter a name, Start session. Buddy speaks greeting, then three warm-up sounds with pauses.
3. First sentence appears in `.passage` typography. Tap 🎙, read the sentence **correctly**, tap ✅. Buddy says "Great reading!", advances.
4. On a later sentence, deliberately misread one word (say "sip" for a word, skip another). Complete the session.
5. Gate screen shows "⭐ All done!" — confirm **no transcript, no verdicts, nothing negative** appeared on any child-facing screen.
6. Grown-up review: audio replays; the deliberately-misread word shows orange with `word → heard`; the skipped word shows red. Tap a chip and confirm the ring toggles.
7. Download JSON; open it; confirm shape matches `SessionExport` (initials, verdicts, no audio, no full name).
8. Check the browser console for errors and the network tab: `/api/transcribe` calls return 200.

- [ ] **Step 3: Fix anything broken** (diagnose in source, re-run the relevant unit tests, repeat Step 2)

- [ ] **Step 4: Commit any fixes**

```bash
git add -A src/
git commit -m "fix(buddy): browser-verification fixes for spike session flow"
```

---

### Task 8: Metrics CLI

**Files:**
- Create: `scripts/buddy-metrics.ts`

- [ ] **Step 1: Write the script** (all math is already unit-tested in Task 3; this is I/O glue)

```ts
// scripts/buddy-metrics.ts
/**
 * Aggregate graded buddy-session JSON exports into spike metrics.
 * Usage: npx tsx scripts/buddy-metrics.ts [dir-of-session-jsons]
 * Default dir: ./spike-data
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  computeMetrics,
  wordsFromSessions,
  type SessionExport,
} from "../src/lib/buddy/metrics";

const dir = process.argv[2] ?? "spike-data";
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
if (files.length === 0) {
  console.error(`No .json session files found in ${dir}/`);
  process.exit(1);
}

const sessions: SessionExport[] = files.map((f) =>
  JSON.parse(readFileSync(join(dir, f), "utf8")),
);
const words = wordsFromSessions(sessions);
const m = computeMetrics(words);
const pct = (x: number | null) =>
  x === null ? "n/a" : `${(x * 100).toFixed(1)}%`;

console.log(`Sessions: ${sessions.length}`);
console.log(`Words graded: ${m.totalWords}`);
console.log(`Actual errors (adult-marked): ${m.adultErrors}`);
console.log(`  detected by ASR: ${m.detected} (detection rate ${pct(m.detectionRate)})`);
console.log(`  missed by ASR:   ${m.missed}`);
console.log(`False alarms: ${m.falseAlarms} (${pct(m.falseAlarmRate)} of correctly-read words)`);
console.log("");
console.log("Decision gates (docs/spikes/2026-07-voice-buddy-rung1.md):");
console.log("  GREEN:  detection >= 70% AND false alarms <= 10%");
console.log("  YELLOW: detection <  70% AND false alarms <= 10%");
console.log("  RED:    false alarms > 10%");
```

- [ ] **Step 2: Verify against a hand-made sample**

Create `spike-data/sample.json` containing the `SessionExport` from the Task 3 test (the one-sentence "The cat sat." session), run:

`npx tsx scripts/buddy-metrics.ts spike-data`

Expected output includes `Words graded: 3`, `Actual errors (adult-marked): 0`, `detection rate n/a`. Then delete the sample: `rm spike-data/sample.json`.

- [ ] **Step 3: Add `spike-data/` to `.gitignore`** (session exports are child data — never committed)

Append the line `spike-data/` to `.gitignore`.

- [ ] **Step 4: Commit**

```bash
git add scripts/buddy-metrics.ts .gitignore
git commit -m "feat(buddy): metrics CLI aggregating graded spike sessions"
```

---

### Task 9: Spike protocol doc

**Files:**
- Create: `docs/spikes/2026-07-voice-buddy-rung1.md`

- [ ] **Step 1: Write the doc**

```markdown
# Voice Buddy Rung-1 Spike — Run Protocol

**Question:** Can Whisper-class ASR reliably detect a child's decoding errors
while reading aloud? This gates the entire AI-tutor ladder (voice buddy →
avatar tutor → avatar-assisted group lessons). Plan:
`docs/superpowers/plans/2026-07-03-voice-buddy-rung1-spike.md`.

## Sample-size target

- At least **3 children** from Ilana's students (mix of reading levels).
- At least **2 sessions each** on different days.
- At least **300 graded words** total before reading the metrics.

## Prerequisites

- `OPENAI_API_KEY` with credits in `.env.local` (`npm run pull-secrets`).
- Signed in as the teacher account on the session device (iPad + external
  or built-in mic; test the mic with an adult first).
- Parent consent: sessions send the child's voice to OpenAI Whisper via the
  existing `/api/transcribe` path — the same consent captured at join time
  covers this. A parent or Ilana is present for every session.

## Running a session (10 min per child)

1. Adult opens `/spike/buddy`, enters the child's first name (spoken only,
   never exported), picks a passage at the child's level — or pastes a
   harder custom passage for grade-3-6 students.
2. Hand the child the iPad. The buddy (Pip) runs the fixed routine:
   greeting → 3 sound echoes → sentence-by-sentence reading → praise.
   The adult **silently notes** any reading errors they hear, but does not
   correct or interrupt (we are measuring the machine, not teaching).
3. At "Hand the iPad to a grown-up", the adult opens the review screen,
   replays each clip, and fixes any word chip the machine got wrong:
   - Child read it correctly but chip is orange/red → tap (mark correct).
   - Child misread/skipped it but chip is green → tap (mark error).
4. Enter the child's initials, Download session JSON, move the file into
   `spike-data/` in the repo (gitignored — never commit child data).

## Reading the result

Run: `npx tsx scripts/buddy-metrics.ts spike-data`

| Gate | Condition | Meaning |
|---|---|---|
| **GREEN** | detection ≥ 70% AND false alarms ≤ 10% | ASR is good enough for gentle in-session correction. Green-light rung 1.5: buddy reacts to errors ("let's try that word again") + start rung-2 (conversational voice) planning. |
| **YELLOW** | detection < 70%, false alarms ≤ 10% | ASR misses too many errors to correct live, but what it flags is trustworthy. Buddy stays praise-only for the child; flagged words go to the teacher as "practice words". Re-test after trying whisper alternatives / prompt hints. |
| **RED** | false alarms > 10% | ASR wrongly flags correct reading too often — any in-session correction would punish good reading. R7 stands. Buddy remains routine + encouragement only. Investigate child-tuned ASR before revisiting. |

## Privacy

- Audio never leaves the browser except the existing transcribe path
  (OpenAI API, not used for training, not persisted by our route).
- Exports contain initials, words, and verdicts only. `spike-data/` is
  gitignored.
- No Supabase writes: spike sessions do not appear in practice history.
```

- [ ] **Step 2: Commit**

```bash
git add docs/spikes/2026-07-voice-buddy-rung1.md
git commit -m "docs(buddy): rung-1 spike run protocol with decision gates"
```

---

### Task 10: Final verification + integration

- [ ] **Step 1: Full suite + build**

Run: `npm test && npm run lint && npm run build`
Expected: all tests pass, lint clean, build succeeds (build validates the new `/spike/buddy` route).

- [ ] **Step 2: Update project docs**

In `CLAUDE.md`: under "Commands", replace the stale line `- No JS/TS test framework yet` with `- npm test — vitest (engine + buddy-spike unit tests)`. Add one line to the Architecture → Routes section: `- /spike/buddy — rung-1 voice-buddy ASR-validation spike (see docs/spikes/2026-07-voice-buddy-rung1.md). Not linked from any child/teacher surface.`

- [ ] **Step 3: Commit and finish the branch**

```bash
git add CLAUDE.md
git commit -m "docs: register buddy spike route and test command"
```

Then use superpowers:finishing-a-development-branch to decide merge/PR. Recommendation: PR to `main` — the spike is additive (new route + new lib dir), touches no existing behavior.

---

## Self-review notes

- **Spec coverage:** routine pre-queuing (Magic Ears) → Task 2; child session → Task 5; ASR measurement → Tasks 1, 3, 6, 8; run protocol + gates → Task 9; rung-1 scope fence (no LLM, no DB writes, no `/student/*`) → Decisions section + Tasks 4–6.
- **Type consistency:** `AlignedWord`/`WordVerdict` defined in Task 1, consumed in Tasks 3, 5, 6. `SessionExport`/`ExportedWord` defined in Task 3, consumed in Tasks 6, 8. `RecordedSentence` defined in Task 5 stub, unchanged in Task 6. `BuddyStep` defined in Task 2, consumed in Task 5.
- **Known soft spot:** `recorder.ts` and the two client components are untested by design (browser APIs); all decision logic they call is unit-tested. Task 7 is the compensating control.
