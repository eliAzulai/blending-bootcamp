"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function TeacherSignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({ id: authData.user.id, role: "teacher", name });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      // Hard navigation so AuthProvider remounts with fresh session + profile.
      // router.push hits stale AuthProvider state and TeacherLayout bounces to /login.
      window.location.href = "/teacher";
      return;
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-3xl font-extrabold text-purple-700">
          Teacher Signup
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Create your WordPets teacher account
        </p>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none transition-colors focus:border-purple-400"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none transition-colors focus:border-purple-400"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none transition-colors focus:border-purple-400"
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-purple-600 px-6 py-3 text-lg font-bold text-white shadow-md transition-all hover:bg-purple-700 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Teacher Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-purple-600 hover:text-purple-700">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
