# Phone testing — get live in 10 minutes

Two ways to test on your iPhone. **Pick one.**

---

## Option A — Any network (recommended)

Works on cellular, job site, any Wi‑Fi. URL: **https://foreman-phi.vercel.app**

### Step 1 — Paste 3 keys into `backend/.env`

Open `backend/.env` and fill in:

```env
ANTHROPIC_API_KEY=sk-ant-...        # https://console.anthropic.com
OPENAI_API_KEY=sk-...               # https://platform.openai.com
SUPABASE_SERVICE_ROLE_KEY=eyJ...    # https://supabase.com/dashboard/project/uvlgbsiwyvtsjlqzozas/settings/api
```

`FOREMAN_API_KEY` is already generated for you — use the **same value** on Render and Vercel.

### Step 2 — Deploy API on Render

1. Open **[Deploy to Render](https://render.com/deploy?repo=https://github.com/mattsmith720/FOREMAN)**
2. Add environment variables:

| Variable | Value |
|----------|--------|
| `ANTHROPIC_API_KEY` | from `.env` |
| `OPENAI_API_KEY` | from `.env` |
| `SUPABASE_URL` | `https://uvlgbsiwyvtsjlqzozas.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | from `.env` |
| `FOREMAN_API_KEY` | from `backend/.env` |
| `CORS_ORIGINS` | `https://foreman-phi.vercel.app` |

3. Wait for **Live**, then copy URL e.g. `https://foreman-api-xxxx.onrender.com`
4. Verify: `curl https://YOUR-URL.onrender.com/health` → `{"status":"ok"}`

### Step 3 — Wire Vercel

[Vercel env vars](https://vercel.com/openland17s-projects/foreman/settings/environment-variables):

| Variable | Value |
|----------|--------|
| `BACKEND_URL` | Your Render URL (no trailing slash) |
| `FOREMAN_API_KEY` | Same as `backend/.env` |
| `NEXT_PUBLIC_API_URL` | `same-origin` (already set) |

Redeploy: Deployments → **Redeploy** (or push to `main`).

### Step 4 — Verify & test

```bash
npm run check-ready
```

On iPhone Safari:

1. **https://foreman-phi.vercel.app**
2. Tap **I understand — enable camera & mic**
3. Allow camera + microphone
4. Tap **Start job**

---

## Option B — Same Wi‑Fi as your Mac (fastest if keys are local)

No Render needed. Mac and iPhone on the same network.

### Step 1 — Fill `backend/.env` (same 3 keys as Option A)

### Step 2 — Run

```bash
npm run check-ready   # optional, checks keys
npm run dev:phone
```

Script prints your Mac IP. On iPhone Safari:

1. **https://YOUR-MAC-IP:3000** (e.g. `https://192.168.0.88:3000`)
2. Accept certificate warning
3. Consent → **Start job**

---

## Quick verify script

```bash
npm run check-ready
```

---

## What you should see

- Full-screen camera + **Jarvis HUD**
- Coaching cues updating ~every 4 seconds
- **Heard:** line when you speak
- **Training memory** feed
- **Stop job** → summary with frame/transcript counts

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| JSON / API not found error | Complete Option A steps 2–3 |
| “API keys not set” | Fill `backend/.env` + Render env |
| “Supabase not configured” | Add `SUPABASE_SERVICE_ROLE_KEY` on Render |
| Render slow first request | Free tier cold start — wait 60s |
| Camera won't open | Must use `https://` URL |

---

## Links

| | |
|--|--|
| Live app | https://foreman-phi.vercel.app |
| Supabase keys | https://supabase.com/dashboard/project/uvlgbsiwyvtsjlqzozas/settings/api |
| Vercel settings | https://vercel.com/openland17s-projects/foreman/settings/environment-variables |
| Deploy Render | https://render.com/deploy?repo=https://github.com/mattsmith720/FOREMAN |
