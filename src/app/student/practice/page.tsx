import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PracticeRunner from "./PracticeRunner";
import {
  getPhonicsContent,
  getSpellingContent,
  getReadAloudPassage,
  getWordMatchContent,
  getClozeContent,
} from "@/lib/content";
import { pickFormat, type PracticeSlot } from "@/lib/formats";
import type {
  Student,
  FocusAreaType,
  DifficultyLevel,
} from "@/types/database";

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ rot?: string }>;
}) {
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

  // Count completed sessions for rotation. New students see set 0, after
  // their first completed session they see set 1, etc. Rotation also picks
  // which FORMAT fills each slot (see src/lib/formats.ts).
  const { count: completedCount } = await supabase
    .from("practice_sessions")
    .select("id", { count: "exact", head: true })
    .eq("student_id", student.id)
    .eq("completed", true);

  // Dev-only override so all formats can be previewed without completing
  // sessions: /student/practice?rot=1
  const sp = await searchParams;
  const rotOverride = Number(sp?.rot);
  const rotation =
    process.env.NODE_ENV !== "production" && Number.isFinite(rotOverride)
      ? rotOverride
      : (completedCount ?? 0);

  // Pre-pick format + content for each slot on the server so the runner
  // just renders what it's given.
  const slots: PracticeSlot[] = [];
  for (const area of activities) {
    const difficulty = focusMap.get(area) ?? "beginner";
    const format = pickFormat(area, rotation);
    if (format === "blending") {
      slots.push({
        area: "phonics",
        format,
        content: await getPhonicsContent(supabase, difficulty, rotation),
      });
    } else if (format === "sound_hunt") {
      slots.push({
        area: "phonics",
        format,
        content: await getWordMatchContent(supabase, difficulty, rotation),
      });
    } else if (format === "typing") {
      slots.push({
        area: "spelling",
        format,
        content: await getSpellingContent(supabase, difficulty, rotation),
      });
    } else if (format === "word_builder") {
      slots.push({
        area: "spelling",
        format,
        content: await getSpellingContent(supabase, difficulty, rotation),
      });
    } else if (format === "missing_word") {
      slots.push({
        area: area as "phonics" | "spelling",
        format,
        content: await getClozeContent(supabase, difficulty, rotation),
      });
    } else {
      slots.push({
        area: "read_aloud",
        format: "read_aloud",
        content: await getReadAloudPassage(supabase, difficulty, rotation),
      });
    }
  }

  return <PracticeRunner student={student} slots={slots} />;
}
