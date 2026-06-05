"use client";

import type { ReactNode } from "react";

interface CoachDetailPanelProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function CoachDetailPanel({
  open,
  title,
  onClose,
  children,
}: CoachDetailPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="coach-detail-backdrop"
        onClick={onClose}
        aria-label="Close panel"
      />
      <div className="coach-detail-panel" role="dialog" aria-label={title}>
        <header className="coach-detail-header">
          <h3>{title}</h3>
          <button type="button" className="coach-detail-close" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="coach-detail-body">{children}</div>
      </div>
    </>
  );
}
