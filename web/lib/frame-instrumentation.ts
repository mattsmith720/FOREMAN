import { reportCueE2eMs } from "./cue-metrics";
import { estimateSessionCostUsd } from "./session-cost";
import type { CaptureHealthStats } from "../components/capture-health";

export interface FrameInstrumentationInput {
  debugMode: boolean;
  frameKb: number;
  analyseMs: number;
  startedAt: number;
  framesCaptured: number;
  transcriptChunkCount: number;
}

export interface FrameInstrumentationResult {
  healthPatch: Partial<CaptureHealthStats>;
  /** Reports cue E2E ms; returns value for debug HUD update. */
  onCueAudible?: () => number;
}

/** Lane L1 — per-frame cost/latency instrumentation (pure patches + side-effect hook). */
export function frameInstrumentation(
  input: FrameInstrumentationInput,
): FrameInstrumentationResult {
  const healthPatch: Partial<CaptureHealthStats> = {};

  if (input.debugMode) {
    healthPatch.frameKb = input.frameKb;
    healthPatch.analyseMs = input.analyseMs;
    healthPatch.persistQueued = true;
    healthPatch.estCostUsd = estimateSessionCostUsd(
      input.framesCaptured,
      input.transcriptChunkCount,
    );
  }

  return {
    healthPatch,
    onCueAudible: () => {
      const cueE2eMs = Math.round(performance.now() - input.startedAt);
      reportCueE2eMs(cueE2eMs);
      return cueE2eMs;
    },
  };
}
