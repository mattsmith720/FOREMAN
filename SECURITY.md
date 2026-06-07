# Security

Audit date: 2026-06-06 (CISO sweep on `orch/foreman-production-ready/ciso-security`).
Foreman handles sensitive job footage, transcripts, and worker data.

## Incident response

A Supabase service role JWT was briefly committed in `backend/.env.example`.
**Rotate that key immediately** — see [SECURITY_INCIDENT.md](SECURITY_INCIDENT.md).

## What is locked down

| Control | Implementation | Evidence on this branch |
|---|---|---|
| **Secrets in git** | `.env` gitignored; gitleaks runs on every push and PR with full git history. | `.github/workflows/gitleaks.yml`, `.gitleaks.toml`. Local `gitleaks detect` on HEAD + history: zero leaks. |
| **Supabase RLS** | All tables RLS on, no public policies. | `backend/supabase/schema.sql` (not modified on this branch). |
| **Storage bucket** | `frames` private + explicit deny policies for `public` role. | `backend/supabase/schema.sql`. |
| **Service role** | Backend/Render only — never in web or native clients. | `rg 'NEXT_PUBLIC_(FOREMAN_API_KEY\|ANTHROPIC\|OPENAI\|SUPABASE_SERVICE_ROLE)' web/` returns no matches. |
| **Session access** | HMAC `x-session-token` issued at session start; required on analyse, transcribe, stop, get. | `backend/src/session-token.ts`, `backend/src/require-session-token.ts`. |
| **API key** | `FOREMAN_API_KEY` required in production; timing-safe compare. | `backend/src/auth.ts` (`crypto.timingSafeEqual`). |
| **Vercel proxy origin gate** | Origin and Referer headers parsed as URLs; only configured `ALLOWED_APP_ORIGINS` and same-project `*.vercel.app` previews pass. Substring-style bypasses (e.g. `Referer: https://attacker/?ref=foo.vercel.app`) are explicitly rejected. | `web/middleware.ts`, `web/middleware.test.ts` (10 cases). |
| **No client secrets** | Repo grep for `NEXT_PUBLIC_(FOREMAN_API_KEY\|ANTHROPIC\|OPENAI\|SUPABASE_SERVICE_ROLE\|SUPABASE_URL)` under `web/` returns zero matches. | Verified by gitleaks workflow + manual `rg`. |
| **CORS** | Explicit `CORS_ORIGINS` required in production; wildcard rejected. | `backend/src/config.ts`, `backend/src/assert-production-security.ts`. |
| **Input validation** | Zod on all routes; image magic-byte sniffing; audio MIME allowlist. | `backend/src/validate-media.ts`, `backend/src/validate-media.test.ts`. |
| **Error responses** | Generic client messages; details logged server-side only. | `backend/src/api-error.ts`. |
| **Rate limiting** | Per-IP via `X-Forwarded-For`; 120/min global; tighter on AI routes (`/analyse` 30/min, `/transcribe` 30/min, `/voice/speak` 30/min, `/voice/advice` 15/min). Other routes (sessions, labels, review, notes, ops) use the global 120/min cap. | `backend/src/index.ts` + `backend/src/routes/*`; integration test in `backend/src/rate-limit.test.ts` proves the (cap+1)th call returns `429` for each route. See [DEPLOY.md](DEPLOY.md) § Cost guards for operator-facing caps after SRE integration. |
| **Security headers** | Helmet on API. | `backend/src/index.ts`. |
| **Production boot guard** | API throws on import in production if `FOREMAN_API_KEY` or `CORS_ORIGINS` is missing or wildcard. | `backend/src/assert-production-security.ts`, `backend/src/assert-production-security.test.ts` — including a child-process boot test that asserts non-zero exit. |

## Required production environment

### Render (`foreman-api`)

| Variable | Required |
|----------|----------|
| `FOREMAN_API_KEY` | Yes — long random secret. |
| `CORS_ORIGINS` | Yes — explicit list, e.g. `https://foreman-phi.vercel.app`. Wildcard `*` is rejected at boot. |
| `SUPABASE_URL` | Yes. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes — JWT (`eyJ...`). Rotate if leaked. |
| `ANTHROPIC_API_KEY` | Yes. |
| `OPENAI_API_KEY` | Yes. |
| `ELEVENLABS_API_KEY` | Optional — TTS + ConvAI. |
| `ELEVENLABS_AGENT_ID` | Optional — required only for live voice coach. |
| `SESSION_TOKEN_SECRET` | Optional — defaults to `FOREMAN_API_KEY`. |
| `OPS_PASSWORD` | Required to use `/ops` — gates the internal dashboard; `/ops` fails closed in production without it. |
| `INGEST_WEBHOOK_SECRET` | Optional — required only for site-video ingest webhooks. |
| `AUDIO_PERSIST` | Optional — `true` persists raw audio (Whisper prep). Default off. |

### Vercel (`web`)

| Variable | Required |
|----------|----------|
| `BACKEND_URL` | Yes — `https://foreman-api-y31r.onrender.com` (Render API URL). Server-side only. |
| `FOREMAN_API_KEY` | Yes — same value as Render. Server-side only. |
| `NEXT_PUBLIC_API_URL` | Set to `same-origin` so the browser hits the Vercel proxy. |
| `ALLOWED_APP_ORIGINS` | Yes — comma-separated, e.g. `https://foreman-phi.vercel.app`. |

**Never** set `NEXT_PUBLIC_FOREMAN_API_KEY` or any AI/Supabase keys on Vercel.
The gitleaks workflow + the repo grep above keep us honest.

## Known limitations (Iteration 1–2)

- No per-user login yet — session UUID + HMAC token is the guard.
- Vercel origin middleware blocks casual abuse and the substring bypasses
  exercised in `web/middleware.test.ts`. Determined attackers can still spoof
  arbitrary headers when calling the Render API directly — the
  `FOREMAN_API_KEY`, the rate limiter, and the production boot guard are the
  backstop.
- The `*.vercel.app` allowance is intentional so preview deployments work.
  This trusts that nobody else publishes a Vercel project that knows our
  `FOREMAN_API_KEY`. If we ever stop relying on previews, narrow this in
  `web/middleware.ts`.
- Pre-job consent overlay with AU privacy wording is implemented in the web
  client (`web/components/camera-coach.tsx`, `web/components/consent-gate-policy.ts`).
  Legal review and a customer-facing pilot consent process are still required
  before live pilot with real customers — see `CLAUDE.md`.

## Verify locally

```bash
# Boot guard + rate-limit + middleware tests
cd backend && npm test
cd web && npm test

# Gitleaks (requires the v8.18.4 binary, see workflow)
gitleaks detect --no-banner --redact --config .gitleaks.toml -s . --log-level info

# No client-bundle secrets
rg 'NEXT_PUBLIC_(FOREMAN_API_KEY|ANTHROPIC|OPENAI|SUPABASE_SERVICE_ROLE|SUPABASE_URL)' web/

npm run check-ready
```

## Verify production

```bash
curl https://foreman-api-y31r.onrender.com/health
# → {"status":"ok"}

curl -H "x-foreman-api-key: YOUR_KEY" https://foreman-api-y31r.onrender.com/ready
# → feature booleans (anthropic, openai, supabase, transcription)

curl https://foreman-phi.vercel.app/api/health
# → {"status":"ok"}
```

First request after Render idle sleep may take **30–60 seconds** (free-tier cold start).

## Dependency updates

Dependabot opens weekly npm PRs (`.github/dependabot.yml`).
Review and merge security patches promptly.
