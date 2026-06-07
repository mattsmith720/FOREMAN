# L9 iOS lane handoff

**Branch:** `swarm/l9-ios`  
**Status:** build-unverified  
**Owner:** native/ios (Lane L9)

## What changed

1. **CoachingResponse** (`Foreman/Models/CoachingModels.swift`) synced with `shared/src/coaching.ts`:
   - `visualCallouts` — on-frame highlights with normalized x/y, category, severity, optional w/h/shape
   - `evidenceShot` — CER evidence classification (`type`, `isGoodEvidence`)
   - `CaptureMeta` — analyse-request metadata (`capturedAt`, optional `lat`/`lng`/`complianceShotId`)

2. **Session token** (`Foreman/Services/BackendClient.swift`):
   - Token is **not** cleared on `stopSession` (matches web `sessions.ts` — kept for post-job review)
   - Token **is** cleared at `startSession` before a new job
   - `getSession(sessionId:)` added for authenticated post-stop reads

3. **Analyse calls** (`StreamViewModel`) send `captureMeta.capturedAt` on each frame.

## Build-unverified

This lane did **not** run `xcodebuild` on a Mac with Xcode 15+ and a physical iPhone. CI does not gate the iOS target today (see `SWARM_BOARD.md` — L9 is marked build-unverified).

**Operator verification before pilot:**

```bash
cd native/ios && xcodegen generate
open Foreman.xcodeproj
# Build & run on a physical iPhone (Debug.xcconfig → BACKEND_API_URL, FOREMAN_API_KEY)
```

Confirm:

- [ ] `/analyse` responses decode with `visualCallouts` and optional `evidenceShot` (no JSON decode errors in Xcode console)
- [ ] Stop job → summary appears; token still works for `GET /sessions/:id` if review UI is wired later
- [ ] Start new job → old token replaced; coaching resumes

## Not in scope (L9)

- Post-job review UI (web: `post-job-review.tsx` — Lane L7)
- Visual callout overlay on preview (decode-only for now)
- Geo stamp / compliance shot IDs (CaptureMeta fields present; lat/lng not wired on iOS yet)

## Integrator notes

Merge after L8 on `swarm/integration`. No changes to `shared/`, backend routes, or Xcode project file required for this lane.
