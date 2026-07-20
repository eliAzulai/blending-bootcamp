import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MetricStrip, { type WeekWindow } from "@/components/teacher/MetricStrip";
import StatsBar from "@/components/teacher/StatsBar";
import StudentCard from "@/components/teacher/StudentCard";
import type { Student, Tag } from "@/types/database";

interface StudentRow extends Student {
  tags: Tag[];
  session_count: number;
  last_session_date: string | null;
  /** Dates (YYYY-MM-DD) of completed sessions, for the success metric. */
  completed_dates: string[];
}

export default async function TeacherDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [studentsRes, tagsRes, profileRes] = await Promise.all([
    supabase
      .from("students")
      .select(`
        *,
        student_tags ( tag_id ),
        practice_sessions ( date, completed )
      `)
      .eq("teacher_id", user.id)
      .order("name"),
    supabase.from("tags").select("*").eq("teacher_id", user.id),
    supabase.from("profiles").select("name").eq("id", user.id).single(),
  ]);

  const tagsMap = new Map(
    (tagsRes.data ?? []).map((t) => [(t as Tag).id, t as Tag]),
  );

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const students: StudentRow[] = (studentsRes.data ?? []).map((s) => {
    const rawTags = (s as { student_tags?: { tag_id: string }[] }).student_tags ?? [];
    const tagIds = rawTags.map((st) => st.tag_id);
    const tags = tagIds.map((id) => tagsMap.get(id)).filter(Boolean) as Tag[];

    const sessions =
      (s as { practice_sessions?: { date: string; completed: boolean }[] })
        .practice_sessions ?? [];
    const recentSessions = sessions.filter(
      (sess) => new Date(sess.date) >= weekAgo,
    );
    const lastDate = sessions.length
      ? sessions
          .slice()
          .sort(
            (a, b) =>
              new Date(b.date).getTime() - new Date(a.date).getTime(),
          )[0].date
      : null;

    const { student_tags: _st, practice_sessions: _ps, ...rest } = s as Student & {
      student_tags?: unknown;
      practice_sessions?: unknown;
    };
    void _st;
    void _ps;

    return {
      ...rest,
      tags,
      session_count: recentSessions.length,
      last_session_date: lastDate,
      completed_dates: sessions
        .filter((sess) => sess.completed)
        .map((sess) => sess.date),
    };
  });

  // Phase 1a success metric: % of students with 4+ DISTINCT completed-practice
  // days per rolling 7-day window, over the last 4 windows (newest first).
  const dayMs = 24 * 60 * 60 * 1000;
  const windows: WeekWindow[] = [0, 1, 2, 3].map((weeksAgo) => {
    const end = new Date(now.getTime() - weeksAgo * 7 * dayMs);
    const start = new Date(end.getTime() - 6 * dayMs);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    const atTarget = students.filter((s) => {
      const distinctDays = new Set(
        s.completed_dates.filter((d) => d >= startStr && d <= endStr),
      );
      return distinctDays.size >= 4;
    }).length;
    return {
      label: weeksAgo === 0 ? "This week" : `${weeksAgo}w ago`,
      atTarget,
    };
  });

  const today = now.toISOString().slice(0, 10);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const practicedToday = students.filter(
    (s) => s.last_session_date === today,
  ).length;
  const inactive = students.filter(
    (s) => !s.last_session_date || s.last_session_date < threeDaysAgo,
  ).length;

  const profileName =
    (profileRes.data as { name?: string } | null)?.name ?? "Teacher";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hi, {profileName}</h1>
        <p className="text-sm text-gray-500">Your students this week</p>
      </div>

      <StatsBar
        totalStudents={students.length}
        practicedToday={practicedToday}
        inactive={inactive}
      />

      <MetricStrip totalStudents={students.length} windows={windows} />

      {students.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 px-6 py-12 text-center">
          <p className="mb-2 text-lg font-semibold text-gray-700">
            No students yet
          </p>
          <p className="mb-4 text-sm text-gray-500">
            Add your first student to get started
          </p>
          <Link
            href="/teacher/add-student"
            className="inline-block rounded-xl bg-purple-600 px-6 py-3 font-bold text-white shadow-md hover:bg-purple-700"
          >
            + Add Student
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((s) => (
            <StudentCard
              key={s.id}
              id={s.id}
              name={s.name}
              age={s.age}
              petType={s.pet_type}
              petName={s.pet_name}
              coins={s.coins}
              tags={s.tags}
              practiceThisWeek={s.session_count}
              lastActive={s.last_session_date}
              isInactive={
                !s.last_session_date || s.last_session_date < threeDaysAgo
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
