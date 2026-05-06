import { createClient } from "@/lib/supabase/server";
import JoinForm from "./JoinForm";
import type { InviteToken } from "@/types/database";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("invite_tokens")
    .select("*")
    .eq("token", token)
    .eq("used", false)
    .single();

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mb-4 text-5xl">😕</div>
          <p className="text-gray-600">
            This invite link is invalid or has already been used.
          </p>
        </div>
      </div>
    );
  }

  const invite = data as InviteToken;

  return (
    <JoinForm
      token={token}
      defaultChildName={invite.student_name ?? ""}
      defaultChildAge={invite.student_age?.toString() ?? ""}
    />
  );
}
