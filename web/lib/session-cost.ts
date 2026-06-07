import { apiFetch } from "./api-fetch";

// Defaults mirror backend/src/config.ts (getAnalyseCostUsd / getTranscribeCostUsd).
export const DEFAULT_ANALYSE_COST_USD = 0.015;
export const DEFAULT_TRANSCRIBE_COST_USD = 0.0004;

export interface CostModel {
  analyse_usd: number;
  transcribe_usd: number;
}

function numericEnv(value: string | undefined, fallback: number): number {
  const trimmed = value?.trim();
  if (!trimmed) {
    return fallback;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function envCostModel(): CostModel {
  return {
    analyse_usd: numericEnv(
      process.env.NEXT_PUBLIC_ANALYSE_COST_USD,
      DEFAULT_ANALYSE_COST_USD,
    ),
    transcribe_usd: numericEnv(
      process.env.NEXT_PUBLIC_TRANSCRIBE_COST_USD,
      DEFAULT_TRANSCRIBE_COST_USD,
    ),
  };
}

let activeCostModel: CostModel = envCostModel();
let syncPromise: Promise<void> | null = null;

export function getCostModel(): CostModel {
  return activeCostModel;
}

export function setCostModel(model: CostModel): void {
  activeCostModel = {
    analyse_usd: numericEnv(String(model.analyse_usd), DEFAULT_ANALYSE_COST_USD),
    transcribe_usd: numericEnv(
      String(model.transcribe_usd),
      DEFAULT_TRANSCRIBE_COST_USD,
    ),
  };
}

/** Best-effort sync from backend /metrics/cost-model (matches /ops costModel). */
export function ensureCostModelSynced(): Promise<void> {
  if (syncPromise || typeof window === "undefined") {
    return syncPromise ?? Promise.resolve();
  }

  syncPromise = (async () => {
    try {
      const response = await apiFetch("/metrics/cost-model", {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        return;
      }
      const body = (await response.json()) as Partial<CostModel>;
      if (
        typeof body.analyse_usd === "number" &&
        typeof body.transcribe_usd === "number"
      ) {
        setCostModel({
          analyse_usd: body.analyse_usd,
          transcribe_usd: body.transcribe_usd,
        });
      }
    } catch {
      // Keep env/default model when proxy or backend is unavailable.
    }
  })();

  return syncPromise;
}

export function estimateSessionCostUsd(
  frameCount: number,
  transcriptChunkCount: number,
): number {
  const { analyse_usd: analyseCost, transcribe_usd: transcribeCost } =
    activeCostModel;
  const cost =
    Math.max(0, frameCount) * analyseCost +
    Math.max(0, transcriptChunkCount) * transcribeCost;
  return Math.round(cost * 1000) / 1000;
}
