"use client";

import { useRef, useState } from "react";
import PetHome from "@/components/PetHome";
import LetterHuntGame from "@/components/activities/LetterHuntGame";
import { fixtureStudent } from "@/lib/fixtures/student";
import { pickDailyRounds } from "@/lib/fixtures/letter-hunt";
import { CARE_COST, pickDailyWant, pickFromList, type CareVerb } from "@/lib/pet";
import { SURPRISE_LINES, fillPetName } from "@/lib/child-copy";
import type { CareResult } from "@/app/student/actions";

/**
 * Exercises the reward surfaces with an in-memory care backend so every state
 * is reachable without Supabase: care spends, satiation, unaffordable-hidden,
 * surprise line, want fulfillment, Letter Hunt rounds.
 */
export default function DevPetHarness() {
  const [view, setView] = useState<"home" | "hunt">("home");
  const [scenario, setScenario] = useState(0);
  const coinsRef = useRef(42);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Local fake of the care_for_pet RPC: same rules, in memory.
  const fakeCare = async (verb: CareVerb): Promise<CareResult> => {
    const cost = CARE_COST[verb];
    if (coinsRef.current < cost) return { ok: false };
    coinsRef.current -= cost;
    return { ok: true, coins: coinsRef.current };
  };

  const scenarios = [
    {
      name: "Practiced today, coins, want showing",
      props: {
        mood: "happy" as const,
        coins: 42,
        practicedToday: true,
        caresToday: 0,
        careAvailable: true,
        surpriseLine: null,
      },
    },
    {
      name: "Not practiced yet (surprise line, no care spend focus)",
      props: {
        mood: "hungry" as const,
        coins: 12,
        practicedToday: false,
        caresToday: 0,
        careAvailable: true,
        surpriseLine: fillPetName(
          pickFromList(`${fixtureStudent.id}:${todayStr}:surprise`, SURPRISE_LINES),
          fixtureStudent.pet_name,
        ),
      },
    },
    {
      name: "Satiated (3 cares done)",
      props: {
        mood: "excited" as const,
        coins: 9,
        practicedToday: true,
        caresToday: 3,
        careAvailable: true,
        surpriseLine: null,
      },
    },
    {
      name: "Broke (2 coins — care row hidden)",
      props: {
        mood: "happy" as const,
        coins: 2,
        practicedToday: true,
        caresToday: 1,
        careAvailable: true,
        surpriseLine: null,
      },
    },
    {
      name: "Supabase down (careAvailable=false)",
      props: {
        mood: "sleepy" as const,
        coins: 42,
        practicedToday: false,
        caresToday: 0,
        careAvailable: false,
        surpriseLine: fillPetName(SURPRISE_LINES[1], fixtureStudent.pet_name),
      },
    },
  ];

  const current = scenarios[scenario];

  if (view === "hunt") {
    return (
      <div>
        <div className="bg-gray-900 px-4 py-2 text-xs text-white">
          DEV HARNESS — Letter Hunt (rounds for {todayStr}){" "}
          <button className="underline" onClick={() => setView("home")}>
            back to PetHome states
          </button>
        </div>
        <LetterHuntGame
          studentId={fixtureStudent.id}
          petType={fixtureStudent.pet_type}
          petName={fixtureStudent.pet_name}
          petMood="happy"
          sessionId={null}
          rounds={pickDailyRounds(todayStr)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="bg-gray-900 px-4 py-2 text-xs text-white">
        DEV HARNESS — scenario: {current.name}{" "}
        <button
          className="ml-2 underline"
          onClick={() => setScenario((scenario + 1) % scenarios.length)}
        >
          next scenario
        </button>{" "}
        <button className="ml-2 underline" onClick={() => setView("hunt")}>
          letter hunt
        </button>
      </div>
      <div className="flex flex-col items-center px-5 py-8">
        <PetHome
          key={`${scenario}-${view}`}
          petType={fixtureStudent.pet_type}
          petName={fixtureStudent.pet_name}
          dailyWant={pickDailyWant(fixtureStudent.id, todayStr)}
          memoryVerb={scenario === 0 ? "ball" : null}
          onCare={fakeCare}
          {...current.props}
        />
      </div>
    </div>
  );
}
