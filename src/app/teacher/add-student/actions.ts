"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export interface InviteResult {
  link?: string;
  error?: string;
}

export async function generateInviteAction(
  formData: FormData,
): Promise<InviteResult> {
  const studentName = String(formData.get("studentName") ?? "").trim();
  const studentAgeRaw = String(formData.get("studentAge") ?? "").trim();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const studentAge = studentAgeRaw ? parseInt(studentAgeRaw, 10) : null;
  if (studentAgeRaw && (isNaN(studentAge!) || studentAge! < 3 || studentAge! > 18)) {
    return { error: "Age must be between 3 and 18." };
  }

  const { data, error: insertError } = await supabase
    .from("invite_tokens")
    .insert({
      teacher_id: user.id,
      student_name: studentName || null,
      student_age: studentAge,
    })
    .select("token")
    .single();

  if (insertError || !data) {
    return { error: insertError?.message ?? "Failed to generate invite." };
  }

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const link = `${proto}://${host}/join/${(data as { token: string }).token}`;

  return { link };
}
