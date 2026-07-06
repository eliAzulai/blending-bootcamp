import type { Student, DifficultyLevel } from "@/types/database";

export const FIXTURE_STUDENT_ID = "fixture-student-1";

export const fixtureStudent: Student = {
  id: FIXTURE_STUDENT_ID,
  parent_id: "fixture-parent-1",
  teacher_id: "fixture-teacher-1",
  name: "Alex",
  age: 7,
  pet_type: "cat",
  pet_name: "Whiskers",
  pet_mood: "happy",
  coins: 0,
  created_at: new Date().toISOString(),
};

export interface PhonicsWord {
  word: string;
  phonemes: string[];
}

export interface PhonicsContent {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  words: PhonicsWord[];
}

/**
 * Phonics content organized by difficulty.
 * Beginner: CVC short vowels (each vowel = one set)
 * Intermediate: CCVC blends, CVCC blends, digraphs
 * Advanced: longer words, mixed patterns
 */
export const fixturePhonicsContent: PhonicsContent[] = [
  // BEGINNER — CVC by short vowel
  {
    id: "phonics-cvc-short-a",
    title: "Short A Words",
    difficulty: "beginner",
    words: [
      { word: "cat", phonemes: ["c", "a", "t"] },
      { word: "hat", phonemes: ["h", "a", "t"] },
      { word: "mat", phonemes: ["m", "a", "t"] },
      { word: "bat", phonemes: ["b", "a", "t"] },
      { word: "pan", phonemes: ["p", "a", "n"] },
      { word: "man", phonemes: ["m", "a", "n"] },
    ],
  },
  {
    id: "phonics-cvc-short-i",
    title: "Short I Words",
    difficulty: "beginner",
    words: [
      { word: "sit", phonemes: ["s", "i", "t"] },
      { word: "pig", phonemes: ["p", "i", "g"] },
      { word: "big", phonemes: ["b", "i", "g"] },
      { word: "win", phonemes: ["w", "i", "n"] },
      { word: "lip", phonemes: ["l", "i", "p"] },
      { word: "kid", phonemes: ["k", "i", "d"] },
    ],
  },
  {
    id: "phonics-cvc-short-o",
    title: "Short O Words",
    difficulty: "beginner",
    words: [
      { word: "hop", phonemes: ["h", "o", "p"] },
      { word: "top", phonemes: ["t", "o", "p"] },
      { word: "dog", phonemes: ["d", "o", "g"] },
      { word: "hot", phonemes: ["h", "o", "t"] },
      { word: "fox", phonemes: ["f", "o", "x"] },
      { word: "pot", phonemes: ["p", "o", "t"] },
    ],
  },
  {
    id: "phonics-cvc-short-u",
    title: "Short U Words",
    difficulty: "beginner",
    words: [
      { word: "cup", phonemes: ["c", "u", "p"] },
      { word: "sun", phonemes: ["s", "u", "n"] },
      { word: "run", phonemes: ["r", "u", "n"] },
      { word: "bug", phonemes: ["b", "u", "g"] },
      { word: "hug", phonemes: ["h", "u", "g"] },
      { word: "mud", phonemes: ["m", "u", "d"] },
    ],
  },
  {
    id: "phonics-cvc-short-e",
    title: "Short E Words",
    difficulty: "beginner",
    words: [
      { word: "bed", phonemes: ["b", "e", "d"] },
      { word: "red", phonemes: ["r", "e", "d"] },
      { word: "pet", phonemes: ["p", "e", "t"] },
      { word: "wet", phonemes: ["w", "e", "t"] },
      { word: "hen", phonemes: ["h", "e", "n"] },
      { word: "ten", phonemes: ["t", "e", "n"] },
    ],
  },
  {
    id: "phonics-cvc-mixed",
    title: "Mixed Short Vowels",
    difficulty: "beginner",
    words: [
      { word: "fan", phonemes: ["f", "a", "n"] },
      { word: "tin", phonemes: ["t", "i", "n"] },
      { word: "log", phonemes: ["l", "o", "g"] },
      { word: "jug", phonemes: ["j", "u", "g"] },
      { word: "net", phonemes: ["n", "e", "t"] },
      { word: "rat", phonemes: ["r", "a", "t"] },
    ],
  },

  // INTERMEDIATE — beginning blends, ending blends, digraphs
  {
    id: "phonics-beg-blends",
    title: "Beginning Blends (st, tr, dr)",
    difficulty: "intermediate",
    words: [
      { word: "stop", phonemes: ["s", "t", "o", "p"] },
      { word: "trip", phonemes: ["t", "r", "i", "p"] },
      { word: "drop", phonemes: ["d", "r", "o", "p"] },
      { word: "frog", phonemes: ["f", "r", "o", "g"] },
      { word: "plug", phonemes: ["p", "l", "u", "g"] },
      { word: "swim", phonemes: ["s", "w", "i", "m"] },
    ],
  },
  {
    id: "phonics-end-blends",
    title: "Ending Blends (mp, st, nd)",
    difficulty: "intermediate",
    words: [
      { word: "jump", phonemes: ["j", "u", "m", "p"] },
      { word: "lamp", phonemes: ["l", "a", "m", "p"] },
      { word: "fast", phonemes: ["f", "a", "s", "t"] },
      { word: "hand", phonemes: ["h", "a", "n", "d"] },
      { word: "sand", phonemes: ["s", "a", "n", "d"] },
      { word: "milk", phonemes: ["m", "i", "l", "k"] },
    ],
  },
  {
    id: "phonics-digraphs-sh-ch",
    title: "Digraphs: sh & ch",
    difficulty: "intermediate",
    words: [
      { word: "ship", phonemes: ["sh", "i", "p"] },
      { word: "shop", phonemes: ["sh", "o", "p"] },
      { word: "fish", phonemes: ["f", "i", "sh"] },
      { word: "chop", phonemes: ["ch", "o", "p"] },
      { word: "chip", phonemes: ["ch", "i", "p"] },
      { word: "much", phonemes: ["m", "u", "ch"] },
    ],
  },
  {
    id: "phonics-digraphs-th",
    title: "Digraph: th",
    difficulty: "intermediate",
    words: [
      { word: "this", phonemes: ["th", "i", "s"] },
      { word: "that", phonemes: ["th", "a", "t"] },
      { word: "them", phonemes: ["th", "e", "m"] },
      { word: "then", phonemes: ["th", "e", "n"] },
      { word: "with", phonemes: ["w", "i", "th"] },
      { word: "bath", phonemes: ["b", "a", "th"] },
    ],
  },

  // ADVANCED — long vowels, silent e, vowel teams
  {
    id: "phonics-magic-e",
    title: "Magic E (long vowels)",
    difficulty: "advanced",
    words: [
      { word: "make", phonemes: ["m", "a", "k", "e"] },
      { word: "bike", phonemes: ["b", "i", "k", "e"] },
      { word: "rope", phonemes: ["r", "o", "p", "e"] },
      { word: "cute", phonemes: ["c", "u", "t", "e"] },
      { word: "name", phonemes: ["n", "a", "m", "e"] },
      { word: "cake", phonemes: ["c", "a", "k", "e"] },
    ],
  },
  {
    id: "phonics-vowel-teams",
    title: "Vowel Teams (ee, ea, oa)",
    difficulty: "advanced",
    words: [
      { word: "tree", phonemes: ["t", "r", "ee"] },
      { word: "feet", phonemes: ["f", "ee", "t"] },
      { word: "read", phonemes: ["r", "ea", "d"] },
      { word: "boat", phonemes: ["b", "oa", "t"] },
      { word: "rain", phonemes: ["r", "ai", "n"] },
      { word: "play", phonemes: ["p", "l", "ay"] },
    ],
  },
];

