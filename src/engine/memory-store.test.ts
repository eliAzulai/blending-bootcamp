import { describe, it, expect } from "vitest";
import { MemoryStore } from "./memory-store";
import { blankState } from "./types";

describe("MemoryStore", () => {
  it("returns null for an unknown concept", async () => {
    const store = new MemoryStore();
    expect(await store.get("child1", "at")).toBeNull();
  });

  it("puts and gets state scoped by child", async () => {
    const store = new MemoryStore();
    await store.put("child1", { ...blankState("at"), status: "learning" });
    expect((await store.get("child1", "at"))?.status).toBe("learning");
    expect(await store.get("child2", "at")).toBeNull();
  });

  it("getAll returns only that child's states", async () => {
    const store = new MemoryStore();
    await store.put("child1", blankState("at"));
    await store.put("child1", blankState("it"));
    await store.put("child2", blankState("op"));
    const all = await store.getAll("child1");
    expect(all.map((s) => s.conceptId).sort()).toEqual(["at", "it"]);
  });
});
