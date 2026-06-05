import type { KnowledgeState, KnowledgeStore } from "./types";

/** In-memory store for tests and dev. Real Supabase store comes in a later plan. */
export class MemoryStore implements KnowledgeStore {
  private byChild = new Map<string, Map<string, KnowledgeState>>();

  async get(childId: string, conceptId: string): Promise<KnowledgeState | null> {
    return this.byChild.get(childId)?.get(conceptId) ?? null;
  }

  async getAll(childId: string): Promise<KnowledgeState[]> {
    return [...(this.byChild.get(childId)?.values() ?? [])];
  }

  async put(childId: string, state: KnowledgeState): Promise<void> {
    let m = this.byChild.get(childId);
    if (!m) {
      m = new Map();
      this.byChild.set(childId, m);
    }
    m.set(state.conceptId, state);
  }
}
