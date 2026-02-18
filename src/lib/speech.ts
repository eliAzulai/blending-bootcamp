/**
 * Speech synthesis helpers using the Web Speech API.
 * Placeholder until real recorded audio is added.
 */

/** Cancel any in-progress TTS. Call before activating the mic. */
export function cancelSpeech(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function speakPhoneme(phoneme: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(phoneme);
    utterance.rate = 0.8;
    utterance.pitch = 1.2; // Slightly higher pitch for kid-friendliness
    utterance.volume = 1;
    utterance.lang = "en-US";

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

export function speakWord(word: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.7;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    utterance.lang = "en-US";

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

export function speakSentence(sentence: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.rate = 0.65;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    utterance.lang = "en-US";

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}
