import type {
  ActivityMode,
  ActivityRequest,
  ActivityResult,
  Cartridge,
  ConceptGraph,
} from "@/engine/types";
import { readingGraph } from "./graph";
import { ITEM_BANK } from "./words";
import { makeTiles } from "./build-word-logic";
import type { SessionPolicy } from "./policy";
import type { ReadingPayload } from "./types";

export type Presenter = (req: ActivityRequest) => Promise<ActivityResult>;

/**
 * The reading cartridge. The engine sees only the Cartridge interface;
 * rendering is delegated to the injected presenter (the runner in the app,
 * a fake in tests). The presenter promise resolving IS the activity ending.
 */
export function createReadingCartridge(
  policy: SessionPolicy,
  present: Presenter,
): Cartridge {
  return {
    conceptGraph(): ConceptGraph {
      return readingGraph;
    },

    buildActivity(conceptId: string, mode: ActivityMode): ActivityRequest {
      const bank = ITEM_BANK[conceptId];
      const activityType = policy.activityFor(conceptId, mode);
      const i = policy.wordIndexFor(conceptId, bank.length);
      let payload: ReadingPayload;
      if (activityType === "blending") {
        payload = {
          kind: "blending",
          words: [bank[i], bank[(i + 1) % bank.length]],
        };
      } else if (activityType === "build_word") {
        payload = { kind: "build_word", word: bank[i].word, tiles: makeTiles(bank[i].word) };
      } else {
        payload = { kind: "read_aloud_check", word: bank[i].word, accept: bank[i].accept };
      }
      return { conceptId, activityType, payload };
    },

    async runActivity(req: ActivityRequest): Promise<ActivityResult> {
      const result = await present(req);
      policy.recordCompleted(req.conceptId);
      return result;
    },
  };
}
