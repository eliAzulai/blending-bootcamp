"use client";

import { useCallback, useRef, useState } from "react";
import { createEngine, type Engine } from "@/engine/engine";
import { MemoryStore } from "@/engine/memory-store";
import { SimpleScheduler } from "@/engine/scheduler";
import type { ActivityRequest, ActivityResult } from "@/engine/types";
import { createReadingCartridge } from "@/cartridges/reading/cartridge";
import { SessionPolicy } from "@/cartridges/reading/policy";
import type { ReadingPayload } from "@/cartridges/reading/types";
import { requestMicPermission } from "@/lib/speech-recognition";
import { SessionEventLog } from "@/lib/feedback-notes";
import BuildWordActivity from "@/components/adaptive/BuildWordActivity";
import ReadAloudCheck from "@/components/adaptive/ReadAloudCheck";
import BlendingRep from "@/components/adaptive/BlendingRep";
import FeedbackButton from "@/components/adaptive/FeedbackButton";

type Phase = "intro" | "running" | "done";
const FORMATIVE_ONLY_CAP = 10; // spec §2.6 R2

interface Props {
  studentId: string;
  builderMode: boolean;
}

export default function AdaptiveRunner({ studentId, builderMode }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [micGranted, setMicGranted] = useState(false);
  const [current, setCurrent] = useState<ActivityRequest | null>(null);
  const [servedCount, setServedCount] = useState(0);

  const engineRef = useRef<Engine | null>(null);
  const policyRef = useRef<SessionPolicy | null>(null);
  // Stable instance (not a ref-read-during-render): the log itself is never
  // reactive state, just an accumulator handed to event handlers and effects.
  const [eventLog] = useState(() => new SessionEventLog());

  const advance = useCallback(async (count: number, mic: boolean) => {
    const engine = engineRef.current!;
    if (!mic && count >= FORMATIVE_ONLY_CAP) {
      setPhase("done");
      return;
    }
    const req = await engine.nextActivity(studentId, "reading");
    if (!req) {
      setPhase("done");
      return;
    }
    setCurrent(req);
  }, [studentId]);

  async function start() {
    const granted = await requestMicPermission();
    setMicGranted(granted);
    const ttsAvailable = typeof window !== "undefined" && "speechSynthesis" in window;
    const policy = new SessionPolicy({ ttsAvailable, micAvailable: granted });
    policyRef.current = policy;
    // The rendered component IS the presenter in this app; cartridge.runActivity
    // (which would call recordCompleted itself) is used only by headless tests.
    // Single bookkeeping path: handleResult below records completion.
    const cartridge = createReadingCartridge(policy, () =>
      Promise.reject(new Error("runner renders activities directly")),
    );
    engineRef.current = createEngine(
      cartridge, new MemoryStore(), new SimpleScheduler(), () => Date.now(),
    );
    setPhase("running");
    await advance(0, granted);
  }

  const handleResult = useCallback(async (result: ActivityResult) => {
    const engine = engineRef.current!;
    eventLog.record({
      conceptId: result.conceptId,
      activityType: current?.activityType ?? "",
      correct: result.correct,
      score: result.score,
      authoritative: result.authoritative,
    });
    policyRef.current!.recordCompleted(result.conceptId);
    await engine.recordResult(studentId, result);
    const count = servedCount + 1;
    setServedCount(count);
    setCurrent(null);
    await advance(count, micGranted);
  }, [advance, current, eventLog, micGranted, servedCount, studentId]);

  // A5/P5: checkpoint aborted on transcription failure — no result recorded,
  // rep cycle resets so the child gets two more games before the next try.
  const handleAbort = useCallback(async () => {
    if (current) policyRef.current!.resetCycle(current.conceptId);
    setCurrent(null);
    await advance(servedCount, micGranted);
  }, [advance, current, micGranted, servedCount]);

  return (
    <main className="min-h-screen bg-amber-50 px-4 py-8">
      {phase === "intro" && (
        <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
          <h1 className="text-3xl font-bold text-purple-900">Word Practice</h1>
          <p className="text-lg text-gray-700">
            Play word games and read words out loud!
          </p>
          <button
            onClick={start}
            className="min-h-14 rounded-full bg-purple-600 px-10 py-4 text-2xl font-bold text-white"
          >
            Start
          </button>
        </div>
      )}

      {phase === "running" && (
        <div className="mx-auto max-w-lg">
          {!micGranted && (
            <p className="mb-4 rounded-xl bg-purple-100 p-3 text-center text-purple-900">
              Reading checks need the microphone — playing games for now!
            </p>
          )}
          {current && (
            <ActivityRenderer
              request={current}
              onResult={handleResult}
              onAbort={handleAbort}
            />
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="mx-auto flex max-w-md flex-col items-center gap-6 pt-16 text-center">
          <p className="text-6xl">🎉</p>
          <h1 className="text-3xl font-bold text-purple-900">You did it! All done!</h1>
          <p className="text-lg text-gray-700">Great word work today!</p>
        </div>
      )}

      {builderMode && current?.activityType !== "read_aloud_check" && (
        <FeedbackButton
          eventLog={eventLog}
          active={
            current
              ? {
                  conceptId: current.conceptId,
                  activityType: current.activityType,
                  mode: "learn",
                  rep: servedCount,
                }
              : null
          }
        />
      )}
    </main>
  );
}

interface ActivityRendererProps {
  request: ActivityRequest;
  onResult: (r: ActivityResult) => void;
  onAbort: () => void;
}

/** Picks the right activity component for the engine's current request.
 * A dedicated component (not a helper called during the parent's render)
 * so callbacks that touch refs never get read while the parent renders. */
function ActivityRenderer({ request, onResult, onAbort }: ActivityRendererProps) {
  const payload = request.payload as ReadingPayload;
  if (payload.kind === "build_word") {
    return (
      <BuildWordActivity
        key={`${request.conceptId}-${payload.word}`}
        conceptId={request.conceptId}
        payload={payload}
        onResult={onResult}
      />
    );
  }
  if (payload.kind === "read_aloud_check") {
    return (
      <ReadAloudCheck
        key={`${request.conceptId}-${payload.word}`}
        conceptId={request.conceptId}
        payload={payload}
        onResult={onResult}
        onAbort={onAbort}
      />
    );
  }
  return (
    <BlendingRep
      key={`${request.conceptId}-${payload.words[0].word}`}
      conceptId={request.conceptId}
      payload={payload}
      onResult={onResult}
    />
  );
}
