import { createClient, supabaseIsConfigured } from "@/lib/supabase/client";
import type { FocusAreaType } from "@/types/database";

export interface AttemptRecord {
  activityType: FocusAreaType;
  contentRef: string | null;
  score: number | null;
  durationSeconds: number;
  transcript?: string | null;
  audioUrl?: string | null;
}

export interface SessionTracker {
  sessionId: string | null;
  recordAttempt(attempt: AttemptRecord): Promise<void>;
  finish(opts: { coinsEarned: number; durationSeconds: number }): Promise<void>;
}

class NoopTracker implements SessionTracker {
  sessionId = null;
  async recordAttempt(attempt: AttemptRecord) {
    if (typeof window !== "undefined") {
      console.info("[tracker:noop] attempt", attempt);
    }
  }
  async finish(opts: { coinsEarned: number; durationSeconds: number }) {
    if (typeof window !== "undefined") {
      console.info("[tracker:noop] finish", opts);
    }
  }
}

class SupabaseTracker implements SessionTracker {
  sessionId: string | null = null;
  constructor(private studentId: string) {}

  private async ensureSession(): Promise<string | null> {
    if (this.sessionId) return this.sessionId;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("practice_sessions")
      .insert({ student_id: this.studentId })
      .select("id")
      .single();
    if (error || !data) {
      console.warn("[tracker] failed to open session", error);
      return null;
    }
    this.sessionId = (data as { id: string }).id;
    return this.sessionId;
  }

  async recordAttempt(attempt: AttemptRecord) {
    const sessionId = await this.ensureSession();
    if (!sessionId) return;
    const supabase = createClient();
    const { error } = await supabase.from("activity_attempts").insert({
      session_id: sessionId,
      activity_type: attempt.activityType,
      content_ref: attempt.contentRef,
      score: attempt.score,
      duration_seconds: attempt.durationSeconds,
      transcript: attempt.transcript ?? null,
      audio_url: attempt.audioUrl ?? null,
    });
    if (error) console.warn("[tracker] failed to record attempt", error);
  }

  async finish({ coinsEarned, durationSeconds }: { coinsEarned: number; durationSeconds: number }) {
    const sessionId = await this.ensureSession();
    if (!sessionId) return;
    const supabase = createClient();
    const { error: sessionError } = await supabase
      .from("practice_sessions")
      .update({
        completed: true,
        coins_earned: coinsEarned,
        duration_seconds: durationSeconds,
      })
      .eq("id", sessionId);
    if (sessionError) console.warn("[tracker] failed to finish session", sessionError);

    // Bump student coins. Read-modify-write is acceptable for Phase 1a single-tab usage.
    const { data: student } = await supabase
      .from("students")
      .select("coins")
      .eq("id", this.studentId)
      .single();
    const current = (student as { coins?: number } | null)?.coins ?? 0;
    await supabase
      .from("students")
      .update({ coins: current + coinsEarned })
      .eq("id", this.studentId);
  }
}

export function createSessionTracker(studentId: string): SessionTracker {
  if (!supabaseIsConfigured()) return new NoopTracker();
  return new SupabaseTracker(studentId);
}
