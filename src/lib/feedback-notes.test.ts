import { describe, it, expect, beforeEach } from "vitest";
import { SessionEventLog, FeedbackQueue, type NoteSaver, type FeedbackNote } from "./feedback-notes";

describe("SessionEventLog (F3)", () => {
  it("keeps only the last 5 activity results", () => {
    const log = new SessionEventLog();
    for (let i = 0; i < 7; i++) {
      log.record({ conceptId: `c${i}`, activityType: "blending", correct: true, score: 1, authoritative: false });
    }
    const ctx = log.context("/student/adaptive", { conceptId: "c6", activityType: "blending", mode: "learn", rep: 2 });
    expect(ctx.recentResults).toHaveLength(5);
    expect(ctx.recentResults[0].conceptId).toBe("c2");
    expect(ctx.route).toBe("/student/adaptive");
    expect(ctx.active).toEqual({ conceptId: "c6", activityType: "blending", mode: "learn", rep: 2 });
  });
});

describe("FeedbackQueue (F4)", () => {
  let store: Record<string, string>;
  const storage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
  };
  beforeEach(() => { store = {}; });

  it("saves directly when the saver succeeds", async () => {
    const saved: unknown[] = [];
    const saver: NoteSaver = async (n) => { saved.push(n); };
    const q = new FeedbackQueue(saver, storage);
    await q.submit({ transcript: "too easy", context: { route: "/x" } });
    expect(saved).toHaveLength(1);
    expect(storage.getItem("wp-feedback-queue")).toBeNull();
  });

  it("queues to storage on failure and flushes later (a note is never lost)", async () => {
    let failing = true;
    const saved: unknown[] = [];
    const saver: NoteSaver = async (n) => {
      if (failing) throw new Error("offline");
      saved.push(n);
    };
    const q = new FeedbackQueue(saver, storage);
    await q.submit({ transcript: "note 1", context: {} });
    expect(saved).toHaveLength(0);
    expect(JSON.parse(storage.getItem("wp-feedback-queue")!)).toHaveLength(1);
    failing = false;
    await q.submit({ transcript: "note 2", context: {} }); // next note triggers flush
    expect(saved).toHaveLength(2);
    expect(storage.getItem("wp-feedback-queue")).toBeNull();
  });

  it("flush() alone drains the queue (page-load retry)", async () => {
    const saved: unknown[] = [];
    storage.setItem("wp-feedback-queue", JSON.stringify([{ transcript: "old", context: {} }]));
    const q = new FeedbackQueue(async (n) => { saved.push(n); }, storage);
    await q.flush();
    expect(saved).toHaveLength(1);
    expect(storage.getItem("wp-feedback-queue")).toBeNull();
  });

  it("overlapping submits never drop a note (queue ops are serialized)", async () => {
    // Race being pinned: an unserialized flush reads a queue snapshot, awaits a
    // slow saver for the pending note, and then writes back its stale snapshot
    // — clobbering any note another failing submit appended in the meantime.
    let releaseOld!: () => void;
    const gate = new Promise<void>((resolve) => { releaseOld = resolve; });
    let oldCalls = 0;
    const saver: NoteSaver = async (n) => {
      if (n.transcript === "old") {
        oldCalls += 1;
        if (oldCalls === 1) {
          await gate; // slow SUCCESS: holds a stale queue snapshot open in flush
          return;
        }
      }
      throw new Error("offline"); // every new note fails and must be queued
    };
    storage.setItem("wp-feedback-queue", JSON.stringify([{ transcript: "old", context: {} }]));
    const q = new FeedbackQueue(saver, storage);
    const p1 = q.submit({ transcript: "note 1", context: {} });
    const p2 = q.submit({ transcript: "note 2", context: {} });
    // Macrotask tick: lets any unserialized work settle while p1's flush is
    // still parked on the gate (a serialized queue just stays parked here).
    await new Promise((resolve) => setTimeout(resolve, 0));
    releaseOld();
    await Promise.all([p1, p2]);
    const queued = JSON.parse(storage.getItem("wp-feedback-queue")!) as FeedbackNote[];
    expect(queued.map((n) => n.transcript).sort()).toEqual(["note 1", "note 2"]);
  });
});
