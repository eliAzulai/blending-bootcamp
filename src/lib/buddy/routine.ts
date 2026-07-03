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

// Deliberate trade-off: an abbreviation that genuinely ends a sentence
// ("Main St. It was fun.") still merges — a too-long sentence beats a
// nonsense fragment, and real NLP is out of scope for the spike.
const ABBREVIATION_END = /\b(?:mr|mrs|ms|dr|st|jr|sr)\.$/i;

export function splitSentences(text: string): string[] {
  const raw = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  // Re-join fragments that were split after an abbreviation ("Mr." + "Smith...").
  const out: string[] = [];
  for (const piece of raw) {
    const prev = out[out.length - 1];
    if (prev && ABBREVIATION_END.test(prev)) {
      out[out.length - 1] = `${prev} ${piece}`;
    } else {
      out.push(piece);
    }
  }
  return out;
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

  const sentences = splitSentences(config.passageText);
  if (sentences.length === 0) {
    throw new Error("buildRoutine: passage has no sentences");
  }
  sentences.forEach((sentence, i) => {
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
