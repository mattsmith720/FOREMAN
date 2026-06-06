# Deploy Foreman — test from your phone on any network

Local `npm run dev:phone` only works when your iPhone and Mac share the same Wi‑Fi.
For **any network** (cellular, different Wi‑Fi, job site), deploy:

| Piece | Host | Why |
|-------|------|-----|
| **Web** (camera + Jarvis UI) | [Vercel](https://vercel.com) | HTTPS by default — required for iPhone camera/mic |
| **API** (Claude + Whisper + Supabase) | [Render](https://render.com) | Long-running Node server; Claude calls can take 15–45s |

Your phone opens the Vercel URL. API traffic is proxied through Vercel (`/api/*` → Render) so you never hit mixed-content or CORS issues.

**Vercel platform health:** Next.js projects on Vercel do not use a `healthCheckPath` in `web/vercel.json` — there is no deploy-time probe to configure. Vercel runs its own platform checks on each deployment; use `/api/health` (proxied to Render) for application-level verification.

## Prerequisites

- GitHub repo pushed (Vercel and Render connect to Git)
- API keys ready (see below)
- Supabase project **uvlgbsiwyvtsjlqzozas** (schema + private `frames` bucket already applied)

## Step 1 — Deploy the API (Render)

1. [render.com](https://render.com) → **New** → **Blueprint** (or **Web Service**)
2. Connect this GitHub repo
3. If using Blueprint, Render reads `render.yaml` at the repo root
4. Set environment variables (Render dashboard → **Environment**):

| Variable | Value |
|----------|--------|
| `ANTHROPIC_API_KEY` | Your Anthropic key |
| `OPENAI_API_KEY` | Your OpenAI key |
| `SUPABASE_URL` | `https://uvlgbsiwyvtsjlqzozas.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | [Service role key](https://supabase.com/dashboard/project/uvlgbsiwyvtsjlqzozas/settings/api) (not anon) |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-20250514` (optional) |

5. Deploy and wait for **Healthy** on `/health`
6. Copy the public URL, e.g. `https://foreman-api.onrender.com`

**Note:** Render free tier sleeps after ~15 min idle. First request after sleep may take 30–60s (cold start).

## Step 2 — Deploy the web app (Vercel)

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → import this repo
2. **Root Directory:** `web` (important — monorepo)
3. Framework should auto-detect **Next.js** (`web/vercel.json` sets install/build)
4. **Environment variables** (Vercel → Project → Settings → Environment Variables):

| Variable | Value | Environments |
|----------|--------|--------------|
| `BACKEND_URL` | `https://foreman-api.onrender.com` (your Render URL, no trailing slash) | Production, Preview, Development |
| `NEXT_PUBLIC_API_URL` | `same-origin` | Production, Preview, Development |

`BACKEND_URL` is baked into Next.js rewrites at **build time** — set it before the first deploy, and redeploy if you change the API URL.

5. Deploy

## Step 3 — Test on your iPhone (any network)

1. Open Safari → your Vercel URL, e.g. `https://foreman.vercel.app`
2. No certificate warning (unlike local HTTPS dev)
3. Tap **I understand — enable camera & mic**
4. Allow camera + microphone
5. Tap **Start job**

Works on cellular, home Wi‑Fi, or a job site — no Mac on the same network required.

## Architecture

```
iPhone (any network)
    │
    ▼ HTTPS
Vercel (Next.js web)
    │  /api/* rewrites
    ▼ HTTPS
Render (Fastify API)
    ├── Claude (vision coaching)
    ├── Whisper (transcription)
    └── Supabase (sessions + training data)
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Camera won't open | URL must be `https://` — use Vercel, not `http://` |
| API 502 / timeout on first request | Render cold start — wait ~60s and retry |
| API 502 during coaching | Claude slow; if persistent, check Render logs. Do **not** point `NEXT_PUBLIC_API_URL` at Render — that exposes your API key in the browser bundle. |
| 413 payload too large | Frame compression is built in; keep `NEXT_PUBLIC_API_URL=same-origin` |
| "Supabase not configured" | Set `SUPABASE_*` on **Render**, redeploy API |
| Build fails on Vercel | Confirm **Root Directory** = `web` |
| Rewrites point at wrong API | `BACKEND_URL` must match Render URL; **redeploy** Vercel after changing it |

## Security — do not call Render from the browser

Never set `NEXT_PUBLIC_API_URL` to your Render URL or `NEXT_PUBLIC_FOREMAN_API_KEY` on Vercel.  
`NEXT_PUBLIC_*` values are embedded in the JavaScript bundle — anyone can extract your API key.

Always use:

```
NEXT_PUBLIC_API_URL=same-origin
BACKEND_URL=https://foreman-api-y31r.onrender.com
FOREMAN_API_KEY=<server-only secret>
ALLOWED_APP_ORIGINS=https://foreman-phi.vercel.app
```

The Vercel `/api/*` proxy injects the key server-side. Frames are compressed client-side to stay under Vercel's body limit.

## Local dev (unchanged)

Same Wi‑Fi testing still works:

```bash
npm run dev:phone
```

See [PHONE_TEST.md](PHONE_TEST.md).

## Costs (typical)

- **Vercel** — Hobby free tier is enough for personal testing
- **Render** — Free web service (with sleep); upgrade if you need always-on for demos
- **Anthropic + OpenAI + Supabase** — usage-based; monitor dashboards during heavy testing

## Cost guards and billing alerts

Backend API cost controls are enforced server-side in Fastify:

- Global default rate limit: `120 requests / minute / IP`
- `/analyse`: `30 requests / minute / IP`
- `/transcribe`: `20 requests / minute / IP`
- `/voice/*` (including `/voice/config`, `/voice/speak`, `/voice/convai-url`, `/voice/advice`): `60 requests / minute / IP`
- `/analyse` frame payload cap: `ANALYSE_FRAME_MAX_BYTES` (default `4194304` bytes of base64 payload)

If a `/analyse` request exceeds `ANALYSE_FRAME_MAX_BYTES`, the API returns `413 Payload Too Large` before the analyse handler runs.

Manual billing-alert operator recipe:

1. Anthropic Console: `Console -> Settings -> Billing -> Usage limits`
   - Set monthly and/or hard usage limits for the workspace used by Foreman.
   - Configure notifications at thresholds that fit your budget policy.
2. OpenAI Platform: `Platform -> Settings -> Limits`
   - Set spend limits and alerts for the project/organization serving Foreman.
   - Confirm alert recipients are the on-call/operator distribution list.

Mirroring this operator recipe into `SECURITY.md` is handled separately by the security owner.

## Reading production logs

When debugging a failed readiness check or a user-reported issue, pull logs from both hosts.

### Render (API — `foreman-api`)

**Dashboard:** [Render](https://dashboard.render.com) → select the **`foreman-api`** service → **Logs** tab (live tail).

**CLI** (if [Render CLI](https://render.com/docs/cli) is installed):

```bash
render logs --service foreman-api
```

API requests include an `x-request-id` response header (Fastify request id). Quote this id when escalating — it ties a browser/proxy request to a single backend log line.

### Vercel (web + `/api/*` proxy)

**Dashboard:** [Vercel](https://vercel.com) → your project → **Deployments** → select the latest deployment → **Logs**.

**CLI** (if [Vercel CLI](https://vercel.com/docs/cli) is installed):

```bash
vercel logs https://foreman-phi.vercel.app
```

Use the deployment URL from the deployment you are inspecting if it differs from production.

### Correlating with `x-request-id`

1. Run `npm run check-ready` (or `curl -i http://127.0.0.1:8080/ready`) and note the `x-request-id` value printed for the `/ready` call.
2. In Render logs, grep for that id:

```bash
render logs --service foreman-api | grep 'YOUR-REQUEST-ID-HERE'
```

On Vercel, function logs for proxied `/api/*` routes may show the same id when the backend forwarded it; filter the deployment log stream by the id string.
