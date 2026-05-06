import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FocusAreaToggle from "@/components/teacher/FocusAreaToggle";
import TagManager from "@/components/teacher/TagManager";
import { PET_EMOJI, type Student, type FocusArea, type Tag } from "@/types/database";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [studentRes, focusRes, studentTagsRes, allTagsRes] = await Promise.all([
    supabase
      .from("students")
      .select("*")
      .eq("id", id)
      .eq("teacher_id", user.id)
      .single(),
    supabase.from("focus_areas").select("*").eq("student_id", id),
    supabase.from("student_tags").select("tag_id").eq("student_id", id),
    supabase.from("tags").select("*").eq("teacher_id", user.id),
  ]);

  if (!studentRes.data) redirect("/teacher");

  const student = studentRes.data as Student;
  const focusAreas = (focusRes.data ?? []) as FocusArea[];
  const allTags = (allTagsRes.data ?? []) as Tag[];

  const studentTagIds = new Set(
    (studentTagsRes.data ?? []).map((st: { tag_id: string }) => st.tag_id),
  );
  const studentTags = allTags.filter((t) => studentTagIds.has(t.id));

  return (
    <div className="space-y-6">
      <Link href="/teacher" className="text-sm text-purple-600 hover:underline">
        ← Back to dashboard
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-4xl">
          {PET_EMOJI[student.pet_type] ?? "🐾"}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
          <p className="text-sm text-gray-500">
            Age {student.age} · {student.pet_name} · {student.coins} coins
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <TagManager
          studentId={student.id}
          currentTags={studentTags}
          allTags={allTags}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <FocusAreaToggle studentId={student.id} focusAreas={focusAreas} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-700">Practice History</h3>
        <p className="mt-2 text-xs text-gray-400">
          Practice sessions will appear here once the student starts using the app.
        </p>
      </div>
    </div>
  );
}
