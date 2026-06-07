import type { CoachingResponse } from "@foreman/shared";
import {
  nextComplianceShot,
  shotForEvidenceType,
  type ComplianceShotId,
  type EvidenceCaptureRecord,
} from "./compliance-pack";
import type { GeoFix } from "./geolocation";
import type { JobPhaseId } from "./job-phase";
import type { CaptureMeta } from "./analyse";

export interface ComplianceSessionState {
  captured: Set<ComplianceShotId>;
  records: EvidenceCaptureRecord[];
}

export interface ComplianceVoiceLine {
  text: string;
  severity: "info" | "warning" | "critical";
}

export interface ComplianceEvidenceOutcome {
  state: ComplianceSessionState;
  voiceLines: ComplianceVoiceLine[];
}

export function createComplianceSessionState(): ComplianceSessionState {
  return { captured: new Set(), records: [] };
}

export function buildInstallCaptureMeta(
  geo: GeoFix | null,
  captured: ReadonlySet<ComplianceShotId>,
  capturedAt: string,
): CaptureMeta | undefined {
  const target = nextComplianceShot(captured);
  return {
    capturedAt,
    lat: geo?.lat,
    lng: geo?.lng,
    complianceShotId: target?.id,
  };
}

/** Lane L3/L4 — compliance evidence reactions after /analyse (pure, no React). */
export function applyComplianceEvidence(
  coaching: CoachingResponse,
  jobPhase: JobPhaseId,
  state: ComplianceSessionState,
  geo: GeoFix | null,
  capturedAt: string,
): ComplianceEvidenceOutcome {
  const voiceLines: ComplianceVoiceLine[] = [];
  const nextState: ComplianceSessionState = {
    captured: new Set(state.captured),
    records: [...state.records],
  };

  if (jobPhase !== "solar_install") {
    return { state: nextState, voiceLines };
  }

  const evidence = coaching.evidenceShot;
  if (evidence?.isGoodEvidence) {
    const shot = shotForEvidenceType(evidence.type);
    if (shot && !nextState.captured.has(shot.id)) {
      nextState.captured.add(shot.id);
      nextState.records.push({
        shotId: shot.id,
        capturedAt,
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
        evidenceType: evidence.type,
      });
      const nextShot = nextComplianceShot(nextState.captured);
      voiceLines.push(
        nextShot
          ? { text: nextShot.prompt, severity: "info" }
          : { text: "All compliance shots captured.", severity: "info" },
      );
    }
  } else if (evidence && !evidence.isGoodEvidence) {
    voiceLines.push({
      text: "Hold steady — retake that shot.",
      severity: "warning",
    });
  }

  return { state: nextState, voiceLines };
}
