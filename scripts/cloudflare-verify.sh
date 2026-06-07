#!/usr/bin/env bash
set -euo pipefail

ZONE="${CLOUDFLARE_ZONE:-unicityai.com.au}"
APP_URL="${FOREMAN_APP_URL:-https://foreman.${ZONE}}"
LANDING_URL="${FOREMAN_LANDING_URL:-https://go.${ZONE}}"
API_HEALTH="${FOREMAN_API_HEALTH:-https://foreman-api-y31r.onrender.com/health}"

echo "== Cloudflare / Foreman verify =="
echo "App:     ${APP_URL}"
echo "Landing: ${LANDING_URL}"
echo "API:     ${API_HEALTH}"

dig +short "foreman.${ZONE}" A | sed 's/^/  foreman A: /'
dig +short "go.${ZONE}" A | sed 's/^/  go A: /'

curl -fsS "${API_HEALTH}" | grep -q '"status":"ok"' && echo "API health ok"
curl -fsS "${APP_URL}/api/health" | grep -q '"status":"ok"' && echo "App proxy health ok"
curl -fsS -o /dev/null -w "Landing HTTP %{http_code}\n" "${LANDING_URL}/"

echo "Verify complete."
