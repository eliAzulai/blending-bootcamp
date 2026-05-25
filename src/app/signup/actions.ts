"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface SignupResult {
  error?: string;
}

export async function signupTeacherAction(formData: FormData): Promise<SignupResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }
  if (!authData.user) {
    return { error: "Signup did not return a user. The email may already be registered." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ id: authData.user.id, role: "teacher", name });

  if (profileError) {
    return { error: profileError.message };
  }

  redirect("/teacher");
}
