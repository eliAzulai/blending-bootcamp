/** A single teachable concept (subject-tagged so the engine hosts any subject's graph). */
export interface ConceptNode {
  id: string;
  subject: string;
  title: string;
}

/** "conceptId requires requiresId to be mastered first." */
export interface PrereqEdge {
  conceptId: string;
  requiresId: string;
}

export interface ConceptGraph {
  nodes: ConceptNode[];
  edges: PrereqEdge[];
}

export type MasteryStatus = "unseen" | "learning" | "mastered";

/** Per-(child, concept) learning state. Scheduling fields are scheduler-owned. */
export interface KnowledgeState {
  conceptId: string;
  status: MasteryStatus;
  authoritativeAttempts: number;
  authoritativeCorrect: number;
  /** Epoch ms when this concept is next due for review; null = not scheduled. */
  due: number | null;
  /** Opaque scheduler bookkeeping (e.g. current interval in ms). */
  intervalMs: number;
  /** Epoch ms of last authoritative review; null = never. */
  lastReview: number | null;
}

/** What the engine asks the cartridge to render. Engine treats payload as OPAQUE. */
export interface ActivityRequest {
  conceptId: string;
  activityType: string;
  payload: unknown;
}

/** What an activity reports back. The ONLY thing the engine consumes. */
export interface ActivityResult {
  conceptId: string;
  correct: boolean;
  /** 0..1 */
  score: number;
  /** true = counts toward mastery; false = formative practice only. */
  authoritative: boolean;
  signals?: Record<string, unknown>;
}

export type ActivityMode = "learn" | "review";

/** A subject. The engine never looks inside payloads or activity internals. */
export interface Cartridge {
  conceptGraph(): ConceptGraph;
  /** Cartridge chooses the concrete activity (game vs authoritative check) for this concept+mode. */
  buildActivity(conceptId: string, mode: ActivityMode): ActivityRequest;
  runActivity(req: ActivityRequest): Promise<ActivityResult>;
}

/** Persistence boundary. In-memory now; Supabase later — engine doesn't care. */
export interface KnowledgeStore {
  get(childId: string, conceptId: string): Promise<KnowledgeState | null>;
  getAll(childId: string): Promise<KnowledgeState[]>;
  put(childId: string, state: KnowledgeState): Promise<void>;
}

/** Spaced-review scheduling, swappable (SimpleScheduler now, FSRS later). */
export interface Scheduler {
  /** Compute the next state's scheduling fields after an authoritative review. */
  schedule(state: KnowledgeState, correct: boolean, now: number): KnowledgeState;
}

/** Fresh state for a never-seen concept. */
export function blankState(conceptId: string): KnowledgeState {
  return {
    conceptId,
    status: "unseen",
    authoritativeAttempts: 0,
    authoritativeCorrect: 0,
    due: null,
    intervalMs: 0,
    lastReview: null,
  };
}
