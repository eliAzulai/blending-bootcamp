import { createClient } from "./client";

/**
 * Sync progress to Supabase when user is authenticated.
 * Falls back gracefully if not logged in (localStorage still works).
 */

export async function getLearner() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: learners } = await supabase
    .from("learners")
    .select("id, name")
    .eq("parent_id", user.id)
    .limit(1);

  return learners?.[0] ?? null;
}

export async function syncDayComplete(
  learnerId: string,
  day: number,
  wordsBlended: number,
  timeSeconds: number,
) {
  const supabase = createClient();

  const { error } = await supabase.from("progress").upsert(
    {
      learner_id: learnerId,
      day,
      words_blended: wordsBlended,
      time_seconds: timeSeconds,
    },
    { onConflict: "learner_id,day" },
  );

  return !error;
}

export async function getCloudProgress(learnerId: string) {
  const supabase = createClient();

  const { data } = await supabase
    .from("progress")
    .select("day, words_blended, time_seconds, completed_at")
    .eq("learner_id", learnerId)
    .order("day");

  if (!data) return null;

  return {
    daysCompleted: data.map((r) => r.day),
    wordsBlended: data.reduce((sum, r) => sum + r.words_blended, 0),
    totalTimeSeconds: data.reduce((sum, r) => sum + r.time_seconds, 0),
    details: data,
  };
}
