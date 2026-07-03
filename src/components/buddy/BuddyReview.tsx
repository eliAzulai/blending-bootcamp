"use client";

import { useMemo, useState } from "react";
import type { AlignedWord } from "@/lib/buddy/alignment";
import type { SessionExport } from "@/lib/buddy/metrics";

export interface RecordedSentence {
  sentenceIndex: number;
  target: string;
  transcript: string;
  blobUrl: string | null;
  words: AlignedWord[];
}

interface BuddyReviewProps {
  passageId: string;
  sentences: RecordedSentence[];
}

const VERDICT_STYLE: Record<string, string> = {
  read: "bg-green-100 text-green-800 border-green-300",
  misread: "bg-orange-100 text-orange-800 border-orange-300",
  skipped: "bg-red-100 text-red-800 border-red-300",
};

export default function BuddyReview({ passageId, sentences }: BuddyReviewProps) {
  const [childAlias, setChildAlias] = useState("");
  // adultCorrect[sentenceIdx][wordIdx] = did the child ACTUALLY read it correctly
  // Invariant: this initializer runs once on mount and assumes `sentences`
  // is a stable snapshot for the component's lifetime (BuddySpike sets
  // reviewSentences once, right before mounting this component). A future
  // caller whose sentences prop changes after mount must key-remount this
  // component, or the toggle grid silently desyncs from the words shown.
  const [adultCorrect, setAdultCorrect] = useState<boolean[][]>(() =>
    sentences.map((s) => s.words.map((w) => w.verdict === "read")),
  );

  const toggle = (si: number, wi: number) => {
    setAdultCorrect((prev) =>
      prev.map((row, i) =>
        i === si ? row.map((v, j) => (j === wi ? !v : v)) : row,
      ),
    );
  };

  const exportJson = useMemo(() => {
    const data: SessionExport = {
      childAlias: childAlias.trim() || "?",
      passageId,
      date: new Date().toISOString().slice(0, 10),
      sentences: sentences.map((s, si) => ({
        sentenceIndex: s.sentenceIndex,
        target: s.target,
        transcript: s.transcript,
        words: s.words.map((w, wi) => ({
          word: w.word,
          heard: w.heard,
          asrVerdict: w.verdict,
          adultVerdict: adultCorrect[si][wi] ? ("correct" as const) : ("error" as const),
        })),
      })),
    };
    return JSON.stringify(data, null, 2);
  }, [childAlias, passageId, sentences, adultCorrect]);

  const download = () => {
    const blob = new Blob([exportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buddy-session-${childAlias.trim() || "x"}-${Date.now()}.json`;
    a.click();
    // iOS Safari hands the download to an async save sheet; revoking the
    // object URL immediately can truncate the file. Defer the revoke.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-extrabold text-gray-800">
        Grown-up review
      </h1>
      <p className="text-sm text-gray-500">
        Machine transcripts below may be inaccurate. Listen to each clip, then
        check the chips. Green chip = the machine thinks this word was read
        correctly. Orange chip = the machine heard a different word. Red chip
        = the machine heard nothing for it. Tap a chip only when the machine
        got it wrong: tap a green chip if the child actually misread or
        skipped that word, and tap an orange or red chip if the child
        actually read it correctly. A blue ring means the word is currently
        marked as read correctly, whatever its color says.
      </p>

      {sentences.map((s, si) => (
        <section key={si} className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="passage text-lg font-semibold text-gray-800">
            {s.target}
          </p>
          {s.blobUrl ? (
            <audio controls src={s.blobUrl} className="mt-3 w-full" />
          ) : (
            <p className="mt-3 text-sm text-red-500">No audio captured</p>
          )}
          <p className="mt-2 text-xs text-gray-400">
            Machine transcript: {s.transcript || "(empty)"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {s.words.map((w, wi) => (
              <button
                key={wi}
                onClick={() => toggle(si, wi)}
                className={`min-h-12 rounded-xl border-2 px-3 py-2 text-sm font-bold ${VERDICT_STYLE[w.verdict]} ${
                  adultCorrect[si][wi] ? "ring-2 ring-blue-500" : ""
                }`}
                title={w.heard ? `machine heard: ${w.heard}` : "machine heard nothing"}
              >
                {w.word}
                {w.heard && w.verdict === "misread" ? ` → ${w.heard}` : ""}
              </button>
            ))}
          </div>
        </section>
      ))}

      <label className="flex flex-col gap-1 text-sm font-bold text-gray-600">
        Child initials for the export (never a full name)
        <input
          value={childAlias}
          onChange={(e) => setChildAlias(e.target.value)}
          maxLength={3}
          className="w-24 rounded-xl border border-gray-300 px-4 py-3 text-lg"
        />
      </label>
      <button
        onClick={download}
        className="min-h-12 rounded-2xl bg-purple-600 px-6 py-4 text-lg font-extrabold text-white shadow-md hover:bg-purple-700"
      >
        Download session JSON
      </button>
      <p className="text-xs text-gray-400">
        Audio is not saved — it lives only in this browser tab. The JSON
        contains words and verdicts only.
      </p>
    </main>
  );
}
