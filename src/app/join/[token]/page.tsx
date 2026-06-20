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

  // Token-scoped lookup (SECURITY DEFINER RPC): anon can validate this exact
  // token without being able to enumerate invite_tokens. See migration
  // supabase/migrations/20260618_restrict_invite_tokens.sql.
  const { data } = await supabase
    .rpc("get_invite_by_token", { p_token: token })
    .maybeSingle();

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
