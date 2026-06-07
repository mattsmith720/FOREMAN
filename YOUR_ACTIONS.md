# What you need to do — Foreman phone testing

> **Pilot walkthrough:** the canonical on-phone guide is **[PILOT_HANDOFF.md](PILOT_HANDOFF.md)**. This file is the operator setup / infrastructure checklist (env vars, deploy, keys).

**Last updated:** 2026-06-07

Everything below is **your** side only. The repo, Vercel UI, Supabase database, security hardening, and deploy pipeline are already built and pushed.

**Production:** [https://foreman-phi.vercel.app](https://foreman-phi.vercel.app) · API [https://foreman-api-y31r.onrender.com](https://foreman-api-y31r.onrender.com)

---

## Already done (no action needed)

| Item | Status |
|------|--------|
| Monorepo — backend API, Foreman web client, shared schema, iOS skeleton | ✅ |
| Supabase project `uvlgbsiwyvtsjlqzozas` — 5 tables, RLS, private `frames` bucket | ✅ |
| GitHub repo | ✅ [github.com/mattsmith720/FOREMAN](https://github.com/mattsmith720/FOREMAN) |
| Vercel production UI | ✅ [foreman-phi.vercel.app](https://foreman-phi.vercel.app) |
| Vercel API route handlers (runtime proxy, not broken rewrites) | ✅ Deployed |
| `NEXT_PUBLIC_API_URL=same-origin` on Vercel | ✅ |
| `FOREMAN_API_KEY` generated in your local `backend/.env` + set on Vercel | ✅ |
| Meta Wearables DAT Cursor rules + MCP | ✅ |
| Security — rate limits, helmet, API key auth, input validation | ✅ See [SECURITY.md](SECURITY.md) |
| `npm run check-ready` verification script | ✅ |
| `npm run smoke` E2E API smoke script | ✅ See [DEPLOY.md](DEPLOY.md) § Release smoke |

---

## Production status — ready for phone testing

Production is **live and wired**. No deploy blockers for the iPhone pilot:

| Check | Status |
|-------|--------|
| Vercel UI | ✅ https://foreman-phi.vercel.app |
| Render API | ✅ https://foreman-api-y31r.onrender.com |
| `BACKEND_URL` + `FOREMAN_API_KEY` on Vercel | ✅ |
| API keys on Render | ✅ (verify with `/ready`) |

```bash
curl https://foreman-phi.vercel.app/api/health   # → {"status":"ok"}
curl https://foreman-api-y31r.onrender.com/health  # → {"status":"ok"} (may be slow on cold start)
```

If both return ok, **skip to Step 4** for the iPhone walk. See **[PILOT_HANDOFF.md](PILOT_HANDOFF.md)** for the full on-phone script.

**Local dev only:** Steps 1–3 below matter if you want to run the backend on your Mac or redeploy from scratch. Empty keys in `backend/.env` block local `npm run dev:backend` but do **not** block the production phone test.

---

## Your checklist — do in this order

### ☐ Step 1 — Get and paste 3 API keys (5 min)

Open **`backend/.env`** in this project and fill in:

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

| Key | Where to get it |
|-----|-----------------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) → API keys |
| `SUPABASE_SERVICE_ROLE_KEY` | [Supabase API settings](https://supabase.com/dashboard/project/uvlgbsiwyvtsjlqzozas/settings/api) → **service_role** (secret, not anon) |

**Important:**
- Use **service_role**, not the anon key.
- Never commit `backend/.env` or paste keys in chat.
- `FOREMAN_API_KEY` is already set in your `.env` — leave it; you'll reuse the same value on Render.

**Verify locally (optional):**

```bash
npm run dev:backend
# new terminal:
curl http://localhost:8080/ready
```

Expect `"anthropic": true`, `"openai": true`, `"supabase": true`.

---

### ☐ Step 2 — Deploy the API on Render (10 min)

1. Open **[Deploy to Render](https://render.com/deploy?repo=https://github.com/mattsmith720/FOREMAN)** (sign in with GitHub).
2. Render reads `render.yaml` and creates **foreman-api**.
3. When prompted for environment variables, add **all** of these:

| Variable | Value |
|----------|--------|
| `ANTHROPIC_API_KEY` | Same as `backend/.env` |
| `OPENAI_API_KEY` | Same as `backend/.env` |
| `SUPABASE_URL` | `https://uvlgbsiwyvtsjlqzozas.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as `backend/.env` |
| `FOREMAN_API_KEY` | Same as `backend/.env` (copy from line `FOREMAN_API_KEY=...`) |
| `CORS_ORIGINS` | `https://foreman-phi.vercel.app` |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-20250514` (optional) |

4. Wait until Render shows **Live** (first deploy ~5–10 min).
5. Copy your service URL. Production example: `https://foreman-api-y31r.onrender.com`

**Verify:**

```bash
curl https://foreman-api-y31r.onrender.com/health
# → {"status":"ok"}

curl -H "x-foreman-api-key: YOUR_KEY" https://foreman-api-y31r.onrender.com/ready
# → anthropic/openai/supabase all true
```

> **Free tier note:** Render sleeps after ~15 min idle. First request after sleep may take 30–60 seconds.

---

### ☐ Step 3 — Connect Vercel to Render (2 min)

1. Open [Vercel → foreman → Environment Variables](https://vercel.com/openland17s-projects/foreman/settings/environment-variables).
2. Add or confirm:

| Name | Value | Environments |
|------|--------|--------------|
| `BACKEND_URL` | `https://foreman-api-y31r.onrender.com` (no trailing slash) | Production, Preview, Development |

`FOREMAN_API_KEY` and `NEXT_PUBLIC_API_URL` are already set on Vercel.

3. **Redeploy** — Vercel → Deployments → latest → **Redeploy**  
   (Or push any commit to `main`.)

**Verify:**

```bash
curl https://foreman-phi.vercel.app/api/health
# → {"status":"ok"}

npm run check-ready
# → all green

BASE_URL=https://foreman-api-y31r.onrender.com FOREMAN_API_KEY=$FOREMAN_API_KEY npm run smoke
# → exits 0 when keys and backends are wired (hit the API host directly; the
#   Vercel /api proxy's origin gate blocks header-less CLI calls)
```

---

### ☐ Step 4 — Test on your iPhone (2 min)

**Works on any network** (cellular, job site, different Wi‑Fi):

1. iPhone Safari → **https://foreman-phi.vercel.app**
2. If Render has been idle, wait ~30–60s on first coaching tap (free-tier cold start); the boot screen shows **Waking Foreman…** while it pre-warms
3. Read the consent copy on the boot screen, pick a job phase — **Survey**, **Install**, or **Pitch**
4. Optional: enter your name (remembered on this device)
5. Tap **I understand — start coaching** (one tap — consent + start) → allow **camera** and **microphone**
6. Confirm the red **REC** badge appears top-left; try **Pause job** / **Resume job** (badge turns amber **PAUSED**)
7. Point camera at a scene and talk through what you're doing

**Try saying:**

> "Installing rail brackets on the north roof. Checking fall protection. Customer asked about payback — quoted thirty percent bill savings."

**You should see:**
- Foreman coach overlay with the hero cue updating every few seconds (tap the card to cycle cues)
- A phase chip + status pill cycling **Live** → **Analyzing…**
- Tap **Details** for the full sheet: **Seeing**, **Heard** (your speech), **Advice**, **Marks**
- Optional: **Cue voice on/off** and **Talk live** / **End talk** when voice routes are configured
- **End job** → **Job complete** summary with frame/transcript counts
- **Was the coaching right?** post-job review — **👍 Right** / **Fix** on top cues, optional job notes
- On **Install**: voice-guided compliance shots; `foreman-evidence-*.zip` downloads on end (JSON fallback if ZIP fails)

**Confirm data in Supabase (optional):**  
[Table Editor](https://supabase.com/dashboard/project/uvlgbsiwyvtsjlqzozas/editor) → `sessions`, `frames`, `transcript_segments` should have rows.

---

## Alternative — same Wi‑Fi only (skip Render)

If your Mac and iPhone are on the **same Wi‑Fi** and you want to test before Render:

1. Complete **Step 1** (keys in `backend/.env`).
2. Run:

```bash
npm run dev:phone
```

3. On iPhone Safari → **`https://YOUR-MAC-IP:3000`** (script prints IP, e.g. `https://192.168.0.88:3000`).
4. Accept certificate warning → pick a phase → tap **I understand — start coaching**.

This does **not** work on cellular or a different network.

---

## Quick verify anytime

```bash
npm run check-ready
```

| Check | Pass means |
|-------|------------|
| ✓ Anthropic / OpenAI / Supabase keys | `backend/.env` complete |
| ✓ Vercel API health | Render + `BACKEND_URL` wired |
| ✓ Vercel UI | App loads on phone |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Unexpected token` / JSON error | API not reachable | Steps 2–3 |
| `API not found` / 404 | `BACKEND_URL` missing on Vercel | Step 3 + redeploy |
| `API unavailable` / 503 | Keys missing on **Render** | Re-check Render env vars |
| `Unauthorized` / 401 | `FOREMAN_API_KEY` mismatch | Same key on Render + Vercel |
| UI loads, no coaching | Anthropic key missing | Step 1 + Render |
| No transcription | OpenAI key missing | Step 1 + Render |
| "Supabase not configured" | Service role missing on Render | Step 1 + Render |
| Long wait then timeout | Render cold start | Wait 60s, retry |
| Camera won't open | Not HTTPS | Use Vercel URL or `dev:phone` HTTPS |

---

## Billing reminder (before heavy testing)

Set spend limits on:
- [Anthropic console](https://console.anthropic.com)
- [OpenAI usage](https://platform.openai.com/usage)

Each camera frame and audio chunk calls paid APIs. See [DEPLOY.md](DEPLOY.md) § Cost guards and billing alerts.

---

## Links cheat sheet

| Resource | URL |
|----------|-----|
| **Your app (open on iPhone)** | https://foreman-phi.vercel.app |
| **Production API** | https://foreman-api-y31r.onrender.com |
| GitHub | https://github.com/mattsmith720/FOREMAN |
| Deploy API (Render) | https://render.com/deploy?repo=https://github.com/mattsmith720/FOREMAN |
| Vercel env vars | https://vercel.com/openland17s-projects/foreman/settings/environment-variables |
| Supabase API keys | https://supabase.com/dashboard/project/uvlgbsiwyvtsjlqzozas/settings/api |
| Supabase data | https://supabase.com/dashboard/project/uvlgbsiwyvtsjlqzozas/editor |
| Anthropic keys | https://console.anthropic.com |
| OpenAI keys | https://platform.openai.com |

---

## When you're done

Run `npm run check-ready` and `npm run smoke` one last time. If anything fails, paste the output in chat.

**4 boxes to tick:** keys in `.env` → Render live → `BACKEND_URL` on Vercel → iPhone test passes.
