import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const isConfigured = supabaseUrl.startsWith("http") && supabaseKey.length > 0;

let _client: SupabaseClient | null = null;

export function supabaseIsConfigured() {
  return isConfigured;
}

function build(): SupabaseClient {
  if (!isConfigured) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local",
    );
  }
  return createBrowserClient(supabaseUrl, supabaseKey);
}

// Singleton — required for AuthProvider so `onAuthStateChange` hooks once
// and stays subscribed across renders. DO NOT use for one-off data queries:
// if a navigation aborts an in-flight auth.getUser() call here, the internal
// _useSession lock can hang and every subsequent .from(...) on this client
// blocks indefinitely.
export function createClient(): SupabaseClient {
  if (!_client) _client = build();
  return _client;
}

// Fresh client for data queries — isolates them from the singleton's
// long-lived auth refresh state. Uses the same cookie jar so RLS still works.
//
// `lock: (_, __, fn) => fn()` bypasses navigator.locks for this client.
// Without the bypass, every .from().select() goes through `_useSession` →
// `lockAcquire` (browser-wide key). When a previous page's auth.getUser()
// was aborted by navigation while holding that lock, every subsequent data
// query hangs forever. The data client doesn't refresh tokens (the singleton
// handles that), so it doesn't actually need the lock.
export function createDataClient(): SupabaseClient {
  if (!isConfigured) {
    throw new Error("Supabase is not configured.");
  }
  return createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      lock: async (_name, _acquireTimeout, fn) => fn(),
    },
  });
}
