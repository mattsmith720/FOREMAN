#!/usr/bin/env bash
# Fail CI when raw hex colors appear outside the token source.
set -euo pipefail
cd "$(dirname "$0")/.."

ALLOWLIST=(
  "web/styles/tokens.css"
  "web/styles/ui-primitives.css"
)

violations=0
while IFS= read -r line; do
  file="${line%%:*}"
  skip=0
  for allowed in "${ALLOWLIST[@]}"; do
    if [[ "$file" == "$allowed" ]]; then
      skip=1
      break
    fi
  done
  if [[ $skip -eq 1 ]]; then
    continue
  fi
  echo "$line"
  violations=$((violations + 1))
done < <(rg -n '#[0-9a-fA-F]{3,8}\b' web --glob '*.css' --glob '*.tsx' 2>/dev/null || true)

if [[ $violations -gt 0 ]]; then
  echo ""
  echo "FAIL: $violations raw hex value(s) outside web/styles/tokens.css"
  echo "Migrate to CSS variables from tokens.css."
  exit 1
fi

echo "PASS: no raw hex outside token files ($violations)"
