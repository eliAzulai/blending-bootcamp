/**
 * Word-level alignment between a target sentence and an ASR transcript.
 * Classic edit-distance DP with backtrace. Insertions in the transcript
 * (filler words, "um") are ignored; only target words get verdicts.
 */

export type WordVerdict = "read" | "misread" | "skipped";

export interface AlignedWord {
  /** Normalized target word */
  word: string;
  verdict: WordVerdict;
  /** Transcript token aligned to this word (null when skipped) */
  heard: string | null;
}

export function normalizeWord(w: string): string {
  // Digits are kept: Whisper often writes numerals ("3" for a spoken
  // "three"). Dropping them would erase the heard token and wrongly mark
  // the target word skipped; keeping them makes a spelled-out target vs
  // numeral transcript show up as a misread, visible to the grader.
  return w.toLowerCase().replace(/[^a-z0-9']/g, "");
}

export function tokenize(text: string): string[] {
  return text.split(/\s+/).map(normalizeWord).filter(Boolean);
}

export function alignWords(target: string, transcript: string): AlignedWord[] {
  const t = tokenize(target);
  const h = tokenize(transcript);
  const n = t.length;
  const m = h.length;

  // dp[i][j] = min edits aligning first i target words with first j heard words
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const subCost = t[i - 1] === h[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + subCost, // match / substitute
        dp[i - 1][j] + 1, // target word skipped
        dp[i][j - 1] + 1, // transcript insertion
      );
    }
  }

  // Backtrace, preferring diagonal moves (match/substitute) on ties.
  const out: AlignedWord[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const subCost = i > 0 && j > 0 && t[i - 1] === h[j - 1] ? 0 : 1;
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + subCost) {
      out.unshift({
        word: t[i - 1],
        verdict: subCost === 0 ? "read" : "misread",
        heard: h[j - 1],
      });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      out.unshift({ word: t[i - 1], verdict: "skipped", heard: null });
      i--;
    } else {
      j--; // transcript insertion — ignore
    }
  }
  return out;
}
