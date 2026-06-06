# Foreman — Pilot handoff (iPhone test)

This is the **single source of truth** for running the Foreman pilot on your iPhone.
It describes the app exactly as it ships today. For deeper detail see
[TECHNICAL_OVERVIEW.md](TECHNICAL_OVERVIEW.md); for setup steps see
[YOUR_ACTIONS.md](YOUR_ACTIONS.md); for security see [SECURITY.md](SECURITY.md).

- **Web (open this on the phone):** https://foreman-phi.vercel.app
- **API:** https://foreman-api-y31r.onrender.com
- **Supabase project:** `uvlgbsiwyvtsjlqzozas`

---

## 1. Status — what's already done

| Piece | State |
|-------|-------|
| Code on `main`, pushed to GitHub | ✅ |
| Web deployed (Vercel) | ✅ `https://foreman-phi.vercel.app` |
| API deployed (Render) | ✅ `https://foreman-api-y31r.onrender.com` |
| Backend features (Claude, Whisper, Supabase, ElevenLabs) | ✅ all green on `/ready` |
| Build + unit tests | ✅ backend 36, web 25 |

You do **not** need to deploy anything. If you changed keys or want to re-verify,
run `npm run check-ready` (see §7).

---

## 2. Pre-flight (30 seconds)

Render free tier sleeps after ~15 min idle, so wake it before you demo:

```bash
curl https://foreman-api-y31r.onrender.com/health      # → {"status":"ok"} (may take 30–60s on cold start)
curl https://foreman-phi.vercel.app/api/health         # → {"status":"ok"}
```

If both return ok, you're ready. The first **Start job** after idle can still take
30–60s while Claude warms up — that's expected on free tier.

---

## 3. The iPhone walk (what actually happens)

Open **https://foreman-phi.vercel.app** in **Safari** (not an in-app browser).

1. **Consent.** A full-screen overlay explains Foreman captures camera, microphone,
   and job context, treated as sensitive personal data under Australian privacy
   rules. Tap **I understand — continue**.
2. **Pick the job phase.** The boot screen asks *"What are you doing on site?"* with
   three options — **Survey**, **Install** (default), **Pitch**. This tunes the
   coaching focus. Tap one.
3. **Start.** Tap **Start install** (the button is labelled for the phase you picked,
   e.g. *Start survey* / *Start pitch*). Allow **camera** and **microphone** when
   Safari prompts.
4. **During the job you'll see:**
   - A red **REC** badge (top-left) while the session is live.
   - A minimal top bar: a **phase chip** (Survey/Install/Pitch) + a **status pill**
     that cycles **Live → Analyzing… → Live** (and **Summarising…** at the end).
   - A brief **scan animation** over the frame each time it analyses.
   - A **hero coaching card** that updates every few seconds with the top cue
     (safety/quality/pitch/next step), colour-coded by severity. **Tap the card** to
     cycle through all cues for the current frame (shows `2/5` style index).
   - A **Details** button → opens one sheet with **Seeing** (what the camera sees),
     **Heard** (your latest transcript), **Advice** (quality & safety, pitch & upsell,
     next steps, pacing), and **Marks** (on-frame callouts).
5. **Talk through the job.** Speak naturally, e.g.
   > "Installing rail brackets on the north roof. Checking the fall-protection anchor.
   > Customer asked about payback — quoted about thirty percent off the power bill."

   Your words appear under **Heard** in Details, and pitch lines get critiqued
   (strongest in **Pitch** phase).
6. **Voice (optional):**
   - **Cue voice on/off** — the Australian male coach (Charlie) reads new cues aloud.
     Turn the phone volume up.
   - **Talk live / End talk** — appears only when the live ElevenLabs agent is
     configured; two-way voice that pauses job mic capture while open.
7. **End job.** Tap **End job** → status shows **Summarising…**, then a **Job complete**
   panel with the stored counts: **frames, coaching events, labels, transcript
   segments**. Those counts are the real proof the job was logged.

---

## 4. Confirm the data landed (the moat)

