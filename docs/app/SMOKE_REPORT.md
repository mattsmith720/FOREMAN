# App smoke report (App A1)

**Date:** 2026-06-06

## Local gates

Run from repo root:

```bash
cd web && npm test && npm run build && npm run test:e2e
cd ../backend && npm run integration-test
```

## Prod smoke

```bash
chmod +x web/scripts/smoke-prod.sh
./web/scripts/smoke-prod.sh
```

Checks:

- API `/health`
- Web `/api/health` proxy
- HTTP 200 for `/`, `/ops`, `/training`

## Manual (iPhone)

1. Open https://foreman-phi.vercel.app in Safari
2. Consent → pick maintenance phase → optional name → Start job
3. Confirm REC + coaching card updates
4. End job → summary + stats + training actions
5. Ops: `/ops` → Training link opens pre-filled training form
