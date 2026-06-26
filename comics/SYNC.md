# Comics — How to Save & Share Your Work

You don't need to learn git or type any commands. There are only **two moments**
to remember, and for both you just *talk to Codex*.

## Every session

**When you sit down — get the latest:**

> Tell Codex: **"get the latest comics work"**

**When you finish — save and share:**

> Tell Codex: **"save and sync my comics work"**

That's the whole routine. Codex does the rest and tells you when it's finished
(**"✅ All synced"**).

## If Codex shows a warning

Your work is **never lost** — it's always saved on your computer first. A warning
just means the *uploading* step needs a human:

- **"changed the same thing… can't merge"** → You and Eli edited the same file
  around the same time. **Message Eli**, or ask Codex: *"help me resolve a comics
  git conflict."*
- **"couldn't upload / login expired"** → A GitHub login timed out. **Ask Eli**
  to do the quick login step below. Try again afterward.

## What's happening behind the scenes (optional to read)

Codex runs one safe script, `scripts/comics-sync.sh`, that: saves your changes →
pulls in Eli's → uploads yours, in the order that can't lose work. Start your day
with the newest version, end it with your work shared. That's it.

---

## One-time setup — Eli does this once, on her Mac

Open **Terminal** and run:

```bash
# 1. Install the tools (skip any that are already installed)
brew install git gh

# 2. Log in to GitHub (opens a browser; pick GitHub.com → HTTPS → web browser)
gh auth login

# 3. Download the project
cd ~/projects 2>/dev/null || mkdir -p ~/projects && cd ~/projects
git clone https://github.com/eliAzulai/blending-bootcamp.git

# 4. Switch to the shared comics line
cd blending-bootcamp && git checkout comics

# 5. Confirm everything is wired up (changes nothing)
cd comics && ./scripts/check-setup.sh

# 6. Open Codex in the comics folder
codex
```

Two more things, once:

- Make sure she has **collaborator access** to the `eliAzulai/blending-bootcamp`
  repo on GitHub (invite her from the repo's Settings → Collaborators).
- In Codex, **allow it to run `scripts/comics-sync.sh`** (approve / trust this
  folder) so the two phrases above work without extra clicks.

After this, day-to-day is just the two phrases at the top of this page.
