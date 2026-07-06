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
