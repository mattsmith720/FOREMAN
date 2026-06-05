# Security

Audit date: 2026-06-05 (post-incident lockdown). Foreman handles sensitive job footage, transcripts, and worker data.

## Incident response

A Supabase service role JWT was briefly committed in `backend/.env.example`. **Rotate that key immediately** — see [SECURITY_INCIDENT.md](SECURITY_INCIDENT.md).

## What is locked down

| Control | Implementation |
|---------|----------------|
| **Secrets in git** | `.env` gitignored; gitleaks CI on push; no keys in tracked files |
| **Supabase RLS** | All tables RLS on, no public policies |
| **Storage bucket** | `frames` private + explicit deny policies for `public` role |
| **Service role** | Backend/Render only — never in web or native clients |
| **Session access** | HMAC session token issued at start; required on analyse/transcribe/stop/get |
| **API key** | `FOREMAN_API_KEY` required in production; timing-safe compare |
| **Vercel proxy** | Origin/referer gate on `/api/*`; server injects API key to Render |
| **No client secrets** | Never use `NEXT_PUBLIC_*` for API keys |
| **CORS** | Explicit `CORS_ORIGINS` required in production |
| **Input validation** | Zod on all routes; image magic bytes; audio MIME allowlist |
| **Error responses** | Generic client messages; details logged server-side only |
| **Rate limiting** | Per client IP via `X-Forwarded-For`; 120/min global; tighter on AI routes |
| **Security headers** | Helmet on API; X-Frame-Options, nosniff, Permissions-Policy on web |
| **Production boot** | API refuses to start without `FOREMAN_API_KEY` + `CORS_ORIGINS` |

## Required production environment

### Render (`foreman-api`)

| Variable | Required |
|----------|----------|
| `FOREMAN_API_KEY` | Yes — long random secret |
| `CORS_ORIGINS` | Yes — e.g. `https://foreman-phi.vercel.app` |
| `SUPABASE_URL` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes — JWT `eyJ...` only, rotate if leaked |
| `ANTHROPIC_API_KEY` | Yes |
| `OPENAI_API_KEY` | Yes |
| `SESSION_TOKEN_SECRET` | Optional — defaults to `FOREMAN_API_KEY` |

### Vercel (`web`)

| Variable | Required |
|----------|----------|
| `BACKEND_URL` | Yes — Render API URL |
| `FOREMAN_API_KEY` | Yes — same value as Render |
| `NEXT_PUBLIC_API_URL` | `same-origin` |
| `ALLOWED_APP_ORIGINS` | Yes — e.g. `https://foreman-phi.vercel.app` |

**Never** set `NEXT_PUBLIC_FOREMAN_API_KEY` or any AI/Supabase keys on Vercel.

## Known limitations (Iteration 1–2)

- No per-user login yet — session UUID + token is the guard.
- Vercel origin middleware blocks casual abuse; determined attackers can spoof headers — rate limits and API key on Render are the backstop.
- AU privacy / customer consent flow not complete — see `CLAUDE.md` before live pilot with customers.

## Verify

```bash
npm run check-ready

# Production API (requires key)
curl -H "x-foreman-api-key: YOUR_KEY" https://foreman-api-y31r.onrender.com/ready

# Session flow
curl -X POST -H "Content-Type: application/json" \
  -H "x-foreman-api-key: YOUR_KEY" \
  -d '{"jobType":"solar_install"}' \
  https://foreman-api-y31r.onrender.com/sessions/start
```

## Dependency updates

Dependabot opens weekly npm PRs. Review and merge security patches promptly.
