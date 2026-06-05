#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/backend/.env"
FAIL=0

red() { printf "\033[31m%s\033[0m\n" "$1"; }
green() { printf "\033[32m%s\033[0m\n" "$1"; }
yellow() { printf "\033[33m%s\033[0m\n" "$1"; }

check_env_key() {
  local key="$1"
  local label="$2"
  if [ ! -f "$ENV_FILE" ]; then
    red "✗ backend/.env missing — run: cp backend/.env.example backend/.env"
    FAIL=1
    return
  fi
  local value
  value="$(grep "^${key}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- || true)"
  if [ -z "$value" ]; then
    red "✗ $label ($key) not set in backend/.env"
    FAIL=1
  else
    green "✓ $label"
  fi
}

echo "=== Foreman readiness check ==="
echo ""

echo "Local backend (.env)"
check_env_key "ANTHROPIC_API_KEY" "Anthropic (vision coaching)"
check_env_key "OPENAI_API_KEY" "OpenAI (transcription)"
check_env_key "SUPABASE_SERVICE_ROLE_KEY" "Supabase service role"
check_env_key "SUPABASE_URL" "Supabase URL"

echo ""
echo "Local backend health"
if curl -sf http://127.0.0.1:8080/health >/dev/null 2>&1; then
  green "✓ Backend running at http://127.0.0.1:8080"
  curl -s http://127.0.0.1:8080/ready | python3 -m json.tool 2>/dev/null || true
else
  yellow "○ Backend not running (start with: npm run dev:backend)"
fi

echo ""
echo "Production (Vercel)"
VERCEL_HEALTH="$(curl -s -o /dev/null -w "%{http_code}" https://foreman-phi.vercel.app/api/health 2>/dev/null || echo "000")"
if [ "$VERCEL_HEALTH" = "200" ]; then
  green "✓ https://foreman-phi.vercel.app/api/health"
else
  red "✗ Vercel API not healthy (HTTP $VERCEL_HEALTH) — need Render + BACKEND_URL on Vercel"
  FAIL=1
fi

SITE_CODE="$(curl -s -o /dev/null -w "%{http_code}" https://foreman-phi.vercel.app 2>/dev/null || echo "000")"
if [ "$SITE_CODE" = "200" ]; then
  green "✓ https://foreman-phi.vercel.app (UI)"
else
  red "✗ Vercel UI unreachable (HTTP $SITE_CODE)"
  FAIL=1
fi

echo ""
if [ "$FAIL" -eq 0 ]; then
  green "Ready for phone testing."
  echo ""
  echo "Open on iPhone: https://foreman-phi.vercel.app"
else
  yellow "Not fully ready — see PHONE_READY.md"
  exit 1
fi
