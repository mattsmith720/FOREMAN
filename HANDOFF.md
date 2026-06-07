# L4 Evidence Pack — Integrator Handoff

Lane `swarm/l4-evidence-pack` ships the evidence ZIP builder and download helper. **Wiring into the live app is intentionally deferred** to the integrator (see SWARM_BOARD integrator-only paths).

## What shipped

| File | Role |
|------|------|
| `backend/src/evidence-pack.ts` | Pure pack builder: extract compliance frames, manifest JSON, store-only ZIP |
| `backend/src/routes/evidence-pack.ts` | `GET /sessions/:id/evidence-pack` route registration |
| `web/lib/evidence-pack.ts` | Client helper `downloadEvidencePack(sessionId)` |
| `backend/src/evidence-pack.test.ts` | Pack builder unit tests |
| `backend/src/routes/evidence-pack.test.ts` | Route registration tests |
| `web/lib/evidence-pack.test.ts` | Client download helper tests |

## API contract

### `GET /sessions/:id/evidence-pack`

- **Auth:** `x-session-token` header (same as other session routes). Session id in path must match token.
- **Response:** `application/zip` attachment
- **Filename:** `foreman-evidence-{first8(sessionId)}.zip`
- **ZIP contents:**
  - `manifest.json` — session id, `generatedAt`, `progress` (`done` / `total` guided shots), `records[]` with shot metadata + `frameId` / `storageRef` / `zipEntry`
  - One stamped JPEG per guided compliance shot (`setup`, `meter_box`, `switchboard`, `serial_plate`, `battery_label`, `testing`), named `{shotId}.jpeg`

Frames are selected server-side from persisted `frames` rows where `analysis.foremanEvidence` and/or `analysis.evidenceShot.isGoodEvidence` indicate a guided shot. JPEG bytes are pulled from the Supabase `frames` bucket via `storage_ref`.

### Web client

```typescript
import { downloadEvidencePack } from "../lib/evidence-pack";

// After stopSession succeeds, solar_install jobs with compliance captures:
await downloadEvidencePack(sessionId);
```

Uses `apiFetch` → same-origin `/api` or `NEXT_PUBLIC_API_URL` base. Expects the backend route (or a proxy) to be reachable at `/sessions/:id/evidence-pack`.

## Integrator checklist (not done in this lane)

1. **`backend/src/index.ts`** — register routes:
   ```typescript
   import { registerEvidencePackRoutes } from "./routes/evidence-pack.js";
   // ...
   await registerEvidencePackRoutes(app);
   ```

2. **`web/app/api/sessions/[id]/evidence-pack/route.ts`** — proxy GET to backend (mirror `web/app/api/sessions/[id]/stop/route.ts` pattern with `proxyToBackend`).

3. **`web/components/camera-coach.tsx`** — in `stopJob`, after `stopSession` for `solar_install` with compliance records, prefer ZIP over JSON-only export:
   ```typescript
   import { downloadEvidencePack } from "../lib/evidence-pack";
   // replace or supplement downloadEvidenceManifest(...)
   await downloadEvidencePack(sessionId);
   ```
   Keep `downloadEvidenceManifest` as fallback if the pack endpoint returns 503/5xx.

4. **CORS** — no change needed if traffic goes through the Next.js proxy (`same-origin`).

## Tests

```bash
npm run test --workspace backend
npm run test --workspace web
```

## Commit

Lane branch: `swarm/l4-evidence-pack` — do **not** push to `main` from this lane; merge via `swarm/integration` train (L4 slot).
