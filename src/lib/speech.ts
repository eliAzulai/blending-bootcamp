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

/**
 * Map letter phonemes to how they should be spoken aloud.
 * TTS reads "c" as "see" — we want "kuh" (the phonetic sound).
 */
const PHONEME_PRONUNCIATION: Record<string, string> = {
  // Consonants — short phonetic sounds
  b: "buh",
  c: "kuh",
  d: "duh",
  f: "fff",
  g: "guh",
  h: "huh",
  j: "juh",
  k: "kuh",
  l: "lll",
  m: "mmm",
  n: "nnn",
  p: "puh",
  q: "kwuh",
  r: "rrr",
  s: "sss",
  t: "tuh",
  v: "vvv",
  w: "wuh",
  x: "ks",
  y: "yuh",
  z: "zzz",
  // Short vowels
  a: "aah",
  e: "eh",
  i: "ih",
  o: "oh",
  u: "uh",
  // Digraphs
  sh: "shh",
  ch: "chuh",
  th: "thh",
  ck: "kuh",
  ng: "nng",
  // Blends — say them blended
  st: "sst",
  cl: "cluh",
  fr: "frr",
  fl: "fluh",
  sp: "ssp",
  mp: "mmp",
  nd: "nnd",
  lk: "lk",
};

export function speakPhoneme(phoneme: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const spoken = PHONEME_PRONUNCIATION[phoneme.toLowerCase()] ?? phoneme;
    const utterance = new SpeechSynthesisUtterance(spoken);
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
