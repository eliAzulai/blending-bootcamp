"use client";

import { useCallback, useRef, useState } from "react";
import type { ReadAloudPassage } from "@/lib/fixtures/student";
import type { SessionTracker } from "@/lib/tracker";

interface ReadAloudActivityProps {
  passage: ReadAloudPassage;
  tracker: SessionTracker;
  onComplete: (result: { coinsEarned: number; durationSeconds: number }) => void;
}

type RecordState = "idle" | "recording" | "transcribing" | "done" | "error";

const COINS = 5;

export default function ReadAloudActivity({
  passage,
  tracker,
  onComplete,
}: ReadAloudActivityProps) {
  const [recordState, setRecordState] = useState<RecordState>("idle");
  // Transcript is sent to the tracker (server) and never displayed to the child (R17).
  const startedAtRef = useRef<number>(Date.now());
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorderRef.current = recorder;
      recorder.start(100);
      setRecordState("recording");
    } catch {
      setRecordState("error");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;

    setRecordState("transcribing");

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    });

    const blob = new Blob(chunksRef.current, {
      type: recorder.mimeType || "audio/webm",
    });

    let transcriptText = "";
    if (blob.size > 1000) {
      try {
        const form = new FormData();
        form.append("audio", blob, "audio.webm");
        const res = await fetch("/api/transcribe", { method: "POST", body: form });
        if (res.ok) {
          const data = await res.json();
          transcriptText = (data.text ?? "").trim();
        }
      } catch {
        // Whisper unavailable — still advance, just no transcript
      }
    }

    setRecordState("done");

    const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
    await tracker.recordAttempt({
      activityType: "read_aloud",
      contentRef: passage.id,
      score: null,
      durationSeconds: duration,
      transcript: transcriptText || null,
    });
  }, [tracker, passage]);

  const handleFinish = useCallback(() => {
    const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
    onComplete({ coinsEarned: COINS, durationSeconds: duration });
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Read Aloud
        </p>
        <h2 className="mt-1 text-xl font-extrabold text-purple-700">
          {passage.title}
        </h2>
      </div>

      {/* R21 — passage typography: short line length, generous line height,
        * left-aligned (never centered or justified). See docs/non-negotiable-rules.md. */}
      <div className="w-full rounded-2xl bg-white px-6 py-5 shadow-sm">
        <p className="passage text-xl font-semibold text-gray-800">
          {passage.text}
        </p>
      </div>

      {recordState === "idle" && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-gray-500">
            Read the passage above out loud, then tap Done!
          </p>
          <button
            onClick={startRecording}
            className="rounded-2xl bg-red-500 px-8 py-5 text-xl font-extrabold text-white shadow-lg hover:bg-red-600 active:scale-95 transition-transform"
          >
            🎙 Start Reading
          </button>
        </div>
      )}

      {recordState === "recording" && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-red-100 px-4 py-2">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-bold text-red-600">Recording…</span>
          </div>
          <button
            onClick={stopRecording}
            className="rounded-2xl bg-purple-600 px-8 py-5 text-xl font-extrabold text-white shadow-lg hover:bg-purple-700 active:scale-95 transition-transform"
          >
            ✅ Done Reading
          </button>
        </div>
      )}

      {recordState === "transcribing" && (
        <p className="text-sm text-gray-400 animate-pulse">Processing…</p>
      )}

      {recordState === "done" && (
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          {/* R17 — never show the raw Whisper transcript to the child.
            * Transcript is still saved server-side for the teacher to review.
            * R5 — no italics on child surfaces. */}
          <div className="rounded-2xl bg-green-50 px-5 py-4 text-center w-full">
            <p className="text-lg font-extrabold text-green-700">
              🌟 Great reading!
            </p>
          </div>
          <button
            onClick={handleFinish}
            className="w-full rounded-2xl bg-purple-600 px-6 py-4 text-xl font-extrabold text-white shadow-md hover:bg-purple-700 active:scale-95 transition-transform"
          >
            Next →
          </button>
        </div>
      )}

      {recordState === "error" && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-red-500">
            Microphone not available — skip for now
          </p>
          <button
            onClick={handleFinish}
            className="rounded-2xl bg-gray-400 px-6 py-3 font-bold text-white hover:bg-gray-500"
          >
            Skip
          </button>
        </div>
      )}
    </div>
  );
}
