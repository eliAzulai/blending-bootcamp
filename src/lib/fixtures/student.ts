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
