# Foreman — Pilot handoff (iPhone test)

This is the **single source of truth** for running the Foreman maintenance pilot on your iPhone.
For deeper detail see [TECHNICAL_OVERVIEW.md](TECHNICAL_OVERVIEW.md); for setup see
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
| Internal `/ops` dashboard | ✅ recent jobs, export, training links |
| Training module generator | ✅ `/training` and post-job CTA |
| Build + unit tests | ✅ backend + web (`npm test` in each workspace) |

You do **not** need to deploy anything unless you changed code. To re-verify,
run `npm run check-ready` (see §7).

---

## 2. Pre-flight (30 seconds)

Render free tier sleeps after ~15 min idle, so wake it before you demo:

```bash
curl https://foreman-api-y31r.onrender.com/health      # → {"status":"ok"} (may take 30–60s on cold start)
curl https://foreman-phi.vercel.app/api/health         # → {"status":"ok"}
```

The app **pre-warms the backend on load** ("Waking Foreman…" on the boot screen).
First coaching after idle can still take 30–60s on free tier — expected.

---

## 3. The iPhone walk (maintenance flow)

Open **https://foreman-phi.vercel.app** in **Safari** (not an in-app browser).

### Boot screen

One screen, one tap to go live:

1. **Read the consent copy** (first visit only):

   > Camera and mic record this job for coaching and training. Only start if everyone on site is OK with that.

2. **Optional:** enter your name (remembered on this device).
3. **Pick the job type** — five maintenance options: Panel clean, Pigeon proofing, Thermal scan, Exterior clean, Commercial.
4. **Start.** Tap **I understand — start job** (first visit) or **Start job** (return visit). Allow **camera** and **microphone** when Safari prompts.

While the backend wakes you may see **Waking Foreman…** — it auto-retries.

### During the job

- Red **REC** badge (top-left) while live.
- **Hero coaching card** updates every few seconds with the top cue (maintenance-specific idle hints before the first analyse).
- **End job** in the footer — ends capture and generates the job summary.

There is no pause button in the field UI; end the job if you need to stop.

### After the job

- **Job complete** screen with AI summary text.
- Quiet stats: frames · coaching cues · voice clips.
- **Generate training module** — turns this job into crew onboarding content.
- **Open in training** — opens `/training` with the session id pre-filled.
- **Start new job** — back to boot.

---

## 4. Crew lead tools

### Ops dashboard

https://foreman-phi.vercel.app/ops

Enter the ops password (set `OPS_PASSWORD` on Render). Shows recent jobs, spend estimates, and per-session **Export** and **Training** links.

### Training module

https://foreman-phi.vercel.app/training

Paste a session id (or follow a link from ops or the post-job summary). Optionally add the ops password for completed jobs. Generates steps, quiz, and briefing script from real job footage.

---

## 5. What to demo

| Scenario | What to show |
|----------|----------------|
| Panel clean on roof | Point camera at arrays — coaching on rinse sequence, safety |
| Pigeon proofing | Nest removal / mesh work — quality cues |
| End of job | Summary + stats + training CTA |
| Crew lead | Ops table → Training link for a completed session |

---

## 6. Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Waking Foreman…" forever | Wake API with `curl` above; wait 60s on cold start |
| No coaching updates | Check `/api/health`; confirm camera permission |
| Summary says "pending" | Data is saved; summary may finish async — refresh ops |
| Training generation fails | Job must have frames; try ops password for ended sessions |

---

## 7. Verify locally

```bash
# Backend ready check (needs .env)
cd backend && npm run check-ready

# Web unit tests
cd web && npm test

# Prod smoke
chmod +x web/scripts/smoke-prod.sh && ./web/scripts/smoke-prod.sh
```

See [docs/app/FIELD_TRUTH_AUDIT.md](docs/app/FIELD_TRUTH_AUDIT.md) for UI claims vs code.
