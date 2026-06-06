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

### 1. Consent (10s)
- Read the consent overlay:

  > Foreman captures camera, microphone, and job context. Recordings are treated as sensitive personal data under Australian privacy rules (see CLAUDE.md). Tap I understand to continue.

- Tap **I understand — continue** → allow camera + mic when Safari prompts.
- Point at something interesting (gym equipment, roof line out the window, anything with structure).
- Say: *"This is Foreman — live AI coaching for field work. It watches the job and gives you feedback."*

### 2. Pick phase + start (5s)
- On the boot screen ("What are you doing on site?") tap a phase — **Survey**, **Install**, or **Pitch**.
- Tap **Start install** (the button is labelled for the phase you picked).
- A red **REC** badge appears top-left; the top bar shows the **phase chip** and a **status pill** cycling **Live → Analyzing…** (through **Summarising…** at the end).

### 3. Coaching (30s)
- Pan the camera slowly across the scene.
- Every few seconds: status flips to **Analyzing…** → hero coaching card updates with the top cue.
- Warnings and safety issues show in amber/red on the card.
- Optional: tap **Details** for the full sheet — **Seeing**, **Heard**, **Advice**, **Marks**.

### 4. Audio (15s)
- Say clearly: *"This install is going smooth, customer loves the savings, we're on schedule."*
- Tap **Details** → **Heard** shows your latest transcript; **Advice → Pitch & upsell** critiques the line.
- Frames and coaching save to the job log in the background — confirmed by the counts at **End job**.

### 5. Close (30s)
- Tap **End job**.
- Status shows **Summarising…**, then the **Job complete** panel with stored counts (frames, coaching events, labels, transcript segments).
- Say: *"Every job builds our training dataset — that's the moat."*

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
| Start job fails immediately | Render cold start — wait 60s, retry |
| "Job complete" shows 0 frames | Cold start before Claude warmed up — retry; check `SUPABASE_*` + `ANTHROPIC_API_KEY` on Render |
| No transcript | Mic permission or iOS audio — vision-only still works |
| 413 error | Hard refresh — compression should keep frames small |
| Job ends with "No frames were analysed during this session." | Session ran but no frames reached Claude — check API keys on Render and retry after cold start |

---

## One-liner pitch

*"Foreman is an AI layer for installers — camera and mic on the job, live coaching, automatic job log. The data from every job makes it sharper over time."*
