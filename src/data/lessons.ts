// ---------------------------------------------------------------------------
// Blending Bootcamp -- Complete 14-day lesson data
// 60-80 unique words across three phases, ~10 min / day, ages 5-7
// ---------------------------------------------------------------------------

import type { Lesson, Curriculum } from "../types/lesson";

// ===== PHASE 1 -- Sound Glue (Days 1-4) ====================================
// Focus: 2-3 letter CVC blending. Slow, deliberate "sound glue" technique.

const day01: Lesson = {
  day: 1,
  phase: 1,
  title: "First Sounds",
  description:
    "Meet the Sound Glue! Learn to stick two and three sounds together to make your first words.",
  words: [
    { word: "at", phonemes: ["a", "t"] },
    { word: "it", phonemes: ["i", "t"] },
    { word: "cat", phonemes: ["c", "a", "t"] },
    { word: "sat", phonemes: ["s", "a", "t"] },
    { word: "sit", phonemes: ["s", "i", "t"] },
  ],
};

const day02: Lesson = {
  day: 2,
  phase: 1,
  title: "More Sound Glue",
  description:
    "Keep practising the glue! Blend new sounds together and read more short words.",
  words: [
    { word: "mat", phonemes: ["m", "a", "t"] },
    { word: "hat", phonemes: ["h", "a", "t"] },
    { word: "hit", phonemes: ["h", "i", "t"] },
    { word: "bit", phonemes: ["b", "i", "t"] },
    { word: "bat", phonemes: ["b", "a", "t"] },
  ],
};

const day03: Lesson = {
  day: 3,
  phase: 1,
  title: "New Endings",
  description:
    "Try words that end with different sounds. You are getting faster at blending!",
  words: [
    { word: "run", phonemes: ["r", "u", "n"] },
    { word: "ran", phonemes: ["r", "a", "n"] },
    { word: "sun", phonemes: ["s", "u", "n"] },
    { word: "fun", phonemes: ["f", "u", "n"] },
    { word: "bun", phonemes: ["b", "u", "n"] },
    { word: "can", phonemes: ["c", "a", "n"] },
    { word: "man", phonemes: ["m", "a", "n"] },
  ],
};

const day04: Lesson = {
  day: 4,
  phase: 1,
  title: "Sound Glue Champion",
  description:
    "Mix all the sounds you know! Blend words with different beginnings and endings.",
  words: [
    { word: "dog", phonemes: ["d", "o", "g"] },
    { word: "log", phonemes: ["l", "o", "g"] },
    { word: "hog", phonemes: ["h", "o", "g"] },
    { word: "hot", phonemes: ["h", "o", "t"] },
    { word: "pot", phonemes: ["p", "o", "t"] },
    { word: "got", phonemes: ["g", "o", "t"] },
  ],
};

// ===== PHASE 2 -- Automatic Blending (Days 5-9) ============================
// Focus: Speed drills, CCVC and CVCC words. Build fluency.

const day05: Lesson = {
  day: 5,
  phase: 2,
  title: "Speed Up!",
  description:
    "Time to get faster! Blend CVC words you already know as quickly as you can, then try some new ones.",
  words: [
    // Review
    { word: "cat", phonemes: ["c", "a", "t"] },
    { word: "run", phonemes: ["r", "u", "n"] },
    { word: "dog", phonemes: ["d", "o", "g"] },
    // New CVC
    { word: "bed", phonemes: ["b", "e", "d"] },
    { word: "red", phonemes: ["r", "e", "d"] },
    { word: "pen", phonemes: ["p", "e", "n"] },
    { word: "ten", phonemes: ["t", "e", "n"] },
  ],
};

const day06: Lesson = {
  day: 6,
  phase: 2,
  title: "Double Start",
  description:
    "Some words start with two sounds squished together. Let's learn consonant blends at the beginning!",
  words: [
    { word: "stop", phonemes: ["s", "t", "o", "p"] },
    { word: "step", phonemes: ["s", "t", "e", "p"] },
    { word: "spin", phonemes: ["s", "p", "i", "n"] },
    { word: "snap", phonemes: ["s", "n", "a", "p"] },
    { word: "frog", phonemes: ["f", "r", "o", "g"] },
    { word: "drip", phonemes: ["d", "r", "i", "p"] },
  ],
};

const day07: Lesson = {
  day: 7,
  phase: 2,
  title: "Strong Endings",
  description:
    "Now try words with two sounds squished at the end. You can do it!",
  words: [
    { word: "hand", phonemes: ["h", "a", "n", "d"] },
    { word: "band", phonemes: ["b", "a", "n", "d"] },
    { word: "lamp", phonemes: ["l", "a", "m", "p"] },
    { word: "jump", phonemes: ["j", "u", "m", "p"] },
    { word: "went", phonemes: ["w", "e", "n", "t"] },
    { word: "best", phonemes: ["b", "e", "s", "t"] },
  ],
};

