"use client";

import Link from "next/link";
import { useState } from "react";
import type { SessionCounts, SessionRow } from "../lib/sessions";

interface SessionSummaryProps {
  session: SessionRow;
  stored: SessionCounts;
  onStartNew?: () => void;
}

function formatStatsLine(stored: SessionCounts): string {
  const cues =
    stored.coaching_events === 1
      ? "1 coaching cue"
      : `${stored.coaching_events} coaching cues`;
  const clips =
    stored.transcript_segments === 1
      ? "1 voice clip"
      : `${stored.transcript_segments} voice clips`;
  return `${stored.frames} frames · ${cues} · ${clips}`;
}

export function SessionSummary({
  session,
  stored,
  onStartNew,
}: SessionSummaryProps) {
  const summaryFailed =
    session.summary?.startsWith("Summarising job") ?? false;
  const noFrames = stored.frames === 0;
  const [trainingState, setTrainingState] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [trainingError, setTrainingError] = useState<string | null>(null);

  async function handleGenerateTraining() {
    setTrainingState("loading");
    setTrainingError(null);
    try {
      const res = await fetch(`/api/sessions/${session.id}/training-module`, {
        method: "POST",
      });
      const body = (await res.json()) as { error?: string; module?: unknown };
      if (!res.ok || !body.module) {
        throw new Error(body.error ?? "Generation failed");
      }
      setTrainingState("done");
    } catch (err) {
      setTrainingState("error");
      setTrainingError(
        err instanceof Error ? err.message : "Generation failed",
      );
    }
  }

  return (
    <section className="summary-panel summary-panel--simple">
      <h2>{summaryFailed || noFrames ? "Job ended" : "Job complete"}</h2>
      {noFrames ? (
        <p className="summary-text summary-empty">
          No footage was captured this time.
        </p>
      ) : (
        <>
          <p className="summary-text">
            {session.summary ?? "Summary will appear here when ready."}
          </p>
          <p className="summary-stats-line">{formatStatsLine(stored)}</p>
        </>
      )}

      {!noFrames && (
        <div className="summary-actions">
          <button
            type="button"
            className="button button-secondary"
            disabled={trainingState === "loading"}
            onClick={() => void handleGenerateTraining()}
          >
            {trainingState === "loading"
              ? "Generating…"
              : trainingState === "done"
                ? "Training module ready"
                : "Generate training module"}
          </button>
          <Link
            className="button button-secondary summary-training-link"
            href={`/training?session=${session.id}`}
          >
            Open in training
          </Link>
        </div>
      )}
      {trainingError && (
        <p className="summary-training-error" role="alert">
          {trainingError}
        </p>
      )}

      {onStartNew && (
        <button
          type="button"
          className="button button-primary summary-new-job"
          onClick={onStartNew}
        >
          Start new job
        </button>
      )}
    </section>
  );
}
