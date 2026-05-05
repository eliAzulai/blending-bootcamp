"use client";

import { useTransition } from "react";
import { signOutAction } from "@/app/auth/actions";

export default function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => signOutAction())}
      disabled={pending}
      className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50"
    >
      {pending ? "Signing out..." : "Sign Out"}
    </button>
  );
}