export function getDefaultPhonicsContent(): PhonicsContent {
  return fixturePhonicsContent[0];
}

export function pickPhonicsContent(
  difficulty: DifficultyLevel,
  rotation: number,
): PhonicsContent {
  const matching = fixturePhonicsContent.filter((c) => c.difficulty === difficulty);
  if (matching.length === 0) return fixturePhonicsContent[0];
  return matching[rotation % matching.length];
}

export interface SpellingWord {
  word: string;
  audioHint?: string;
}

export interface SpellingContent {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  words: SpellingWord[];
}

/**
 * Spelling content. Beginner = CVC words. Intermediate = blends + sight words.
 * Advanced = magic-e + multisyllabic.
 */
export const fixtureSpellingContent: SpellingContent[] = [
  // BEGINNER
  {
    id: "spelling-cvc-1",
    title: "CVC Words: Set 1",
    difficulty: "beginner",
    words: [
      { word: "cat" },
      { word: "hat" },
      { word: "sit" },
      { word: "big" },
      { word: "map" },
    ],
  },
  {
    id: "spelling-cvc-2",
    title: "CVC Words: Set 2",
    difficulty: "beginner",
    words: [
      { word: "cup" },
      { word: "dog" },
      { word: "red" },
      { word: "run" },
      { word: "hop" },
    ],
  },
  {
    id: "spelling-cvc-3",
    title: "CVC Words: Set 3",
    difficulty: "beginner",
    words: [
      { word: "fox" },
      { word: "sun" },
      { word: "bed" },
      { word: "pig" },
      { word: "jam" },
    ],
  },
  {
    id: "spelling-sight-words-pre-k",
    title: "Sight Words: Pre-K",
    difficulty: "beginner",
    words: [
      { word: "the" },
      { word: "and" },
      { word: "see" },
      { word: "look" },
      { word: "go" },
      { word: "we" },
    ],
  },
  {
    id: "spelling-sight-words-k",
    title: "Sight Words: Kindergarten",
    difficulty: "beginner",
    words: [
      { word: "you" },
      { word: "are" },
      { word: "for" },
      { word: "have" },
      { word: "they" },
      { word: "with" },
    ],
  },

  // INTERMEDIATE
  {
    id: "spelling-blends",
    title: "Blends",
    difficulty: "intermediate",
    words: [
      { word: "stop" },
      { word: "trip" },
      { word: "jump" },
      { word: "frog" },
      { word: "milk" },
      { word: "hand" },
    ],
  },
  {
    id: "spelling-digraphs",
    title: "Digraphs (sh, ch, th)",
    difficulty: "intermediate",
    words: [
      { word: "ship" },
      { word: "fish" },
      { word: "chop" },
      { word: "much" },
      { word: "this" },
      { word: "with" },
    ],
  },
  {
    id: "spelling-sight-words-1st",
    title: "Sight Words: 1st Grade",
    difficulty: "intermediate",
    words: [
      { word: "from" },
      { word: "could" },
      { word: "when" },
      { word: "your" },
      { word: "said" },
      { word: "they" },
    ],
  },

  // ADVANCED
  {
    id: "spelling-magic-e",
    title: "Magic E Words",
    difficulty: "advanced",
    words: [
      { word: "make" },
      { word: "name" },
      { word: "ride" },
      { word: "rope" },
      { word: "cute" },
      { word: "cake" },
    ],
  },
  {
    id: "spelling-vowel-teams",
    title: "Vowel Team Words",
    difficulty: "advanced",
    words: [
      { word: "tree" },
      { word: "boat" },
      { word: "rain" },
      { word: "play" },
      { word: "team" },
      { word: "soap" },
    ],
  },
];

