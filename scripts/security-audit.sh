#!/usr/bin/env bash
# D3 security sweep helper — PATCH/MINOR audit only; majors remain operator-gated.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== npm audit (moderate+) ==="
npm audit --audit-level=moderate || true

echo "=== gitleaks (if installed) ==="
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks detect --source . --verbose --no-git
else
  echo "gitleaks not installed locally — CI workflow covers pushes."
fi

echo "=== client secret grep ==="
if rg 'NEXT_PUBLIC_(FOREMAN_API_KEY|ANTHROPIC|OPENAI|SUPABASE_SERVICE_ROLE)' web/; then
  echo "FAIL: client-exposed secret pattern found"
  exit 1
fi
echo "PASS: no client secret patterns in web/"
