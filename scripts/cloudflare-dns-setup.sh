#!/usr/bin/env bash
# Create Foreman DNS records in Cloudflare for unicityai.com.au (or CLOUDFLARE_ZONE).
# Requires: CLOUDFLARE_API_TOKEN with Zone.DNS Edit on the zone.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "${ROOT}/backend/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/backend/.env"
  set +a
fi

ZONE_NAME="${CLOUDFLARE_ZONE:-unicityai.com.au}"
VERCEL_IP="${VERCEL_A_RECORD_IP:-76.76.21.21}"
PROXIED="${CLOUDFLARE_PROXIED:-true}"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Set CLOUDFLARE_API_TOKEN (Zone.DNS Edit)." >&2
  echo "Create at: https://dash.cloudflare.com/profile/api-tokens" >&2
  exit 1
fi

api() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  local response
  if [[ -n "$data" ]]; then
    response=$(curl -sS -X "$method" "https://api.cloudflare.com/client/v4${path}" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data "$data")
  else
    response=$(curl -sS -X "$method" "https://api.cloudflare.com/client/v4${path}" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}")
  fi
  if ! echo "$response" | python3 -c 'import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get("success") else 1)' 2>/dev/null; then
    echo "Cloudflare API error on ${method} ${path}:" >&2
    echo "$response" | python3 -m json.tool 2>/dev/null >&2 || echo "$response" >&2
    echo "Token needs Zone → DNS → Edit for ${ZONE_NAME}. Create at https://dash.cloudflare.com/profile/api-tokens" >&2
    exit 1
  fi
  echo "$response"
}

echo "== Cloudflare DNS setup for ${ZONE_NAME} =="

ZONE_ID=$(api GET "/zones?name=${ZONE_NAME}" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["result"][0]["id"] if d.get("result") else "")')
if [[ -z "$ZONE_ID" ]]; then
  echo "Zone not found: ${ZONE_NAME}" >&2
  exit 1
fi
echo "Zone ID: ${ZONE_ID}"

upsert_a() {
  local name="$1"
  local existing
  existing=$(api GET "/zones/${ZONE_ID}/dns_records?type=A&name=${name}.${ZONE_NAME}" | python3 -c 'import json,sys; r=json.load(sys.stdin)["result"]; print(r[0]["id"] if r else "")')
  local body
  body=$(python3 -c "import json; print(json.dumps({'type':'A','name':'${name}','content':'${VERCEL_IP}','proxied':${PROXIED}}))")
  if [[ -n "$existing" ]]; then
    echo "Updating A ${name}.${ZONE_NAME} -> ${VERCEL_IP}"
    api PUT "/zones/${ZONE_ID}/dns_records/${existing}" "$body" >/dev/null
  else
    echo "Creating A ${name}.${ZONE_NAME} -> ${VERCEL_IP}"
    api POST "/zones/${ZONE_ID}/dns_records" "$body" >/dev/null
  fi
}

# Vercel custom domains (already added to projects via vercel domains add)
upsert_a "foreman"
upsert_a "go"

echo ""
echo "Done. Verify in ~2 min:"
echo "  curl -fsS https://foreman.${ZONE_NAME}/api/health"
echo "  curl -fsS -o /dev/null -w '%{http_code}\n' https://go.${ZONE_NAME}/"
