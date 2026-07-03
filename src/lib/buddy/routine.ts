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
