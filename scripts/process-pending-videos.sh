#!/usr/bin/env bash
# Process queued site videos into sessions / frames / transcript_segments.
#
#   Local (needs ffmpeg):   scripts/process-pending-videos.sh
#   Remote (Render cron):    scripts/process-pending-videos.sh --remote
#
# --remote POSTs /ingest/process-pending with INGEST_WEBHOOK_SECRET so a cron
# host without ffmpeg can trigger processing on a Render instance that has it
# (default Render free tier has no ffmpeg — run locally instead).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-local}"

if [ "$MODE" = "--remote" ] || [ "$MODE" = "remote" ]; then
  : "${FOREMAN_API_URL:=https://foreman-api-y31r.onrender.com}"
  : "${INGEST_WEBHOOK_SECRET:?Set INGEST_WEBHOOK_SECRET to trigger remote processing}"
  echo "Triggering remote processing at ${FOREMAN_API_URL}/ingest/process-pending"
  curl -fsS -X POST "${FOREMAN_API_URL}/ingest/process-pending" \
    -H "x-ingest-webhook-secret: ${INGEST_WEBHOOK_SECRET}"
  echo ""
else
  echo "Processing pending site videos locally (requires ffmpeg on PATH)..."
  cd "$ROOT/backend"
  npm run process-videos
fi
