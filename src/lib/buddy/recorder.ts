/**
 * Manual start/stop clip recorder for the buddy spike.
 * Unlike listenForSpeech(), this keeps the audio blob (needed for adult
 * grading playback) and stops on user action, not a timer.
 * Transcription goes through the existing auth-gated /api/transcribe route.
 */

export interface ClipResult {
  blob: Blob | null;
  transcript: string;
}

let _recorder: MediaRecorder | null = null;
let _chunks: Blob[] = [];

/** Stop and release any in-progress recorder's mic stream without transcribing. */
function _releaseActiveRecorder(): void {
  if (_recorder) {
    if (_recorder.state === "recording") {
      try {
        _recorder.stop();
      } catch {
        /* ignore */
      }
    }
    _recorder.stream.getTracks().forEach((t) => t.stop());
    _recorder = null;
  }
}

export async function startClip(): Promise<boolean> {
  // Guard against startClip being called twice without an intervening
  // stopClip(): release the previous recorder's mic stream first so it
  // doesn't leak.
  _releaseActiveRecorder();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
    _chunks = [];
    _recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    _recorder.ondataavailable = (e) => {
      if (e.data.size > 0) _chunks.push(e.data);
    };
    _recorder.start(100);
    return true;
  } catch {
    return false;
  }
}

export async function stopClip(): Promise<ClipResult> {
  const recorder = _recorder;
  _recorder = null;
  if (!recorder || recorder.state !== "recording") {
    return { blob: null, transcript: "" };
  }

  await new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
    recorder.stop();
    recorder.stream.getTracks().forEach((t) => t.stop());
  });

  const blob = new Blob(_chunks, { type: recorder.mimeType || "audio/webm" });

  // Skip transcription for tiny (likely silent) recordings, but still
  // return the blob — the grading screen should show whatever was
  // captured even if there's nothing to transcribe.
  if (blob.size < 1000) return { blob, transcript: "" };

  try {
    const form = new FormData();
    form.append("audio", blob, "audio.webm");
    const res = await fetch("/api/transcribe", { method: "POST", body: form });
    if (!res.ok) return { blob, transcript: "" };
    const data = await res.json();
    return { blob, transcript: (data.text ?? "").trim() };
  } catch {
    return { blob, transcript: "" };
  }
}
