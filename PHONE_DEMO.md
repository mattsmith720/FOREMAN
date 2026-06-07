# Foreman — gym demo script

**URL:** [https://foreman-phi.vercel.app](https://foreman-phi.vercel.app)

Show your mate live AI coaching on a real scene in ~90 seconds.

---

## Before you walk in

1. Open the URL on your iPhone in **Safari** (not in-app browser).
2. Wait for Render to wake if it's been idle (~30–60s first load is normal on Render free tier).
3. Confirm Vercel env: `NEXT_PUBLIC_API_URL=same-origin`, `BACKEND_URL` set, **no** `NEXT_PUBLIC_FOREMAN_API_KEY`.

---

## The 90-second demo

### 1. Consent + start (15s)

One screen — consent, phase, and start in a single tap:

- Read the consent copy:

  > Foreman watches the job through your camera and mic and coaches you live — flagging safety and quality issues, sharpening your pitch, and keeping a secure record of every job. Footage is stored securely and never shared publicly. Make sure everyone in view is OK with being recorded.

- Pick a phase — **Survey**, **Install**, or **Pitch**.
- Tap **I understand — start coaching** → allow camera + mic when Safari prompts.
- Point at something interesting (gym equipment, roof line out the window, anything with structure).
- Say: *"This is Foreman — live AI coaching for field work. It watches the job and gives you feedback."*

### 2. Coaching (30s)

- A red **REC** badge appears top-left; the top bar shows the **phase chip** and a **status pill** cycling **Live → Analyzing…**.
- Pan the camera slowly across the scene.
- Every few seconds: status flips to **Analyzing…** → hero coaching card updates with the top cue.
- Warnings and safety issues show in amber/red on the card.
- Optional: tap **Details** for the full sheet — **Seeing**, **Heard**, **Advice**, **Marks**.
- Optional: tap **Pause job** → badge turns amber **PAUSED** → **Resume job** to continue.

**Install bonus:** pick **Install** and Foreman voice-prompts six compliance shots (meter box, switchboard, serial plate, etc.). On **End job** a `foreman-evidence-*.json` manifest downloads if any shots were captured.

### 3. Audio (15s)

- Say clearly: *"This install is going smooth, customer loves the savings, we're on schedule."*
- Tap **Details** → **Heard** shows your latest transcript; **Advice → Pitch & upsell** critiques the line.
- Frames and coaching save to the job log in the background — confirmed by the counts at **End job**.

### 4. Close (30s)

- Tap **End job**.
- Status shows **Summarising…**, then the **Job complete** panel with stored counts (frames, coaching events, labels, transcript segments).
- Scroll to **Was the coaching right?** — tap **👍 Right** on one cue to show the training loop.
- Say: *"Every job builds our training dataset — that's the moat."*
- Tap **Start new job** if you want another run.

---

## Debug mode (optional)

Append `?debug=1` to the URL for a capture health strip:

- Frame size (KB)
- Analyse latency (ms)
- Persist (async — frames queued for background save)
- Mic MIME + chunk size
- Inside **Details**, an **Activity** feed of live Frame/AI/Coach/Saved events

---

## If something breaks

| Symptom | Fix |
|---------|-----|
| Start fails immediately | Render cold start — wait 60s, retry |
| "Job complete" shows 0 frames | Cold start before Claude warmed up — retry; check `SUPABASE_*` + `ANTHROPIC_API_KEY` on Render |
| No transcript | Mic permission or iOS audio — vision-only still works |
| 413 error | Hard refresh — compression should keep frames small |
| Job ends with "No frames were analysed during this session." | Session ran but no frames reached Claude — check API keys on Render and retry after cold start |

---

## One-liner pitch

*"Foreman is an AI layer for installers — camera and mic on the job, live coaching, automatic job log. The data from every job makes it sharper over time."*
