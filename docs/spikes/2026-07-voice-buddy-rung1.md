# Voice Buddy Rung-1 Spike — Run Protocol

**Question:** Can Whisper-class ASR reliably detect a child's decoding errors
while reading aloud? This gates the entire AI-tutor ladder (voice buddy →
avatar tutor → avatar-assisted group lessons). Plan:
`docs/superpowers/plans/2026-07-03-voice-buddy-rung1-spike.md`.

## Sample-size target

- At least **3 children** from Ilana's students (mix of reading levels).
- At least **2 sessions each** on different days.
- At least **300 graded words** total before reading the metrics.

## Prerequisites

- `OPENAI_API_KEY` with credits in `.env.local` (`npm run pull-secrets`).
  **Known issue:** the Infisical `blending-bootcamp` key has been out of
  credits since 2026-04-23. Without topping up or rotating it, every
  transcript comes back empty and every word grades as "skipped" — the
  spike is meaningless. Verify this first (the mandatory dry-run below will
  surface it immediately).
- Signed in as the teacher account on the session device —
  `/api/transcribe` is auth-gated and the session redirects to `/login` if
  signed out.
- iPad with a working microphone; test the mic with an adult first.
- Parent consent: sessions send the child's voice to OpenAI Whisper via
  the existing `/api/transcribe` path — the same consent captured at join
  time covers this. OpenAI API inputs are not used for training and our
  route does not persist audio. A parent or Ilana is present for every
  session.

## Mandatory adult dry-run (before ANY child session)

Automated verification could not exercise the mic/TTS/Whisper loop
(headless environment, API key out of credits at build time). An adult
must complete one full session end-to-end on the actual device first:

1. Open `/spike/buddy`, enter your own name, pick a passage, tap **Start
   session**. Read the passage yourself — deliberately misread one word
   and skip another on a later sentence.
2. Confirm: the buddy speaks every line audibly and completely (the
   greeting is not cut off), the warm-up sound echoes and 1.8s pause feel
   reasonable, tapping **Start Reading** begins recording cleanly, tapping
   **Done Reading** stops it, and "Great reading!" plays only after your
   recording has stopped (never overlapping it).
3. At the "All done!" gate screen, tap **Grown-up review**. Replay each
   clip, confirm your deliberate misread/skip show as orange/red chips.
   Enter initials, tap **Download session JSON**, move the file into
   `spike-data/` (create the folder if it doesn't exist — it's gitignored).
4. Run `npx tsx scripts/buddy-metrics.ts spike-data` and confirm your
   deliberate misread/skip appear as adult-marked errors in the printed
   totals.
5. Delete the dry-run file from `spike-data/` before real data collection.

If anything fails here — silent buddy, mic error, missing download, a CLI
error rejecting the JSON — fix it before involving a child.

## Running a session (10 min per child)

1. Adult opens `/spike/buddy`, enters the child's first name (spoken only
   via TTS, never exported), picks a passage at the child's level — or
   pastes a harder custom passage for grade-3-6 students in the "Or paste
   a custom passage" box (this overrides the picker). Custom passages:
   prefer text without numerals (Whisper often writes "3" for "three" —
   this shows up as a visible misread in review, which is fine, but adds
   noise) and avoid sentences that **end** in an abbreviation like "Main
   St." — the sentence splitter deliberately merges it with the next
   sentence rather than produce a nonsense fragment, which makes that
   pairing read as one long "sentence" to grade. Mid-sentence abbreviations
   ("Dr. Lee is nice.") are unaffected.
2. Hand the child the iPad. The buddy (Pip) runs the fixed routine:
   greeting → 3 sound echoes → sentence-by-sentence reading → praise. Each
   reading turn shows **Start Reading** then **Done Reading**; only the
   sentence text is ever shown on screen (buddy lines are audio-only). The
   adult **silently notes** any reading errors they hear, but does not
   correct or interrupt (we are measuring the machine, not teaching).
3. At the "All done!" gate ("Hand the iPad to a grown-up"), the adult taps
   **Grown-up review** and replays each clip. Every word chip is
   pre-seeded with the machine's verdict — green (machine heard it read
   correctly), orange (machine heard a different word, shown as
   `word → heard`), red (machine heard nothing for it). **Tap a chip only
   when the machine got it wrong**: tap a green chip if the child actually
   misread/skipped that word; tap an orange or red chip if the child
   actually read it correctly. A blue ring means the word is *currently*
   marked as read-correctly, regardless of the chip's color.
4. Enter the child's initials (max 3 characters — never a full name), tap
   **Download session JSON**, and move the file into `spike-data/` in the
   repo (gitignored — never commit child data). **Do this before closing
   the tab.** Nothing is stored server-side; a refresh loses the whole
   session silently.

## Reading the result

Run: `npx tsx scripts/buddy-metrics.ts spike-data`

The CLI validates every JSON in the folder loudly — a malformed or
hand-edited file (missing field, bad verdict value, not valid JSON) stops
the run with a specific error naming the file and field, rather than
silently skewing the metrics. Fix or remove the bad file and re-run.

The output includes a per-file word/error breakdown, warnings for
duplicate or zero-word exports, and ends with an explicit verdict line —
`RESULT: GREEN|YELLOW|RED|INSUFFICIENT` — naming the gate that fired.
INSUFFICIENT means there are not yet enough adult-marked errors or graded
words to evaluate the gates.

| Gate | Condition | Meaning |
|---|---|---|
| **GREEN** | detection ≥ 70% AND false alarms ≤ 10% | ASR is good enough for gentle in-session correction. Green-light rung 1.5: buddy reacts to errors ("let's try that word again") + start rung-2 (conversational voice) planning. |
| **YELLOW** | detection < 70% AND false alarms ≤ 10% | ASR misses too many errors to correct live, but what it flags is trustworthy. Buddy stays praise-only for the child; flagged words go to the teacher as "practice words". Re-test after trying Whisper alternatives / prompt hints. |
| **RED** | false alarms > 10% | ASR wrongly flags correct reading too often — any in-session correction would punish good reading. R7 stands. Buddy remains routine + encouragement only. Investigate child-tuned ASR before revisiting. |

## Privacy

- Audio never leaves the browser except the existing transcribe path
  (OpenAI API — not used for training, not persisted by our route).
- Exports contain initials, words, and verdicts only. No audio is ever
  written to the JSON.
- `spike-data/` is gitignored — session exports are child data and must
  never be committed.
- No Supabase writes: spike sessions do not appear in `practice_sessions`
  or anywhere in practice history.
