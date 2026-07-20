"use client";

import { useRef, useState } from "react";
import PetDisplay from "@/components/PetDisplay";
import {
  CARE_COST,
  CARE_EMOJI,
  CARE_LABEL,
  CARE_VERBS,
  SATIATION_LIMIT,
  type CareVerb,
} from "@/lib/pet";
import {
  CARE_REACTION_LINE,
  MEMORY_LINE,
  PET_TAP_LINES,
  SATIATED_LINE,
  WANT_FULFILLED_LINE,
  WANT_LINE,
  fillPetName,
} from "@/lib/child-copy";
import type { CareResult } from "@/app/student/actions";
import type { PetMood, PetType } from "@/types/database";

/**
 * Pet home card — pet + coins + care verbs. The reward loop's spend side.
 *
 * Rule compliance (see 2026-07-13 reward-system spec):
 * - R26 (amended): reactions are user-triggered one-shots that REPLACE the
 *   idle breathe (PetDisplay class swap) and are debounced via the `reacting`
 *   gate — taps during a reaction are ignored, so spam cannot chain motion.
 * - R27: no store UI. Unaffordable verbs are hidden (never greyed-out with a
 *   visible price), satiation replaces buttons with a contented line, coin
 *   balance updates by plain value swap (no animation).
 * - R25: failures are silent no-ops; every line comes from the audited
 *   child-copy manifest.
 */

const REACTION_MS = 1000;

interface Reaction {
  line: string;
  overlay: string | null;
}

interface PetHomeProps {
  petType: PetType;
  petName: string;
  mood: PetMood;
  coins: number;
  practicedToday: boolean;
  caresToday: number;
  /** False when Supabase is down/unmigrated — care UI is simply absent. */
  careAvailable: boolean;
  /** Today's deterministic want; null when it should not be shown. */
  dailyWant: CareVerb | null;
  /** Verb of the most recent care event from a previous day (memory line). */
  memoryVerb: CareVerb | null;
  /**
   * Bloom-on-return surprise (research spec §3), computed server-side,
   * already pet-name-filled. null once the child has practiced today.
   */
  surpriseLine: string | null;
  onCare: (verb: CareVerb) => Promise<CareResult>;
}

export default function PetHome({
  petType,
  petName,
  mood: initialMood,
  coins: initialCoins,
  practicedToday,
  caresToday: initialCares,
  careAvailable,
  dailyWant,
  memoryVerb,
  surpriseLine,
  onCare,
}: PetHomeProps) {
  const [coins, setCoins] = useState(initialCoins);
  const [caresToday, setCaresToday] = useState(initialCares);
  const [mood, setMood] = useState<PetMood>(initialMood);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [wantFulfilled, setWantFulfilled] = useState(false);
  const [inFlight, setInFlight] = useState(false);
  const tapCountRef = useRef(0);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playReaction = (next: Reaction) => {
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    setReaction(next);
    reactionTimer.current = setTimeout(() => setReaction(null), REACTION_MS);
  };

  // Free aliveness: poking the pet always earns a wiggle + a line. Same
  // debounce gate as care taps — no coin cost, no persistence.
  const handlePetTap = () => {
    if (reaction || inFlight) return;
    const line = PET_TAP_LINES[tapCountRef.current % PET_TAP_LINES.length];
    tapCountRef.current += 1;
    playReaction({ line: fillPetName(line, petName), overlay: null });
  };

  const handleCare = async (verb: CareVerb) => {
    if (reaction || inFlight) return;
    setInFlight(true);
    try {
      const result = await onCare(verb);
      if (result.ok) {
        setCoins(result.coins);
        setCaresToday((c) => c + 1);
        // Local mirror of derivePetMood: care upgrades mood only on top of
        // practice (excited requires practicedToday && caredToday).
        if (practicedToday) setMood("excited");
        const fulfilled = dailyWant === verb && !wantFulfilled;
        if (fulfilled) setWantFulfilled(true);
        playReaction({
          line: fillPetName(
            fulfilled ? WANT_FULFILLED_LINE : CARE_REACTION_LINE[verb],
            petName,
          ),
          overlay: fulfilled ? "💛" : CARE_EMOJI[verb],
        });
      }
      // {ok:false}: silent no-op — never an error a child can read.
    } finally {
      setInFlight(false);
    }
  };

  const satiated = caresToday >= SATIATION_LIMIT;
  const affordableVerbs = CARE_VERBS.filter((v) => coins >= CARE_COST[v]);
  const showCareButtons = careAvailable && !satiated && affordableVerbs.length > 0;
  const showWant =
    careAvailable && practicedToday && !satiated && !wantFulfilled && dailyWant !== null;

  return (
    <div className="w-full max-w-sm">
      {/* Coins — plain number, value swap only (R26/R27). */}
      <div className="flex items-center justify-end pb-3">
        <span className="text-sm font-bold text-amber-700">🪙 {coins}</span>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={handlePetTap}
          className="w-full cursor-pointer text-left"
          aria-label={`Say hi to ${petName}`}
        >
          <PetDisplay
            petType={petType}
            petName={petName}
            mood={mood}
            size="lg"
            bouncing={reaction !== null}
          />
        </button>
        {reaction?.overlay && (
          <span
            aria-hidden="true"
            className="care-overlay absolute right-8 top-8 text-4xl"
          >
            {reaction.overlay}
          </span>
        )}
      </div>

      {/* Fixed-height line slot: reaction > surprise > want > satiated > memory. */}
      <p className="mt-3 min-h-6 text-center text-base font-semibold text-purple-700">
        {reaction
          ? reaction.line
          : !practicedToday && surpriseLine
            ? surpriseLine
            : showWant && dailyWant
              ? fillPetName(WANT_LINE[dailyWant], petName)
              : careAvailable && satiated
                ? fillPetName(SATIATED_LINE, petName)
                : memoryVerb
                  ? fillPetName(MEMORY_LINE, petName).replace(
                      "{emoji}",
                      CARE_EMOJI[memoryVerb],
                    )
                  : ""}
      </p>

      {showCareButtons && (
        <div className="mt-4 flex justify-center gap-2">
          {affordableVerbs.map((verb) => (
            <button
              key={verb}
              type="button"
              onClick={() => handleCare(verb)}
              disabled={inFlight}
              className="flex min-h-12 min-w-12 flex-col items-center rounded-2xl border-2 border-amber-200 bg-white px-4 py-2 shadow-sm transition-transform hover:bg-amber-50 active:scale-95 disabled:opacity-60"
            >
              <span className="text-2xl" aria-hidden="true">
                {CARE_EMOJI[verb]}
              </span>
              <span className="text-xs font-bold text-gray-700">
                {CARE_LABEL[verb]}
              </span>
              <span className="text-xs font-semibold text-amber-700">
                🪙 {CARE_COST[verb]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
