"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import FocusAreaToggle from "@/components/teacher/FocusAreaToggle";
import TagManager from "@/components/teacher/TagManager";
import { PET_EMOJI, type Student, type FocusArea, type Tag } from "@/types/database";
import Link from "next/link";

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuth();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [studentTags, setStudentTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();

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

    if (!studentRes.data) {
      router.push("/teacher");
      return;
    }

    setStudent(studentRes.data as Student);
    setFocusAreas((focusRes.data ?? []) as FocusArea[]);

    const tagIds = new Set(
      (studentTagsRes.data ?? []).map((st: { tag_id: string }) => st.tag_id),
    );
    const allTagsList = (allTagsRes.data ?? []) as Tag[];
    setAllTags(allTagsList);
    setStudentTags(allTagsList.filter((t) => tagIds.has(t.id)));

    setLoading(false);
  }, [id, user, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !student) {
    return <p className="py-12 text-center text-gray-400">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/teacher"
        className="text-sm text-purple-600 hover:underline"
      >
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
          onUpdate={loadData}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <FocusAreaToggle
          studentId={student.id}
          focusAreas={focusAreas}
          onUpdate={loadData}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-700">Practice History</h3>
        <p className="mt-2 text-xs text-gray-400">
          Practice sessions will appear here once the student starts using the
          app.
        </p>
      </div>
    </div>
  );
}
