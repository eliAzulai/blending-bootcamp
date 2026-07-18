import { CARE_LABEL, type CareVerb } from "@/lib/pet";

/**
 * Every child-facing string introduced by the pet reward system lives here so
 * a single vitest can enforce R25 (no streak shaming) and R27 (no economy
 * language) over ALL of it. Components import from this manifest — never
 * inline new child copy without adding it here.
 *
 * Templates use {pet} for the pet's name.
 */

export const CARE_REACTION_LINE: Record<CareVerb, string> = {
  snack: "Yum yum!",
  ball: "So fun!",
  treat: "{pet} loves it!",
};

export const WANT_FULFILLED_LINE = "Just what {pet} wanted!";

export const WANT_LINE: Record<CareVerb, string> = {
  snack: "{pet} would love a snack today.",
  ball: "{pet} would love to play ball today.",
  treat: "{pet} would love a special treat today.",
};

export const MEMORY_LINE = "{pet} loved the {emoji}!";

export const SATIATED_LINE = "{pet} is happily full.";

/** Free reactions when the child taps the pet directly (picked deterministically). */
export const PET_TAP_LINES = [
  "{pet} is happy to see you!",
  "{pet} wiggles with joy!",
  "{pet} loves you!",
];

/**
 * Bloom-on-return (research spec §3): a good surprise waiting when the child
 * arrives before practicing. Never references absence — reunion joy, not
 * escape from dread. Which line varies by day (detoxified variable reward).
 */
export const SURPRISE_LINES = [
  "{pet} learned a silly dance!",
  "{pet} found a shiny leaf!",
  "{pet} made a new friend!",
  "{pet} had a funny dream!",
  "{pet} drew you a picture!",
  "{pet} learned a new wiggle!",
];

/** Completion screen: the pet consumes the learning ("the words are the food"). */
export const PET_LEARNED_WORD_LINE = "{pet} learned your word!";
export const HEAR_WORD_LABEL = "Hear {pet} say it";

export const PLAY_ENTRY_LABEL = "Play Letter Hunt with {pet}";

export const HUNT_PROMPT = "Find {count} things that start with";
export const HUNT_CORRECT_LINE = "You found one!";
export const HUNT_ROUND_DONE_LINE = "{pet} is so proud of you!";
export const HUNT_ALL_DONE_LINE = "{pet} found everything! Time for a nap. 💤";
export const HUNT_HEAR_SOUND_LABEL = "Hear the sound";

/** Flat list for the R25/R27 copy audit test. */
export const ALL_CHILD_COPY: string[] = [
  ...Object.values(CARE_LABEL),
  ...Object.values(CARE_REACTION_LINE),
  WANT_FULFILLED_LINE,
  ...Object.values(WANT_LINE),
  MEMORY_LINE,
  SATIATED_LINE,
  ...PET_TAP_LINES,
  ...SURPRISE_LINES,
  PET_LEARNED_WORD_LINE,
  HEAR_WORD_LABEL,
  PLAY_ENTRY_LABEL,
  HUNT_PROMPT,
  HUNT_CORRECT_LINE,
  HUNT_ROUND_DONE_LINE,
  HUNT_ALL_DONE_LINE,
  HUNT_HEAR_SOUND_LABEL,
];

export function fillPetName(template: string, petName: string): string {
  return template.replaceAll("{pet}", petName);
}
