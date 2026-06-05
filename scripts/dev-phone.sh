#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo 'YOUR_MAC_IP')"

echo "=== Foreman phone dev ==="
echo ""
echo "1. Ensure backend/.env is filled — see PHONE_READY.md"
echo "   Run: npm run check-ready"
echo "2. On iPhone (same Wi-Fi), open:"
echo "   https://${LAN_IP}:3000"
echo "3. Accept the self-signed certificate warning in Safari"
echo "4. Tap I understand → Start job"
echo ""
echo "Backend proxy: web /api/* → http://127.0.0.1:8080"
echo ""

cd "$ROOT"
npm run dev:backend &
BACKEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 2
BACKEND_URL=http://127.0.0.1:8080 npm run dev:phone --workspace web
