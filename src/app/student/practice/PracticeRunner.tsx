"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createSessionTracker } from "@/lib/tracker";
import PhonicsActivity from "@/components/activities/PhonicsActivity";
import SpellingActivity from "@/components/activities/SpellingActivity";
import ReadAloudActivity from "@/components/activities/ReadAloudActivity";
import SoundHuntActivity from "@/components/activities/SoundHuntActivity";
import WordBuilderActivity from "@/components/activities/WordBuilderActivity";
import MissingWordActivity from "@/components/activities/MissingWordActivity";
import PetDisplay from "@/components/PetDisplay";
import type { PracticeSlot } from "@/lib/formats";
import type { Student } from "@/types/database";

interface PracticeRunnerProps {
  student: Student;
  slots: PracticeSlot[];
}

type PageState = "activity" | "complete";

export default function PracticeRunner({ student, slots }: PracticeRunnerProps) {
  const router = useRouter();

  const [activityIndex, setActivityIndex] = useState(0);
  const [pageState, setPageState] = useState<PageState>("activity");
  const [totalCoins, setTotalCoins] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  const [tracker] = useState(() => createSessionTracker(student.id));

  const handleActivityComplete = useCallback(
    async (result: { coinsEarned?: number; durationSeconds?: number }) => {
      const coins = result.coinsEarned ?? 0;
      const duration = result.durationSeconds ?? 0;

      setTotalCoins((prev) => prev + coins);
      setTotalDuration((prev) => prev + duration);

      const nextIndex = activityIndex + 1;
      if (nextIndex >= slots.length) {
        const finalCoins = totalCoins + coins;
        const finalDuration = totalDuration + duration;
        await tracker.finish({
          coinsEarned: finalCoins,
          durationSeconds: finalDuration,
        });
        setPageState("complete");
      } else {
        setActivityIndex(nextIndex);
      }
    },
    [activityIndex, slots.length, totalCoins, totalDuration, tracker],
  );

  if (pageState === "complete") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-amber-50 px-4 py-10 gap-6">
        <div className="text-center">
          <div className="text-7xl mb-2">🎉</div>
          <h1 className="text-3xl font-extrabold text-purple-700">
            Practice done!
          </h1>
        </div>

        {/* Big coins number — clear and large per courtroom verdict.
          * Pet bounces once to react. No coin-fly animation. */}
        <p className="text-5xl font-extrabold text-amber-600">
          +{totalCoins} 🪙
        </p>

        <PetDisplay
          petType={student.pet_type}
          petName={student.pet_name}
          mood="excited"
          size="lg"
          bouncing
        />

        <p className="text-center text-base text-gray-600">
          {student.pet_name} loved that!
        </p>

        <button
          onClick={() => router.push("/student")}
          className="min-h-12 w-full max-w-xs rounded-2xl bg-purple-600 px-6 py-4 text-xl font-extrabold text-white shadow-lg hover:bg-purple-700 active:scale-95 transition-transform"
        >
          Back to Home 🏠
        </button>
      </div>
    );
  }

  const slot = slots[activityIndex];
  const progressPct = Math.round((activityIndex / slots.length) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-amber-50">
      {/* Progress bar */}
      <div className="h-2 bg-gray-200">
        <div
          className="h-2 bg-purple-500 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => router.push("/student")}
          className="min-h-12 min-w-12 px-3 text-sm font-semibold text-gray-400 hover:text-gray-600"
        >
          ← Home
        </button>
        <p className="text-sm font-bold text-gray-500">
          {activityIndex + 1} / {slots.length}
        </p>
        <div className="text-sm font-bold text-amber-600">
          🪙 {totalCoins}
        </div>
      </div>

      {/* Activity area — component chosen by the server-picked format */}
      <div className="flex-1">
        {slot.format === "blending" && (
          <PhonicsActivity
            content={slot.content}
            tracker={tracker}
            onComplete={handleActivityComplete}
          />
        )}
        {slot.format === "sound_hunt" && (
          <SoundHuntActivity
            content={slot.content}
            tracker={tracker}
            onComplete={handleActivityComplete}
          />
        )}
        {slot.format === "typing" && (
          <SpellingActivity
            content={slot.content}
            tracker={tracker}
            onComplete={handleActivityComplete}
          />
        )}
        {slot.format === "word_builder" && (
          <WordBuilderActivity
            content={slot.content}
            difficulty={slot.content.difficulty}
            tracker={tracker}
            onComplete={handleActivityComplete}
          />
        )}
        {slot.format === "missing_word" && (
          <MissingWordActivity
            content={slot.content}
            area={slot.area}
            tracker={tracker}
            onComplete={handleActivityComplete}
          />
        )}
        {slot.format === "read_aloud" && (
          <ReadAloudActivity
            passage={slot.content}
            tracker={tracker}
            onComplete={handleActivityComplete}
          />
        )}
      </div>
    </div>
  );
}
