"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isSpeechRecognitionSupported,
  requestMicPermission,
  isPermissionGranted as checkPermission,
  listenForSpeech,
  cancelListening,
} from "@/lib/speech-recognition";
import { matchPhoneme, matchWord, type MatchResult } from "@/lib/phoneme-matching";

export interface UseSpeechRecognitionReturn {
  /** Browser supports SpeechRecognition */
  isSupported: boolean;
  /** Mic permission has been granted */
  isPermissionGranted: boolean;
  /** Currently listening for speech */
  isListening: boolean;
  /** Request mic permission (call once at lesson start) */
  requestPermission: () => Promise<boolean>;
  /** Listen for a phoneme — returns match result */
  listenForPhoneme: (phoneme: string, attempt: number) => Promise<MatchResult>;
  /** Listen for a word — returns match result */
  listenForWord: (word: string, attempt: number) => Promise<MatchResult>;
  /** Cancel in-progress listening */
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
    async (phoneme: string, attempt: number): Promise<MatchResult> => {
      if (!mountedRef.current) {
        return { matched: false, confidence: "low", bestTranscript: "" };
      }

      setIsListening(true);
      try {
        const result = await listenForSpeech({ timeoutMs: 4000 });
        if (!mountedRef.current) {
          return { matched: false, confidence: "low", bestTranscript: "" };
        }
        // On second attempt, be lenient (accept any sound)
        return matchPhoneme(phoneme, result.transcripts, attempt >= 1);
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
        const result = await listenForSpeech({ timeoutMs: 5000 });
        if (!mountedRef.current) {
          return { matched: false, confidence: "low", bestTranscript: "" };
        }
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

  return {
    isSupported,
    isPermissionGranted,
    isListening,
    requestPermission,
    listenForPhoneme,
    listenForWord,
    cancel,
  };
}
