export type PetKitchenPetState =
  | "watching"
  | "sniffing"
  | "cheering"
  | "encouraging"
  | "eating"
  | "full";

export interface KitchenSnack {
  id: string;
  label: string;
  icingColor: string;
  sprinkleColor: string;
}

export interface KitchenReward {
  coins: number;
  petState: PetKitchenPetState;
  message: string;
}

export const KITCHEN_SNACKS: KitchenSnack[] = [
  { id: "sprinkle-donut", label: "sprinkle donut", icingColor: "#f472b6", sprinkleColor: "#38bdf8" },
  { id: "chocolate-donut", label: "chocolate donut", icingColor: "#7c2d12", sprinkleColor: "#fde68a" },
  { id: "strawberry-donut", label: "strawberry donut", icingColor: "#fb7185", sprinkleColor: "#bbf7d0" },
  { id: "glazed-donut", label: "glazed donut", icingColor: "#fef3c7", sprinkleColor: "#f59e0b" },
  { id: "blueberry-donut", label: "blueberry donut", icingColor: "#818cf8", sprinkleColor: "#f9a8d4" },
];

export function snackForWord(wordIndex: number): KitchenSnack {
  return KITCHEN_SNACKS[wordIndex % KITCHEN_SNACKS.length];
}

export function rewardForCorrectWord(attemptNumber: number, snack: KitchenSnack): KitchenReward {
  const firstTry = attemptNumber <= 1;
  return {
    coins: firstTry ? 2 : 1,
    petState: "eating",
    message: firstTry
      ? `Perfect! The ${snack.label} is ready.`
      : `Good fix! The ${snack.label} is ready.`,
  };
}

export function hintForAttempt(word: string, guess: string): string {
  if (!guess[0] || guess[0] !== word[0]) return "Listen for the first sound.";

  const middleIndex = Math.floor(word.length / 2);
  if (word.length > 2 && guess[middleIndex] !== word[middleIndex]) {
    return "Check the middle sound.";
  }

  return "Try the ending sound.";
}
