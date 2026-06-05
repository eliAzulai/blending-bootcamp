import type {
  ActivityRequest,
  ActivityResult,
  Cartridge,
  KnowledgeStore,
  Scheduler,
} from "./types";
import { blankState } from "./types";
import { selectNext } from "./sequencer";
import { applyResult } from "./mastery";

export interface MasteryView {
  mastered: string[];
  learning: string[];
  frontierNext: string | null;
}

export interface Engine {
  nextActivity(childId: string, subject: string): Promise<ActivityRequest | null>;
  recordResult(childId: string, result: ActivityResult): Promise<void>;
  masteryState(childId: string, subject: string): Promise<MasteryView>;
}

export function createEngine(
  cartridge: Cartridge,
  store: KnowledgeStore,
  scheduler: Scheduler,
  clock: () => number,
): Engine {
  const graph = cartridge.conceptGraph();

  return {
    async nextActivity(childId) {
      const states = await store.getAll(childId);
      const pick = selectNext(graph, states, clock());
      if (!pick) return null;
      // Cartridge owns activity construction. Engine passes only concept + mode.
      return cartridge.buildActivity(pick.conceptId, pick.mode);
    },

    async recordResult(childId, result) {
      const existing =
        (await store.get(childId, result.conceptId)) ?? blankState(result.conceptId);
      const updated = applyResult(existing, result, clock(), scheduler);
      await store.put(childId, updated);
    },

    async masteryState(childId) {
      const states = await store.getAll(childId);
      const mastered = states.filter((s) => s.status === "mastered").map((s) => s.conceptId);
      const learning = states.filter((s) => s.status === "learning").map((s) => s.conceptId);
      const pick = selectNext(graph, states, clock());
      return {
        mastered,
        learning,
        frontierNext: pick && pick.mode === "learn" ? pick.conceptId : null,
      };
    },
  };
}
