import {
  GUIDED_COMPLIANCE_SHOT_IDS,
  type EvidencePackManifest,
  type EvidencePackRecord,
  type GuidedComplianceShotId,
} from "./evidence-pack.js";

const LOCAL_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_DIR_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIR_SIGNATURE = 0x06054b50;

export interface ZipEntry {
  name: string;
  data: Buffer;
}

/** Read store-only ZIP archives produced by createZipArchive (method 0). */
export function readZipArchive(zipBytes: Buffer): ZipEntry[] {
  const entries: ZipEntry[] = [];
  let offset = 0;

  while (offset + 30 <= zipBytes.length) {
    const signature = zipBytes.readUInt32LE(offset);
    if (signature === END_OF_CENTRAL_DIR_SIGNATURE) {
      break;
    }
    if (signature === CENTRAL_DIR_SIGNATURE) {
      break;
    }
    if (signature !== LOCAL_HEADER_SIGNATURE) {
      throw new Error(`Invalid ZIP local header at offset ${offset}`);
    }

    const compressionMethod = zipBytes.readUInt16LE(offset + 8);
    const compressedSize = zipBytes.readUInt32LE(offset + 18);
    const uncompressedSize = zipBytes.readUInt32LE(offset + 22);
    const nameLength = zipBytes.readUInt16LE(offset + 26);
    const extraLength = zipBytes.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const nameEnd = nameStart + nameLength;
    const dataStart = nameEnd + extraLength;
    const dataEnd = dataStart + compressedSize;

    if (dataEnd > zipBytes.length) {
      throw new Error(`ZIP entry extends past archive end: ${nameStart}`);
    }

    const name = zipBytes.subarray(nameStart, nameEnd).toString("utf8");
    const data = zipBytes.subarray(dataStart, dataEnd);

    if (compressionMethod !== 0) {
      throw new Error(`Unsupported ZIP compression for ${name} (method ${compressionMethod})`);
    }
    if (compressedSize !== uncompressedSize) {
      throw new Error(`ZIP size mismatch for ${name}`);
    }

    entries.push({ name, data });
    offset = dataEnd;
  }

  return entries;
}

function zipEntryMap(entries: ZipEntry[]): Map<string, Buffer> {
  return new Map(entries.map((entry) => [entry.name, entry.data]));
}

function isGuidedShotId(value: string): value is GuidedComplianceShotId {
  return (GUIDED_COMPLIANCE_SHOT_IDS as readonly string[]).includes(value);
}

function shotIdFromZipEntry(zipEntry: string): string {
  const slash = zipEntry.lastIndexOf("/");
  const base = slash >= 0 ? zipEntry.slice(slash + 1) : zipEntry;
  const dot = base.lastIndexOf(".");
  return dot >= 0 ? base.slice(0, dot) : base;
}

function hasCapturedAt(record: EvidencePackRecord): boolean {
  return typeof record.capturedAt === "string" && record.capturedAt.trim().length > 0;
}

function hasStampFields(record: EvidencePackRecord): boolean {
  return hasCapturedAt(record);
}

function looksLikeJpeg(data: Buffer): boolean {
  return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
}

function parseManifest(raw: Buffer): EvidencePackManifest {
  const parsed: unknown = JSON.parse(raw.toString("utf8"));
  if (!parsed || typeof parsed !== "object") {
    throw new Error("manifest.json must be a JSON object");
  }

  const manifest = parsed as EvidencePackManifest;
  if (typeof manifest.sessionId !== "string" || manifest.sessionId.trim().length === 0) {
    throw new Error("manifest.sessionId is required");
  }
  if (!Array.isArray(manifest.records)) {
    throw new Error("manifest.records must be an array");
  }

  return manifest;
}

export interface StampFieldStatus {
  shotId: string;
  capturedAt: boolean;
  hasGps: boolean;
}

export interface PackValidationReport {
  ok: boolean;
  sessionId: string | null;
  progress: { done: number; total: number } | null;
  presentShots: string[];
  missingShots: string[];
  stampFieldsPresent: StampFieldStatus[];
  errors: string[];
}

