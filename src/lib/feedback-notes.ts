/**
 * Builder feedback capture support (spec §2.7). Pure logic — no React, no
 * Supabase import; the saver and storage are injected so tests use stubs.
 */

export interface ActivityEvent {
  conceptId: string;
  activityType: string;
  correct: boolean;
  score: number;
  authoritative: boolean;
}

export interface ActiveActivity {
  conceptId: string;
  activityType: string;
  mode: "learn" | "review";
  rep: number;
}

export interface NoteContext {
  route: string;
  active: ActiveActivity | null;
  recentResults: ActivityEvent[];
}

export interface FeedbackNote {
  transcript: string;
  context: Record<string, unknown>;
}

export class SessionEventLog {
  private events: ActivityEvent[] = [];

  record(event: ActivityEvent): void {
    this.events.push(event);
    if (this.events.length > 5) this.events.shift();
  }

  context(route: string, active: ActiveActivity | null): NoteContext {
    return { route, active, recentResults: [...this.events] };
  }
}

export type NoteSaver = (note: FeedbackNote) => Promise<void>;

interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

const QUEUE_KEY = "wp-feedback-queue";

/** F4: failed saves land in storage and retry on the next submit or flush. */
export class FeedbackQueue {
  private chain: Promise<void> = Promise.resolve();

  constructor(private saver: NoteSaver, private storage: StorageLike) {}

  /** All queue ops run strictly sequentially — concurrent submits can't
   *  interleave their read-modify-write on storage and drop a note. */
  private serialize(op: () => Promise<void>): Promise<void> {
    const next = this.chain.then(op, op);
    // Keep the chain alive even if op rejects.
    this.chain = next.catch(() => {});
    return next;
  }

  private readQueue(): FeedbackNote[] {
    try {
      return JSON.parse(this.storage.getItem(QUEUE_KEY) ?? "[]") as FeedbackNote[];
    } catch {
      return [];
    }
  }

  private writeQueue(notes: FeedbackNote[]): void {
    if (notes.length === 0) this.storage.removeItem(QUEUE_KEY);
    else this.storage.setItem(QUEUE_KEY, JSON.stringify(notes));
  }

  private async flushNow(): Promise<void> {
    const pending = this.readQueue();
    const stillPending: FeedbackNote[] = [];
    for (const note of pending) {
      try {
        await this.saver(note);
      } catch {
        stillPending.push(note);
      }
    }
    this.writeQueue(stillPending);
  }

  flush(): Promise<void> {
    return this.serialize(() => this.flushNow());
  }

  submit(note: FeedbackNote): Promise<void> {
    return this.serialize(async () => {
      await this.flushNow();
      try {
        await this.saver(note);
      } catch {
        this.writeQueue([...this.readQueue(), note]);
      }
    });
  }
}
