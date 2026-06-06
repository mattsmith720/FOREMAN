<!-- orchestrate handoff
task: consent-and-recording-ux
branch: orch/cpo-product-ux/consent-and-recording-ux
agentId: bc-c316bf10-7517-4956-8c2a-d5a591772362
runId: run-3b629b2d-58ca-4ed4-be91-7774b276bb38
resultStatus: finished
finishedAt: 2026-06-06T02:51:34.816Z
-->

## Status
success

## Branch
`orch/cpo-product-ux/consent-and-recording-ux`

## What I did
- Updated `web/components/camera-coach.tsx`:
  - Added structural consent guard at top of `startJob()` using `hasConsentedRef` + `canCapture(...)`; if not consented it now sets `errorMessage` to `Consent required`, sets status to `error`, and returns before any media/session startup.
  - Added `hasConsented` mirror ref sync via `useEffect` so guard remains valid for programmatic/stale-closure triggers.
  - Wired active-session logic to shared policy helper (`recordingIndicatorVisible(status)`).
  - Updated consent overlay copy to explicit AU privacy/sensitive-data wording.
  - Added recording indicator DOM element inside camera stage:
    - `<div className="recording-indicator" data-testid="recording-indicator" role="status" aria-live="polite">...REC...</div>`
- Added `web/components/consent-gate-policy.ts` (pure helper, under 80 LOC):
  - `canCapture(hasConsented: boolean): boolean`
  - `recordingIndicatorVisible(status: 'idle'|'running'|'analysing'|'summarising'|'error'): boolean`
- Added `web/components/camera-coach.consent.test.ts`:
  - Test case: `consent gate cannot be bypassed`
  - Test case: `recording indicator visible during active session`
- Updated `web/package.json` test script exactly as requested:
  - `"test": "tsx --test 'lib/**/*.test.ts' 'components/**/*.test.ts' 'components/**/*.test.tsx'"`
- Updated `web/app/globals.css` with visible top-left recording-indicator styling (red pill + pulsing dot).
- Committed and pushed to `origin/orch/cpo-product-ux/consent-and-recording-ux`.

## Measurements
- `LOC(web/components/consent-gate-policy.ts): 0 → 16`
- `cd web && npm test (tests/failures): 4/0 == 4/0`
- `npm run build --workspace web (exit code): 0 == 0`

## Verification
unit-test-verified

## Notes, concerns, deviations, findings, thoughts, feedback
- Final UI strings (verbatim) for docs truth-sync:
  - Consent overlay copy: `Foreman captures camera, microphone, and job context. Recordings are treated as sensitive personal data under Australian privacy rules (see CLAUDE.md). Tap I understand to continue.`
  - Consent button label: `I understand — continue`
  - Recording indicator label: `REC`
- Recording indicator selector is stable: `data-testid="recording-indicator"`.
- Manual UI artifact recorded at:
  - `/opt/cursor/artifacts/consent_overlay_and_pre_session_recording_check.mp4`
- In this environment, full active-session manual verification was blocked by missing backend Supabase env config; unit tests and build are green and cover the required consent/indicator policy contract.
- Pre-existing unrelated dirty file remained untouched: root `package-lock.json`.

## Suggested follow-ups
- Mirror the above three UI strings verbatim into `PHONE_DEMO.md` and `YOUR_ACTIONS.md`.
- After backend env is configured, run one additional live manual pass to visually confirm REC appears during `running/analysing/summarising` state in-browser.