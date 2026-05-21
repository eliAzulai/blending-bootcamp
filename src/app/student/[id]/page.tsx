"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import PetDisplay from "@/components/PetDisplay";
import { DonutMark, LetterTilesMark, WordBuildMark } from "@/components/ui/StickerMarks";
import { getStudent } from "@/lib/student-data";
import { supabaseIsConfigured } from "@/lib/supabase/client";
import type { Student } from "@/types/database";

export default function StudentHome({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getStudent(id);
        if (!cancelled) {
          setStudent(s);
          setLoading(false);
        }
      } catch (err) {
        console.error("[StudentHome] getStudent threw:", err);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-amber-50 px-4 py-12 text-center text-gray-500">
        Loading...
      </main>
    );
  }

  if (!student) {
    return (
      <main className="min-h-screen bg-amber-50 px-4 py-12 text-center">
        <p className="text-xl font-semibold text-gray-700">Student not found.</p>
        <p className="mt-2 text-sm text-gray-500">
          {supabaseIsConfigured()
            ? "Check the link your teacher sent you."
            : "Supabase isn't configured — try /student/fixture-student-1 to see the demo."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-amber-50 px-4 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-8">
        <header className="flex flex-col items-center gap-4 pt-6">
          <PetDisplay
            petType={student.pet_type}
            petName={student.pet_name}
            mood={student.pet_mood}
            coins={student.coins}
          />
          <p className="text-center text-lg text-gray-600">
            Hi, <span className="font-bold text-gray-800">{student.name}</span>! Time to practice.
          </p>
        </header>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-purple-600">
            Today&apos;s practice
          </h2>
          <div className="flex flex-col gap-3">
            <Link
              href={`/student/${student.id}/practice/spelling`}
              className="block rounded-3xl bg-purple-600 p-5 text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <DonutMark size="lg" />
                <div className="flex-1">
                  <p className="text-xl font-extrabold">Donut Kitchen</p>
                  <p className="text-sm font-semibold text-purple-100">
                    Spell words to decorate donuts for {student.pet_name}
                  </p>
                </div>
                <span className="text-2xl" aria-hidden>
                  ›
                </span>
              </div>
            </Link>
            <Link
              href={`/student/${student.id}/practice/phonics`}
              className="block rounded-3xl bg-white p-5 shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <LetterTilesMark />
                <div className="flex-1">
                  <p className="text-xl font-extrabold text-gray-800">Phonics</p>
                  <p className="text-sm text-gray-500">Tap, listen, blend, say</p>
                </div>
                <span className="text-2xl text-purple-500" aria-hidden>
                  ›
                </span>
              </div>
            </Link>
            <Link
              href={`/student/${student.id}/practice/spelling`}
              className="block rounded-3xl bg-white p-5 shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <WordBuildMark />
                <div className="flex-1">
                  <p className="text-xl font-extrabold text-gray-800">Spelling</p>
                  <p className="text-sm text-gray-500">Decorate donuts with letters</p>
                </div>
                <span className="text-2xl text-purple-500" aria-hidden>
                  ›
                </span>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
