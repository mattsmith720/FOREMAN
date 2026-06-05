# Your action items — Foreman

> **Superseded by [YOUR_ACTIONS.md](YOUR_ACTIONS.md)** — use that file as the single source of truth.

Full audit run **2026-06-05**. Everything below is what **you** need to do to go from “UI loads” to “full AI coaching on your iPhone from any network.”

---

## Audit summary

| Area | Status | Notes |
|------|--------|-------|
| **Codebase** | ✅ Ready | Shared, backend, web build clean; backend tests 3/3 pass |
| **GitHub** | ✅ Live | [github.com/mattsmith720/FOREMAN](https://github.com/mattsmith720/FOREMAN) — `main` pushed |
| **Vercel (web)** | ⚠️ Partial | [foreman-phi.vercel.app](https://foreman-phi.vercel.app) returns 200 — UI loads |
| **Vercel API proxy** | ❌ Broken | `/api/health` → 404 — `BACKEND_URL` not set on Vercel (code now uses runtime API routes) |
| **Render (API)** | ❌ Not deployed | No live backend yet |
| **Supabase DB** | ✅ Ready | 5 tables, RLS on, 0 rows |
| **Supabase storage** | ✅ Ready | Private `frames` bucket |
| **Local `backend/.env`** | ⚠️ Partial | URL + anon key set; **3 keys still empty** |
| **AI keys** | ❌ Missing | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` not in `.env` |
| **Service role** | ❌ Missing | `SUPABASE_SERVICE_ROLE_KEY` not in `.env` |
| **Local dev** | ✅ Configured | `web/.env.local` exists for same-Wi‑Fi testing |
| **iOS native app** | ⏸️ Later | Mock/real glasses path — not needed for phone browser test |

**Bottom line:** The Jarvis UI is deployed. Nothing AI-related works until you add API keys and deploy the backend.

---

## Do these in order

### 1. Get API keys (if you don’t have them yet)

| Key | Where to get it | Used for |
|-----|-----------------|----------|
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com) → API Keys | Camera vision coaching (Claude) |
| **OpenAI** | [platform.openai.com](https://platform.openai.com) → API keys | Microphone transcription (Whisper) |
| **Supabase service role** | [Supabase API settings](https://supabase.com/dashboard/project/uvlgbsiwyvtsjlqzozas/settings/api) → **service_role** (secret) | Sessions, frames, transcript storage |

> Use **service_role**, not anon. Never put service_role in the web app or commit it to Git.

---

### 2. Fill in `backend/.env` (local Mac)

Open `backend/.env` and paste:

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are already set. Save the file.

**Verify locally:**

```bash
cd /Users/mattsmith/Downloads/FOREMAN
npm run dev:backend
```

In another terminal:

```bash
curl http://localhost:8080/health
# expect: {"status":"ok"}
```

Optional — test Claude on a sample image (needs `ANTHROPIC_API_KEY`):

```bash
npm run analyse-sample --workspace backend
```

---

### 3. Deploy the API to Render (~10 min)

1. Open **[Deploy to Render](https://render.com/deploy?repo=https://github.com/mattsmith720/FOREMAN)** (sign in with GitHub if prompted).
2. Render reads `render.yaml` and creates **foreman-api**.
3. When prompted for environment variables, add:

| Variable | Value |
|----------|--------|
| `ANTHROPIC_API_KEY` | same as local |
| `OPENAI_API_KEY` | same as local |
| `SUPABASE_URL` | `https://uvlgbsiwyvtsjlqzozas.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | same as local |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-20250514` (optional) |

4. Wait until Render shows **Live** (first deploy ~5–10 min).
5. Copy your service URL, e.g. `https://foreman-api-xxxx.onrender.com`.

**Verify:**

```bash
curl https://YOUR-RENDER-URL.onrender.com/health
# expect: {"status":"ok"}
```

> **Free tier:** Render sleeps after ~15 min idle. First request after sleep can take 30–60s.

---

### 4. Connect Vercel to Render

1. Open [Vercel → foreman → Environment Variables](https://vercel.com/openland17s-projects/foreman/settings/environment-variables).
2. Add:

| Name | Value | Environments |
|------|--------|--------------|
| `BACKEND_URL` | `https://YOUR-RENDER-URL.onrender.com` (no trailing slash) | Production, Preview, Development |
| `FOREMAN_API_KEY` | Same random secret on Vercel + Render (recommended) | Production, Preview, Development |

`NEXT_PUBLIC_API_URL` = `same-origin` is already set for Production.

On **Render**, also set `CORS_ORIGINS=https://foreman-phi.vercel.app` and the same `FOREMAN_API_KEY`.

3. **Redeploy** Vercel after setting env vars (push to `main` or Redeploy in dashboard).

**Verify:**

```bash
curl https://foreman-phi.vercel.app/api/health
# expect: {"status":"ok"}
```

---

### 5. Test on your iPhone (any network)

1. Safari → **https://foreman-phi.vercel.app**
2. Tap **I understand — enable camera & mic**
3. Allow camera + microphone
4. Tap **Start job**
5. Point camera at a work scene and talk through what you’re doing

**You should see:**

- Jarvis HUD with updating coaching cues (~every 4s)
- **Heard:** line when you speak
- **Training memory** feed (“adding to training memory…”)
- **Stop job** → session summary with frame/transcript counts

**Simulate a tradie** — say something like:

> “Installing rail brackets on the north roof. Checking fall protection. Customer asked about payback — quoted thirty percent bill savings.”

---

### 6. Confirm data landed in Supabase (optional)

After a test job, open [Supabase Table Editor](https://supabase.com/dashboard/project/uvlgbsiwyvtsjlqzozas/editor):

- `sessions` — should have 1 row with `summary`
- `frames` — one row per analysed camera frame
- `transcript_segments` — speech chunks
- `coaching_events` — structured coaching flags

Or locally (paste session ID from the app summary):

```bash
npm run confirm-session --workspace backend -- <session-uuid>
```

---

## Checklist (tick as you go)

- [ ] `ANTHROPIC_API_KEY` in `backend/.env`
- [ ] `OPENAI_API_KEY` in `backend/.env`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`
- [ ] `curl localhost:8080/health` → ok
- [ ] Render **foreman-api** deployed and healthy
- [ ] Same 4 keys on Render environment
- [ ] `BACKEND_URL` + `FOREMAN_API_KEY` set on Vercel
- [ ] `FOREMAN_API_KEY` + `CORS_ORIGINS` set on Render
- [ ] Vercel redeployed after env changes
- [ ] `curl foreman-phi.vercel.app/api/health` → ok
- [ ] iPhone test: Start job → coaching + memory feed works
- [ ] Supabase tables have rows after a test job

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| UI loads, no coaching | API not reachable | Complete steps 3–4 |
| `/api/health` 404 on Vercel | `BACKEND_URL` missing or not redeployed | Set env var, redeploy |
| “Supabase not configured” | Missing service role on **Render** | Add `SUPABASE_SERVICE_ROLE_KEY`, redeploy API |
| No transcription | Missing `OPENAI_API_KEY` on Render | Add key, redeploy API |
| No vision coaching | Missing `ANTHROPIC_API_KEY` on Render | Add key, redeploy API |
| Long wait then timeout | Render cold start | Wait 60s, retry |
| Camera won’t open | Not HTTPS | Use Vercel URL, not `http://` |

---

## Optional (not required for phone test)

| Task | When |
|------|------|
| **Local same-Wi‑Fi test** | `npm run dev:phone` — see [PHONE_TEST.md](PHONE_TEST.md) |
| **Billing alerts** | Set spend limits on Anthropic + OpenAI dashboards before heavy testing |
| **Render always-on** | Upgrade from free tier if you demo to customers |
| **Custom domain** | Vercel → Project → Domains |
| **Native iOS / Meta glasses** | See [native/ios/README.md](native/ios/README.md) — Iteration 4+ |
| **Australian privacy / consent** | Review before live pilot with real customers — see [CLAUDE.md](CLAUDE.md) |

---

## Quick links

| Resource | URL |
|----------|-----|
| Live app | https://foreman-phi.vercel.app |
| GitHub | https://github.com/mattsmith720/FOREMAN |
| Vercel dashboard | https://vercel.com/openland17s-projects/foreman |
| Deploy API (Render) | https://render.com/deploy?repo=https://github.com/mattsmith720/FOREMAN |
| Supabase project | https://supabase.com/dashboard/project/uvlgbsiwyvtsjlqzozas |
| Supabase API keys | https://supabase.com/dashboard/project/uvlgbsiwyvtsjlqzozas/settings/api |

---

## What’s already done (no action needed)

- Monorepo scaffold: backend, web Jarvis client, shared schema, iOS skeleton
- Supabase schema + private `frames` bucket + RLS lockdown
- GitHub repo created and pushed
- Vercel project linked to GitHub, production deploy live
- Monorepo build config fixed for Vercel (`Root Directory` = `web`)
- Supabase MCP connected in `.cursor/mcp.json`
- Supabase agent skills installed locally

When steps 1–5 are done, you’re fully operational on your iPhone from any network. Paste your Render URL here if you want help setting `BACKEND_URL` and verifying the end-to-end flow.
