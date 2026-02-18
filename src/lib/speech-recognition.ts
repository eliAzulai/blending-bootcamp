/**
 * Speech recognition via MediaRecorder + OpenAI Whisper.
 *
 * Records audio for a given duration, sends the clip to /api/transcribe,
 * and returns the transcript. Much more reliable than the Web Speech API.
 */

/* ---------- Types ---------- */

export interface SpeechResult {
  /** All alternative transcripts, lowercased and trimmed */
  transcripts: string[];
  /** Highest confidence score from the results (1.0 for Whisper) */
  confidence: number;
}

export interface ListenOptions {
  /** Max listening time in ms (default 4000) */
  timeoutMs?: number;
  /** BCP-47 language (default "en-US") — unused by Whisper but kept for API compat */
  lang?: string;
  /** Unused — kept for API compat */
  maxAlternatives?: number;
}

/* ---------- Feature detection ---------- */

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return !!(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== "undefined";
}

/* ---------- Mic permission ---------- */

let _permissionGranted: boolean | null = null;
let _micStream: MediaStream | null = null;

export async function requestMicPermission(): Promise<boolean> {
  try {
    console.log("[WordPets] Requesting mic...");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Keep the stream alive so subsequent recordings start instantly
    _micStream = stream;
    _permissionGranted = true;
    console.log("[WordPets] Mic granted");
  } catch (err) {
    _permissionGranted = false;
    console.error("[WordPets] Mic denied:", err);
  }
  return _permissionGranted ?? false;
}

export function isPermissionGranted(): boolean {
  return _permissionGranted === true;
}

/* ---------- Single-shot listener ---------- */

let _activeRecorder: MediaRecorder | null = null;
let _cancelFlag = false;

/**
 * Record audio for `timeoutMs` then send to Whisper for transcription.
 */
export async function listenForSpeech(
  options: ListenOptions = {},
): Promise<SpeechResult> {
  const { timeoutMs = 4000 } = options;
  const empty: SpeechResult = { transcripts: [], confidence: 0 };

  cancelListening();
  _cancelFlag = false;

  // Get or reuse mic stream
  let stream = _micStream;
  if (!stream || !stream.active) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      _micStream = stream;
    } catch {
      console.error("[WordPets] Failed to get mic stream");
      return empty;
    }
  }

  // Determine best supported MIME type
  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  _activeRecorder = recorder;

  const chunks: Blob[] = [];

  return new Promise<SpeechResult>((resolve) => {
    let settled = false;
    const settle = (result: SpeechResult) => {
      if (settled) return;
      settled = true;
      _activeRecorder = null;
      resolve(result);
    };

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
      if (_cancelFlag || settled) {
        settle(empty);
        return;
      }

      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      console.log("[WordPets] Recorded", blob.size, "bytes, sending to Whisper...");

      // Skip tiny recordings (likely silence)
      if (blob.size < 1000) {
        console.log("[WordPets] Recording too small, skipping");
        settle(empty);
        return;
      }

      try {
        const form = new FormData();
        form.append("audio", blob, "audio.webm");

        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: form,
        });

        if (!res.ok) {
          console.error("[WordPets] Transcribe failed:", res.status);
          settle(empty);
          return;
        }

        const data = await res.json();
        const text = (data.text ?? "").toLowerCase().trim();
        console.log("[WordPets] Whisper heard:", text);

        if (text) {
          // Split into individual words as "alternatives"
          const words = text.split(/\s+/).filter(Boolean);
          settle({
            transcripts: [text, ...words],
            confidence: 1.0,
          });
        } else {
          settle(empty);
        }
      } catch (err) {
        console.error("[WordPets] Transcribe error:", err);
        settle(empty);
      }
    };

    recorder.onerror = () => {
      console.error("[WordPets] MediaRecorder error");
      settle(empty);
    };

    // Start recording
    try {
      recorder.start();
      console.log("[WordPets] Recording started,", timeoutMs, "ms");
    } catch (err) {
      console.error("[WordPets] Recorder start failed:", err);
      settle(empty);
      return;
    }

    // Stop after timeout
    setTimeout(() => {
      if (recorder.state === "recording") {
        console.log("[WordPets] Recording timeout, stopping...");
        recorder.stop();
      }
    }, timeoutMs);
  });
}

/** Cancel any in-progress recording. Safe to call anytime. */
export function cancelListening(): void {
  _cancelFlag = true;
  if (_activeRecorder && _activeRecorder.state === "recording") {
    try { _activeRecorder.stop(); } catch { /* ignore */ }
  }
  _activeRecorder = null;
}
