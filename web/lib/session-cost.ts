// Ballpark defaults — match backend config.ts for the live /ops readout.
const ANALYSE_COST_USD = 0.015;
const TRANSCRIBE_COST_USD = 0.0004;

export function estimateSessionCostUsd(
  frameCount: number,
  transcriptChunkCount: number,
): number {
  const cost =
    Math.max(0, frameCount) * ANALYSE_COST_USD +
    Math.max(0, transcriptChunkCount) * TRANSCRIBE_COST_USD;
  return Math.round(cost * 1000) / 1000;
}
