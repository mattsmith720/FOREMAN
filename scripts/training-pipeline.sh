#!/usr/bin/env bash
# Export Foreman training data after site videos are processed.
# Full model training (Whisper fine-tune, VLM distill) is Iteration B — export is step 1.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/backend/.env"
OUT="${1:-$ROOT/backend/exports/training-$(date +%Y%m%d).jsonl}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing backend/.env — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

echo "Processing any pending site videos (requires ffmpeg)..."
(cd "$ROOT/backend" && npm run process-videos) || echo "○ process-videos skipped or failed"

echo "Exporting training JSONL → $OUT"
cd "$ROOT/backend"
npx tsx scripts/export-training-data.ts --out "$OUT" --limit 200

echo "Done. Next: Iteration B — train/val split by session, Whisper fine-tune (see TRAINING_ROADMAP.md)"
