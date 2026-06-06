# Foreman

AI coaching layer for field work teams (starting with solar installers). A wearable camera
and microphone watch the job; the backend analyses frames with Claude and returns structured
coaching in real time. See [CLAUDE.md](CLAUDE.md) for the full mission, architecture, and
roadmap.

**Production:** [foreman-phi.vercel.app](https://foreman-phi.vercel.app) (web) · [foreman-api-y31r.onrender.com](https://foreman-api-y31r.onrender.com) (API)

## Layout

```
foreman/
├── shared/    @foreman/shared — coaching zod schema + FrameSource interface (consumed by both clients/backend)
├── backend/   Node + TypeScript + Fastify. Owns the Claude call, schema, transcription, persistence.
├── web/       Next.js 14 (App Router) + TypeScript. The phone camera prototype.
└── native/ios/  Swift iOS app — Meta DAT + MockDeviceKit (glasses path)
```

The camera feed sits behind the `FrameSource` interface (`shared`) so the source can be
swapped (phone web camera now, Meta glasses later) without touching the pipeline.

## Prerequisites

- Node 18.18+ (Node 20+ recommended)
- npm 8+ (this repo uses npm workspaces)

## Install

```bash
npm install
```

`npm install` installs every workspace and then builds `@foreman/shared` (via the root
`postinstall`) so `backend` and `web` can import it. If you change anything in `shared/src`,
rebuild it with `npm run build:shared` (or run `npm run dev --workspace @foreman/shared` to
watch).

## Configure

```bash
cp backend/.env.example backend/.env       # then fill in ANTHROPIC_API_KEY + Supabase keys
cp web/.env.local.example web/.env.local   # optional: sets the backend URL for the web client
```

Secrets live only in `.env` files (git-ignored). Never commit keys.

## Run on your iPhone

**Any network (cellular, job site):** deploy to Vercel + Render — see [DEPLOY.md](DEPLOY.md).
On the production stack, the first API request after Render idle sleep may take **30–60 seconds** (free-tier cold start).

**Same Wi‑Fi as your Mac (local dev):**

```bash
npm run dev:phone
```

Opens HTTPS on port 3000 with camera + mic support. See [PHONE_TEST.md](PHONE_TEST.md).

## Run (desktop / two terminals)

```bash
npm run dev:backend   # Fastify on http://localhost:8080  (GET /health, GET /ready)
npm run dev:web       # Next.js  on http://localhost:3000
```

## Native iOS (glasses path)

See [native/ios/README.md](native/ios/README.md). Uses Meta Wearables DAT 0.7 with MockDeviceKit (phone back camera as mock glasses feed). Calls the same backend — no API changes.

```bash
cd native/ios && xcodegen generate && open Foreman.xcodeproj
```

<!-- TODO: xcodegen generate requires macOS — see native/ios/README.md § Gap: xcodegen not available in CI for manual Mac smoke steps -->

## Build

```bash
npm run build         # builds shared, backend, and web
```

## Verify

```bash
npm run check-ready   # local keys, unit tests, production health probes
npm run smoke         # E2E API walk: sessions → analyse → transcribe → stop (needs BASE_URL + FOREMAN_API_KEY)
```

See [DEPLOY.md](DEPLOY.md) for production smoke examples.

## What you need to do next

**Phone testing — start here:** **[YOUR_ACTIONS.md](YOUR_ACTIONS.md)** (what you need to do)

Also: [PHONE_READY.md](PHONE_READY.md) · [PHONE_DEMO.md](PHONE_DEMO.md) · [SECURITY.md](SECURITY.md)

Security posture: **[SECURITY.md](SECURITY.md)**
