// src/lib/supabase/admin.ts
// Server-side profile helpers
import { createClient } from "./client";
import type { Profile, Role } from "@/types/database";

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data as Profile | null;
}

export async function createProfile(
  role: Role,
  name: string,
): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: user.id, role, name })
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}
