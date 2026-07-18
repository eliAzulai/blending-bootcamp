import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LetterHuntGame from "@/components/activities/LetterHuntGame";
import { pickDailyRounds } from "@/lib/fixtures/letter-hunt";
import { derivePetMood } from "@/lib/pet";
import type { Student } from "@/types/database";

/**
 * Post-practice play. The gate is completed practice TODAY — arriving without
 * it silently redirects home (absence, never a padlock; 2026-07-13 spec).
 * Rounds are deterministic per UTC date (R24). Attempts attach to today's
 * completed session — play never opens practice_sessions rows.
 */
export default async function PlayPage() {
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
  if (!studentData) redirect("/student");

  const student = studentData as Student;

  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: todaySessions } = await supabase
    .from("practice_sessions")
    .select("id")
    .eq("student_id", student.id)
    .eq("date", todayStr)
    .eq("completed", true)
    .limit(1);

  const sessionId = (todaySessions?.[0] as { id: string } | undefined)?.id;
  if (!sessionId) redirect("/student");

  const rounds = pickDailyRounds(todayStr);
  const mood = derivePetMood({
    practicedToday: true,
    daysSinceLastPractice: 0,
    caredToday: false,
  });

  return (
    <LetterHuntGame
      studentId={student.id}
      petType={student.pet_type}
      petName={student.pet_name}
      petMood={mood}
      sessionId={sessionId}
      rounds={rounds}
    />
  );
}
