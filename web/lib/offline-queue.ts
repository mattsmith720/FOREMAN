import type { AnalyseContext, CaptureMeta } from "./analyse";

/** IndexedDB-backed queue for frames, audio, and evidence API payloads. */

export const OFFLINE_QUEUE_LIMITS = {
  analyse: 40,
  transcribe: 16,
  evidence: 2,
} as const;

export type OfflineQueueKind = "analyse" | "transcribe" | "evidence_pack";

export interface OfflineQueueCounts {
  analyse: number;
  transcribe: number;
  evidence: number;
  total: number;
}

export type OfflineSyncPhase = "idle" | "syncing" | "error";

export interface OfflineUiState {
  online: boolean;
  storageAvailable: boolean;
  syncPhase: OfflineSyncPhase;
  queued: OfflineQueueCounts;
  /** Items successfully uploaded in the current browser session. */
  syncedThisSession: number;
  lastSyncedAt: string | null;
  lastError: string | null;
}

export interface EnqueueAnalyseInput {
  sessionId: string;
  image: string;
  context?: AnalyseContext;
  recentTranscript?: string[];
  captureMeta?: CaptureMeta;
}

export interface EnqueueTranscribeInput {
  sessionId: string;
  blob: Blob;
  speaker?: string;
}

interface QueueRecordBase {
  id: string;
  kind: OfflineQueueKind;
  sessionId: string;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

export interface AnalyseQueueRecord extends QueueRecordBase {
  kind: "analyse";
  image: string;
  context?: AnalyseContext;
  recentTranscript?: string[];
  captureMeta?: CaptureMeta;
}

export interface TranscribeQueueRecord extends QueueRecordBase {
  kind: "transcribe";
  audioDataUrl: string;
  speaker: string;
}

export interface EvidenceQueueRecord extends QueueRecordBase {
  kind: "evidence_pack";
}

export type OfflineQueueRecord =
  | AnalyseQueueRecord
  | TranscribeQueueRecord
  | EvidenceQueueRecord;

const DB_NAME = "foreman-offline-v1";
const DB_VERSION = 1;
const STORE = "queue";

const memoryFallback: OfflineQueueRecord[] = [];
let dbPromise: Promise<IDBDatabase | null> | null = null;
let storageAvailable = true;

let syncPhase: OfflineSyncPhase = "idle";
let syncedThisSession = 0;
let lastSyncedAt: string | null = null;
let lastError: string | null = null;

const listeners = new Set<(state: OfflineUiState) => void>();

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase | null> {
  if (!isBrowser()) {
    storageAvailable = false;
    return Promise.resolve(null);
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("createdAt", "createdAt", { unique: false });
          store.createIndex("sessionId", "sessionId", { unique: false });
          store.createIndex("kind", "kind", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        storageAvailable = false;
        resolve(null);
      };
    });
  }

  return dbPromise;
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | void> {
  return openDb().then((db) => {
    if (!db) {
      return undefined;
    }

    return new Promise<T | void>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      const request = run(store);
      tx.oncomplete = () => {
        if (request instanceof IDBRequest) {
          resolve(request.result);
        } else {
          resolve(undefined);
        }
      };
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
    });
  });
}

async function readAllRecords(): Promise<OfflineQueueRecord[]> {
  const fromDb = await runTransaction<OfflineQueueRecord[]>("readonly", (store) =>
    store.getAll(),
  );
  if (fromDb) {
    return fromDb;
  }
  return [...memoryFallback];
}

function countByKind(records: OfflineQueueRecord[]): OfflineQueueCounts {
  const analyse = records.filter((item) => item.kind === "analyse").length;
  const transcribe = records.filter((item) => item.kind === "transcribe").length;
  const evidence = records.filter((item) => item.kind === "evidence_pack").length;
  return {
    analyse,
    transcribe,
    evidence,
    total: analyse + transcribe + evidence,
  };
}

export function getOfflineUiState(): OfflineUiState {
  return {
    online: typeof navigator === "undefined" ? true : navigator.onLine,
    storageAvailable,
    syncPhase,
    queued: { analyse: 0, transcribe: 0, evidence: 0, total: 0 },
    syncedThisSession,
    lastSyncedAt,
    lastError,
  };
}

async function refreshUiCounts(): Promise<OfflineUiState> {
  const records = await readAllRecords();
  const state: OfflineUiState = {
    online: typeof navigator === "undefined" ? true : navigator.onLine,
    storageAvailable,
    syncPhase,
    queued: countByKind(records),
    syncedThisSession,
    lastSyncedAt,
    lastError,
  };
  for (const listener of listeners) {
    listener(state);
  }
  return state;
}

export function subscribeOfflineUiState(
  listener: (state: OfflineUiState) => void,
): () => void {
  listeners.add(listener);
  void refreshUiCounts().then((state) => listener(state));
  return () => {
    listeners.delete(listener);
  };
}

export function setOfflineSyncPhase(phase: OfflineSyncPhase, error?: string | null): void {
  syncPhase = phase;
  if (error !== undefined) {
    lastError = error;
  }
  void refreshUiCounts();
}

export function markOfflineItemSynced(): void {
  syncedThisSession += 1;
  lastSyncedAt = new Date().toISOString();
  lastError = null;
  void refreshUiCounts();
}

export function resetOfflineSessionStats(): void {
  syncedThisSession = 0;
  lastSyncedAt = null;
  lastError = null;
  void refreshUiCounts();
}