export function getDefaultSpellingContent(): SpellingContent {
  return fixtureSpellingContent[0];
}

export function pickSpellingContent(
  difficulty: DifficultyLevel,
  rotation: number,
): SpellingContent {
  const matching = fixtureSpellingContent.filter((c) => c.difficulty === difficulty);
  if (matching.length === 0) return fixtureSpellingContent[0];
  return matching[rotation % matching.length];
}

export interface ReadAloudPassage {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  text: string;
}

/**
 * Decodable read-aloud passages.
 * Beginner: 30-50 words, mostly CVC.
 * Intermediate: 50-80 words, blends and digraphs.
 * Advanced: 80-120 words, mixed patterns and longer sentences.
 */
export const fixtureReadAloudPassages: ReadAloudPassage[] = [
  // BEGINNER (CVC-heavy, very short)
  {
    id: "read-aloud-cat-hat",
    title: "The Cat and the Hat",
    difficulty: "beginner",
    text: "The cat sat on the mat. The cat had a big hat. The hat was red and fat. The cat likes the hat a lot!",
  },
  {
    id: "read-aloud-dog-spot",
    title: "My Dog Spot",
    difficulty: "beginner",
    text: "My dog is Spot. Spot can run and hop. Spot has a big red ball. We play in the sun all day.",
  },
  {
    id: "read-aloud-pig",
    title: "Pig in the Mud",
    difficulty: "beginner",
    text: "A pig is in the mud. The pig is hot. The pig sits in the mud. Mud is fun for a pig!",
  },
  {
    id: "read-aloud-bug",
    title: "The Bug on the Rug",
    difficulty: "beginner",
    text: "A bug is on the rug. The bug is big. I see the bug. The bug can hop. Hop, bug, hop!",
  },
  {
    id: "read-aloud-fox",
    title: "Fox in a Box",
    difficulty: "beginner",
    text: "A fox sat in a box. The box was red. The fox was hot. The fox ran out of the box. Run, fox, run!",
  },

  // INTERMEDIATE (blends + digraphs)
  {
    id: "read-aloud-ship",
    title: "The Big Ship",
    difficulty: "intermediate",
    text: "I see a ship in the shop. The ship is big and red. Fish swim by the ship. The ship can stop and go. I wish I had a ship like that!",
  },
  {
    id: "read-aloud-frog",
    title: "Frog at the Pond",
    difficulty: "intermediate",
    text: "The frog sits on a log. He jumps in with a splash. Plop! The frog swims fast in the pond. He sees a bug and snaps it up. The frog is glad.",
  },
  {
    id: "read-aloud-camp",
    title: "Camp with Dad",
    difficulty: "intermediate",
    text: "Dad and I go to camp. We bring a lamp and a tent. We jump in the lake. The water is cold but fun. At night we sit by the fire and chat. Camp with Dad is the best!",
  },
  {
    id: "read-aloud-shop",
    title: "At the Shop",
    difficulty: "intermediate",
    text: "Mom and I went to the shop. We got fish, milk, and chips. The shop man said hi. He had a big smile. We went home and had lunch. The fish was good.",
  },
  {
    id: "read-aloud-bath",
    title: "Bath Time",
    difficulty: "intermediate",
    text: "It is bath time for my dog. He runs and hides under the bed. I find him and bring him to the tub. He gets in with a splash. Now my dog is wet and clean.",
  },

  // ADVANCED (long vowels, longer sentences)
  {
    id: "read-aloud-bike-ride",
    title: "The Bike Ride",
    difficulty: "advanced",
    text: "I ride my bike to the lake. The sun is hot but the wind feels good on my face. I see a green tree by the path. A bird sings in the tree. I stop and read a book. Then I ride home in time for dinner. What a fine day!",
  },
  {
    id: "read-aloud-rainy-day",
    title: "A Rainy Day",
    difficulty: "advanced",
    text: "The rain came down all day. I sat by the window and read. My cat sat on my lap. She liked the warm room. We could hear the rain on the roof. Drip, drop, drip, drop. I made some hot tea. Then the sun came out and I went out to play.",
  },
  {
    id: "read-aloud-baking",
    title: "Baking with Grandma",
    difficulty: "advanced",
    text: "Grandma showed me how to bake a cake. We mixed eggs, milk, and flour in a big bowl. She let me lick the spoon. The cake baked for thirty minutes. The kitchen smelled so good. When it was done, we put it on the table. We ate the cake with cold milk. It was the best day.",
  },
];

