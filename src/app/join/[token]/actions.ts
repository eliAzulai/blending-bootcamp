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

  // Re-validate the invite on the server to prevent tampering
  const { data: invite } = await supabase
    .from("invite_tokens")
    .select("*")
    .eq("token", token)
    .eq("used", false)
    .single();

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

  await supabase
    .from("invite_tokens")
    .update({ used: true, used_by: parentId })
    .eq("id", (invite as { id: string }).id);

  redirect(`/join/${token}/pet-select?student=${(student as { id: string }).id}`);
}
