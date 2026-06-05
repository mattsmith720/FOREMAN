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
check_env_key "FOREMAN_API_KEY" "Foreman API key"

if grep -q "^ELEVENLABS_API_KEY=" "$ENV_FILE" 2>/dev/null && [ -n "$(grep "^ELEVENLABS_API_KEY=" "$ENV_FILE" 2>/dev/null | cut -d= -f2-)" ]; then
  green "✓ ElevenLabs voice (TTS)"
else
  yellow "○ ELEVENLABS_API_KEY not set — coaching voice disabled"
fi

echo ""
echo "Unit tests"
if (cd "$ROOT/backend" && npm test 2>/dev/null); then
  green "✓ Backend tests"
else
  yellow "○ Backend tests failed or unavailable"
fi

if (cd "$ROOT/web" && npm test 2>/dev/null); then
  green "✓ Web tests"
else
  yellow "○ Web tests failed or unavailable"
fi

echo ""
echo "Local backend health"
if curl -sf http://127.0.0.1:8080/health >/dev/null 2>&1; then
  green "✓ Backend running at http://127.0.0.1:8080"
  curl -s http://127.0.0.1:8080/ready | python3 -m json.tool 2>/dev/null || true

  if [ -f "$ENV_FILE" ]; then
    API_KEY="$(grep "^FOREMAN_API_KEY=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' || true)"
    if [ -n "$API_KEY" ]; then
      echo ""
      echo "Local API smoke (session start → analyse)"
      SESSION_JSON="$(curl -sf -X POST http://127.0.0.1:8080/sessions/start \
        -H "Content-Type: application/json" \
        -H "x-foreman-api-key: $API_KEY" \
        -d '{"jobType":"smoke_test"}' 2>/dev/null || echo "")"

      if [ -n "$SESSION_JSON" ]; then
        SESSION_ID="$(echo "$SESSION_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['session']['id'])" 2>/dev/null || echo "")"
        TOKEN="$(echo "$SESSION_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null || echo "")"
        if [ -n "$SESSION_ID" ] && [ -n "$TOKEN" ]; then
          green "✓ Session start ($SESSION_ID)"
          TINY_JPEG="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q=="
          ANALYSE_CODE="$(curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:8080/analyse \
            -H "Content-Type: application/json" \
            -H "x-foreman-api-key: $API_KEY" \
            -H "x-session-token: $TOKEN" \
            -d "{\"image\":\"$TINY_JPEG\",\"sessionId\":\"$SESSION_ID\"}" 2>/dev/null || echo "000")"
          if [ "$ANALYSE_CODE" = "200" ]; then
            green "✓ Analyse with session token"
          else
            yellow "○ Analyse returned HTTP $ANALYSE_CODE (Claude/Supabase may be unavailable)"
          fi
          curl -sf -X POST "http://127.0.0.1:8080/sessions/$SESSION_ID/stop" \
            -H "x-foreman-api-key: $API_KEY" \
            -H "x-session-token: $TOKEN" >/dev/null 2>&1 || true
        else
          yellow "○ Session start response missing id/token"
        fi
      else
        yellow "○ Session start failed — is FOREMAN_API_KEY set?"
      fi
    fi
  fi
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
  echo "Debug capture stats: append ?debug=1 to the URL"
else
  yellow "Not fully ready — see PHONE_READY.md"
  exit 1
fi
