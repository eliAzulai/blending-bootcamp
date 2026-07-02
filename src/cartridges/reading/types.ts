/** Reading-cartridge internals. The ENGINE never imports from this file. */

export type ReadingActivityType = "blending" | "build_word" | "read_aloud_check";

export interface BankWord {
  word: string;
  phonemes: string[];
  /** Curated transcripts also accepted by the authoritative check (homophones). */
  accept: string[];
}

export interface BlendingPayload {
  kind: "blending";
  words: BankWord[];
}
export interface BuildWordPayload {
  kind: "build_word";
  word: string;
  tiles: string[];
}
export interface ReadAloudPayload {
  kind: "read_aloud_check";
  word: string;
  accept: string[];
}
export type ReadingPayload = BlendingPayload | BuildWordPayload | ReadAloudPayload;
