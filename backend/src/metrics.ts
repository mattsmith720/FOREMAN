/**
 * Lightweight in-memory latency metrics. Ephemeral (resets on process restart) —
 * a live readout for /ops, not durable analytics. No PII, no storage, no migration.
 */
const MAX_SAMPLES = 200;
const analyseMsSamples: number[] = [];
const cueE2eMsSamples: number[] = [];

function pushSample(bucket: number[], ms: number): void {
  if (!Number.isFinite(ms) || ms < 0) {
    return;
  }
  bucket.push(ms);
  if (bucket.length > MAX_SAMPLES) {
    bucket.shift();
  }
}

export function recordAnalyseMs(ms: number): void {
  pushSample(analyseMsSamples, ms);
}

/** Frame captured → coaching cue audible (client-reported E2E). */
export function recordCueE2eMs(ms: number): void {
  pushSample(cueE2eMsSamples, ms);
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

export interface LatencySlice {
  sampleCount: number;
  p50Ms: number;
  p95Ms: number;
}

function sliceMetrics(samples: number[]): LatencySlice {
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    sampleCount: sorted.length,
    p50Ms: Math.round(percentile(sorted, 50)),
    p95Ms: Math.round(percentile(sorted, 95)),
  };
}

export interface LatencyMetrics {
  analyse: LatencySlice;
  cueE2e: LatencySlice;
}

export function getLatencyMetrics(): LatencyMetrics {
  return {
    analyse: sliceMetrics(analyseMsSamples),
    cueE2e: sliceMetrics(cueE2eMsSamples),
  };
}
