"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PetDisplay from "@/components/PetDisplay";
import PetKitchenSpellingActivity from "@/components/activities/PetKitchenSpellingActivity";
import { CoinMark } from "@/components/ui/StickerMarks";
import type { PhonicsContent } from "@/lib/fixtures/student";
import { createSessionTracker } from "@/lib/tracker";
import { getSpellingContent, getStudent } from "@/lib/student-data";
import type { Student } from "@/types/database";

type Result = { wordsCompleted: number; coinsEarned: number; durationSeconds: number };

export default function SpellingPracticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<Result | null>(null);

  const tracker = useMemo(() => createSessionTracker(id), [id]);
  const [content, setContent] = useState<PhonicsContent | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [s, c] = await Promise.all([getStudent(id), getSpellingContent(id)]);
      if (!cancelled) {
        setStudent(s);
        setContent(c);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleComplete(r: Result) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    await tracker.finish({
      coinsEarned: r.coinsEarned,
      durationSeconds: r.durationSeconds,
    });
    setResult(r);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-amber-50 px-4 py-12 text-center text-gray-500">
        Loading...
      </main>
    );
  }

  if (!student || !content) {
    return (
      <main className="min-h-screen bg-amber-50 px-4 py-12 text-center">
        <p className="text-xl font-semibold text-gray-700">
          {student ? "No spelling content available." : "Student not found."}
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-full bg-purple-600 px-6 py-3 font-bold text-white"
        >
          Go home
        </Link>
      </main>
    );
  }

  if (result) {
    return (
      <main className="min-h-screen bg-amber-50 px-4 py-12">
        <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
          <PetDisplay
            petType={student.pet_type}
            petName={student.pet_name}
            mood="excited"
            coins={student.coins + result.coinsEarned}
            size="lg"
            kitchenState="full"
          />
          <h1 className="text-3xl font-extrabold text-gray-800">{student.pet_name} is full!</h1>
          <p className="text-lg text-gray-600">
            You decorated <span className="font-bold">{result.wordsCompleted}</span> donuts and earned{" "}
            <span className="inline-flex items-center gap-1 font-bold text-amber-600">
              +{result.coinsEarned} <CoinMark />
            </span>.
          </p>
          <Link
            href={`/student/${student.id}`}
            className="rounded-full bg-purple-600 px-8 py-4 text-lg font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            Back to {student.pet_name}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-amber-50 px-4 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <header className="flex items-center justify-between">
          <Link
            href={`/student/${student.id}`}
            className="text-sm font-semibold text-purple-600 hover:text-purple-800"
          >
            ← Back
          </Link>
          <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
            Donut Kitchen
          </p>
        </header>
        <PetKitchenSpellingActivity
          content={content}
          tracker={tracker}
          petType={student.pet_type}
          petName={student.pet_name}
          petMood={student.pet_mood}
          startingCoins={student.coins}
          onComplete={handleComplete}
        />
      </div>
    </main>
  );
}
