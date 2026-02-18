"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  isSpeechRecognitionSupported,
  requestMicPermission,
  isPermissionGranted as checkPermission,
  listenForSpeech,
  cancelListening,
} from "@/lib/speech-recognition";
import { matchPhoneme, matchWord, type MatchResult } from "@/lib/phoneme-matching";

export interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isPermissionGranted: boolean;
  isListening: boolean;
  requestPermission: () => Promise<boolean>;
  listenForPhoneme: (phoneme: string, attempt: number) => Promise<MatchResult>;
  listenForWord: (word: string, attempt: number) => Promise<MatchResult>;
  cancel: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isSupported] = useState(() => isSpeechRecognitionSupported());
  const [isPermissionGranted, setPermissionGranted] = useState(() =>
    checkPermission(),
  );
  const [isListening, setIsListening] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelListening();
    };
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await requestMicPermission();
    if (mountedRef.current) setPermissionGranted(granted);
    return granted;
  }, []);

  const listenForPhoneme = useCallback(
    async (phoneme: string, _attempt: number): Promise<MatchResult> => {
      if (!mountedRef.current) {
        return { matched: false, confidence: "low", bestTranscript: "" };
      }
      setIsListening(true);
      try {
        // Give the child 2 seconds to say the sound.
        // Individual phonemes are too short for the Web Speech API to
        // reliably detect, so we treat the act of listening as practice.
        const result = await listenForSpeech({ timeoutMs: 2000 });
        if (!mountedRef.current) {
          return { matched: false, confidence: "low", bestTranscript: "" };
        }
        const heard = result.transcripts.length > 0;
        console.log("[WordPets] phoneme:", phoneme, "heard:", result.transcripts);
        // Always pass — the child practiced saying the sound
        return {
          matched: true,
          confidence: heard ? "high" : "medium",
          bestTranscript: result.transcripts[0] ?? "",
        };
      } finally {
        if (mountedRef.current) setIsListening(false);
      }
    },
    [],
  );

  const listenForWord = useCallback(
    async (word: string, attempt: number): Promise<MatchResult> => {
      if (!mountedRef.current) {
        return { matched: false, confidence: "low", bestTranscript: "" };
      }
      setIsListening(true);
      try {
        const result = await listenForSpeech({ timeoutMs: 3000 });
        if (!mountedRef.current) {
          return { matched: false, confidence: "low", bestTranscript: "" };
        }
        console.log("[WordPets] word:", word, "heard:", result.transcripts, "attempt:", attempt);
        return matchWord(word, result.transcripts, attempt >= 1);
      } finally {
        if (mountedRef.current) setIsListening(false);
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    cancelListening();
    if (mountedRef.current) setIsListening(false);
  }, []);

  // Memoize the return object so consumers get a stable reference.
  return useMemo(
    () => ({
      isSupported,
      isPermissionGranted,
      isListening,
      requestPermission,
      listenForPhoneme,
      listenForWord,
      cancel,
    }),
    [isSupported, isPermissionGranted, isListening, requestPermission, listenForPhoneme, listenForWord, cancel],
  );
}
