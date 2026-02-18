/**
 * Browser-agnostic wrapper around the Web Speech API SpeechRecognition.
 * Handles feature detection, mic permission, and single-shot listening.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/* ---------- Types ---------- */

export interface SpeechResult {
  /** All alternative transcripts, lowercased and trimmed */
  transcripts: string[];
  /** Highest confidence score from the results */
  confidence: number;
}

export interface ListenOptions {
  /** Max listening time in ms (default 4000) */
  timeoutMs?: number;
  /** BCP-47 language (default "en-US") */
  lang?: string;
  /** Number of alternative transcripts to request (default 10) */
  maxAlternatives?: number;
}

/* ---------- Feature detection ---------- */

/** Returns the SpeechRecognition constructor or null. */
function getSRClass(): (new () => any) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSRClass() !== null;
}

/* ---------- Mic permission ---------- */

let _permissionGranted: boolean | null = null;

export async function requestMicPermission(): Promise<boolean> {
  if (_permissionGranted !== null) return _permissionGranted;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    _permissionGranted = true;
  } catch {
    _permissionGranted = false;
  }
  return _permissionGranted;
}

export function isPermissionGranted(): boolean {
  return _permissionGranted === true;
}

/* ---------- Single-shot listener ---------- */

let _activeRecognition: any = null;

/**
 * Listen for a single utterance and return all transcript alternatives.
 * Resolves when the user stops speaking or the timeout fires.
 */
export function listenForSpeech(
  options: ListenOptions = {},
): Promise<SpeechResult> {
  const {
    timeoutMs = 4000,
    lang = "en-US",
    maxAlternatives = 10,
  } = options;

  const SRClass = getSRClass();
  if (!SRClass) {
    return Promise.resolve({ transcripts: [], confidence: 0 });
  }

  cancelListening();

  const recognition = new SRClass();
  _activeRecognition = recognition;

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = maxAlternatives;
  recognition.lang = lang;

  return new Promise<SpeechResult>((resolve) => {
    let settled = false;
    const settle = (result: SpeechResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      _activeRecognition = null;
      resolve(result);
    };

    const timer = setTimeout(() => {
      try { recognition.abort(); } catch { /* ignore */ }
      settle({ transcripts: [], confidence: 0 });
    }, timeoutMs + 1000);

    recognition.onresult = (event: any) => {
      const transcripts: string[] = [];
      let bestConfidence = 0;

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        for (let j = 0; j < result.length; j++) {
          const alt = result[j];
          const t = (alt.transcript as string).toLowerCase().trim();
          if (t) transcripts.push(t);
          if (alt.confidence > bestConfidence) bestConfidence = alt.confidence;
        }
      }

      settle({ transcripts, confidence: bestConfidence });
    };

    recognition.onnomatch = () => {
      settle({ transcripts: [], confidence: 0 });
    };

    recognition.onerror = (event: any) => {
      settle({ transcripts: [], confidence: 0 });
      if (event.error === "not-allowed") {
        _permissionGranted = false;
      }
    };

    recognition.onend = () => {
      settle({ transcripts: [], confidence: 0 });
    };

    setTimeout(() => {
      try { recognition.stop(); } catch { /* ignore */ }
    }, timeoutMs);

    try {
      recognition.start();
    } catch {
      settle({ transcripts: [], confidence: 0 });
    }
  });
}

/** Abort any in-progress recognition. Safe to call anytime. */
export function cancelListening(): void {
  if (_activeRecognition) {
    try { _activeRecognition.abort(); } catch { /* ignore */ }
    _activeRecognition = null;
  }
}
