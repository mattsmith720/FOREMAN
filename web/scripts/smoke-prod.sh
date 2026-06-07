#!/usr/bin/env bash
set -euo pipefail

WEB_URL="${WEB_URL:-https://foreman-phi.vercel.app}"
API_URL="${API_URL:-https://foreman-api-y31r.onrender.com}"

echo "== Foreman prod smoke =="
echo "Web: $WEB_URL"
echo "API: $API_URL"

curl -fsS "$API_URL/health" | grep -q '"status":"ok"' && echo "API health ok"
curl -fsS "$WEB_URL/api/health" | grep -q '"status":"ok"' && echo "Web proxy health ok"

curl -fsS -o /dev/null -w "Field app HTTP %{http_code}\n" "$WEB_URL/"
curl -fsS -o /dev/null -w "Ops HTTP %{http_code}\n" "$WEB_URL/ops"
curl -fsS -o /dev/null -w "Training HTTP %{http_code}\n" "$WEB_URL/training"

echo "Smoke complete."
