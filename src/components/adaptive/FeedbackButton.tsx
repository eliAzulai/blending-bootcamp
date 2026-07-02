"use client";

import { useEffect, useRef, useState } from "react";
import { createClient, supabaseIsConfigured } from "@/lib/supabase/client";
import {
  FeedbackQueue,
  SessionEventLog,
  type ActiveActivity,
  type FeedbackNote,
} from "@/lib/feedback-notes";

interface Props {
  eventLog: SessionEventLog;
  active: ActiveActivity | null;
}

async function transcribeBlob(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", blob, "note.webm");
  const res = await fetch("/api/transcribe", { method: "POST", body: form });
  if (!res.ok) throw new Error(`transcribe failed: ${res.status}`);
  const data = (await res.json()) as { text?: string };
  return data.text ?? "";
}

function makeSaver() {
  return async (note: FeedbackNote) => {
    if (!supabaseIsConfigured()) throw new Error("supabase not configured");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("not signed in");
    const { error } = await supabase.from("feedback_notes").insert({
      user_id: user.id,
      transcript: note.transcript,
      context: note.context,
    });
    if (error) throw new Error(error.message);
  };
}

export default function FeedbackButton({ eventLog, active }: Props) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const contextRef = useRef<Record<string, unknown>>({});
  const queueRef = useRef<FeedbackQueue | null>(null);

  useEffect(() => {
    queueRef.current = new FeedbackQueue(makeSaver(), window.localStorage);
    void queueRef.current.flush(); // F4: page-load retry
  }, []);

  async function toggle() {
    if (busy) return;
    if (!recording) {
      // F3: stamp context at note START.
      contextRef.current = { ...eventLog.context(window.location.pathname, active) };
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setBusy(true);
        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          const transcript = await transcribeBlob(blob);
          if (transcript.trim()) {
            await queueRef.current!.submit({ transcript, context: contextRef.current });
          }
        } catch {
          // transcription itself failed — nothing to queue (no transcript, and
          // we never store audio); the builder simply re-records.
        } finally {
          setBusy(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } else {
      recorderRef.current?.stop();
      recorderRef.current = null;
      setRecording(false);
    }
  }

  return (
    <button
      onClick={toggle}
      className={`fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg ${
        recording ? "bg-red-500" : "bg-gray-800"
      } text-2xl text-white`}
      aria-label={recording ? "Stop note" : "Record a builder note"}
    >
      {busy ? "…" : recording ? "■" : "🎙️"}
    </button>
  );
}
