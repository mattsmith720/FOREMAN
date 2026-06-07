"use client";

export interface CaptureHealthStats {
  frameKb: number | null;
  analyseMs: number | null;
  cueE2eMs: number | null;
  estCostUsd: number | null;
  persistQueued: boolean;
  micMime: string | null;
  chunkKb: number | null;
}

interface CaptureHealthProps {
  stats: CaptureHealthStats;
}

export function CaptureHealth({ stats }: CaptureHealthProps) {
  return (
    <div className="capture-health" aria-label="Capture diagnostics">
      <span>Frame {stats.frameKb ?? "—"} KB</span>
      <span>Analyse {stats.analyseMs ?? "—"} ms</span>
      <span>Cue attempt {stats.cueE2eMs ?? "—"} ms</span>
      <span>Est ${stats.estCostUsd?.toFixed(3) ?? "—"}</span>
      <span>Persist {stats.persistQueued ? "async" : "—"}</span>
      <span>Mic {stats.micMime ?? "—"}</span>
      <span>Chunk {stats.chunkKb ?? "—"} KB</span>
    </div>
  );
}
