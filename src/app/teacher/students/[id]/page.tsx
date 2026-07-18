import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FocusAreaToggle from "@/components/teacher/FocusAreaToggle";
import TagManager from "@/components/teacher/TagManager";
import PracticeHistory from "@/components/teacher/PracticeHistory";
import {
  PET_EMOJI,
  type Student,
  type FocusArea,
  type Tag,
  type AttemptType,
} from "@/types/database";

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

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 14);
  const fourteenDaysAgo = since.toISOString().slice(0, 10);

  const [studentRes, focusRes, studentTagsRes, allTagsRes, sessionsRes] =
    await Promise.all([
      supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .eq("teacher_id", user.id)
        .single(),
      supabase.from("focus_areas").select("*").eq("student_id", id),
      supabase.from("student_tags").select("tag_id").eq("student_id", id),
      supabase.from("tags").select("*").eq("teacher_id", user.id),
      supabase
        .from("practice_sessions")
        .select("id, date, duration_seconds, coins_earned, completed")
        .eq("student_id", id)
        .gte("date", fourteenDaysAgo)
        .order("date", { ascending: false }),
    ]);

  if (!studentRes.data) redirect("/teacher");

  const student = studentRes.data as Student;
  const focusAreas = (focusRes.data ?? []) as FocusArea[];
  const allTags = (allTagsRes.data ?? []) as Tag[];

  const studentTagIds = new Set(
    (studentTagsRes.data ?? []).map((st: { tag_id: string }) => st.tag_id),
  );
  const studentTags = allTags.filter((t) => studentTagIds.has(t.id));

  type SessionRow = {
    id: string;
    date: string;
    duration_seconds: number;
    coins_earned: number;
    completed: boolean;
  };
  const sessions = (sessionsRes.data ?? []) as SessionRow[];

  // Fetch attempts only for the recent sessions to keep the query bounded
  const sessionIds = sessions.slice(0, 10).map((s) => s.id);
  type AttemptRow = {
    id: string;
    session_id: string;
    activity_type: AttemptType;
    content_ref: string | null;
    score: number | null;
    duration_seconds: number;
    transcript: string | null;
    created_at: string;
  };
  let attempts: AttemptRow[] = [];
  if (sessionIds.length > 0) {
    const { data: attemptsData } = await supabase
      .from("activity_attempts")
      .select(
        "id, session_id, activity_type, content_ref, score, duration_seconds, transcript, created_at",
      )
      .in("session_id", sessionIds);
    attempts = (attemptsData ?? []) as AttemptRow[];
  }

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
        <PracticeHistory sessions={sessions} attempts={attempts} />
      </div>
    </div>
  );
}
