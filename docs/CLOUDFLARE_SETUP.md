# Cloudflare setup — Foreman on unicityai.com.au

Foreman runs on **Vercel** (web + landing) and **Render** (API). **Cloudflare** manages DNS for `unicityai.com.au` and optionally hosts a keep-warm cron worker.

## URLs (target state)

| Surface | URL |
|---------|-----|
| Field app | https://foreman.unicityai.com.au |
| Marketing | https://go.unicityai.com.au |
| API (direct) | https://foreman-api-y31r.onrender.com |
| API (phone) | Same-origin via `foreman.unicityai.com.au/api/*` |

Legacy Vercel URLs keep working: `foreman-phi.vercel.app`, `landing-lac-mu.vercel.app`.

---

## 1. Vercel custom domains (done in repo setup)

```bash
cd web && vercel domains add foreman.unicityai.com.au
cd landing && vercel domains add go.unicityai.com.au
```

Vercel expects **A records** → `76.76.21.21` for each subdomain.

---

## 2. Cloudflare DNS

### Option A — script (recommended)

1. Create API token: [Cloudflare dashboard](https://dash.cloudflare.com/profile/api-tokens) → **Edit zone DNS** for `unicityai.com.au`.
2. Put the real token in **`backend/.env`** only (never `backend/.env.example`):

```bash
CLOUDFLARE_API_TOKEN=your-token-here
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_ZONE=unicityai.com.au
```

3. Run:

```bash
chmod +x scripts/cloudflare-dns-setup.sh scripts/cloudflare-verify.sh
./scripts/cloudflare-dns-setup.sh
./scripts/cloudflare-verify.sh
```

The DNS script auto-loads `backend/.env` if present.

Creates/updates:

| Name | Type | Value | Proxy |
|------|------|-------|-------|
| `foreman` | A | `76.76.21.21` | ON (default) |
| `go` | A | `76.76.21.21` | ON (default) |

**SSL/TLS** in Cloudflare → **Full** (not Flexible) when proxy is ON.

### Option B — dashboard

Cloudflare → **unicityai.com.au** → DNS → add the two A records above.

---

## 3. Vercel environment variables

### Web project (`foreman`)

| Variable | Production value |
|----------|------------------|
| `ALLOWED_APP_ORIGINS` | `https://foreman-phi.vercel.app,https://foreman.unicityai.com.au` |
| `BACKEND_URL` | `https://foreman-api-y31r.onrender.com` |
| `NEXT_PUBLIC_API_URL` | `same-origin` |

Redeploy after changes: `cd web && vercel --prod`

### Landing project (`landing`)

| Variable | Production value |
|----------|------------------|
| `NEXT_PUBLIC_SITE_URL` | `https://go.unicityai.com.au` |
| `NEXT_PUBLIC_APP_URL` | `https://foreman.unicityai.com.au` |
| `NEXT_PUBLIC_DEMO_URL` | `https://foreman.unicityai.com.au/demo` |

Redeploy: `cd landing && vercel --prod`

---

## 4. Render API CORS

Render dashboard → **foreman-api** → Environment:

```
CORS_ORIGINS=https://foreman-phi.vercel.app,https://foreman.unicityai.com.au,https://go.unicityai.com.au
```

Redeploy API after updating.

---

## 5. Optional — Cloudflare Worker keep-warm

Pings Render `/health` every 10 minutes (free tier cron).

```bash
cd cloudflare
npx wrangler login
npx wrangler deploy
```

Disable `.github/workflows/keep-warm.yml` if you rely on the worker instead.

---

## 6. iPhone test

1. Open **https://foreman.unicityai.com.au** in Safari.
2. `curl https://foreman.unicityai.com.au/api/health` → `{"status":"ok"}`.
3. Start job → coaching → end job.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| SSL handshake error | Cloudflare SSL mode → **Full** |
| `/api/*` 403 Forbidden | Add custom origin to `ALLOWED_APP_ORIGINS` on Vercel; redeploy web |
| Domain stuck on Vercel “Invalid configuration” | Confirm A records in Cloudflare; wait 5–10 min |
| API CORS errors from landing | Add `go.unicityai.com.au` to Render `CORS_ORIGINS` |
