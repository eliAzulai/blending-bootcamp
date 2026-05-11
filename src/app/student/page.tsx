import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PetDisplay from "@/components/PetDisplay";
import type { Student } from "@/types/database";

/**
 * Kid home — pet is the protagonist.
 *
 * Layout: small top bar (coins, plain number) + large pet card + sticky CTA
 * below. No streak chip. Copy is positive-readiness only (R25, R27).
 */
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

  // Count practice days in the last 7 (R25: neutral framing, not a streak chip).
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // include today as day 1

  const { data: sessions } = await supabase
    .from("practice_sessions")
    .select("date, completed")
    .eq("student_id", student.id)
    .gte("date", sevenDaysAgo.toISOString().slice(0, 10))
    .order("date", { ascending: false });

  const completedDates = new Set(
    (sessions ?? [])
      .filter((s: { date: string; completed: boolean }) => s.completed)
      .map((s: { date: string }) => s.date),
  );

  const todayStr = today.toISOString().slice(0, 10);
  const practicedToday = completedDates.has(todayStr);
  const daysThisWeek = completedDates.size;

  return (
    <main className="flex min-h-screen flex-col bg-amber-50">
      {/* Top bar — coins only. Plain number, not a chip. */}
      <header className="flex items-center justify-end px-5 py-3">
        <span className="text-sm font-bold text-amber-700">
          🪙 {student.coins}
        </span>
      </header>

      {/* Pet stage */}
      <section className="flex flex-1 flex-col items-center justify-center px-5 py-4">
        <div className="w-full max-w-sm">
          <h1 className="mb-5 text-center text-3xl font-extrabold text-purple-700">
            Hi, {student.name}!
          </h1>

          <PetDisplay
            petType={student.pet_type}
            petName={student.pet_name}
            mood={student.pet_mood}
            coins={student.coins}
            size="lg"
          />

          {/* Practice count — small, neutral, no streak fire emoji */}
          <p className="mt-4 text-center text-sm text-gray-500">
            Practiced {daysThisWeek} of the last 7 days.
          </p>
        </div>
      </section>

      {/* Sticky CTA at the bottom */}
      <footer className="px-5 py-4">
        <div className="mx-auto max-w-sm">
          {practicedToday ? (
            <div className="space-y-3 text-center">
              <p className="text-lg font-bold text-green-700">
                ✅ Done for today!
              </p>
              <Link
                href="/student/practice"
                className="block min-h-12 w-full rounded-2xl border-2 border-purple-300 bg-white px-6 py-4 text-lg font-bold text-purple-700 hover:bg-purple-50 active:scale-95 transition-transform"
              >
                Practice again
              </Link>
            </div>
          ) : (
            <Link
              href="/student/practice"
              className="block min-h-12 w-full rounded-2xl bg-purple-600 px-6 py-5 text-center text-xl font-extrabold text-white shadow-lg hover:bg-purple-700 active:scale-95 transition-transform"
            >
              🎮 Practice Today!
            </Link>
          )}
        </div>
      </footer>
    </main>
  );
}
