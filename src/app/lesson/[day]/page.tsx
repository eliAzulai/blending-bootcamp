import { notFound } from "next/navigation";
import { getLessonByDay } from "@/data/curriculum";
import LessonClient from "./LessonClient";

interface LessonPageProps {
  params: Promise<{ day: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { day: dayParam } = await params;
  const dayNum = parseInt(dayParam, 10);

  if (isNaN(dayNum) || dayNum < 1 || dayNum > 14) {
    notFound();
  }

  const lesson = getLessonByDay(dayNum);
  if (!lesson) {
    notFound();
  }

  return <LessonClient lesson={lesson} />;
}

/** Pre-generate the 14 day routes at build time. */
export function generateStaticParams() {
  return Array.from({ length: 14 }, (_, i) => ({ day: String(i + 1) }));
}
