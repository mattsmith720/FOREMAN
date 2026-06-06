"use client";

interface CoachScanOverlayProps {
  active: boolean;
}

export function CoachScanOverlay({ active }: CoachScanOverlayProps) {
  if (!active) {
    return null;
  }

  return (
    <div className="coach-scan-overlay" aria-hidden="true">
      <div className="coach-scan-grid" />
      <div className="coach-scan-sweep" />
      <div className="coach-scan-ring" />
    </div>
  );
}
