import { FOCUS_AREA_LABELS, type FocusAreaType } from "@/types/database";

interface SessionRow {
  id: string;
  date: string;
  duration_seconds: number;
  coins_earned: number;
  completed: boolean;
}

interface AttemptRow {
  id: string;
  session_id: string;
  activity_type: FocusAreaType;
  content_ref: string | null;
  score: number | null;
  duration_seconds: number;
  transcript: string | null;
  created_at: string;
}

interface PracticeHistoryProps {
  sessions: SessionRow[];
  attempts: AttemptRow[];
}

const ACTIVITY_EMOJI: Record<FocusAreaType, string> = {
  phonics: "🔤",
  spelling: "✏️",
  read_aloud: "📖",
};

/**
 * 14-day heatmap row + recent attempts list. Server-rendered.
 */
export default function PracticeHistory({
  sessions,
  attempts,
}: PracticeHistoryProps) {
  // Build 14-day heatmap (today on the right)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completedDates = new Set(
    sessions.filter((s) => s.completed).map((s) => s.date),
  );

  const days: { dateStr: string; label: string; practiced: boolean }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({
      dateStr,
      label: d.toLocaleDateString("en-US", { weekday: "narrow" }),
      practiced: completedDates.has(dateStr),
    });
  }

  // Group attempts by session (most recent first)
  const sessionMap = new Map<string, SessionRow>();
  sessions.forEach((s) => sessionMap.set(s.id, s));

  const attemptsBySession = new Map<string, AttemptRow[]>();
  attempts.forEach((a) => {
    const list = attemptsBySession.get(a.session_id) ?? [];
    list.push(a);
    attemptsBySession.set(a.session_id, list);
  });

  const recentSessions = sessions
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-700">Practice History</h3>
        <p className="mt-1 text-xs text-gray-400">Last 14 days</p>
      </div>

      {/* Heatmap */}
      <div className="flex gap-1">
        {days.map((d) => (
          <div
            key={d.dateStr}
            title={d.dateStr}
            className={`flex h-8 flex-1 flex-col items-center justify-center rounded text-[10px] font-bold ${
              d.practiced
                ? "bg-purple-500 text-white"
                : "bg-gray-100 text-gray-300"
            }`}
          >
            {d.label}
          </div>
        ))}
      </div>

      {/* Recent sessions */}
      {recentSessions.length === 0 ? (
        <p className="text-xs text-gray-400">
          No practice sessions yet. Sessions will appear here once the student
          starts using the app.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Recent sessions
          </p>
          {recentSessions.map((session) => {
            const sessionAttempts = attemptsBySession.get(session.id) ?? [];
            const minutes = Math.max(
              1,
              Math.round(session.duration_seconds / 60),
            );
            return (
              <div
                key={session.id}
                className={`rounded-lg border p-3 ${
                  session.completed
                    ? "border-gray-200 bg-white"
                    : "border-gray-100 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">
                    {new Date(session.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="text-gray-400">
                    {session.completed
                      ? `${minutes} min · 🪙 ${session.coins_earned}`
                      : "Incomplete"}
                  </span>
                </div>
                {sessionAttempts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {sessionAttempts.map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] text-purple-700"
                      >
                        <span>{ACTIVITY_EMOJI[a.activity_type]}</span>
                        {FOCUS_AREA_LABELS[a.activity_type]}
                        {a.score !== null && ` · ${a.score}%`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
