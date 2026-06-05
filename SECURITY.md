# Security

Audit date: 2026-06-05. This document tracks posture and lockdown for Foreman.

## What is locked down

| Control | Implementation |
|---------|----------------|
| **Secrets in git** | `.env` gitignored; no keys in tracked files |
| **Supabase RLS** | All tables RLS on, no public policies |
| **Storage bucket** | `frames` private + explicit deny policies |
| **Service role** | Backend/Render only — never in web client |
| **Input validation** | Zod on all routes; UUID params; MIME allowlist |
| **Error responses** | Generic client messages; details server-side only |
| **Rate limiting** | 120/min global; 20/min analyse; 30/min transcribe |
| **Security headers** | `@fastify/helmet` on API |
| **CORS** | Configurable via `CORS_ORIGINS` (set on Render) |
| **API key** | Optional `FOREMAN_API_KEY` — Vercel proxy injects header |
| **Vercel proxy** | Runtime route handlers (not build-time rewrites) |

## Optional hardening (recommended for production)

1. Set `FOREMAN_API_KEY` on **Render** and **Vercel** (same value).
2. Set `CORS_ORIGINS=https://foreman-phi.vercel.app` on Render.
3. Rotate keys if `.env` was ever shared.
4. Set Anthropic/OpenAI spend limits before pilot testing.

## Known limitations (Iteration 1–2)

- No per-user auth yet — session UUIDs are the only guard.
- API key protects direct Render access; Vercel proxy holds the key server-side.
- Claude calls may exceed Vercel Hobby function timeout — use Render direct URL fallback if needed.

## Verify

```bash
# Backend readiness (local)
curl http://localhost:8080/ready

# API key required when FOREMAN_API_KEY is set
curl -H "X-Foreman-Api-Key: your-key" http://localhost:8080/health
```
