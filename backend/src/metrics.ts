/**
 * Lightweight in-memory latency metrics for the /analyse model call. Ephemeral
 * (resets on process restart) — a live readout for /ops, not durable analytics.
 * No PII, no storage, no migration.
 */
const MAX_SAMPLES = 200;
const analyseMsSamples: number[] = [];

export function recordAnalyseMs(ms: number): void {
  if (!Number.isFinite(ms) || ms < 0) {
    return;
  }
  analyseMsSamples.push(ms);
  if (analyseMsSamples.length > MAX_SAMPLES) {
    analyseMsSamples.shift();
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx];
}

export interface LatencyMetrics {
  sampleCount: number;
  p50Ms: number;
  p95Ms: number;
}

export function getLatencyMetrics(): LatencyMetrics {
  const sorted = [...analyseMsSamples].sort((a, b) => a - b);
  return {
    sampleCount: sorted.length,
    p50Ms: Math.round(percentile(sorted, 50)),
    p95Ms: Math.round(percentile(sorted, 95)),
  };
}
