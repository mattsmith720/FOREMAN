# Foreman — gym demo script

**URL:** [https://foreman-phi.vercel.app](https://foreman-phi.vercel.app)

Show your mate live AI coaching on a real scene in ~90 seconds.

---

## Before you walk in

1. Open the URL on your iPhone in **Safari** (not in-app browser).
2. Wait for Render to wake if it's been idle (~60s first load is normal).
3. Confirm Vercel env: `NEXT_PUBLIC_API_URL=same-origin`, `BACKEND_URL` set, **no** `NEXT_PUBLIC_FOREMAN_API_KEY`.

---

## The 90-second demo

### 1. Consent (10s)
- Read the consent overlay:

  > Foreman captures camera, microphone, and job context. Recordings are treated as sensitive personal data under Australian privacy rules (see CLAUDE.md). Tap I understand to continue.

- Tap **I understand — continue** → allow camera + mic when Safari prompts.
- Point at something interesting (gym equipment, roof line out the window, anything with structure).
- Say: *"This is Foreman — live AI coaching for field work. It watches the job and gives you feedback."*

### 2. Start job (5s)
- Tap **Start job**.
- Status pill shows **Live**; **Cam** and **Mic** dots light up in the coach header.
- A red **REC** badge appears top-left on the camera stage while the session is active (through **Summarising…**).

### 3. Coaching (30s)
- Pan the camera slowly across the scene.
- Every few seconds: status flips to **Analyzing…** → hero coaching card updates with the top cue.
- Warnings and safety issues show in amber/red on the card.
- Optional: tap toolbar buttons **Seeing**, **Hearing**, **Advice**, **Marks**, or **Feed** for detail panels.

### 4. Audio (15s)
- Say clearly: *"This install is going smooth, customer loves the savings, we're on schedule."*
- **Heard** line appears under the coaching card with your latest transcript.
- Tap **Feed** → **Live feed** shows Frame, AI, Coach, and Saved activity as frames persist.

### 5. Close (30s)
- Tap **End job**.
- Status shows **Summarising…**, then the **Job complete** panel with stored counts (frames, coaching events, labels, transcript segments).
- Say: *"Every job builds our training dataset — that's the moat."*

---

## Debug mode (optional)

Append `?debug=1` to the URL for a capture health strip:

- Frame size (KB)
- Analyse latency (ms)
- Persist success per frame
- Mic MIME + chunk size

---

## If something breaks

| Symptom | Fix |
|---------|-----|
| Start job fails immediately | Render cold start — wait 60s, retry |
| Yellow "not saved" banner | Supabase env on Render — check `SUPABASE_URL` |
| No transcript | Mic permission or iOS audio — vision-only still works |
| 413 error | Hard refresh — compression should keep frames small |

---

## One-liner pitch

*"Foreman is an AI layer for installers — camera and mic on the job, live coaching, automatic job log. The data from every job makes it sharper over time."*
