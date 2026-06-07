import { estimateSessionCostUsd } from "./session-cost";

/** Soft warning threshold — coaching continues; integrator surfaces UX/voice. */
export const DEFAULT_SOFT_CAP_WARNING_USD = 0.5;

function resolveWarningUsd(override?: number): number {
  if (override !== undefined) {
    return override;
  }
  const raw =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SESSION_SPEND_WARNING_USD
      : undefined;
  if (raw) {
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_SOFT_CAP_WARNING_USD;
}

export interface SessionSpendCapOptions {
  /** USD estimate at which to fire one soft warning (default $0.50). */
  warningUsd?: number;
}

/**
 * Running session spend tally (analyse + transcribe estimates).
 * Soft cap only — does not block capture; use consumeWarning() + onSpendCapWarning.
 */
export class SessionSpendCap {
  private analyseCount = 0;
  private transcriptCount = 0;
  private warned = false;
  private readonly warningUsd: number;

  constructor(opts?: SessionSpendCapOptions) {
    this.warningUsd = resolveWarningUsd(opts?.warningUsd);
  }

  recordAnalyse(): void {
    this.analyseCount += 1;
  }

  recordTranscribe(): void {
    this.transcriptCount += 1;
  }

  spentUsd(): number {
    return estimateSessionCostUsd(this.analyseCount, this.transcriptCount);
  }

  warningThresholdUsd(): number {
    return this.warningUsd;
  }

  remainingUntilWarningUsd(): number {
    return Math.max(0, this.warningUsd - this.spentUsd());
  }

  /** 0–1 fraction of soft warning threshold consumed. */
  utilisation(): number {
    if (this.warningUsd <= 0) {
      return 1;
    }
    return Math.min(1, this.spentUsd() / this.warningUsd);
  }

  isWarningThresholdReached(): boolean {
    return this.spentUsd() >= this.warningUsd;
  }

  /** True once when spend first crosses the soft cap; idempotent thereafter. */
  consumeWarning(): boolean {
    if (this.warned || !this.isWarningThresholdReached()) {
      return false;
    }
    this.warned = true;
    return true;
  }

  reset(): void {
    this.analyseCount = 0;
    this.transcriptCount = 0;
    this.warned = false;
  }
}
