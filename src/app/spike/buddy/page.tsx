import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BuddySpike from "@/components/buddy/BuddySpike";

export default async function BuddySpikePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <BuddySpike />;
}
