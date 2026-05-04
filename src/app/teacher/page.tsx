"use client";

import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import StatsBar from "@/components/teacher/StatsBar";
import StudentCard from "@/components/teacher/StudentCard";
import type { Student, Tag } from "@/types/database";
import Link from "next/link";

interface StudentRow extends Student {
  tags: Tag[];
  session_count: number;
  last_session_date: string | null;
}

export default function TeacherDashboard() {
  const { user, profile } = useAuth();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadStudents() {
      const supabase = createClient();

      const { data: studentsData } = await supabase
        .from("students")
        .select(`
          *,
          student_tags ( tag_id ),
          practice_sessions ( date )
        `)
        .eq("teacher_id", user!.id)
        .order("name");

      const { data: tagsData } = await supabase
        .from("tags")
        .select("*")
        .eq("teacher_id", user!.id);

      const tagsMap = new Map((tagsData ?? []).map((t) => [t.id, t as Tag]));

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const rows: StudentRow[] = (studentsData ?? []).map((s) => {
        const rawTags = (s as { student_tags?: { tag_id: string }[] }).student_tags ?? [];
        const tagIds = rawTags.map((st) => st.tag_id);
        const tags = tagIds
          .map((id) => tagsMap.get(id))
          .filter(Boolean) as Tag[];

        const sessions = (s as { practice_sessions?: { date: string }[] }).practice_sessions ?? [];
        const recentSessions = sessions.filter(
          (sess) => new Date(sess.date) >= weekAgo,
        );
        const lastDate = sessions.length
          ? sessions.sort(
              (a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime(),
            )[0].date
          : null;

        const { student_tags: _st, practice_sessions: _ps, ...rest } = s as Student & {
          student_tags?: unknown;
          practice_sessions?: unknown;
        };

        return {
          ...rest,
          tags,
          session_count: recentSessions.length,
          last_session_date: lastDate,
        };
      });

      setStudents(rows);
      setLoading(false);
    }

    loadStudents();
  }, [user]);

  if (loading) {
    return <p className="py-12 text-center text-gray-400">Loading...</p>;
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const threeDaysAgo = new Date(
    now.getTime() - 3 * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 10);

  const practicedToday = students.filter(
    (s) => s.last_session_date === today,
  ).length;
  const inactive = students.filter(
    (s) => !s.last_session_date || s.last_session_date < threeDaysAgo,
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hi, {profile?.name ?? "Teacher"}
        </h1>
        <p className="text-sm text-gray-500">Your students this week</p>
      </div>

      <StatsBar
        totalStudents={students.length}
        practicedToday={practicedToday}
        inactive={inactive}
      />

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
