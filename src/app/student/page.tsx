import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PetHome from "@/components/PetHome";
import { careForPet } from "./actions";
import {
  daysBetweenUTC,
  derivePetMood,
  pickDailyWant,
  pickFromList,
  type CareVerb,
} from "@/lib/pet";
import { PLAY_ENTRY_LABEL, SURPRISE_LINES, fillPetName } from "@/lib/child-copy";
import type { Student } from "@/types/database";

/**
 * Kid home — pet is the protagonist.
 *
 * Reward system (2026-07-13 spec): all pet-state inputs are computed here,
 * server-side, and passed to the PetHome client island. Mood derives from
 * practice recency (care is flavor, never a substitute). "Today" is UTC
 * throughout, matching practice_sessions.date.
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // include today as day 1
  const todayStr = today.toISOString().slice(0, 10);

  // Recent practice: last-7-days list (week count) + latest completed ever
  // (mood recency) in parallel.
  const [sessionsRes, latestRes] = await Promise.all([
    supabase
      .from("practice_sessions")
      .select("date, completed")
      .eq("student_id", student.id)
      .gte("date", sevenDaysAgo.toISOString().slice(0, 10))
      .order("date", { ascending: false }),
    supabase
      .from("practice_sessions")
      .select("date")
      .eq("student_id", student.id)
      .eq("completed", true)
      .order("date", { ascending: false })
      .limit(1),
  ]);

  const completedDates = new Set(
    (sessionsRes.data ?? [])
      .filter((s: { date: string; completed: boolean }) => s.completed)
      .map((s: { date: string }) => s.date),
  );
  const practicedToday = completedDates.has(todayStr);
  const daysThisWeek = completedDates.size;

  const latestDate = (latestRes.data?.[0] as { date: string } | undefined)?.date;
  const daysSinceLastPractice = latestDate
    ? daysBetweenUTC(latestDate, todayStr)
    : null;

  // Care events: recent rows give cared-today, satiation count, and the
  // memory line. A query error here means Supabase is down or the reward
  // migration is not applied yet — the care UI is simply absent (fail closed,
  // never an error a child can read).
  const careRes = await supabase
    .from("pet_care_events")
    .select("verb, created_at")
    .eq("student_id", student.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const careAvailable = !careRes.error;
  type CareRow = { verb: CareVerb; created_at: string };
  const careRows = (careRes.data ?? []) as CareRow[];
  const todayStart = `${todayStr}T00:00:00`;
  const caresToday = careRows.filter((c) => c.created_at >= todayStart).length;
  const caredToday = caresToday > 0;
  const latestCare = careRows[0];
  const memoryVerb =
    latestCare && latestCare.created_at < todayStart ? latestCare.verb : null;

  const mood = derivePetMood({
    practicedToday,
    daysSinceLastPractice,
    caredToday,
  });

  const dailyWant = pickDailyWant(student.id, todayStr);
  const surpriseLine = practicedToday
    ? null
    : fillPetName(
        pickFromList(`${student.id}:${todayStr}:surprise`, SURPRISE_LINES),
        student.pet_name,
      );

  return (
    <main className="flex min-h-screen flex-col bg-amber-50">
      {/* Pet stage */}
      <section className="flex flex-1 flex-col items-center justify-center px-5 py-4">
        <h1 className="mb-5 text-center text-3xl font-extrabold text-purple-700">
          Hi, {student.name}!
        </h1>

        <PetHome
          petType={student.pet_type}
          petName={student.pet_name}
          mood={mood}
          coins={student.coins}
          practicedToday={practicedToday}
          caresToday={caresToday}
          careAvailable={careAvailable}
          dailyWant={dailyWant}
          memoryVerb={memoryVerb}
          surpriseLine={surpriseLine}
          onCare={careForPet}
        />

        {/* Practice count — small, neutral, no streak fire emoji (R25) */}
        <p className="mt-4 text-center text-sm text-gray-500">
          Practiced {daysThisWeek} of the last 7 days.
        </p>
      </section>

      {/* Sticky CTA at the bottom */}
      <footer className="px-5 py-4">
        <div className="mx-auto max-w-sm">
          {practicedToday ? (
            <div className="space-y-3 text-center">
              <p className="text-lg font-bold text-green-700">
                ✅ Done for today!
              </p>
              {/* Post-practice play — the entry point EXISTS only once
                  practice is done (absence, never a padlock). */}
              <Link
                href="/student/play"
                className="block min-h-12 w-full rounded-2xl bg-teal-600 px-6 py-4 text-lg font-extrabold text-white shadow-lg hover:bg-teal-700 active:scale-95 transition-transform"
              >
                🔤 {fillPetName(PLAY_ENTRY_LABEL, student.pet_name)}
              </Link>
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
