import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PracticeRunner from "./PracticeRunner";
import {
  getPhonicsContent,
  getSpellingContent,
  getReadAloudPassage,
} from "@/lib/content";
import type {
  Student,
  FocusAreaType,
  DifficultyLevel,
} from "@/types/database";

export default async function PracticePage() {
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

  // Fetch focus areas with their difficulty
  const { data: focusData } = await supabase
    .from("focus_areas")
    .select("area, difficulty, active")
    .eq("student_id", student.id)
    .eq("active", true);

  type FocusRow = { area: FocusAreaType; difficulty: DifficultyLevel };
  const focusMap = new Map<FocusAreaType, DifficultyLevel>(
    ((focusData ?? []) as FocusRow[]).map((f) => [f.area, f.difficulty]),
  );

  const order: FocusAreaType[] = ["phonics", "spelling", "read_aloud"];
  const activities = focusMap.size > 0
    ? order.filter((a) => focusMap.has(a))
    : order;

  // Count completed sessions for content rotation. New students see set 0,
  // after their first completed session they see set 1, etc.
  const { count: completedCount } = await supabase
    .from("practice_sessions")
    .select("id", { count: "exact", head: true })
    .eq("student_id", student.id)
    .eq("completed", true);

  const rotation = completedCount ?? 0;

  // Pre-pick the content for each activity on the server so the runner
  // doesn't need to call any fixture-lookup logic.
  const phonicsDifficulty = focusMap.get("phonics") ?? "beginner";
  const spellingDifficulty = focusMap.get("spelling") ?? "beginner";
  const readAloudDifficulty = focusMap.get("read_aloud") ?? "beginner";

  const [phonicsContent, spellingContent, readAloudPassage] = await Promise.all([
    getPhonicsContent(supabase, phonicsDifficulty, rotation),
    getSpellingContent(supabase, spellingDifficulty, rotation),
    getReadAloudPassage(supabase, readAloudDifficulty, rotation),
  ]);

  return (
    <PracticeRunner
      student={student}
      activities={activities}
      phonicsContent={phonicsContent}
      spellingContent={spellingContent}
      readAloudPassage={readAloudPassage}
    />
  );
}
