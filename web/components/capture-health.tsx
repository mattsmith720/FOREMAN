"use client";

export interface CaptureHealthStats {
  frameKb: number | null;
  analyseMs: number | null;
  lastPersisted: boolean | null;
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
      <span>
        Saved {stats.lastPersisted === null ? "—" : stats.lastPersisted ? "yes" : "no"}
      </span>
      <span>Mic {stats.micMime ?? "—"}</span>
      <span>Chunk {stats.chunkKb ?? "—"} KB</span>
    </div>
  );
}
