import { coachingResponseSchema } from "@foreman/shared";
import { apiFetch } from "./api-fetch";
import { evidencePackFilename } from "./evidence-pack";
import {
  deleteQueueItem,
  getNextQueueItem,
  getOfflineQueueCounts,
  markOfflineItemSynced,
  recordQueueFailure,
  setOfflineSyncPhase,
  type OfflineQueueRecord,
} from "./offline-queue";
import { parseApiResponse } from "./parse-api-response";

const SYNC_INTERVAL_MS = 12_000;
const MAX_ITEMS_PER_PASS = 24;

let started = false;
let syncing = false;
let intervalId: ReturnType<typeof setInterval> | null = null;
let onlineHandler: (() => void) | null = null;
let offlineHandler: (() => void) | null = null;

export interface OfflineSyncOptions {
  /** Limit drain to one session (e.g. after stopJob). */
  sessionId?: string;
  /** Stop after N successful uploads (default: drain all reachable items). */
  maxItems?: number;
}

export interface OfflineSyncResult {
  attempted: number;
  synced: number;
  failed: number;
  remaining: number;
}

async function syncAnalyseItem(item: Extract<OfflineQueueRecord, { kind: "analyse" }>) {
  const response = await apiFetch("/analyse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: item.image,
      context: item.context,
      sessionId: item.sessionId,
      recentTranscript: item.recentTranscript,
      captureMeta: item.captureMeta,
    }),
    retry: { retries: 0 },
  });

  const body = await parseApiResponse<{ coaching?: unknown; error?: string }>(response);
  if (!body.coaching) {
    throw new Error("Analysis response was missing coaching data");
  }

  coachingResponseSchema.parse(body.coaching);
}

async function syncTranscribeItem(
  item: Extract<OfflineQueueRecord, { kind: "transcribe" }>,
) {
  const response = await apiFetch("/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audio: item.audioDataUrl,
      sessionId: item.sessionId,
      speaker: item.speaker,
    }),
    retry: { retries: 0 },
  });

  await parseApiResponse<{ text?: string; persisted?: boolean }>(response);
}

async function syncEvidenceItem(
  item: Extract<OfflineQueueRecord, { kind: "evidence_pack" }>,
) {
  if (typeof window === "undefined") {
    return;
  }

  const response = await apiFetch(`/sessions/${item.sessionId}/evidence-pack`, {
    method: "GET",
    retry: { retries: 0 },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      detail.trim() || `Evidence pack download failed (${response.status})`,
    );
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = evidencePackFilename(item.sessionId);
  anchor.click();
  URL.revokeObjectURL(url);
}

async function syncQueueItem(item: OfflineQueueRecord): Promise<void> {
  switch (item.kind) {
    case "analyse":
      await syncAnalyseItem(item);
      return;
    case "transcribe":
      await syncTranscribeItem(item);
      return;
    case "evidence_pack":
      await syncEvidenceItem(item);
      return;
    default: {
      const _exhaustive: never = item;
      throw new Error(`Unknown queue item kind: ${String(_exhaustive)}`);
    }
  }
}

export async function syncOfflineQueue(
  options: OfflineSyncOptions = {},
): Promise<OfflineSyncResult> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const remaining = (await getOfflineQueueCounts()).total;
    return { attempted: 0, synced: 0, failed: 0, remaining };
  }

  if (syncing) {
    const remaining = (await getOfflineQueueCounts()).total;
    return { attempted: 0, synced: 0, failed: 0, remaining };
  }

  syncing = true;
  setOfflineSyncPhase("syncing", null);

  let attempted = 0;
  let synced = 0;
  let failed = 0;
  const maxItems = options.maxItems ?? MAX_ITEMS_PER_PASS;

  try {
    while (attempted < maxItems) {
      const item = await getNextQueueItem(options.sessionId);
      if (!item) {
        break;
      }

      attempted += 1;

      try {
        await syncQueueItem(item);
        await deleteQueueItem(item.id);
        markOfflineItemSynced();
        synced += 1;
      } catch (err) {
        failed += 1;
        const message = err instanceof Error ? err.message : "Sync failed";
        await recordQueueFailure(item.id, message);
        setOfflineSyncPhase("error", message);
        break;
      }
    }
  } finally {
    syncing = false;
  }

  const remaining = (await getOfflineQueueCounts()).total;
  if (remaining === 0 || failed === 0) {
    setOfflineSyncPhase("idle", null);
  }

  return { attempted, synced, failed, remaining };
}

export function startOfflineSync(): () => void {
  if (started || typeof window === "undefined") {
    return stopOfflineSync;
  }

  started = true;

  onlineHandler = () => {
    void syncOfflineQueue();
  };
  offlineHandler = () => {
    setOfflineSyncPhase("idle", null);
  };

  window.addEventListener("online", onlineHandler);
  window.addEventListener("offline", offlineHandler);

  intervalId = setInterval(() => {
    if (!navigator.onLine) {
      return;
    }
    void getOfflineQueueCounts().then((counts) => {
      if (counts.total > 0) {
        void syncOfflineQueue();
      }
    });
  }, SYNC_INTERVAL_MS);

  if (navigator.onLine) {
    void syncOfflineQueue();
  }

  return stopOfflineSync;
}

export function stopOfflineSync(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  if (onlineHandler) {
    window.removeEventListener("online", onlineHandler);
    onlineHandler = null;
  }

  if (offlineHandler) {
    window.removeEventListener("offline", offlineHandler);
    offlineHandler = null;
  }

  started = false;
  syncing = false;
  setOfflineSyncPhase("idle", null);
}
