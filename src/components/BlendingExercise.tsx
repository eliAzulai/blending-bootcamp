"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { speakPhoneme, speakWord, cancelSpeech } from "@/lib/speech";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import PhonemeCard, { type PhonemeState } from "./PhonemeCard";

interface BlendingExerciseProps {
  word: string;
  phonemes: string[];
  onComplete: () => void;
  speechEnabled?: boolean;
}

/* ---------- Encouragement ---------- */

const CORRECT_MSGS = ["Great job!", "You got it!", "Amazing!", "Super sound!", "Wow!"];
const WORD_CORRECT_MSGS = ["Fantastic!", "You said it!", "Perfect!", "Brilliant!"];
const SKIP_MSGS = ["Good try! Moving on!", "You're doing great!"];

function pick(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ---------- Stage types ---------- */

type TapStage = "tapping" | "blending" | "reveal" | "done";
type SpeechStage =
  | "phoneme-play"
  | "phoneme-listen"
  | "phoneme-correct"
  | "phoneme-skip"
  | "blending"
  | "word-play"
  | "word-listen"
  | "word-correct"
  | "word-skip"
  | "done";

type Stage = TapStage | SpeechStage;

/* ---------- Component ---------- */

export default function BlendingExercise({
  word,
  phonemes,
  onComplete,
  speechEnabled = false,
}: BlendingExerciseProps) {
  const {
    isSupported: srSupported,
    isListening: srListening,
    listenForPhoneme: srListenPhoneme,
    listenForWord: srListenWord,
    cancel: srCancel,
  } = useSpeechRecognition();
  const useSpeech = speechEnabled && srSupported;

  const [states, setStates] = useState<PhonemeState[]>(
    () => phonemes.map(() => "idle") as PhonemeState[],
  );
  const [nextIndex, setNextIndex] = useState(0);
  const [stage, setStage] = useState<Stage>(useSpeech ? "phoneme-play" : "tapping");
  const [message, setMessage] = useState("");
  const [messageKey, setMessageKey] = useState(0); // force re-animate message

  const phonemeAttempts = useRef(0);
  const wordAttempts = useRef(0);
  const blendingRef = useRef(false);
  const mountedRef = useRef(true);

  function showMessage(text: string) {
    setMessage(text);
    setMessageKey((k) => k + 1);
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      srCancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset when word changes
  useEffect(() => {
    setStates(phonemes.map(() => "idle"));
    setNextIndex(0);
    setStage(useSpeech ? "phoneme-play" : "tapping");
    setMessage("");
    phonemeAttempts.current = 0;
    wordAttempts.current = 0;
    blendingRef.current = false;
  }, [word, phonemes, useSpeech]);

  /* =====================================================
   * SPEECH MODE
   * ===================================================== */

  // --- Phoneme play: TTS says the sound, then move to listen
  useEffect(() => {
    if (stage !== "phoneme-play") return;
    let cancelled = false;

    showMessage("Listen...");
    setStates((prev) => {
      const next = [...prev];
      next[nextIndex] = "active";
      return next;
    });

    (async () => {
      await speakPhoneme(phonemes[nextIndex]);
      if (cancelled || !mountedRef.current) return;
      await new Promise((r) => setTimeout(r, 200));
      if (cancelled || !mountedRef.current) return;
      setStage("phoneme-listen");
    })();

    return () => { cancelled = true; };
  }, [stage, nextIndex, phonemes]);

  // --- Phoneme listen
  useEffect(() => {
    if (stage !== "phoneme-listen") return;
    let cancelled = false;

    cancelSpeech();
    showMessage(`Say "${phonemes[nextIndex]}"`);
    setStates((prev) => {
      const next = [...prev];
      next[nextIndex] = "listening";
      return next;
    });

    (async () => {
      const result = await srListenPhoneme(
        phonemes[nextIndex],
        phonemeAttempts.current,
      );
      if (cancelled || !mountedRef.current) return;

      if (result.matched) {
        setStage("phoneme-correct");
      } else {
        phonemeAttempts.current += 1;
        if (phonemeAttempts.current >= 2) {
          setStage("phoneme-skip");
        } else {
          setStage("phoneme-listen");
        }
      }
    })();

    return () => {
      cancelled = true;
      srCancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, nextIndex, phonemes]);

  // --- Phoneme correct
  useEffect(() => {
    if (stage !== "phoneme-correct") return;
    let cancelled = false;

    showMessage(pick(CORRECT_MSGS));
    setStates((prev) => {
      const next = [...prev];
      next[nextIndex] = "correct";
      return next;
    });

    const timer = setTimeout(() => {
      if (cancelled || !mountedRef.current) return;
      advancePhoneme();
    }, 500);

    return () => { cancelled = true; clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // --- Phoneme skip
  useEffect(() => {
    if (stage !== "phoneme-skip") return;
    let cancelled = false;

    showMessage(pick(SKIP_MSGS));
    setStates((prev) => {
      const next = [...prev];
      next[nextIndex] = "active";
      return next;
    });

    const timer = setTimeout(() => {
      if (cancelled || !mountedRef.current) return;
      advancePhoneme();
    }, 400);

    return () => { cancelled = true; clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // --- Word play: TTS says the word, then move to listen
  useEffect(() => {
    if (stage !== "word-play") return;
    let cancelled = false;

    showMessage("Listen...");

    (async () => {
      await speakWord(word);
      if (cancelled || !mountedRef.current) return;
      await new Promise((r) => setTimeout(r, 200));
      if (cancelled || !mountedRef.current) return;
      setStage("word-listen");
    })();

    return () => { cancelled = true; };
  }, [stage, word]);

  // --- Word listen (auto-start)
  useEffect(() => {
    if (stage !== "word-listen") return;
    let cancelled = false;

    cancelSpeech();
    showMessage(`Say "${word}"`);

    (async () => {
      const result = await srListenWord(word, wordAttempts.current);
      if (cancelled || !mountedRef.current) return;

      if (result.matched) {
        setStage("word-correct");
      } else {
        wordAttempts.current += 1;
        if (wordAttempts.current >= 2) {
          setStage("word-skip");
        } else {
          setStage("word-listen");
        }
      }
    })();

    return () => {
      cancelled = true;
      srCancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, word]);

  // --- Word correct
  useEffect(() => {
    if (stage !== "word-correct") return;
    let cancelled = false;

    showMessage(pick(WORD_CORRECT_MSGS));

    const timer = setTimeout(() => {
      if (cancelled || !mountedRef.current) return;
      setStage("done");
      onComplete();
    }, 2500);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [stage, onComplete]);

  // --- Word skip
  useEffect(() => {
    if (stage !== "word-skip") return;
    let cancelled = false;

    showMessage(pick(SKIP_MSGS));

    const timer = setTimeout(() => {
      if (cancelled || !mountedRef.current) return;
      setStage("done");
      onComplete();
    }, 500);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [stage, onComplete]);

  /* ---------- Helpers ---------- */

  function advancePhoneme() {
    const next = nextIndex + 1;
    phonemeAttempts.current = 0;

    // Mark completed card
    setStates((prev) => {
      const updated = [...prev];
      updated[nextIndex] = "active";
      return updated;
    });

    if (next >= phonemes.length) {
      // All phonemes done → blend and go to word
      setTimeout(() => {
        if (!mountedRef.current) return;
        setStage("blending");
        setStates(phonemes.map(() => "blended"));
        showMessage("Now say the whole word!");

        setTimeout(() => {
          if (!mountedRef.current) return;
          setStage("word-play");
        }, 600);
      }, 200);
    } else {
      setNextIndex(next);
      setStage("phoneme-play");
    }
  }

  /* =====================================================
   * TAP MODE — fallback
   * ===================================================== */

  const handleTap = useCallback(
    async (index: number) => {
      if (stage !== "tapping") return;
      if (index !== nextIndex) return;

      setStates((prev) => {
        const next = [...prev];
        next[index] = "active";
        return next;
      });

      await speakPhoneme(phonemes[index]);

      const newNextIndex = index + 1;
      setNextIndex(newNextIndex);

      if (newNextIndex === phonemes.length && !blendingRef.current) {
        blendingRef.current = true;
        setTimeout(async () => {
          setStage("blending");
          setStates(phonemes.map(() => "blended"));

          await new Promise((r) => setTimeout(r, 600));
          await speakWord(word);

          setStage("reveal");
        }, 400);
      }
    },
    [stage, nextIndex, phonemes, word],
  );

  const handleConfirm = useCallback(() => {
    setStage("done");
    onComplete();
  }, [onComplete]);

  /* =====================================================
   * RENDER
   * ===================================================== */

  const isSpeechMode = useSpeech && stage !== "tapping" && stage !== "reveal";

  const instructionText = (() => {
    if (isSpeechMode) return message;
    if (stage === "tapping") return "Tap each sound!";
    if (stage === "blending") return "Slide them together...";
    if (stage === "reveal") return "Can you say it?";
    return "";
  })();

  const isRecording = isSpeechMode && (stage === "phoneme-listen" || stage === "word-listen") && srListening;

  // Card gap narrows when blending/word phase
  const isBlendedPhase =
    stage === "blending" ||
    stage === "word-play" ||
    stage === "word-listen" ||
    stage === "word-correct" ||
    stage === "word-skip" ||
    stage === "reveal";

  return (
    <div className="flex flex-col items-center gap-6 px-4">
      {/* Instruction text — animated on change */}
      <p
        key={messageKey}
        className="min-h-[2rem] text-center text-2xl font-semibold text-gray-700 animate-fade-up"
      >
        {instructionText}
      </p>

      {/* Listening indicator */}
      {isRecording && (
        <div className="flex items-center gap-2.5 animate-fade-up">
          <span className="inline-block h-3 w-3 rounded-full bg-teal-500 animate-listening-dot" />
          <span className="inline-block h-4 w-4 rounded-full bg-teal-400 animate-listening-dot" style={{ animationDelay: "0.15s" }} />
          <span className="inline-block h-3 w-3 rounded-full bg-teal-500 animate-listening-dot" style={{ animationDelay: "0.3s" }} />
        </div>
      )}

      {/* Phoneme cards */}
      <div
        className="flex items-center justify-center transition-all duration-500 ease-out"
        style={{ gap: isBlendedPhase ? 4 : 20 }}
      >
        {phonemes.map((p, i) => (
          <PhonemeCard
            key={`${word}-${i}`}
            text={p}
            state={states[i]}
            onTap={() => handleTap(i)}
            index={i}
            total={phonemes.length}
          />
        ))}
      </div>

      {/* Tap-order hint */}
      {stage === "tapping" && (
        <p className="text-lg text-gray-400 animate-fade-up">
          {nextIndex < phonemes.length ? (
            <>
              Tap{" "}
              <span className="font-bold text-purple-500">
                {phonemes[nextIndex]}
              </span>
            </>
          ) : (
            "Great!"
          )}
        </p>
      )}

      {/* Word phase */}
      {(stage === "word-play" || stage === "word-listen" || stage === "word-skip") && (
        <span className="text-6xl font-extrabold text-purple-700 animate-word-pop">
          {word}
        </span>
      )}

      {/* Word correct — big celebration */}
      {stage === "word-correct" && (
        <div className="flex flex-col items-center gap-4">
          {/* The word in green */}
          <span className="text-7xl font-extrabold text-emerald-500 animate-celebrate-word">
            {word}
          </span>
          {/* Encouragement text */}
          <span className="text-3xl font-extrabold text-purple-600 animate-celebrate-msg">
            {message}
          </span>
          {/* Stars bursting out */}
          <div className="relative h-16 w-64 flex items-center justify-center">
            {["🌟", "⭐", "✨", "🎉", "⭐", "🌟", "✨"].map((emoji, i) => (
              <span
                key={i}
                className="absolute text-2xl animate-celebrate-star"
                style={{
                  animationDelay: `${i * 0.12}s`,
                  left: `${10 + i * 13}%`,
                }}
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Reveal phase (tap mode) */}
      {stage === "reveal" && (
        <div className="flex flex-col items-center gap-5 animate-fade-up">
          <span className="text-6xl font-extrabold text-green-600 animate-word-pop">
            {word}
          </span>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-full bg-green-500 px-10 py-4 text-2xl font-bold text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            I can say it!
          </button>
        </div>
      )}
    </div>
  );
}
