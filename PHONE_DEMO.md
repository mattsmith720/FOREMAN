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
- Tap **I understand — continue** → allow camera + mic.
- Point at something interesting (gym equipment, roof line out the window, anything with structure).
- Say: *"This is Foreman — live AI coaching for field work. It watches the job and gives you feedback."*

### 2. Start job (5s)
- Tap **Start job**.
- Status bar shows **Live** with camera and mic indicators.
- Small **Recording** badge appears when the session is active.

### 3. Coaching (30s)
- Pan the camera slowly across the scene.
- Every few seconds: status flips to **Analyzing…** → coaching card updates with the top cue.
- Warnings and safety issues show in amber/red on the card.

### 4. Audio (15s)
- Say clearly: *"This install is going smooth, customer loves the savings, we're on schedule."*
- Last heard line appears under the coaching card.
- Events counter ticks up as frames save to the job log.

### 5. Close (30s)
- Tap **End job**.
- Read the job summary and stored counts (frames, coaching events, labels, transcripts).
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