async function writeRecord(record: OfflineQueueRecord): Promise<void> {
  const db = await openDb();
  if (!db) {
    memoryFallback.push(record);
    await refreshUiCounts();
    return;
  }

  await runTransaction("readwrite", (store) => store.put(record));
  await refreshUiCounts();
}

async function trimKind(kind: OfflineQueueKind, limit: number): Promise<void> {
  const records = (await readAllRecords())
    .filter((item) => item.kind === kind)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const overflow = records.length - limit;
  if (overflow <= 0) {
    return;
  }

  const toDrop = records.slice(0, overflow);
  for (const item of toDrop) {
    await deleteQueueItem(item.id);
  }
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read audio blob"));
    reader.readAsDataURL(blob);
  });
}

export function isRetriableApiFailure(
  error: unknown,
  response?: Response,
): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true;
  }

  if (response) {
    if (response.status >= 500 || response.status === 408 || response.status === 429) {
      return true;
    }
    return false;
  }

  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return false;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("timed out") ||
      message.includes("cold start")
    );
  }

  return false;
}

export async function enqueueAnalyseFrame(
  input: EnqueueAnalyseInput,
): Promise<OfflineQueueRecord> {
  const record: AnalyseQueueRecord = {
    id: newId(),
    kind: "analyse",
    sessionId: input.sessionId,
    createdAt: new Date().toISOString(),
    attempts: 0,
    image: input.image,
    context: input.context,
    recentTranscript: input.recentTranscript,
    captureMeta: input.captureMeta,
  };

  await writeRecord(record);
  await trimKind("analyse", OFFLINE_QUEUE_LIMITS.analyse);
  return record;
}

export async function enqueueTranscribeChunk(
  input: EnqueueTranscribeInput,
): Promise<OfflineQueueRecord> {
  const record: TranscribeQueueRecord = {
    id: newId(),
    kind: "transcribe",
    sessionId: input.sessionId,
    createdAt: new Date().toISOString(),
    attempts: 0,
    audioDataUrl: await blobToDataUrl(input.blob),
    speaker: input.speaker?.trim() || "worker",
  };

  await writeRecord(record);
  await trimKind("transcribe", OFFLINE_QUEUE_LIMITS.transcribe);
  return record;
}

export async function enqueueEvidencePack(sessionId: string): Promise<OfflineQueueRecord> {
  const records = await readAllRecords();
  const existing = records.find(
    (item) => item.kind === "evidence_pack" && item.sessionId === sessionId,
  );
  if (existing) {
    return existing;
  }

  const record: EvidenceQueueRecord = {
    id: newId(),
    kind: "evidence_pack",
    sessionId,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  await writeRecord(record);
  await trimKind("evidence_pack", OFFLINE_QUEUE_LIMITS.evidence);
  return record;
}

export async function getOfflineQueueCounts(): Promise<OfflineQueueCounts> {
  const records = await readAllRecords();
  return countByKind(records);
}

export async function listQueueItems(
  sessionId?: string,
): Promise<OfflineQueueRecord[]> {
  const records = await readAllRecords();
  const filtered = sessionId
    ? records.filter((item) => item.sessionId === sessionId)
    : records;
  return filtered.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getNextQueueItem(
  sessionId?: string,
): Promise<OfflineQueueRecord | null> {
  const items = await listQueueItems(sessionId);
  return items[0] ?? null;
}

export async function deleteQueueItem(id: string): Promise<void> {
  const db = await openDb();
  if (!db) {
    const index = memoryFallback.findIndex((item) => item.id === id);
    if (index >= 0) {
      memoryFallback.splice(index, 1);
    }
    await refreshUiCounts();
    return;
  }

  await runTransaction("readwrite", (store) => store.delete(id));
  await refreshUiCounts();
}

export async function recordQueueFailure(
  id: string,
  errorMessage: string,
): Promise<void> {
  const records = await readAllRecords();
  const item = records.find((entry) => entry.id === id);
  if (!item) {
    return;
  }

  const next: OfflineQueueRecord = {
    ...item,
    attempts: item.attempts + 1,
    lastError: errorMessage,
  };
  await writeRecord(next);
}

export async function purgeSession(sessionId: string): Promise<void> {
  const records = await readAllRecords();
  const toDelete = records.filter((item) => item.sessionId === sessionId);
  for (const item of toDelete) {
    await deleteQueueItem(item.id);
  }
}

export async function purgeAll(): Promise<void> {
  const records = await readAllRecords();
  for (const item of records) {
    await deleteQueueItem(item.id);
  }
}

export function formatOfflineStatusMessage(state: OfflineUiState): string | null {
  if (!state.storageAvailable && state.queued.total === 0) {
    return "Local storage unavailable — job data may not survive refresh.";
  }

  if (state.syncPhase === "syncing") {
    return `Syncing ${state.queued.total} queued item${state.queued.total === 1 ? "" : "s"}…`;
  }

  if (!state.online && state.queued.total > 0) {
    return `Offline — ${state.queued.total} item${state.queued.total === 1 ? "" : "s"} saved on device`;
  }

  if (state.online && state.queued.total > 0) {
    return `${state.queued.total} item${state.queued.total === 1 ? "" : "s"} queued — will sync when connection stabilises`;
  }

  if (state.syncedThisSession > 0 && state.queued.total === 0) {
    return `Synced — ${state.syncedThisSession} item${state.syncedThisSession === 1 ? "" : "s"} uploaded`;
  }

  return null;
}
