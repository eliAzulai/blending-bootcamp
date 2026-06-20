"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface JoinResult {
  error?: string;
}

export async function joinAction(
  token: string,
  formData: FormData,
): Promise<JoinResult> {
  const parentName = String(formData.get("parentName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const childName = String(formData.get("childName") ?? "").trim();
  const childAgeRaw = String(formData.get("childAge") ?? "").trim();

  if (!parentName || !email || !password || !childName || !childAgeRaw) {
    return { error: "All fields are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  const childAge = parseInt(childAgeRaw, 10);
  if (isNaN(childAge) || childAge < 3 || childAge > 18) {
    return { error: "Child age must be between 3 and 18." };
  }

  const supabase = await createClient();

  // Re-validate the invite on the server to prevent tampering. Token-scoped
  // SECURITY DEFINER RPC; no blanket anon read of invite_tokens.
  const { data: invite } = await supabase
    .rpc("get_invite_by_token", { p_token: token })
    .maybeSingle();

  if (!invite) {
    return { error: "This invite link is invalid or has already been used." };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Signup failed." };
  }

  const parentId = authData.user.id;

  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ id: parentId, role: "parent", name: parentName });

  if (profileError) {
    return { error: profileError.message };
  }

  const { data: claimed, error: claimError } = await supabase.rpc(
    "claim_invite_token",
    { p_token: token, p_used_by: parentId },
  );

  if (claimError || !claimed) {
    return {
      error:
        claimError?.message ??
        "This invite link was already used. Please ask your teacher for a new link.",
    };
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      parent_id: parentId,
      teacher_id: (invite as { teacher_id: string }).teacher_id,
      name: childName,
      age: childAge,
    })
    .select("id")
    .single();

  if (studentError || !student) {
    return { error: studentError?.message ?? "Could not create student." };
  }

  redirect(`/join/${token}/pet-select?student=${(student as { id: string }).id}`);
}