export function getDefaultReadAloudPassage(): ReadAloudPassage {
  return fixtureReadAloudPassages[0];
}

export function pickReadAloudPassage(
  difficulty: DifficultyLevel,
  rotation: number,
): ReadAloudPassage {
  const matching = fixtureReadAloudPassages.filter((p) => p.difficulty === difficulty);
  if (matching.length === 0) return fixtureReadAloudPassages[0];
  return matching[rotation % matching.length];
}

// ===========================================================================
// Sound Hunt (word_match_set) — tap the word you hear / that starts with a sound
// ===========================================================================

export interface WordMatchRound {
  target: string;
  /** Required when the set's promptKind is "starts_with". */
  sound?: string;
  distractors: string[];
}

export interface WordMatchContent {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  promptKind: "hear_word" | "starts_with";
  rounds: WordMatchRound[];
}

/**
 * Distractor rule (applies to cloze sets below too): a distractor must be
 * clearly wrong — same word family or same initial sound is good, but never
 * a defensible alternative answer.
 */
export const fixtureWordMatchContent: WordMatchContent[] = [
  // BEGINNER
  {
    id: "wordmatch-beg-short-a",
    title: "Listen and Find: Short A",
    difficulty: "beginner",
    promptKind: "hear_word",
    rounds: [
      { target: "cat", distractors: ["bat", "hat"] },
      { target: "man", distractors: ["map", "mat"] },
      { target: "pan", distractors: ["pat", "pad"] },
      { target: "bag", distractors: ["bat", "bad"] },
      { target: "ham", distractors: ["hat", "had"] },
    ],
  },
  {
    id: "wordmatch-beg-first-sounds",
    title: "First Sounds",
    difficulty: "beginner",
    promptKind: "starts_with",
    rounds: [
      { target: "sun", sound: "s", distractors: ["fun", "run"] },
      { target: "dog", sound: "d", distractors: ["log", "fog"] },
      { target: "pig", sound: "p", distractors: ["dig", "big"] },
      { target: "hen", sound: "h", distractors: ["ten", "pen"] },
      { target: "mop", sound: "m", distractors: ["top", "hop"] },
    ],
  },
  {
    id: "wordmatch-beg-short-i-o",
    title: "Listen and Find: Short I and O",
    difficulty: "beginner",
    promptKind: "hear_word",
    rounds: [
      { target: "pig", distractors: ["pin", "pit"] },
      { target: "sit", distractors: ["sip", "six"] },
      { target: "dog", distractors: ["dot", "dig"] },
      { target: "top", distractors: ["tip", "tap"] },
      { target: "win", distractors: ["wig", "fin"] },
    ],
  },
  // INTERMEDIATE
  {
    id: "wordmatch-int-digraphs",
    title: "Digraph Hunt",
    difficulty: "intermediate",
    promptKind: "starts_with",
    rounds: [
      { target: "ship", sound: "sh", distractors: ["chip", "slip"] },
      { target: "chat", sound: "ch", distractors: ["cat", "hat"] },
      { target: "thin", sound: "th", distractors: ["shin", "tin"] },
      { target: "shop", sound: "sh", distractors: ["chop", "stop"] },
      { target: "chest", sound: "ch", distractors: ["test", "rest"] },
    ],
  },
  {
    id: "wordmatch-int-blends",
    title: "Listen and Find: Blends",
    difficulty: "intermediate",
    promptKind: "hear_word",
    rounds: [
      { target: "frog", distractors: ["from", "fog"] },
      { target: "stop", distractors: ["step", "spot"] },
      { target: "clap", distractors: ["clip", "cap"] },
      { target: "swim", distractors: ["slim", "skim"] },
      { target: "hand", distractors: ["band", "sand"] },
    ],
  },
  {
    id: "wordmatch-int-end-sounds",
    title: "Listen and Find: End Sounds",
    difficulty: "intermediate",
    promptKind: "hear_word",
    rounds: [
      { target: "fast", distractors: ["fist", "last"] },
      { target: "milk", distractors: ["silk", "mill"] },
      { target: "jump", distractors: ["bump", "just"] },
      { target: "sing", distractors: ["ring", "sink"] },
      { target: "lamp", distractors: ["camp", "land"] },
    ],
  },
  // ADVANCED
  {
    id: "wordmatch-adv-magic-e",
    title: "Magic E Words",
    difficulty: "advanced",
    promptKind: "hear_word",
    rounds: [
      { target: "cake", distractors: ["lake", "came"] },
      { target: "bike", distractors: ["bake", "like"] },
      { target: "note", distractors: ["nose", "vote"] },
      { target: "cube", distractors: ["cute", "tube"] },
      { target: "plane", distractors: ["plan", "place"] },
    ],
  },
  {
    id: "wordmatch-adv-long-short",
    title: "Long or Short?",
    difficulty: "advanced",
    promptKind: "hear_word",
    rounds: [
      { target: "hope", distractors: ["hop", "rope"] },
      { target: "kite", distractors: ["kit", "bite"] },
      { target: "tape", distractors: ["tap", "cape"] },
      { target: "pine", distractors: ["pin", "nine"] },
      { target: "ride", distractors: ["rid", "hide"] },
    ],
  },
  {
    id: "wordmatch-adv-tricky-starts",
    title: "First Sounds: Tricky",
    difficulty: "advanced",
    promptKind: "starts_with",
    rounds: [
      { target: "shine", sound: "sh", distractors: ["chime", "spine"] },
      { target: "chase", sound: "ch", distractors: ["case", "base"] },
      { target: "white", sound: "wh", distractors: ["bite", "kite"] },
      { target: "brave", sound: "br", distractors: ["gave", "crave"] },
      { target: "smile", sound: "sm", distractors: ["mile", "slide"] },
    ],
  },
];

