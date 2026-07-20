import { notFound } from "next/navigation";
import DevPetHarness from "./DevPetHarness";

/**
 * Dev-only harness for the pet reward system — verifies PetHome states and
 * Letter Hunt with fixture data, no Supabase needed (the live project is
 * paused; see 2026-07-13 spec, failure-mode contract). 404s in production.
 */
export default function DevPetPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DevPetHarness />;
}
