"use client";

interface ProgressBarProps {
  current: number;
  total: number;
}

/**
 * A colourful, kid-friendly progress bar.
 * Shows "Word X of Y" and a filled bar that animates as the learner progresses.
 */
export default function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full px-4">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-base font-bold text-purple-700">
          Word {Math.min(current + 1, total)} of {total}
        </span>
        <span className="text-sm font-semibold text-purple-500">{pct}%</span>
      </div>
      <div className="h-5 w-full overflow-hidden rounded-full bg-purple-100">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #7C3AED, #0D9488, #10B981)",
          }}
        />
      </div>
    </div>
  );
}
