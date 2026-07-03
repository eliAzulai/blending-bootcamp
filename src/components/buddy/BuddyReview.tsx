"use client";

import type { AlignedWord } from "@/lib/buddy/alignment";

export interface RecordedSentence {
  sentenceIndex: number;
  target: string;
  transcript: string;
  blobUrl: string | null;
  words: AlignedWord[];
}

interface BuddyReviewProps {
  passageId: string;
  sentences: RecordedSentence[];
}

export default function BuddyReview({ sentences }: BuddyReviewProps) {
  return (
    <p className="text-gray-500">
      Review screen — built in Task 6. Recorded {sentences.length} sentences.
    </p>
  );
}
