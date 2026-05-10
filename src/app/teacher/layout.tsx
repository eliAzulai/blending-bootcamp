import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "teacher") {
    redirect("/login");
  }

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
            <SignOutButton />
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
