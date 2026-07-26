"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CARE_VERBS, type CareVerb } from "@/lib/pet";

export type CareResult = { ok: true; coins: number } | { ok: false };

/**
 * Spend coins on a care verb. All economy rules (parent check, price table,
 * satiation cap, atomic conditional decrement) live in the care_for_pet
 * Postgres RPC — this action just authenticates and relays.
 *
 * Contract: NEVER throws. Any failure (Supabase paused, migration not yet
 * applied so the RPC is missing, can't afford, satiated, bad verb) returns
 * {ok:false} and the UI treats it as a silent no-op — a child must never see
 * an error state (R25 spirit).
 */
export async function careForPet(verb: CareVerb): Promise<CareResult> {
  try {
    if (!CARE_VERBS.includes(verb)) return { ok: false };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false };

    // Resolve the student server-side from the signed-in parent — the client
    // never supplies a student id (the RPC re-checks parentage regardless).
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("parent_id", user.id)
      .single();
    if (!student) return { ok: false };

    const { data: newBalance, error } = await supabase.rpc("care_for_pet", {
      p_student_id: student.id,
      p_verb: verb,
    });
    if (error || newBalance === null || typeof newBalance !== "number") {
      return { ok: false };
    }

    revalidatePath("/student");
    return { ok: true, coins: newBalance };
  } catch {
    return { ok: false };
  }
}
