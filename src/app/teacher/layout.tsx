"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user && role === "teacher") return;
    // user exists but role hasn't loaded yet → fetchProfile is in flight; wait it out
    if (user && role === null) return;
    // No user, or wrong role: defer redirect — onAuthStateChange + fetchProfile
    // can take >1s on slow networks (Sydney pooler RTT). Without this delay the
    // layout briefly sees user=null and bounces back to /login on fresh signup.
    const timer = setTimeout(() => router.push("/login"), 2500);
    return () => clearTimeout(timer);
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user || role !== "teacher") return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/teacher" className="text-xl font-bold text-purple-700">
            WordPets
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/teacher"
              className="text-sm font-medium text-gray-600 hover:text-purple-700"
            >
              Students
            </Link>
            <Link
              href="/teacher/add-student"
              className="text-sm font-medium text-gray-600 hover:text-purple-700"
            >
              + Add Student
            </Link>
            <button
              onClick={signOut}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
