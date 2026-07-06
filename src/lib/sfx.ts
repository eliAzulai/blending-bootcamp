/**
 * Tiny synthesized sound effects via WebAudio — no audio asset files.
 * Every function silently no-ops when AudioContext is unavailable
 * (SSR, unsupported browsers, autoplay-blocked contexts).
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  durationMs: number,
  startDelayMs = 0,
  type: OscillatorType = "sine",
  gainPeak = 0.12,
): void {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime + startDelayMs / 1000;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + durationMs / 1000);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + durationMs / 1000 + 0.05);
}

/** Soft pop — tile picked up / placed. */
export function playPop(): void {
  tone(440, 90, 0, "triangle");
}

/** Gentle low click — wrong try. Deliberately soft, not a buzzer (R25). */
export function playClick(): void {
  tone(220, 80, 0, "sine", 0.08);
}

/** Two-note success chime (C5 → G5). */
export function playChime(): void {
  tone(523.25, 120);
  tone(783.99, 180, 110);
}
