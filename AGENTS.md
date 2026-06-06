# AGENTS.md

## Cursor Cloud specific instructions

Foreman is an **npm workspaces** monorepo (`shared`, `backend`, `web`). Native iOS (`native/ios/`) is macOS/Xcode-only and is out of scope for Linux cloud VMs.

### Services (local dev)

| Service | Port | Start |
|---------|------|-------|
| Backend (Fastify) | 8080 | `npm run dev:backend` |
| Web (Next.js) | 3000 | `npm run dev:web` |

Use **tmux** for long-running dev servers. Health checks: `GET http://127.0.0.1:8080/health` (public) and `GET http://127.0.0.1:3000/api/health` (proxies to backend).

### First-time env setup (not in update script)

```bash
cp backend/.env.example backend/.env
cp web/.env.local.example web/.env.local
```

Fill `backend/.env` with at least `ANTHROPIC_API_KEY` for vision coaching. Optional: `OPENAI_API_KEY`, `SUPABASE_*`, `ELEVENLABS_*`, `FOREMAN_API_KEY`. See `backend/.env.example` for the full list.

**Auth in dev:** If `FOREMAN_API_KEY` is unset and `NODE_ENV` is not `production`, the backend skips API-key checks (except `/health`). Setting `FOREMAN_API_KEY` enables auth locally — pass `x-foreman-api-key` on requests and mirror the same value in `web/.env.local` for the Next.js API proxy.

### Verify

```bash
npm test                    # backend + web unit tests (run per workspace)
npm run build               # shared + backend + web production build
npm run check-ready         # env keys + optional production smoke (needs secrets + running backend)
```

`npm run lint` in `web/` may prompt for ESLint setup interactively; `next build` already type-checks and lints the app.

### CLI smoke (Iteration 0)

With backend running and `ANTHROPIC_API_KEY` set:

```bash
cd backend && npm run analyse-sample -- sample/roof.jpg
```

### Gotchas

- No docker-compose or local Postgres — Supabase is cloud-hosted.
- `/ready` requires `x-foreman-api-key` when `FOREMAN_API_KEY` is set; use `/health` for unauthenticated liveness.
- `npm run analyse-sample` paths are relative to `backend/` (e.g. `sample/roof.jpg`, not `backend/sample/roof.jpg` from repo root).
- Production phone testing uses Vercel + Render (`DEPLOY.md`); local iPhone dev needs `npm run dev:phone` (HTTPS) on a Mac on the same Wi‑Fi.
