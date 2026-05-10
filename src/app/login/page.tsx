"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-3xl font-extrabold text-purple-700">
          Welcome Back!
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Sign in to continue
        </p>

        <form action={handleSubmit} className="flex flex-col gap-4">
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
            placeholder="Password"
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
            {pending ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-purple-600 hover:text-purple-700"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
