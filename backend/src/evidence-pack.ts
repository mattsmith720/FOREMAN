import { getSupabase } from "./db/supabase.js";

const FRAMES_BUCKET = "frames";

/** Guided CER shots — mirrors web/lib/compliance-pack.ts COMPLIANCE_SHOTS ids. */
export const GUIDED_COMPLIANCE_SHOT_IDS = [
  "setup",
  "meter_box",
  "switchboard",
  "serial_plate",
  "battery_label",
  "testing",
] as const;

export type GuidedComplianceShotId = (typeof GUIDED_COMPLIANCE_SHOT_IDS)[number];

export interface EvidenceFrameRow {
  id: string;
  ts: string;
  storage_ref: string;
  analysis: Record<string, unknown> | null;
}

export interface EvidencePackRecord {
  shotId: string;
  capturedAt: string;
  lat: number | null;
  lng: number | null;
  evidenceType: string;
  frameId: string;
  storageRef: string;
  zipEntry: string;
}

export interface EvidencePackManifest {
  sessionId: string;
  generatedAt: string;
  progress: { done: number; total: number };
  records: EvidencePackRecord[];
  note: string;
}

interface ForemanEvidenceMeta {
  capturedAt?: string;
  lat?: number | null;
  lng?: number | null;
  complianceShotId?: string | null;
}

interface EvidenceShotMeta {
  type?: string;
  isGoodEvidence?: boolean;
}

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]!;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function isGuidedShotId(value: string): value is GuidedComplianceShotId {
  return (GUIDED_COMPLIANCE_SHOT_IDS as readonly string[]).includes(value);
}

function readForemanEvidence(
  analysis: Record<string, unknown> | null,
): ForemanEvidenceMeta | null {
  const raw = analysis?.foremanEvidence;
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return raw as ForemanEvidenceMeta;
}

function readEvidenceShot(
  analysis: Record<string, unknown> | null,
): EvidenceShotMeta | null {
  const raw = analysis?.evidenceShot;
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return raw as EvidenceShotMeta;
}

function resolveShotId(
  foreman: ForemanEvidenceMeta | null,
  evidenceShot: EvidenceShotMeta | null,
): string | null {
  const fromMeta = foreman?.complianceShotId?.trim();
  if (fromMeta && isGuidedShotId(fromMeta)) {
    return fromMeta;
  }
  const fromType = evidenceShot?.type?.trim();
  if (fromType && isGuidedShotId(fromType)) {
    return fromType;
  }
  return null;
}

/** Pick at most one stamped JPEG per guided compliance shot (first good frame wins). */
export function extractEvidenceRecords(
  frames: EvidenceFrameRow[],
): EvidencePackRecord[] {
  const records: EvidencePackRecord[] = [];
  const seenShots = new Set<string>();

  for (const frame of frames) {
    const foreman = readForemanEvidence(frame.analysis);
    const evidenceShot = readEvidenceShot(frame.analysis);
    if (evidenceShot && evidenceShot.isGoodEvidence === false) {
      continue;
    }
    const shotId = resolveShotId(foreman, evidenceShot);
    if (!shotId || seenShots.has(shotId)) {
      continue;
    }

    const evidenceType = evidenceShot?.type ?? shotId;
    const capturedAt =
      foreman?.capturedAt?.trim() || frame.ts || new Date().toISOString();
    const extension = frame.storage_ref.split(".").pop() ?? "jpg";
    const zipEntry = `${shotId}.${extension}`;

    records.push({
      shotId,
      capturedAt,
      lat: foreman?.lat ?? null,
      lng: foreman?.lng ?? null,
      evidenceType,
      frameId: frame.id,
      storageRef: frame.storage_ref,
      zipEntry,
    });
    seenShots.add(shotId);
  }

  return records;
}

export function buildEvidencePackManifest(
  sessionId: string,
  records: EvidencePackRecord[],
  generatedAt = new Date().toISOString(),
): EvidencePackManifest {
  const uniqueShots = new Set(records.map((record) => record.shotId));
  return {
    sessionId,
    generatedAt,
    progress: {
      done: uniqueShots.size,
      total: GUIDED_COMPLIANCE_SHOT_IDS.length,
    },
    records,
    note: "JPEGs in this archive have burned-in timestamp and GPS from the capture client.",
  };
}

/** Store-only ZIP (no compression) — JPEGs are already compressed. */
export function createZipArchive(
  entries: ReadonlyArray<{ name: string; data: Buffer }>,
): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, "utf8");
    const data = entry.data;
    const checksum = crc32(data);

    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);

    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    nameBuf.copy(central, 46);

    localParts.push(local, data);
    centralParts.push(central);
    offset += local.length + data.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDir.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, end]);
}

export interface EvidencePackDependencies {
  getEvidenceFrames: (sessionId: string) => Promise<EvidenceFrameRow[]>;
  downloadFrame: (storageRef: string) => Promise<Buffer>;
}

async function defaultGetEvidenceFrames(
  sessionId: string,
): Promise<EvidenceFrameRow[]> {
  const supabase = getSupabase();
  const result = await supabase
    .from("frames")
    .select("id, ts, storage_ref, analysis")
    .eq("session_id", sessionId)
    .order("ts", { ascending: true });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return (result.data ?? []) as EvidenceFrameRow[];
}

async function defaultDownloadFrame(storageRef: string): Promise<Buffer> {
  const supabase = getSupabase();
  const download = await supabase.storage.from(FRAMES_BUCKET).download(storageRef);
  if (download.error || !download.data) {
    throw new Error(
      download.error?.message ?? `Failed to download frame ${storageRef}`,
    );
  }
  const bytes = Buffer.from(await download.data.arrayBuffer());
  return bytes;
}

const defaultDependencies: EvidencePackDependencies = {
  getEvidenceFrames: defaultGetEvidenceFrames,
  downloadFrame: defaultDownloadFrame,
};

export async function buildEvidencePackZip(
  sessionId: string,
  dependencies: EvidencePackDependencies = defaultDependencies,
): Promise<Buffer> {
  const frames = await dependencies.getEvidenceFrames(sessionId);
  const records = extractEvidenceRecords(frames);
  const manifest = buildEvidencePackManifest(sessionId, records);

  const zipEntries: Array<{ name: string; data: Buffer }> = [
    {
      name: "manifest.json",
      data: Buffer.from(JSON.stringify(manifest, null, 2), "utf8"),
    },
  ];

  for (const record of records) {
    const bytes = await dependencies.downloadFrame(record.storageRef);
    zipEntries.push({ name: record.zipEntry, data: bytes });
  }

  return createZipArchive(zipEntries);
}

export function evidencePackFilename(sessionId: string): string {
  return `foreman-evidence-${sessionId.slice(0, 8)}.zip`;
}
