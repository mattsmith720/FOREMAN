import type { CoachingResponse } from "@foreman/shared";
import {
  nextComplianceShot,
  shotForEvidenceType,
  type ComplianceShot,
  type ComplianceShotId,
  type EvidenceCaptureRecord,
} from "./compliance-pack";
import type { GeoFix } from "./geolocation";
import type { JobPhaseId } from "./job-phase";
import type { CaptureMeta } from "./analyse";

/** Evidence types the model may return for CER guided capture. */
export const GUIDED_EVIDENCE_TYPES = [
  "meter_box",
  "switchboard",
  "dc_isolator",
  "inverter",
  "serial_plate",
  "battery_label",
  "array_complete",
  "roof_penetration",
  "setup",
  "testing",
] as const;

export type GuidedEvidenceType = (typeof GUIDED_EVIDENCE_TYPES)[number];

export const RETAKE_ESCALATION_THRESHOLD = 3;

export interface ComplianceSessionState {
  captured: Set<ComplianceShotId>;
  records: EvidenceCaptureRecord[];
  /** Consecutive legibility failures on the current target shot. */
  failCounts: Partial<Record<ComplianceShotId, number>>;
}

export interface ComplianceVoiceLine {
  text: string;
  severity: "info" | "warning" | "critical";
}

export interface ComplianceEvidenceOutcome {
  state: ComplianceSessionState;
  voiceLines: ComplianceVoiceLine[];
  /** Shorten capture gap after a same-target retake (integrator calls captureNow). */
  accelerateCapture: boolean;
  /** Front camera needed for the active guided shot (integrator may flip stream). */
  facingMode: "user" | "environment" | null;
}

export function createComplianceSessionState(): ComplianceSessionState {
  return { captured: new Set(), records: [], failCounts: {} };
}

export function isGuidedEvidenceType(type: string): type is GuidedEvidenceType {
  return (GUIDED_EVIDENCE_TYPES as readonly string[]).includes(type);
}

export function facingModeForShot(
  shotId: ComplianceShotId,
): "user" | "environment" {
  return shotId === "setup" || shotId === "testing" ? "user" : "environment";
}

/** Selfie compliance types need the front camera when evidenceShot requests them. */
export function facingModeForEvidenceType(
  evidenceType: string,
): "user" | "environment" {
  return evidenceType === "setup" || evidenceType === "testing"
    ? "user"
    : "environment";
}

export function selfieCameraVoiceLine(
  shotId: ComplianceShotId,
): ComplianceVoiceLine | null {
  if (facingModeForShot(shotId) !== "user") {
    return null;
  }
  return {
    text: "Selfie — flip to front if needed.",
    severity: "info",
  };
}

function shotLabel(shot: ComplianceShot): string {
  return shot.id.replace(/_/g, " ");
}

function repromptForBadEvidence(
  target: ComplianceShot,
  failCount: number,
): ComplianceVoiceLine {
  if (failCount >= RETAKE_ESCALATION_THRESHOLD) {
    return {
      text: `Move closer or improve light — still need ${shotLabel(target)}.`,
      severity: "warning",
    };
  }
  return {
    text: `Hold steady — ${target.prompt}`,
    severity: "warning",
  };
}

export function shouldAccelerateCapture(
  evidence: CoachingResponse["evidenceShot"],
  target: ComplianceShot | null,
): boolean {
  if (!target || !evidence) {
    return false;
  }
  return (
    evidence.type === target.evidenceType && evidence.isGoodEvidence === false
  );
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
    failCounts: { ...state.failCounts },
  };

  const target = nextComplianceShot(nextState.captured);
  const facingMode = target ? facingModeForShot(target.id) : null;

  if (jobPhase !== "solar_install") {
    return { state: nextState, voiceLines, accelerateCapture: false, facingMode };
  }

  if (!target) {
    return { state: nextState, voiceLines, accelerateCapture: false, facingMode };
  }

  const evidence = coaching.evidenceShot;
  if (!evidence || !isGuidedEvidenceType(evidence.type)) {
    return { state: nextState, voiceLines, accelerateCapture: false, facingMode };
  }

  const creditedShot = shotForEvidenceType(evidence.type);
  if (creditedShot && nextState.captured.has(creditedShot.id)) {
    return { state: nextState, voiceLines, accelerateCapture: false, facingMode };
  }

  if (evidence.type !== target.evidenceType) {
    voiceLines.push({
      text: `That's not the ${shotLabel(target)} — ${target.prompt}`,
      severity: "warning",
    });
    return { state: nextState, voiceLines, accelerateCapture: false, facingMode };
  }

  if (evidence.isGoodEvidence) {
    const shot = shotForEvidenceType(evidence.type);
    if (shot && !nextState.captured.has(shot.id)) {
      nextState.captured.add(shot.id);
      delete nextState.failCounts[shot.id];
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
      const nextFacing = nextShot ? facingModeForShot(nextShot.id) : null;
      return {
        state: nextState,
        voiceLines,
        accelerateCapture: false,
        facingMode: nextFacing,
      };
    }
    return { state: nextState, voiceLines, accelerateCapture: false, facingMode };
  }

  const priorFails = nextState.failCounts[target.id] ?? 0;
  const failCount = priorFails + 1;
  nextState.failCounts[target.id] = failCount;
  voiceLines.push(repromptForBadEvidence(target, failCount));

  return {
    state: nextState,
    voiceLines,
    accelerateCapture: true,
    facingMode,
  };
}