export function getDefaultWordMatchContent(): WordMatchContent {
  return fixtureWordMatchContent[0];
}

// ===========================================================================
// Missing Word (cloze_sentence) — drag the word into the gap
// ===========================================================================

export interface ClozeSentence {
  /** Contains exactly one "___" gap. */
  text: string;
  answer: string;
  distractors: string[];
}

export interface ClozeContent {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  /** Which slot this set leans toward. Wave 1 pickers ignore it (one pool). */
  intendedFor: "phonics" | "spelling";
  sentences: ClozeSentence[];
}

export const fixtureClozeContent: ClozeContent[] = [
  // BEGINNER
  {
    id: "cloze-beg-at-the-mat",
    title: "Finish It: At the Mat",
    difficulty: "beginner",
    intendedFor: "phonics",
    sentences: [
      { text: "The cat sat on the ___.", answer: "mat", distractors: ["map", "man"] },
      { text: "A pig can ___ in mud.", answer: "dig", distractors: ["dip", "big"] },
      { text: "The sun is ___.", answer: "hot", distractors: ["hop", "hat"] },
      { text: "The man got in his ___.", answer: "van", distractors: ["vat", "vet"] },
    ],
  },
  {
    id: "cloze-beg-pets",
    title: "Finish It: Pets",
    difficulty: "beginner",
    intendedFor: "phonics",
    sentences: [
      { text: "The dog sat in the ___.", answer: "sun", distractors: ["sub", "sad"] },
      { text: "My cat naps on the ___.", answer: "bed", distractors: ["bud", "bad"] },
      { text: "The hen is in a ___.", answer: "pen", distractors: ["pin", "peg"] },
      { text: "A pup can run and ___.", answer: "hop", distractors: ["hip", "hot"] },
    ],
  },
  {
    id: "cloze-beg-my-day",
    title: "Finish It: My Day",
    difficulty: "beginner",
    intendedFor: "spelling",
    sentences: [
      { text: "I sit on the ___.", answer: "rug", distractors: ["run", "rat"] },
      { text: "We had ham and ___.", answer: "jam", distractors: ["jab", "jog"] },
      { text: "The bug is in the ___.", answer: "mud", distractors: ["mad", "map"] },
      { text: "I can nap on the ___.", answer: "cot", distractors: ["cut", "can"] },
    ],
  },
  // INTERMEDIATE
  {
    id: "cloze-int-at-the-shop",
    title: "Finish It: At the Shop",
    difficulty: "intermediate",
    intendedFor: "phonics",
    sentences: [
      { text: "We went to the ___ to get fish.", answer: "shop", distractors: ["shut", "chip"] },
      { text: "The crab hid under a ___.", answer: "shell", distractors: ["smell", "spell"] },
      { text: "I can ring the ___.", answer: "bell", distractors: ["belt", "bent"] },
      { text: "The frog sat on a ___.", answer: "log", distractors: ["fog", "leg"] },
    ],
  },
  {
    id: "cloze-int-play-time",
    title: "Finish It: Play Time",
    difficulty: "intermediate",
    intendedFor: "phonics",
    sentences: [
      { text: "We ___ our hands to the song.", answer: "clap", distractors: ["clip", "crab"] },
      { text: "The kids can ___ in the pool.", answer: "swim", distractors: ["slim", "swam"] },
      { text: "Do not ___ on the wet step.", answer: "slip", distractors: ["slap", "ship"] },
      { text: "The wind made the flag ___.", answer: "flap", distractors: ["clap", "frog"] },
    ],
  },
  {
    id: "cloze-int-lunch",
    title: "Finish It: Lunch",
    difficulty: "intermediate",
    intendedFor: "spelling",
    sentences: [
      { text: "Please ___ the door.", answer: "shut", distractors: ["shot", "shop"] },
      { text: "The truck went up the ___.", answer: "hill", distractors: ["hit", "hip"] },
      { text: "We sang a ___ in class.", answer: "song", distractors: ["sang", "sing"] },
      { text: "I had chips and ___ for lunch.", answer: "fish", distractors: ["fist", "wish"] },
    ],
  },
  // ADVANCED
  {
    id: "cloze-adv-bake-sale",
    title: "Finish It: Bake Sale",
    difficulty: "advanced",
    intendedFor: "spelling",
    sentences: [
      { text: "We will ___ a cake for the sale.", answer: "bake", distractors: ["bike", "back"] },
      { text: "Jane gave me a ___ of cake.", answer: "slice", distractors: ["slide", "spice"] },
      { text: "The cake is on the ___.", answer: "plate", distractors: ["place", "plum"] },
      { text: "I hope the cake will ___ nice.", answer: "taste", distractors: ["tame", "toast"] },
    ],
  },
  {
    id: "cloze-adv-outside",
    title: "Finish It: Outside",
    difficulty: "advanced",
    intendedFor: "phonics",
    sentences: [
      { text: "The ___ flew high in the sky.", answer: "kite", distractors: ["kit", "bite"] },
      { text: "We rode our bikes down the ___.", answer: "lane", distractors: ["cane", "lime"] },
      { text: "The snake hid in a deep ___.", answer: "hole", distractors: ["hold", "pole"] },
      { text: "We could see the moon ___.", answer: "shine", distractors: ["shone", "spine"] },
    ],
  },
  {
    id: "cloze-adv-story-time",
    title: "Finish It: Story Time",
    difficulty: "advanced",
    intendedFor: "phonics",
    sentences: [
      { text: "The brave mouse ran to its ___.", answer: "home", distractors: ["dome", "hose"] },
      { text: "Dave made a ___ with his blocks.", answer: "cube", distractors: ["cub", "cape"] },
      { text: "The whale made a big ___.", answer: "splash", distractors: ["flash", "brush"] },
      { text: "Kate can ___ very fast.", answer: "skate", distractors: ["state", "slate"] },
    ],
  },
];

export function getDefaultClozeContent(): ClozeContent {
  return fixtureClozeContent[0];
}
