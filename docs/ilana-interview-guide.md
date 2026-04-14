# Ilana Interview Guide — WordPets Product

**Purpose:** Get real input from the domain expert and primary teacher user before building Plan 2 (activities and daily practice flow).

**Format:** 30-45 min recorded conversation. Send questions 24-48 hours in advance so Ilana can think about them. Use `/voice` or `/transcribe` to record + transcribe.

**Context to share with Ilana first (just before the interview):**

> "I've been building a practice app called WordPets that would work alongside your teaching — your students do short daily practice between your sessions, earn rewards for a virtual pet, and you see who's practicing in a dashboard. Before I build the actual lesson content and activities, I want to make sure I'm building what you actually need. These questions are to help me understand your teaching, not to test you — there are no right answers. Feel free to say 'I don't know' or 'this question doesn't make sense.'"

---

## Part 1: Your Teaching (5-10 min)

*These questions ground everything. Don't rush them.*

1. **Walk me through a typical lesson with a 7-year-old student.** What do you do at the start? Middle? End? What activities work best with them?

2. **What do you currently assign between sessions?** Worksheets? Reading? Writing? How do you send it — WhatsApp, email, handouts?

3. **Of the students you assign homework to, roughly what percentage actually do it?** Your best guess.

4. **What's the #1 thing holding your students back right now?** Don't say "reading" — get specific. Is it confidence? Decoding? Memory? Attention? Parent support?

5. **Which of your current students are you most frustrated with?** What's the pattern you see?

6. **Which students are you most excited about?** What makes them work?

---

## Part 2: Content (5-10 min)

7. **Do you create teaching materials yourself, reuse from other sources, or both?** How do you decide?

8. **If you have a pile of PDFs/worksheets/passages you already use, would you want to upload those into an app, or would it feel like extra work?**

9. **For reading passages — do you pick from books, websites, write your own, or something else?** What level of English is appropriate for your 6-8 year olds?

10. **Do you use sight word lists (Dolch/Fry) or something else for vocabulary?**

11. **What kind of spelling practice actually works with your kids?**

---

## Part 3: The App Idea (10-15 min)

*This is the core. Slow down here.*

12. **What's your honest reaction to the idea of a companion app?** Excited, skeptical, curious, overwhelmed?

13. **If this app existed tomorrow, would you actually use it with your students, or does it feel like one more thing on your plate?**

14. **What would make a 7-year-old actually open the app every day?** In your experience, what hooks these kids?

15. **What would make YOU use it with students vs forget it exists?**

16. **Is there something you wish existed for your teaching that doesn't?** (Don't constrain to apps — could be anything.)

17. **What would you NOT want the app to do?** Things that would annoy you, embarrass your students, or create more work.

18. **The pet thing — is that appealing to your age group? Would kids name a pet, care about it, come back for it?** Or is that more of a younger-kid thing?

---

## Part 4: Logistics (5-10 min)

19. **How many of your current students would you pilot this with? Which ones and why?** Don't feel obligated — if the answer is zero, that's useful to know.

20. **How much time are you realistically willing to spend on this per week?** Be honest — 5 min? 30 min? An hour? More?

21. **What about the parents?** Are they going to be on board if we ask them to install an app for their kid? Or will we need to convince them?

22. **Do you charge parents separately for between-session work right now, or is it included in your teaching fee?**

23. **What's your biggest hesitation about this whole project?** What could go wrong?

---

## Part 5: Speech Recognition Test (5 min — optional but valuable)

*If you can play Ilana a sample of Whisper transcribing a 7-year-old reading:*

24. **Listen to this — a kid reading a passage, and here's what the AI transcribed.** Would you trust this to tell a kid "correct" or "try again"?

25. **If the AI transcription is imperfect, would you rather have: (a) AI grades strictly (kid sees pass/fail), (b) AI grades leniently (always says "great job"), or (c) AI just records the attempt and you review it when you have time?**

---

## Part 6: Ilana's Questions (5-10 min)

26. **What questions do YOU have for me about this project?**

27. **What should I be asking that I'm not asking?**

28. **Is there anyone else we should talk to before building this?** Other teachers, parents, kids?

---

## After The Interview

### Transcribe
Use `/transcribe` skill on the recording. Output goes into `docs/ilana-interview-transcript-YYYY-MM-DD.md`.

### Extract insights
Create `docs/ilana-interview-insights.md` with:
- **Surprises** (things that didn't match my assumptions)
- **Corrections** (things I had wrong)
- **Validations** (things I had right)
- **New ideas** (things Ilana suggested that I hadn't considered)
- **Red flags** (things that worry her or could go wrong)
- **Pilot plan** (which specific students, how many, when to start)

### Update the spec
Apply the insights to `docs/superpowers/specs/2026-04-14-wordpets-companion-app-design.md`. Things likely to change:
- Success metric (may be different from "60% practice 4+ days")
- Which activities matter most (may not be phonics + spelling + read aloud)
- Content sources (Ilana may already have materials)
- Teacher effort budget (may be more or less than 10 min/week)
- Which students to pilot with

### Decide: is Ilana in or is this solo?
Be honest with yourself about her answer to "how much time are you willing to spend on this?" If it's "not much," either:
- Build a version that needs zero teacher involvement
- Delay until she has more bandwidth
- Accept that she's not actually a co-builder and stop designing around her

---

## Tips For The Conversation

- **Record audio, not video.** Less self-conscious, better for natural conversation.
- **Don't interrupt or defend the design.** Let Ilana criticize. The whole point is to hear things you haven't considered.
- **If she says something you disagree with, ask "tell me more" instead of pushing back.** Save disagreements for after the interview.
- **Take notes AFTER the call, not during.** Be present in the conversation.
- **Thank her and mean it.** She's saving you weeks of building the wrong thing.

---

## Anti-patterns to avoid

- **Don't pitch her.** This isn't a sales meeting. You're learning, not convincing.
- **Don't lead the witness.** "Don't you think the pet system is great?" gets you fake validation. "What do you think about the pet idea?" gets you truth.
- **Don't skip questions that feel awkward.** #23 (her biggest hesitation) is the most valuable one.
- **Don't update the spec the same day.** Sleep on it. Let the insights settle.
