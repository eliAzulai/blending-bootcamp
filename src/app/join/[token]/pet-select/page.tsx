import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PetSelectForm from "./PetSelectForm";

export default async function PetSelectPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const params = await searchParams;
  const studentId = params.student;

  if (!studentId) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <PetSelectForm studentId={studentId} />;
}
