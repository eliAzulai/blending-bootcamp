/**
 * Phase 1a success-metric strip — the number the whole experiment reports to:
 * >=60% of students completing practice on 4+ distinct days per week
 * (2026-04-14 spec; instrumentation decision 2026-07-18 grilling session).
 *
 * Teacher-only surface: R27 (no economy dashboards) applies to child surfaces,
 * not here. Server-computed; renders plain numbers.
 */

export interface WeekWindow {
  /** e.g. "This week", "1w ago" */
  label: string;
  /** Students with 4+ distinct completed-practice days in the window. */
  atTarget: number;
}

interface MetricStripProps {
  totalStudents: number;
  windows: WeekWindow[]; // newest first
}

const TARGET_PCT = 60;

export default function MetricStrip({ totalStudents, windows }: MetricStripProps) {
  if (totalStudents === 0) return null;

  const current = windows[0];
  const pct = Math.round((100 * current.atTarget) / totalStudents);
  const hit = pct >= TARGET_PCT;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-gray-700">
          Success metric · 4+ practice days/week
        </p>
        <p className="text-xs text-gray-400">target {TARGET_PCT}%</p>
      </div>

      <div className="mt-2 flex items-baseline gap-3">
        <span
          className={`text-3xl font-bold ${hit ? "text-green-600" : "text-gray-900"}`}
        >
          {pct}%
        </span>
        <span className="text-sm text-gray-500">
          {current.atTarget} of {totalStudents} students this week
        </span>
      </div>

      {/* 4-week trend, oldest on the left */}
      <div className="mt-3 flex items-end gap-4">
        {windows
          .slice()
          .reverse()
          .map((w) => {
            const wPct = Math.round((100 * w.atTarget) / totalStudents);
            return (
              <div key={w.label} className="flex flex-col items-center gap-1">
                <div
                  className="flex w-10 items-end rounded bg-gray-100"
                  style={{ height: 40 }}
                >
                  <div
                    className={`w-full rounded ${wPct >= TARGET_PCT ? "bg-green-500" : "bg-purple-400"}`}
                    style={{ height: `${Math.max(4, (wPct / 100) * 40)}px` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">{w.label}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
