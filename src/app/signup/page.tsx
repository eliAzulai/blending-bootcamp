"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signupTeacherAction } from "./actions";

export default function TeacherSignupPage() {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await signupTeacherAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
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

        <form action={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="name"
            placeholder="Your name"
            required
            className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none transition-colors focus:border-purple-400"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none transition-colors focus:border-purple-400"
          />
          <input
            type="password"
            name="password"
            placeholder="Password (min 6 characters)"
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
            disabled={pending}
            className="rounded-xl bg-purple-600 px-6 py-3 text-lg font-bold text-white shadow-md transition-all hover:bg-purple-700 active:scale-95 disabled:opacity-50"
          >
            {pending ? "Creating account..." : "Create Teacher Account"}
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
