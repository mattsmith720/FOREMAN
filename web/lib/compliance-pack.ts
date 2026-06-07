export type ComplianceShotId =
  | "setup"
  | "meter_box"
  | "switchboard"
  | "serial_plate"
  | "battery_label"
  | "testing";

export interface ComplianceShot {
  id: ComplianceShotId;
  /** Short voice prompt (≤12 words). */
  prompt: string;
  evidenceType: string;
}

/** CER-required shots Foreman guides in sequence (install phase). */
export const COMPLIANCE_SHOTS: ComplianceShot[] = [
  { id: "setup", prompt: "Selfie now — your face at setup.", evidenceType: "setup" },
  { id: "meter_box", prompt: "Point at the meter box exterior.", evidenceType: "meter_box" },
  {
    id: "switchboard",
    prompt: "Show the switchboard shutdown label.",
    evidenceType: "switchboard",
  },
  {
    id: "serial_plate",
    prompt: "Hold steady on the inverter serial plate.",
    evidenceType: "serial_plate",
  },
  {
    id: "battery_label",
    prompt: "Capture the battery critical labels.",
    evidenceType: "battery_label",
  },
  { id: "testing", prompt: "Selfie again — testing stage.", evidenceType: "testing" },
];

export function nextComplianceShot(
  captured: ReadonlySet<ComplianceShotId>,
): ComplianceShot | null {
  return COMPLIANCE_SHOTS.find((shot) => !captured.has(shot.id)) ?? null;
}

export function complianceProgress(captured: ReadonlySet<ComplianceShotId>): {
  done: number;
  total: number;
} {
  return { done: captured.size, total: COMPLIANCE_SHOTS.length };
}

export interface EvidenceCaptureRecord {
  shotId: ComplianceShotId;
  capturedAt: string;
  lat: number | null;
  lng: number | null;
  evidenceType: string;
}

export function shotForEvidenceType(
  evidenceType: string,
): ComplianceShot | undefined {
  return COMPLIANCE_SHOTS.find((shot) => shot.evidenceType === evidenceType);
}

export function downloadEvidenceManifest(
  sessionId: string,
  records: EvidenceCaptureRecord[],
): void {
  if (typeof window === "undefined") {
    return;
  }
  const progress = complianceProgress(new Set(records.map((r) => r.shotId)));
  const payload = {
    sessionId,
    generatedAt: new Date().toISOString(),
    progress,
    records,
    note: "JPEGs with burned-in timestamp+GPS are in Supabase frames bucket.",
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `foreman-evidence-${sessionId.slice(0, 8)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
