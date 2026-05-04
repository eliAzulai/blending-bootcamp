import type { Student } from "@/types/database";

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
  difficulty: "beginner" | "intermediate" | "advanced";
  words: PhonicsWord[];
}

export const fixturePhonicsContent: PhonicsContent[] = [
  {
    id: "phonics-cvc-at",
    title: "Short A: -at family",
    difficulty: "beginner",
    words: [
      { word: "cat", phonemes: ["c", "a", "t"] },
      { word: "sat", phonemes: ["s", "a", "t"] },
      { word: "mat", phonemes: ["m", "a", "t"] },
      { word: "hat", phonemes: ["h", "a", "t"] },
      { word: "bat", phonemes: ["b", "a", "t"] },
    ],
  },
  {
    id: "phonics-cvc-it",
    title: "Short I: -it family",
    difficulty: "beginner",
    words: [
      { word: "sit", phonemes: ["s", "i", "t"] },
      { word: "hit", phonemes: ["h", "i", "t"] },
      { word: "fit", phonemes: ["f", "i", "t"] },
      { word: "pit", phonemes: ["p", "i", "t"] },
    ],
  },
];

export function getDefaultPhonicsContent(): PhonicsContent {
  return fixturePhonicsContent[0];
}

export interface SpellingWord {
  word: string;
  audioHint?: string; // how to say it for TTS
}

export interface SpellingContent {
  id: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  words: SpellingWord[];
}

export const fixtureSpellingContent: SpellingContent[] = [
  {
    id: "spelling-cvc-1",
    title: "Spell It!",
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
    title: "More Words",
    difficulty: "beginner",
    words: [
      { word: "cup" },
      { word: "dog" },
      { word: "red" },
      { word: "run" },
      { word: "hop" },
    ],
  },
];

export function getDefaultSpellingContent(): SpellingContent {
  return fixtureSpellingContent[0];
}

export interface ReadAloudPassage {
  id: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  text: string;
}

export const fixtureReadAloudPassages: ReadAloudPassage[] = [
  {
    id: "read-aloud-1",
    title: "The Cat and the Hat",
    difficulty: "beginner",
    text: "The cat sat on the mat. The cat had a big hat. The hat was red and fat. The cat likes the hat a lot!",
  },
  {
    id: "read-aloud-2",
    title: "My Dog Spot",
    difficulty: "beginner",
    text: "My dog is Spot. Spot can run and hop. Spot has a big red ball. We play in the sun all day.",
  },
];

export function getDefaultReadAloudPassage(): ReadAloudPassage {
  return fixtureReadAloudPassages[0];
}
