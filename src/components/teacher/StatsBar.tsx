"use client";

interface StatsBarProps {
  totalStudents: number;
  practicedToday: number;
  inactive: number;
}

export default function StatsBar({
  totalStudents,
  practicedToday,
  inactive,
}: StatsBarProps) {
  return (
    <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200">
      <div className="bg-white px-4 py-4 text-center">
        <div className="text-2xl font-bold text-purple-600">{totalStudents}</div>
        <div className="text-xs text-gray-500">Students</div>
      </div>
      <div className="bg-white px-4 py-4 text-center">
        <div className="text-2xl font-bold text-green-600">{practicedToday}</div>
        <div className="text-xs text-gray-500">Practiced Today</div>
      </div>
      <div className="bg-white px-4 py-4 text-center">
        <div className="text-2xl font-bold text-amber-600">{inactive}</div>
        <div className="text-xs text-gray-500">Inactive 3+ Days</div>
      </div>
    </div>
  );
}
