import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing page. Routes signed-in users to their role-appropriate home,
 * shows a simple call-to-action for everyone else.
 *
 * This page is intentionally minimal — the app's primary entry points
 * are invite links sent by teachers, not organic landing-page traffic.
 */
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role === "teacher") redirect("/teacher");
    if (profile?.role === "parent") redirect("/student");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <Image
          src="/wordpets/logo.png"
          alt="WordPets"
          width={140}
          height={140}
          priority
        />
        <h1 className="mt-6 text-4xl font-extrabold text-purple-700">
          WordPets
        </h1>
        <p className="mt-3 text-base text-gray-600">
          Daily reading practice your teacher assigns.
          <br />
          Earn coins. Feed your pet.
        </p>

        <div className="mt-10 flex w-full flex-col gap-3">
          <Link
            href="/login"
            className="min-h-12 rounded-2xl bg-purple-600 px-6 py-4 text-lg font-extrabold text-white shadow-md hover:bg-purple-700 active:scale-95 transition-transform"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="min-h-12 rounded-2xl border-2 border-purple-300 bg-white px-6 py-4 text-lg font-bold text-purple-700 hover:bg-purple-50 active:scale-95 transition-transform"
          >
            Teacher Sign Up
          </Link>
        </div>

        <p className="mt-8 text-xs text-gray-400">
          Got an invite link from your teacher? Open it on this device.
        </p>
      </div>
    </main>
  );
}
