import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the server Supabase client so the test exercises the route's auth gate
// without touching next/headers cookies() or the network.
const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

import { POST } from "./route";

function postRequest(body?: BodyInit) {
  return new Request("http://localhost/api/transcribe", {
    method: "POST",
    body,
  }) as unknown as Parameters<typeof POST>[0];
}

describe("POST /api/transcribe authenticated-session gate", () => {
  beforeEach(() => {
    getUser.mockReset();
    vi.restoreAllMocks();
  });

  it("rejects an unauthenticated request with 401 (no OpenAI relay)", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const request = postRequest();
    const formDataSpy = vi.spyOn(request, "formData");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const res = await POST(request);

    expect(res.status).toBe(401);
    expect(formDataSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("lets an authenticated request past the gate (not 401)", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "00000000-0000-0000-0000-000000000001" } },
      error: null,
    });
    const formData = new FormData();
    formData.append("audio", new Blob(["audio"], { type: "audio/webm" }));
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ text: "cat" }), { status: 200 }),
    );

    const res = await POST(postRequest(formData));

    // Past the gate it may fail later if OPENAI_API_KEY is absent, but crucially
    // it is NOT a 401: auth succeeded.
    expect(res.status).not.toBe(401);
  });
});
