import { reportSpokenCueAttemptMs } from "./cue-metrics";
import {
  ensureCostModelSynced,
  estimateSessionCostUsd,
} from "./session-cost";
import type { CaptureHealthStats } from "../components/capture-health";

export interface FrameInstrumentationInput {
  debugMode: boolean;
  frameKb: number;
  analyseMs: number;
  startedAt: number;
  framesCaptured: number;
  transcriptChunkCount: number;
  /** When true, records frame→spoken-cue-attempt E2E immediately (not only when audio plays). */
  spokenCueAttempt?: boolean;
}

export interface FrameInstrumentationResult {
  healthPatch: Partial<CaptureHealthStats>;
  /** Reports spoken-cue-attempt E2E ms; returns value for debug HUD update. */
  onCueAttempt: () => number;
  /** @deprecated Use onCueAttempt — metrics are attempt-based, not play-audible-only. */
  onCueAudible: () => number;
}

/** Lane L1 — per-frame cost/latency instrumentation (pure patches + side-effect hook). */
export function frameInstrumentation(
  input: FrameInstrumentationInput,
): FrameInstrumentationResult {
  const healthPatch: Partial<CaptureHealthStats> = {};

  if (input.debugMode) {
    void ensureCostModelSynced();
    healthPatch.frameKb = input.frameKb;
    healthPatch.analyseMs = input.analyseMs;
    healthPatch.persistQueued = true;
    healthPatch.estCostUsd = estimateSessionCostUsd(
      input.framesCaptured,
      input.transcriptChunkCount,
    );
  }

  const onCueAttempt = () => reportSpokenCueAttemptMs(input.startedAt);

  return {
    healthPatch,
    onCueAttempt,
    onCueAudible: onCueAttempt,
  };
}
