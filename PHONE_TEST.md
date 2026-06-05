# Test Foreman on your iPhone

Jarvis-style live coach: full-screen camera, microphone, AI coaching overlay, and training memory feedback.

## Test from any network (recommended for real use)

If your phone is **not** on the same Wi‑Fi as your Mac (cellular, job site, different network), deploy to Vercel + Render:

**→ [DEPLOY.md](DEPLOY.md)** — step-by-step; you get a permanent `https://` URL with no cert warnings.

## Test on same Wi‑Fi as your Mac (local dev)

## One-time setup

```bash
npm install
cp backend/.env.example backend/.env
cp web/.env.local.example web/.env.local
```

Fill `backend/.env`:

| Key | Required for |
|-----|----------------|
| `ANTHROPIC_API_KEY` | Vision coaching |
| `OPENAI_API_KEY` | Speech transcription |
| `SUPABASE_SERVICE_ROLE_KEY` | Sessions + memory storage (`SUPABASE_URL` already in `backend/.env`) |

Supabase project **uvlgbsiwyvtsjlqzozas** is provisioned (tables, RLS, `frames` bucket). Add keys to `backend/.env` — see below.

**Security:** If you previously committed real API keys to `.env.example`, rotate them in Anthropic/OpenAI dashboards.

## Start everything (one command)

```bash
npm run dev:phone
```

This starts:

- Backend on `http://0.0.0.0:8080`
- Web on **HTTPS** `https://0.0.0.0:3000` (required for iPhone camera/mic)
- API proxy: browser calls `/api/*` → backend (no mixed-content issues)

## On your iPhone

1. Same Wi‑Fi as your Mac
2. Safari → `https://<your-mac-ip>:3000` (script prints IP, e.g. `https://192.168.0.88:3000`)
3. Accept the certificate warning (self-signed dev cert)
4. Tap **I understand — enable camera & mic**
5. Allow camera and microphone
6. Tap **Start job**

## What you should see

- Full-screen camera with **Jarvis HUD** overlay
- **CAM ON** / **MIC ON** chips
- Hero cue updating every ~4 seconds (safety, quality, pitch, next step)
- **Heard** line when you speak
- **Training memory** feed: "Frame analysed — adding to training memory", "Dataset growing…"
- Voice readout for warning/critical cues (disable by muting phone)
- **Stop job** → session summary + Supabase record counts

## Simulate a tradie

Point the camera at a work scene and talk through what you're doing:

> "Installing rail brackets on the north roof. Checking fall protection anchor. Customer asked about payback period — quoted roughly thirty percent bill savings."

Foreman should:

- Observe install activity in the HUD
- Flag safety/quality if visible
- Critique pitch from your speech
- Log frames, transcript, and coaching to Supabase (training data moat)

## AI vs local memory

| Layer | Where it runs |
|-------|----------------|
| Vision + coaching | Claude via backend (cloud) |
| Speech-to-text | Whisper via backend (cloud) |
| Training memory | Supabase — every frame, transcript, coaching event stored for future model training |

There is no on-device LLM yet. The "training memory" UI reflects real data accumulation in Supabase — the moat described in CLAUDE.md.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Camera won't open | Must use **HTTPS** URL, not `http://192.168.x.x:3000` |
| Certificate warning | Expected — tap Advanced → Proceed (dev only) |
| "Supabase not configured" | Fill `SUPABASE_*` in `backend/.env`, restart backend |
| No transcription | Set `OPENAI_API_KEY` |
| No coaching | Set `ANTHROPIC_API_KEY` |
| Backend unreachable | Same Wi‑Fi; macOS firewall allow Node |

## Native iOS app (glasses path)

For Meta glasses instead of phone browser, see `native/ios/README.md`.
