# Foreman training roadmap

Foreman accumulates proprietary field data (frames, transcripts, coaching events, labels) in Supabase. This document describes how that data becomes a defensible moat through human-verified labels and local models.

## Current state (Iteration 0–1)

- **Vision coaching:** Claude Sonnet 4 via backend `/analyse`
- **Transcription:** OpenAI Whisper via `/transcribe`
- **Persistence:** `frames`, `transcript_segments`, `coaching_events`, `labels` (pseudo-labels from Claude)
- **No training loop yet** — data accumulation only

## Iteration A — Data foundation (in progress)

**Goal:** Store everything needed for export; distinguish Claude guesses from human truth.

| Deliverable | Status |
|-------------|--------|
| `labels.label_source` (`claude` \| `human` \| `corrected`) | SQL in `backend/supabase/training-iteration-a.sql` |
| `audio_segments` + private `audio` bucket | Same migration |
| `frames.transcript_window` for alignment | Same migration |
| `sessions.consent_at`, `data_retention` | Same migration |
| `POST /labels/confirm` stub | `backend/src/routes/labels.ts` |
| Export script | `backend/scripts/export-training-data.ts` |

**Apply migration:** Run `training-iteration-a.sql` in the Supabase SQL editor for project `uvlgbsiwyvtsjlqzozas`.

**Export:**

```bash
cd backend
npx tsx scripts/export-training-data.ts --out ./exports/dataset.jsonl --limit 20
```

**Important:** Pseudo-labels from Claude alone are not the moat. Human corrections on real jobs are the asset.

## Iteration B — Export and MLOps

- Scheduled dataset snapshots (GitHub Action or Render cron)
- Train/val split **by session** (never random frames from the same job)
- Baseline eval: safety-flag recall, install-phase accuracy on held-out sessions
- **Whisper fine-tune** on solar/trade vocabulary (first local win — cheaper than VLM)
- Stack options: Python sidecar, `whisper.cpp`, or `mlx` for local ASR experiments

## Iteration C — Local vision coach and continual loop

- Distill Claude outputs → smaller VLM or classifier heads (phase + safety triage)
- Hybrid backend inference: fast local/heuristic path + Claude for hard frames
- Continual retrain when N new **human-verified** sessions accumulate; shadow deploy; promote on eval
- Native path: CoreML weights in `native/ios/` for glasses iteration; same `FrameSource` seam

## Privacy (AU pilot)

- Consent captured in UI before recording (`sessions.consent_at` when wired)
- Default retention policy: `pilot_90d` — confirm with legal before production pilot
- Frames and audio in private buckets; access via service role only

## What not to do yet

- Full on-device VLM inference
- Customer-facing annotation UI (API stub only for now)
- Training on Claude-only labels without human verification
