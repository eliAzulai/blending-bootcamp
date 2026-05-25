import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// Support both the legacy ANON_KEY name and Supabase's newer PUBLISHABLE_KEY name
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";
const isConfigured = supabaseUrl.startsWith("http");

let _client: SupabaseClient | null = null;

export function supabaseIsConfigured() {
  return isConfigured;
}

export function createClient(): SupabaseClient {
  if (!isConfigured) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL in .env.local");
  }
  if (!_client) {
    _client = createBrowserClient(supabaseUrl, supabaseKey, {
      auth: {
        // Disable the navigator.locks coordinator. The default `processLock`
        // can deadlock when a previous tab acquired the lock and never
        // released it (e.g. crashed mid-auth-call). Symptom: getUser /
        // signUp / etc. hang forever even after a hard reload. We're a
        // single-tab PWA — cross-tab auth coordination isn't needed.
        lock: function noopLock<R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
          return fn();
        },
      },
    });
  }
  return _client;
}
