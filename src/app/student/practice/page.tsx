import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PracticeRunner from "./PracticeRunner";
import type { Student, FocusAreaType } from "@/types/database";

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

  const { data: focusData } = await supabase
    .from("focus_areas")
    .select("area")
    .eq("student_id", student.id)
    .eq("active", true);

  const order: FocusAreaType[] = ["phonics", "spelling", "read_aloud"];
  const activeAreas = new Set(
    (focusData ?? []).map((f: { area: FocusAreaType }) => f.area),
  );

  const activities = activeAreas.size > 0
    ? order.filter((a) => activeAreas.has(a))
    : order;

  return <PracticeRunner student={student} activities={activities} />;
}
