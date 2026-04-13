"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { InviteToken } from "@/types/database";

export default function JoinPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const [invite, setInvite] = useState<InviteToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadInvite() {
      const supabase = createClient();
      const { data } = await supabase
        .from("invite_tokens")
        .select("*")
        .eq("token", token)
        .eq("used", false)
        .single();

      if (!data) {
        setError("This invite link is invalid or has already been used.");
        setLoading(false);
        return;
      }

      setInvite(data as InviteToken);
      if (data.student_name) setChildName(data.student_name);
      if (data.student_age) setChildAge(String(data.student_age));
      setLoading(false);
    }
    loadInvite();
  }, [token]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!invite) return;
    setSubmitting(true);
    setError("");

    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError(authError?.message ?? "Signup failed");
      setSubmitting(false);
      return;
    }

    const parentId = authData.user.id;

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: parentId, role: "parent", name: parentName });

    if (profileError) {
      setError(profileError.message);
      setSubmitting(false);
      return;
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .insert({
        parent_id: parentId,
        teacher_id: invite.teacher_id,
        name: childName,
        age: parseInt(childAge),
      })
      .select("id")
      .single();

    if (studentError || !student) {
      setError(studentError?.message ?? "Could not create student");
      setSubmitting(false);
      return;
    }

    await supabase
      .from("invite_tokens")
      .update({ used: true, used_by: parentId })
      .eq("id", invite.id);

    router.push(`/join/${token}/pet-select?student=${student.id}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mb-4 text-5xl">😕</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-3xl font-extrabold text-purple-700">
          Join WordPets
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Your child&apos;s teacher invited you!
        </p>

        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Your name (parent)"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            required
            className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none focus:border-purple-400"
          />
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none focus:border-purple-400"
          />
          <input
            type="password"
            placeholder="Create password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none focus:border-purple-400"
          />

          <div className="border-t border-gray-100 pt-4">
            <p className="mb-2 text-sm font-medium text-gray-700">
              About your child
            </p>
          </div>

          <input
            type="text"
            placeholder="Child's name"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            required
            className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none focus:border-purple-400"
          />
          <input
            type="number"
            placeholder="Child's age"
            value={childAge}
            onChange={(e) => setChildAge(e.target.value)}
            required
            min="3"
            max="18"
            className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none focus:border-purple-400"
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-purple-600 px-6 py-3 text-lg font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? "Setting up..." : "Join & Pick a Pet!"}
          </button>
        </form>
      </div>
    </div>
  );
}