After ending a job, open the Supabase
[Table Editor](https://supabase.com/dashboard/project/uvlgbsiwyvtsjlqzozas/editor):

- `sessions` — one row per job (with the summary).
- `frames` — one row per analysed frame (image in the private `frames` bucket +
  `analysis` JSON).
- `transcript_segments` — your speech.
- `coaching_events` / `labels` — derived cues and pseudo-labels.

> **Persistence is asynchronous.** `/analyse` returns coaching immediately and the
> frame is saved in the background, so there is **no per-frame "saved" tick** in
> normal mode — the **Job complete** counts (and the rows above) are the confirmation.

---

## 5. Debug mode (`?debug=1`)

Open **https://foreman-phi.vercel.app/?debug=1** for a diagnostics strip:

- **Frame** size (KB), **Analyse** latency (ms), **Persist** (async — frames are
  queued for background save), **Mic** MIME, **Chunk** size (KB).
- A pipeline strip (Cap → AI/ms → Coach) and an **Activity** feed inside Details
  showing live frame/AI/coach/saved events.

---

## 6. Known limits (pilot)

- **Render cold start** — first request after idle takes 30–60s. Wake it (§2) before
  a live demo.
- **No per-user login yet** — access is a session UUID + an HMAC `x-session-token`
  issued at job start, plus the server-side `FOREMAN_API_KEY`. Fine for a private
  pilot; not multi-tenant.
- **Consent wording is implemented; legal review is not done.** Get the customer-facing
  consent reviewed against AU privacy rules before filming real customers.
- **Site video ingest needs an ffmpeg host.** The `/ingest` upload page stores videos,
  but frame/audio extraction runs where ffmpeg exists (your Mac: `cd backend &&
  npm run process-videos`). Render free tier has no ffmpeg. See
  [SITE_VIDEO_INGEST.md](SITE_VIDEO_INGEST.md).
- **Costs are usage-based.** Every frame and audio chunk calls paid APIs. Set spend
  limits on Anthropic and OpenAI before heavy testing.

---

## 7. Verify anytime

```bash
npm run check-ready
# Local env + unit tests + production health probes. Ends "Ready for phone testing."

BASE_URL=https://foreman-api-y31r.onrender.com FOREMAN_API_KEY="$(grep '^FOREMAN_API_KEY=' backend/.env | cut -d= -f2-)" npm run smoke
# Walks sessions/start → analyse → transcribe → stop against production. Exits 0 on pass.
# Target the API host directly — the Vercel /api proxy's origin gate blocks header-less CLI calls.
```

---

## 8. Environment checklist

Never put API keys in `NEXT_PUBLIC_*` — those ship in the browser bundle.

**Render (`foreman-api`)** — set in the Render dashboard (`sync: false` vars in
`render.yaml`):

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Vision coaching |
| `OPENAI_API_KEY` | Whisper transcription |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Persistence (JWT service role, `eyJ…`) |
| `FOREMAN_API_KEY` | API auth (same value as Vercel) |
| `CORS_ORIGINS` | `https://foreman-phi.vercel.app` |
| `ELEVENLABS_API_KEY` | Live ConvAI coach (optional) |
| `ELEVENLABS_AGENT_ID` | Live ConvAI coach (optional) |
| `INGEST_WEBHOOK_SECRET` | Site video ingest webhook (optional) |

**Vercel (`web`)**:

| Variable | Purpose |
|----------|---------|
| `BACKEND_URL` | `https://foreman-api-y31r.onrender.com` (server-side proxy target) |
| `FOREMAN_API_KEY` | Injected by the proxy (same value as Render) |
| `NEXT_PUBLIC_API_URL` | `same-origin` |
| `ALLOWED_APP_ORIGINS` | `https://foreman-phi.vercel.app` |
| `ELEVENLABS_API_KEY` | **Cue TTS runs on Vercel** (Render IPs are blocked for TTS) |
| `ELEVENLABS_VOICE_ID` | Charlie AU (optional; default baked in) |

---

## 9. If something breaks

| Symptom | Fix |
|---------|-----|
| Start job fails immediately | Render cold start — wait 60s, retry |
| Camera won't open | Must be the `https://` Vercel URL, not `http://` |
| No coaching | `ANTHROPIC_API_KEY` on Render; check `/ready` |
| No transcript | `OPENAI_API_KEY` on Render, or mic permission denied (vision still works) |
| No coach voice | Set `ELEVENLABS_API_KEY` on **Vercel** (cue TTS), turn volume up |
| "Job complete" shows 0 frames | Session ran before Claude warmed up — retry after cold start |
| 401 Unauthorized | `FOREMAN_API_KEY` must match on Render and Vercel |