export function validateEvidencePackZip(zipBytes: Buffer): PackValidationReport {
  const errors: string[] = [];
  let sessionId: string | null = null;
  let progress: { done: number; total: number } | null = null;
  const presentShots = new Set<string>();
  const stampFieldsPresent: StampFieldStatus[] = [];

  let entries: ZipEntry[];
  try {
    entries = readZipArchive(zipBytes);
  } catch (err) {
    return {
      ok: false,
      sessionId: null,
      progress: null,
      presentShots: [],
      missingShots: [...GUIDED_COMPLIANCE_SHOT_IDS],
      stampFieldsPresent: [],
      errors: [err instanceof Error ? err.message : "Failed to read ZIP archive"],
    };
  }

  const files = zipEntryMap(entries);
  const manifestRaw = files.get("manifest.json");
  if (!manifestRaw) {
    errors.push("Missing manifest.json");
    return {
      ok: false,
      sessionId: null,
      progress: null,
      presentShots: [],
      missingShots: [...GUIDED_COMPLIANCE_SHOT_IDS],
      stampFieldsPresent: [],
      errors,
    };
  }

  let manifest: EvidencePackManifest;
  try {
    manifest = parseManifest(manifestRaw);
  } catch (err) {
    errors.push(err instanceof Error ? err.message : "Invalid manifest.json");
    return {
      ok: false,
      sessionId: null,
      progress: null,
      presentShots: [],
      missingShots: [...GUIDED_COMPLIANCE_SHOT_IDS],
      stampFieldsPresent: [],
      errors,
    };
  }

  sessionId = manifest.sessionId;
  progress = manifest.progress ?? null;

  const seenShotIds = new Set<string>();

  for (const [index, record] of manifest.records.entries()) {
    const label = `records[${index}]`;

    if (!record.shotId || typeof record.shotId !== "string") {
      errors.push(`${label}: missing shotId`);
      continue;
    }

    const shotId = record.shotId.trim();
    if (!isGuidedShotId(shotId)) {
      errors.push(`${label}: unknown shotId "${record.shotId}"`);
      continue;
    }

    if (!hasCapturedAt(record)) {
      errors.push(`${label}: missing capturedAt for shot "${shotId}"`);
    }

    if (seenShotIds.has(shotId)) {
      errors.push(`${label}: duplicate shotId "${shotId}"`);
    }
    seenShotIds.add(shotId);

    if (!record.zipEntry || typeof record.zipEntry !== "string") {
      errors.push(`${label}: missing zipEntry for shot "${shotId}"`);
      continue;
    }

    const entryShotId = shotIdFromZipEntry(record.zipEntry);
    if (entryShotId !== shotId) {
      errors.push(
        `${label}: shotId "${shotId}" does not match zipEntry "${record.zipEntry}"`,
      );
    }

    const jpeg = files.get(record.zipEntry);
    if (!jpeg) {
      errors.push(`${label}: missing JPEG "${record.zipEntry}" for shot "${shotId}"`);
      continue;
    }

    if (!looksLikeJpeg(jpeg)) {
      errors.push(`${label}: "${record.zipEntry}" is not a JPEG`);
    }

    presentShots.add(shotId);
    stampFieldsPresent.push({
      shotId,
      capturedAt: hasCapturedAt(record),
      hasGps: record.lat !== null && record.lng !== null,
    });
  }

  const missingShots = GUIDED_COMPLIANCE_SHOT_IDS.filter(
    (shotId) => !presentShots.has(shotId),
  );

  for (const shotId of GUIDED_COMPLIANCE_SHOT_IDS) {
    const expectedNames = [`${shotId}.jpeg`, `${shotId}.jpg`];
    const orphan = expectedNames.find(
      (name) => files.has(name) && !presentShots.has(shotId),
    );
    if (orphan) {
      errors.push(`ZIP contains "${orphan}" but manifest has no record for "${shotId}"`);
    }
  }

  if (missingShots.length > 0) {
    errors.push(`Missing guided shots: ${missingShots.join(", ")}`);
  }

  const recordsMissingStamp = manifest.records
    .filter((record) => !hasStampFields(record))
    .map((record) => record.shotId || "(unknown)");

  if (recordsMissingStamp.length > 0) {
    errors.push(
      `Records missing stamp fields (capturedAt): ${recordsMissingStamp.join(", ")}`,
    );
  }

  return {
    ok: errors.length === 0,
    sessionId,
    progress,
    presentShots: [...presentShots],
    missingShots,
    stampFieldsPresent,
    errors,
  };
}

export function formatPackValidationReport(report: PackValidationReport): string {
  const lines = [
    report.ok ? "PASS" : "FAIL",
    `sessionId: ${report.sessionId ?? "(none)"}`,
  ];

  if (report.progress) {
    lines.push(`progress: ${report.progress.done}/${report.progress.total}`);
  }

  lines.push(`presentShots: ${report.presentShots.join(", ") || "(none)"}`);
  lines.push(`missingShots: ${report.missingShots.join(", ") || "(none)"}`);

  if (report.stampFieldsPresent.length > 0) {
    lines.push("stampFields:");
    for (const stamp of report.stampFieldsPresent) {
      lines.push(
        `  ${stamp.shotId}: capturedAt=${stamp.capturedAt ? "yes" : "no"}, gps=${stamp.hasGps ? "yes" : "no"}`,
      );
    }
  }

  if (report.errors.length > 0) {
    lines.push("errors:");
    for (const error of report.errors) {
      lines.push(`  - ${error}`);
    }
  }

  return lines.join("\n");
}
