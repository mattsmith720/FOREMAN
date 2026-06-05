"use client";

import type { CoachingResponse } from "@foreman/shared";
import type { MemoryEvent } from "../lib/memory-feed";

interface JarvisHudProps {
  coaching: CoachingResponse | null;
  status: string;
  isListening: boolean;
  isWatching: boolean;
  latestTranscript: string | null;
  memoryEvents: MemoryEvent[];
  memoryTotal: number;
}

function pickHeroCue(coaching: CoachingResponse | null): {
  text: string;
  severity: "info" | "warning" | "critical";
  label: string;
} {
  if (!coaching) {
    return {
      text: "Standing by. Watching and listening.",
      severity: "info",
      label: "Foreman",
    };
  }

  const critical = coaching.installQualityFlags.find(
    (f) => f.severity === "critical",
  );
  if (critical) {
    return { text: critical.message, severity: "critical", label: "Safety" };
  }

  const warning = coaching.installQualityFlags.find(
    (f) => f.severity === "warning",
  );
  if (warning) {
    return { text: warning.message, severity: "warning", label: "Quality" };
  }

  const pitch = coaching.salesPitchFeedback[0];
  if (pitch) {
    return { text: pitch.message, severity: pitch.severity, label: "Pitch" };
  }

  const next = coaching.nextSteps[0];
  if (next) {
    return { text: next, severity: "info", label: "Next step" };
  }

  const observation = coaching.observations[0];
  if (observation) {
    return { text: observation, severity: "info", label: "Observation" };
  }

  return {
    text: coaching.timeOnTaskNote || "Analysing your work.",
    severity: "info",
    label: "Foreman",
  };
}

export function JarvisHud({
  coaching,
  status,
  isListening,
  isWatching,
  latestTranscript,
  memoryEvents,
  memoryTotal,
}: JarvisHudProps) {
  const hero = pickHeroCue(coaching);
  const recentMemory = memoryEvents.slice(-3).reverse();

  return (
    <div className="jarvis-hud" aria-live="polite">
      <div className="jarvis-scanline" aria-hidden="true" />
      <div className="jarvis-grid" aria-hidden="true" />

      <div className="jarvis-top">
        <span className="jarvis-brand">FOREMAN</span>
        <div className="jarvis-chips">
          <span className={`jarvis-chip ${isWatching ? "active" : ""}`}>
            CAM {isWatching ? "ON" : "—"}
          </span>
          <span className={`jarvis-chip ${isListening ? "active" : ""}`}>
            MIC {isListening ? "ON" : "—"}
          </span>
          <span className="jarvis-chip accent">{status}</span>
        </div>
      </div>

      <div className={`jarvis-hero severity-${hero.severity}`}>
        <p className="jarvis-hero-label">{hero.label}</p>
        <p className="jarvis-hero-text">{hero.text}</p>
      </div>

      {coaching && (
        <div className="jarvis-ticker">
          {coaching.observations.slice(0, 2).map((line) => (
            <p key={line}>{line}</p>
          ))}
          {coaching.timeOnTaskNote && (
            <p className="jarvis-muted">{coaching.timeOnTaskNote}</p>
          )}
        </div>
      )}

      {latestTranscript && (
        <div className="jarvis-transcript">
          <span className="jarvis-transcript-label">Heard</span>
          <p>{latestTranscript}</p>
        </div>
      )}

      <div className="jarvis-memory">
        <div className="jarvis-memory-header">
          <span>Training memory</span>
          <span>{memoryTotal} records</span>
        </div>
        {recentMemory.length === 0 ? (
          <p className="jarvis-muted">Adding to memory as you work…</p>
        ) : (
          <ul>
            {recentMemory.map((event) => (
              <li key={event.id}>{event.message}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
