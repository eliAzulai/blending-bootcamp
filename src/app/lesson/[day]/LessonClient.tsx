"use client";

import type { Lesson } from "@/types/lesson";
import LessonScreen from "@/components/LessonScreen";

interface LessonClientProps {
  lesson: Lesson;
}

/**
 * Thin client wrapper so the server page.tsx can pass lesson data
 * down to the fully interactive LessonScreen component.
 */
export default function LessonClient({ lesson }: LessonClientProps) {
  return <LessonScreen lesson={lesson} />;
}
