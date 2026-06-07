# Program B — Lane B1 handoff (offline queue + sync)

**Branch:** `program/b1-offline`  
**Scope:** IndexedDB queue for failed `/analyse`, `/transcribe`, and evidence-pack calls; background retry when the device is back online. Integrator wires `camera-coach.tsx`.

## Delivered

| Path | Purpose |
|------|---------|
| `web/lib/offline-queue.ts` | IndexedDB store, enqueue helpers, retriability check, UI state + status copy |
| `web/lib/offline-sync.ts` | `online` listener, periodic drain, per-item replay to backend |
| `docs/swarm/B1_OFFLINE_HANDOFF.md` | This integrator checklist |

## Queue model

| Kind | Enqueue when | Payload | Limit (oldest dropped) |
|------|----------------|---------|------------------------|
| `analyse` | `/analyse` fails with retriable network/5xx | JPEG data URL + session context + `captureMeta` | 40 |
| `transcribe` | `/transcribe` fails retriably | Audio data URL + speaker | 16 |
| `evidence_pack` | ZIP download fails at job end | `sessionId` only (deduped per session) | 2 |

DB name: `foreman-offline-v1`. Falls back to in-memory if IndexedDB is blocked (private mode).

## Integrator wiring — `camera-coach.tsx`

### 1. Boot sync loop

```tsx
import { startOfflineSync, syncOfflineQueue } from "../lib/offline-sync";
import {
  enqueueAnalyseFrame,
  enqueueEvidencePack,
  enqueueTranscribeChunk,
  formatOfflineStatusMessage,
  isRetriableApiFailure,
  subscribeOfflineUiState,
  purgeSession,
  type OfflineUiState,
} from "../lib/offline-queue";

// mount
useEffect(() => startOfflineSync(), []);

// state for banner
const [offlineUi, setOfflineUi] = useState<OfflineUiState | null>(null);
useEffect(() => subscribeOfflineUiState(setOfflineUi), []);
const offlineMessage = offlineUi ? formatOfflineStatusMessage(offlineUi) : null;
```

Render `offlineMessage` near the existing `warning-banner` (role="status"). Suggested classes: `warning-banner offline-queue-banner` when queued, neutral when fully synced.

### 2. Frame analyse — queue on failure

In `handleFrame` `catch`:

```tsx
} catch (err) {
  const sessionId = sessionIdRef.current;
  if (sessionId && isRetriableApiFailure(err)) {
    await enqueueAnalyseFrame({
      sessionId,
      image,
      context: { jobType: jobPhaseRef.current },
      recentTranscript: transcriptRef.current,
      captureMeta: /* same as live call */,
    });
    setWarningMessage("Connection weak — frame saved locally, coaching paused until sync.");
  } else {
    setWarningMessage(err instanceof Error ? err.message : "Analysis failed");
  }
  setStatus("running");
}
```

Do **not** apply coaching from sync responses in this lane — stale frames are for persistence only. Live coaching resumes on the next successful in-flight analyse.

Optional debug HUD: extend `CaptureHealthStats` with `offlineQueued: number` from `offlineUi.queued.total`.

### 3. Audio transcribe — queue on failure

In `transcribeChunk` / `handleAudioChunk` `catch`:

```tsx
if (isRetriableApiFailure(err)) {
  await enqueueTranscribeChunk({ sessionId, blob, speaker: workerNameRef.current.trim() || "worker" });
  setWarningMessage("Mic chunk saved locally — will transcribe when back online.");
}
```

Keep the existing in-memory `MAX_AUDIO_QUEUE` for in-flight backpressure; IndexedDB is for **failed uploads**, not the happy path.

### 4. Evidence pack — queue on failure

In `stopJob`, replace the bare `catch` around `downloadEvidencePack`:

```tsx
try {
  await downloadEvidencePack(sessionId);
} catch (err) {
  if (isRetriableApiFailure(err)) {
    await enqueueEvidencePack(sessionId);
    downloadEvidenceManifest(sessionId, complianceStateRef.current.records);
    packLine = "Evidence manifest saved — ZIP will download when back online.";
  } else {
    downloadEvidenceManifest(sessionId, complianceStateRef.current.records);
    packLine = `Evidence manifest ${done} of ${total} shots saved.`;
  }
}
```

After `stopSession` succeeds, kick a session-scoped drain:

```tsx
void syncOfflineQueue({ sessionId });
```

### 5. Session lifecycle

| Event | Call |
|-------|------|
| `startJob` (new session) | No purge — prior session queue should drain |
| Worker taps “Start new job” on summary | `void purgeSession(endedSession.id)` only if integrator confirms counts match and queue empty |
| App unmount mid-job | Existing `stopSession` cleanup unchanged; queue retains unsynced items for next visit |

### 6. UI copy reference

`formatOfflineStatusMessage(state)` returns:

- Offline + queued: `Offline — N items saved on device`
- Online + syncing: `Syncing N queued items…`
- Online + queued idle: `N items queued — will sync when connection stabilises`
- All clear after sync: `Synced — N items uploaded`
- IDB blocked: storage warning

## Verification (integrator)

1. Start a job, enable airplane mode mid-capture → frames/audio enqueue, banner shows offline count.
2. Disable airplane mode → banner shows syncing, then synced; backend session counts increase after refresh.
3. Solar install stop with offline evidence ZIP → manifest downloads immediately; ZIP auto-downloads on reconnect.
4. `cd web && npm run lint && npm test`

## Out of scope (later lanes)

- Applying stale coaching from synced analyse responses
- Service worker / true offline-first app shell
- Crew/session handoff (B2)
- Blake dashboard queue visibility (B3)

## Commit

`program(b1): add IndexedDB offline queue and sync handoff`
