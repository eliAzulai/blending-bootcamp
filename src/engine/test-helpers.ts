import type {
  Cartridge,
  ConceptGraph,
  ActivityRequest,
  ActivityResult,
  ActivityMode,
} from "./types";

/**
 * A 3-concept linear reading-ish graph: at -> it -> op (each requires the previous).
 * Used to verify frontier/sequencing without any real subject.
 */
export const linearGraph: ConceptGraph = {
  nodes: [
    { id: "at", subject: "reading", title: "-at family" },
    { id: "it", subject: "reading", title: "-it family" },
    { id: "op", subject: "reading", title: "-op family" },
  ],
  edges: [
    { conceptId: "it", requiresId: "at" },
    { conceptId: "op", requiresId: "it" },
  ],
};

/**
 * A throwaway subject the engine drives in the boundary test. It carries a
 * deliberately weird payload to prove the engine never inspects it.
 */
export class FakeCartridge implements Cartridge {
  public built: ActivityRequest[] = [];

  constructor(
    private graph: ConceptGraph = linearGraph,
    /** What runActivity returns; default = authoritative correct. */
    private result: Partial<ActivityResult> = {},
  ) {}

  conceptGraph(): ConceptGraph {
    return this.graph;
  }

  buildActivity(conceptId: string, mode: ActivityMode): ActivityRequest {
    const req: ActivityRequest = {
      conceptId,
      activityType: mode === "review" ? "fake-check" : "fake-learn",
      payload: { secret: "engine must never read this", mode },
    };
    this.built.push(req);
    return req;
  }

  async runActivity(req: ActivityRequest): Promise<ActivityResult> {
    return {
      conceptId: req.conceptId,
      correct: this.result.correct ?? true,
      score: this.result.score ?? 1,
      authoritative: this.result.authoritative ?? true,
      signals: this.result.signals,
    };
  }
}