const day08: Lesson = {
  day: 8,
  phase: 2,
  title: "Blend Mix",
  description:
    "Mix beginning blends and ending blends together. You are becoming a blending superstar!",
  words: [
    { word: "drop", phonemes: ["d", "r", "o", "p"] },
    { word: "trip", phonemes: ["t", "r", "i", "p"] },
    { word: "clap", phonemes: ["c", "l", "a", "p"] },
    { word: "flag", phonemes: ["f", "l", "a", "g"] },
    { word: "slug", phonemes: ["s", "l", "u", "g"] },
    { word: "grin", phonemes: ["g", "r", "i", "n"] },
  ],
};

const day09: Lesson = {
  day: 9,
  phase: 2,
  title: "Speed Star",
  description:
    "Show off your skills! Blend all kinds of words as fast as you can in today's speed challenge.",
  words: [
    { word: "plan", phonemes: ["p", "l", "a", "n"] },
    { word: "flat", phonemes: ["f", "l", "a", "t"] },
    { word: "drum", phonemes: ["d", "r", "u", "m"] },
    { word: "gift", phonemes: ["g", "i", "f", "t"] },
    { word: "mist", phonemes: ["m", "i", "s", "t"] },
    { word: "pond", phonemes: ["p", "o", "n", "d"] },
  ],
};

// ===== PHASE 3 -- Transfer to Reading (Days 10-14) =========================
// Focus: Decodable sentences & mini-stories using only learned words.

const day10: Lesson = {
  day: 10,
  phase: 3,
  title: "Read a Line",
  description:
    "Put your words into sentences! Read your very first lines all by yourself.",
  words: [
    { word: "big", phonemes: ["b", "i", "g"] },
    { word: "rug", phonemes: ["r", "u", "g"] },
    { word: "hid", phonemes: ["h", "i", "d"] },
  ],
  decodableText:
    "The cat sat. The dog hid. A big red hat sat on the mat. The cat bit the rug.",
};

const day11: Lesson = {
  day: 11,
  phase: 3,
  title: "Mini Story Time",
  description:
    "Read a mini story about a fun day in the sun. You are reading real sentences now!",
  words: [
    { word: "dug", phonemes: ["d", "u", "g"] },
    { word: "mud", phonemes: ["m", "u", "d"] },
    { word: "not", phonemes: ["n", "o", "t"] },
  ],
  decodableText:
    "The dog ran in the sun. It dug in the mud. The man got hot. He sat on a log and had fun.",
};

const day12: Lesson = {
  day: 12,
  phase: 3,
  title: "Blend and Read",
  description:
    "Use your blending power on longer sentences with trickier words. You have got this!",
  words: [
    { word: "grab", phonemes: ["g", "r", "a", "b"] },
    { word: "just", phonemes: ["j", "u", "s", "t"] },
    { word: "from", phonemes: ["f", "r", "o", "m"] },
  ],
  decodableText:
    "The frog sat on a flat log. It went drip drop from the pond. A slug slid from the mud. The frog just sat and did not jump.",
};

const day13: Lesson = {
  day: 13,
  phase: 3,
  title: "Story Builder",
  description:
    "Read a bigger story with all the words you have learned. You are almost a reading champion!",
  words: [
    { word: "nap", phonemes: ["n", "a", "p"] },
    { word: "led", phonemes: ["l", "e", "d"] },
    { word: "bit", phonemes: ["b", "i", "t"] },
  ],
  decodableText:
    "The man led the dog on a trip. The dog ran and ran. It did a big jump and got the flag. The band clap clap clap! The dog had a nap on the best red rug.",
};

const day14: Lesson = {
  day: 14,
  phase: 3,
  title: "Reading Champion!",
  description:
    "You did it! Read your graduation story and celebrate being a Blending Bootcamp champion!",
  words: [
    { word: "wins", phonemes: ["w", "i", "n", "z"] },
    { word: "fast", phonemes: ["f", "a", "s", "t"] },
    { word: "spot", phonemes: ["s", "p", "o", "t"] },
  ],
  decodableText:
    "A cat and a frog met at the pond. The frog did a big jump. The cat ran fast from the spot. The frog sat on the flat drum. The cat hid in the mist. The band clap and grin. The cat wins! Best fun in the sun.",
};

// ---------------------------------------------------------------------------
// Export the full 14-day curriculum
// ---------------------------------------------------------------------------

export const lessons: Curriculum = [
  day01,
  day02,
  day03,
  day04,
  day05,
  day06,
  day07,
  day08,
  day09,
  day10,
  day11,
  day12,
  day13,
  day14,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up a lesson by its day number (1-14). */
export function getLessonByDay(day: number): Lesson | undefined {
  return lessons.find((l) => l.day === day);
}

/** Get all lessons belonging to a given phase. */
export function getLessonsByPhase(phase: 1 | 2 | 3): Lesson[] {
  return lessons.filter((l) => l.phase === phase);
}

/** Collect every unique word across the entire curriculum. */
export function getAllUniqueWords(): string[] {
  const seen = new Set<string>();
  for (const lesson of lessons) {
    for (const w of lesson.words) {
      seen.add(w.word);
    }
  }
  return Array.from(seen);
}

/**
 * Build a flat map of word -> phonemes from every lesson.
 * Later occurrences of the same word overwrite earlier ones (phoneme splits
 * should be identical, but this keeps the contract simple).
 */
export function getPhonemeMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const lesson of lessons) {
    for (const w of lesson.words) {
      map[w.word] = w.phonemes;
    }
  }
  return map;
}
