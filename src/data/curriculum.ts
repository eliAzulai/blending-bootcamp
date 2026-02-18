import type { Curriculum } from "@/types/lesson";

/**
 * The 14-day Blending Bootcamp curriculum.
 *
 * Phase 1 (Days 1-4): Sound Glue -- simple CVC words.
 * Phase 2 (Days 5-9): Automatic Blending -- CCVC / CVCC words and speed drills.
 * Phase 3 (Days 10-14): Transfer to Reading -- decodable sentences.
 */
export const curriculum: Curriculum = [
  // ---- Phase 1: Sound Glue ----
  {
    day: 1,
    phase: 1,
    title: "First Sounds",
    description: "Blend simple three-sound words with short vowels.",
    words: [
      { word: "cat", phonemes: ["c", "a", "t"] },
      { word: "sat", phonemes: ["s", "a", "t"] },
      { word: "mat", phonemes: ["m", "a", "t"] },
      { word: "hat", phonemes: ["h", "a", "t"] },
      { word: "bat", phonemes: ["b", "a", "t"] },
    ],
  },
  {
    day: 2,
    phase: 1,
    title: "Short I Words",
    description: "Practise blending words with the short i sound.",
    words: [
      { word: "sit", phonemes: ["s", "i", "t"] },
      { word: "bit", phonemes: ["b", "i", "t"] },
      { word: "hit", phonemes: ["h", "i", "t"] },
      { word: "fit", phonemes: ["f", "i", "t"] },
      { word: "pin", phonemes: ["p", "i", "n"] },
    ],
  },
  {
    day: 3,
    phase: 1,
    title: "Short O Words",
    description: "Blend words with the short o sound.",
    words: [
      { word: "dog", phonemes: ["d", "o", "g"] },
      { word: "log", phonemes: ["l", "o", "g"] },
      { word: "hot", phonemes: ["h", "o", "t"] },
      { word: "pot", phonemes: ["p", "o", "t"] },
      { word: "mop", phonemes: ["m", "o", "p"] },
    ],
  },
  {
    day: 4,
    phase: 1,
    title: "Short U & E Words",
    description: "Blend words with short u and short e sounds.",
    words: [
      { word: "sun", phonemes: ["s", "u", "n"] },
      { word: "run", phonemes: ["r", "u", "n"] },
      { word: "bug", phonemes: ["b", "u", "g"] },
      { word: "bed", phonemes: ["b", "e", "d"] },
      { word: "red", phonemes: ["r", "e", "d"] },
    ],
  },

  // ---- Phase 2: Automatic Blending ----
  {
    day: 5,
    phase: 2,
    title: "Beginning Blends",
    description: "Blend words that start with two consonants.",
    words: [
      { word: "stop", phonemes: ["s", "t", "o", "p"] },
      { word: "clap", phonemes: ["c", "l", "a", "p"] },
      { word: "frog", phonemes: ["f", "r", "o", "g"] },
      { word: "flag", phonemes: ["f", "l", "a", "g"] },
      { word: "spin", phonemes: ["s", "p", "i", "n"] },
    ],
  },
  {
    day: 6,
    phase: 2,
    title: "Ending Blends",
    description: "Blend words that end with two consonants.",
    words: [
      { word: "jump", phonemes: ["j", "u", "m", "p"] },
      { word: "hand", phonemes: ["h", "a", "n", "d"] },
      { word: "milk", phonemes: ["m", "i", "l", "k"] },
      { word: "pond", phonemes: ["p", "o", "n", "d"] },
      { word: "dust", phonemes: ["d", "u", "s", "t"] },
    ],
  },
  {
    day: 7,
    phase: 2,
    title: "Digraph Sounds",
    description: "Blend words with sh, ch, and th digraphs.",
    words: [
      { word: "ship", phonemes: ["sh", "i", "p"] },
      { word: "chip", phonemes: ["ch", "i", "p"] },
      { word: "thin", phonemes: ["th", "i", "n"] },
      { word: "shop", phonemes: ["sh", "o", "p"] },
      { word: "chop", phonemes: ["ch", "o", "p"] },
    ],
  },
  {
    day: 8,
    phase: 2,
    title: "Speed Drill 1",
    description: "Blend familiar words quickly to build fluency.",
    words: [
      { word: "cat", phonemes: ["c", "a", "t"] },
      { word: "ship", phonemes: ["sh", "i", "p"] },
      { word: "frog", phonemes: ["f", "r", "o", "g"] },
      { word: "hand", phonemes: ["h", "a", "n", "d"] },
      { word: "bed", phonemes: ["b", "e", "d"] },
      { word: "stop", phonemes: ["s", "t", "o", "p"] },
    ],
  },
  {
    day: 9,
    phase: 2,
    title: "Speed Drill 2",
    description: "More speed practice with mixed word types.",
    words: [
      { word: "thin", phonemes: ["th", "i", "n"] },
      { word: "clap", phonemes: ["c", "l", "a", "p"] },
      { word: "dust", phonemes: ["d", "u", "s", "t"] },
      { word: "pin", phonemes: ["p", "i", "n"] },
      { word: "flag", phonemes: ["f", "l", "a", "g"] },
      { word: "chop", phonemes: ["ch", "o", "p"] },
    ],
  },

  // ---- Phase 3: Transfer to Reading ----
  {
    day: 10,
    phase: 3,
    title: "Reading Sentences 1",
    description: "Read short sentences built from words you know.",
    words: [
      { word: "the", phonemes: ["th", "e"] },
      { word: "cat", phonemes: ["c", "a", "t"] },
      { word: "sat", phonemes: ["s", "a", "t"] },
      { word: "mat", phonemes: ["m", "a", "t"] },
      { word: "hat", phonemes: ["h", "a", "t"] },
    ],
    decodableText: "The cat sat on the mat. The cat has a hat.",
  },
  {
    day: 11,
    phase: 3,
    title: "Reading Sentences 2",
    description: "Read sentences with action words.",
    words: [
      { word: "dog", phonemes: ["d", "o", "g"] },
      { word: "run", phonemes: ["r", "u", "n"] },
      { word: "jump", phonemes: ["j", "u", "m", "p"] },
      { word: "stop", phonemes: ["s", "t", "o", "p"] },
      { word: "hot", phonemes: ["h", "o", "t"] },
    ],
    decodableText: "The dog can run and jump. Stop! It is hot.",
  },
  {
    day: 12,
    phase: 3,
    title: "Mini Story 1",
    description: "Read a short story about a frog.",
    words: [
      { word: "frog", phonemes: ["f", "r", "o", "g"] },
      { word: "log", phonemes: ["l", "o", "g"] },
      { word: "pond", phonemes: ["p", "o", "n", "d"] },
      { word: "bug", phonemes: ["b", "u", "g"] },
      { word: "sun", phonemes: ["s", "u", "n"] },
    ],
    decodableText:
      "A frog sat on a log. The log is in the pond. The frog can see a bug. The sun is hot.",
  },
  {
    day: 13,
    phase: 3,
    title: "Mini Story 2",
    description: "Read a story about a trip to the shop.",
    words: [
      { word: "shop", phonemes: ["sh", "o", "p"] },
      { word: "chip", phonemes: ["ch", "i", "p"] },
      { word: "milk", phonemes: ["m", "i", "l", "k"] },
      { word: "hand", phonemes: ["h", "a", "n", "d"] },
      { word: "flag", phonemes: ["f", "l", "a", "g"] },
    ],
    decodableText:
      "We go to the shop. I get a chip and milk. I hold them in my hand. The shop has a big flag.",
  },
  {
    day: 14,
    phase: 3,
    title: "Graduation Day",
    description: "Read a final story and celebrate all you have learned!",
    words: [
      { word: "clap", phonemes: ["c", "l", "a", "p"] },
      { word: "spin", phonemes: ["s", "p", "i", "n"] },
      { word: "dust", phonemes: ["d", "u", "s", "t"] },
      { word: "red", phonemes: ["r", "e", "d"] },
      { word: "thin", phonemes: ["th", "i", "n"] },
    ],
    decodableText:
      "Clap your hands and spin! Dust off the thin red hat. You did it! You can read!",
  },
];

export function getLessonByDay(day: number) {
  return curriculum.find((l) => l.day === day) ?? null;
}
