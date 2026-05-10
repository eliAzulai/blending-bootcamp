import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PetDisplay from "@/components/PetDisplay";
import type { Student } from "@/types/database";

export default async function StudentHomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: studentData } = await supabase
    .from("students")
    .select("*")
    .eq("parent_id", user.id)
    .single();

  if (!studentData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mb-4 text-5xl">🐾</div>
          <p className="text-gray-600">No student account found.</p>
          <p className="mt-2 text-sm text-gray-400">
            Ask your teacher for an invite link to get started!
          </p>
        </div>
      </div>
    );
  }

  const student = studentData as Student;

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data: sessions } = await supabase
    .from("practice_sessions")
    .select("date, completed")
    .eq("student_id", student.id)
    .gte("date", thirtyDaysAgo)
    .order("date", { ascending: false });

  const completedDates = new Set(
    (sessions ?? [])
      .filter((s: { date: string; completed: boolean }) => s.completed)
      .map((s: { date: string }) => s.date),
  );

  const practicedToday = completedDates.has(today);

  let streakDays = 0;
  const d = new Date();
  while (true) {
    const dateStr = d.toISOString().slice(0, 10);
    if (!completedDates.has(dateStr)) break;
    streakDays++;
    d.setDate(d.getDate() - 1);
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-amber-50 px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-purple-700">
            Hi, {student.name}! 👋
          </h1>
          {streakDays > 0 && (
            <p className="mt-1 text-sm font-semibold text-orange-500">
              🔥 {streakDays} day streak!
            </p>
          )}
        </div>

        <PetDisplay
          petType={student.pet_type}
          petName={student.pet_name}
          mood={student.pet_mood}
          coins={student.coins}
          size="lg"
        />

        {practicedToday ? (
          <div className="rounded-2xl bg-green-50 px-6 py-4 text-center">
            <p className="text-lg font-bold text-green-700">
              ✅ You practiced today!
            </p>
            <p className="mt-1 text-sm text-green-600">
              Come back tomorrow to keep your streak going.
            </p>
            <Link
              href="/student/practice"
              className="mt-3 inline-block text-sm font-semibold text-purple-600 underline"
            >
              Practice again
            </Link>
          </div>
        ) : (
          <Link
            href="/student/practice"
            className="block w-full rounded-2xl bg-purple-600 px-6 py-5 text-center text-xl font-extrabold text-white shadow-lg hover:bg-purple-700 active:scale-95 transition-transform"
          >
            🎮 Practice Today!
          </Link>
        )}

        <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Your coins
          </p>
          <p className="text-3xl font-extrabold text-amber-600">
            🪙 {student.coins}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Earn coins by practicing — feed your pet!
          </p>
        </div>
      </div>
    </div>
  );
}
