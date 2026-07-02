import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Student } from "@/types/database";
import AdaptiveRunner from "./AdaptiveRunner";

export default async function AdaptivePage({
  searchParams,
}: {
  searchParams: Promise<{ builder?: string }>;
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
  const { builder } = await searchParams;

  return <AdaptiveRunner studentId={student.id} builderMode={builder === "1"} />;
}
