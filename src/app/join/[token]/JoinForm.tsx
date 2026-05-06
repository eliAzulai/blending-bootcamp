"use client";

import { useState, useTransition } from "react";
import { joinAction } from "./actions";

interface JoinFormProps {
  token: string;
  defaultChildName: string;
  defaultChildAge: string;
}

export default function JoinForm({
  token,
  defaultChildName,
  defaultChildAge,
}: JoinFormProps) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await joinAction(token, formData);
      if (result?.error) setError(result.error);
    });
  }

  const inputClass =
    "rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none focus:border-purple-400";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-3xl font-extrabold text-purple-700">
          Join WordPets
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Your child&apos;s teacher invited you!
        </p>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="parentName"
            placeholder="Your name (parent)"
            required
            className={inputClass}
          />
          <input
            type="email"
            name="email"
            placeholder="Your email"
            required
            className={inputClass}
          />
          <input
            type="password"
            name="password"
            placeholder="Create password (min 6 chars)"
            required
            minLength={6}
            className={inputClass}
          />

          <div className="border-t border-gray-100 pt-4">
            <p className="mb-2 text-sm font-medium text-gray-700">
              About your child
            </p>
          </div>

          <input
            type="text"
            name="childName"
            placeholder="Child's name"
            defaultValue={defaultChildName}
            required
            className={inputClass}
          />
          <input
            type="number"
            name="childAge"
            placeholder="Child's age"
            defaultValue={defaultChildAge}
            required
            min="3"
            max="18"
            className={inputClass}
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-purple-600 px-6 py-3 text-lg font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-50"
          >
            {pending ? "Setting up..." : "Join & Pick a Pet!"}
          </button>
        </form>
      </div>
    </div>
  );
}
