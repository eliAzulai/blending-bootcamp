// ---------------------------------------------------------------------------
// Blending Bootcamp -- Lesson type definitions
// ---------------------------------------------------------------------------

/** A single word broken into its constituent phonemes. */
export interface PhonemeWord {
  /** The complete written word (e.g. "cat"). */
  word: string;
  /** Ordered array of phoneme strings (e.g. ["c", "a", "t"]). */
  phonemes: string[];
}

/** Curriculum phase identifier. */
export type Phase = 1 | 2 | 3;

/** Base fields shared by every lesson. */
interface LessonBase {
  /** Day number within the 14-day programme (1-14). */
  day: number;
  /** Curriculum phase the lesson belongs to. */
  phase: Phase;
  /** Kid-friendly lesson title. */
  title: string;
  /** Short description of what the lesson covers. */
  description: string;
  /** Words practised in this lesson, each split into phonemes. */
  words: PhonemeWord[];
}

/**
 * Phase 1 -- Sound Glue (Days 1-4)
 * Simple 2-3 letter CVC blending.
 */
export interface Phase1Lesson extends LessonBase {
  phase: 1;
}

/**
 * Phase 2 -- Automatic Blending (Days 5-9)
 * Speed drills with CCVC / CVCC words.
 */
export interface Phase2Lesson extends LessonBase {
  phase: 2;
}

/**
 * Phase 3 -- Transfer to Reading (Days 10-14)
 * Decodable sentences and mini-stories built from learned words.
 */
export interface Phase3Lesson extends LessonBase {
  phase: 3;
  /** Short decodable sentences / mini-story using only previously learned words. */
  decodableText: string;
}

/** Discriminated union of all lesson types. */
export type Lesson = Phase1Lesson | Phase2Lesson | Phase3Lesson;

/** The full curriculum is simply an ordered array of lessons. */
export type Curriculum = Lesson[];
