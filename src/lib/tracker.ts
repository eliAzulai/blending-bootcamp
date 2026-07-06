import { supabaseIsConfigured } from "@/lib/supabase/client";
import { fixtureStudent } from "@/lib/fixtures/student";
import type { FocusAreaType } from "@/types/database";

export interface AttemptRecord {
  activityType: FocusAreaType;
  /** Which game produced this attempt; null/omitted = legacy formats. */
  format?: string | null;
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

// Direct REST writes bypass the Supabase JS client's session lock, which can
// hang after an aborted navigation. This keeps the child practice loop moving.

function readAccessTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const projectRef = url.match(/https:\/\/([^.]+)\./)?.[1];
  if (!projectRef) return null;
  const cookieName = `sb-${projectRef}-auth-token`;
  const cookies = document.cookie.split(";").map((c) => c.trim());
  const chunks: string[] = [];
  for (const c of cookies) {
    const [name, ...rest] = c.split("=");
    if (name === cookieName || /^sb-[^=]+-auth-token\.\d+$/.test(name)) {
      chunks.push(rest.join("="));
    }
  }
  if (chunks.length === 0) return null;
  let raw = decodeURIComponent(chunks.join(""));
  if (raw.startsWith("base64-")) {
    try {
      raw = atob(raw.slice("base64-".length));
    } catch {
      return null;
    }
  }
  try {
    return JSON.parse(raw)?.access_token ?? null;
  } catch {
    return null;
  }
}

function authHeaders(extra?: Record<string, string>): HeadersInit {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const token = readAccessTokenFromCookie() ?? key;
  return {
    apikey: key,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(extra ?? {}),
  };
}

const baseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 4000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

class SupabaseTracker implements SessionTracker {
  sessionId: string | null = null;
  constructor(private studentId: string) {}

  private async ensureSession(): Promise<string | null> {
    if (this.sessionId) return this.sessionId;
    let res: Response;
    try {
      res = await fetchWithTimeout(`${baseUrl()}/rest/v1/practice_sessions`, {
        method: "POST",
        headers: authHeaders({ Prefer: "return=representation" }),
        body: JSON.stringify({ student_id: this.studentId }),
      });
    } catch (err) {
      console.warn("[tracker] failed to open session", err);
      return null;
    }
    if (!res.ok) {
      console.warn("[tracker] failed to open session", res.status, await res.text());
      return null;
    }
    const rows = (await res.json()) as { id: string }[];
    this.sessionId = rows[0]?.id ?? null;
    return this.sessionId;
  }

  async recordAttempt(attempt: AttemptRecord) {
    const sessionId = await this.ensureSession();
    if (!sessionId) return;
    let res: Response;
    try {
      res = await fetchWithTimeout(`${baseUrl()}/rest/v1/activity_attempts`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          session_id: sessionId,
          activity_type: attempt.activityType,
          format: attempt.format ?? null,
          content_ref: attempt.contentRef,
          score: attempt.score,
          duration_seconds: attempt.durationSeconds,
          transcript: attempt.transcript ?? null,
          audio_url: attempt.audioUrl ?? null,
        }),
      });
    } catch (err) {
      console.warn("[tracker] failed to record attempt", err);
      return;
    }
    if (!res.ok) console.warn("[tracker] failed to record attempt", res.status);
  }

  async finish({ coinsEarned, durationSeconds }: { coinsEarned: number; durationSeconds: number }) {
    const sessionId = await this.ensureSession();
    if (!sessionId) return;
    let sessionRes: Response;
    try {
      sessionRes = await fetchWithTimeout(
        `${baseUrl()}/rest/v1/practice_sessions?id=eq.${sessionId}`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({
            completed: true,
            coins_earned: coinsEarned,
            duration_seconds: durationSeconds,
          }),
        },
      );
    } catch (err) {
      console.warn("[tracker] failed to finish session", err);
      return;
    }
    if (!sessionRes.ok) console.warn("[tracker] failed to finish session", sessionRes.status);

    // Read-modify-write on coins is acceptable for Phase 1a single-tab usage.
    let studentRes: Response;
    try {
      studentRes = await fetchWithTimeout(
        `${baseUrl()}/rest/v1/students?id=eq.${this.studentId}&select=coins&limit=1`,
        { headers: authHeaders() },
      );
    } catch (err) {
      console.warn("[tracker] failed to read student coins", err);
      return;
    }
    if (!studentRes.ok) {
      console.warn("[tracker] failed to read student coins", studentRes.status);
      return;
    }
    const studentRows = (await studentRes.json()) as { coins?: number }[];
    const current = studentRows[0]?.coins ?? 0;
    try {
      await fetchWithTimeout(`${baseUrl()}/rest/v1/students?id=eq.${this.studentId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ coins: current + coinsEarned }),
      });
    } catch (err) {
      console.warn("[tracker] failed to update student coins", err);
    }
  }
}

export function createSessionTracker(studentId: string): SessionTracker {
  if (studentId === fixtureStudent.id) return new NoopTracker();
  if (!supabaseIsConfigured()) return new NoopTracker();
  return new SupabaseTracker(studentId);
}
