"use client";

import type { CoachingResponse } from "@foreman/shared";
import { useEffect, useState } from "react";
import type { MemoryEvent } from "../lib/memory-feed";
import { JarvisRings } from "./jarvis-rings";

interface JarvisHudProps {
  coaching: CoachingResponse | null;
  status: string;
  isListening: boolean;
  isWatching: boolean;
  isAnalysing: boolean;
  sessionId: string | null;
  latestTranscript: string | null;
  memoryEvents: MemoryEvent[];
  memoryTotal: number;
  audioLevels: number[];
}

function pickHeroCue(coaching: CoachingResponse | null): {
  text: string;
  severity: "info" | "warning" | "critical";
  label: string;
} {
  if (!coaching) {
    return {
      text: "Systems online. Neural vision active. Awaiting scene.",
      severity: "info",
      label: "Foreman AI",
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
    text: coaching.timeOnTaskNote || "Processing visual feed…",
    severity: "info",
    label: "Foreman AI",
  };
}

function shortSessionId(id: string | null): string {
  if (!id) {
    return "—";
  }
  return id.slice(0, 8).toUpperCase();
}

export function JarvisHud({
  coaching,
  status,
  isListening,
  isWatching,
  isAnalysing,
  sessionId,
  latestTranscript,
  memoryEvents,
  memoryTotal,
  audioLevels,
}: JarvisHudProps) {
  const hero = pickHeroCue(coaching);
  const recentMemory = memoryEvents.slice(-4).reverse();
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={`jarvis-hud ${isAnalysing ? "is-analysing" : ""} ${isWatching ? "is-live" : ""}`}
      aria-live="polite"
    >
      <div className="jarvis-vignette" aria-hidden="true" />
      <div className="jarvis-scanline" aria-hidden="true" />
      <div className="jarvis-scanline-fast" aria-hidden="true" />
      <div className="jarvis-grid" aria-hidden="true" />
      <div className="jarvis-noise" aria-hidden="true" />

      <div className="jarvis-corner jarvis-corner-tl" aria-hidden="true" />
      <div className="jarvis-corner jarvis-corner-tr" aria-hidden="true" />
      <div className="jarvis-corner jarvis-corner-bl" aria-hidden="true" />
      <div className="jarvis-corner jarvis-corner-br" aria-hidden="true" />

      <JarvisRings isAnalysing={isAnalysing} isActive={isWatching} />

      <div className="jarvis-top hud-boot" style={{ animationDelay: "0.05s" }}>
        <div className="jarvis-brand-block">
          <span className="jarvis-brand">FOREMAN</span>
          <span className="jarvis-subbrand">NEURAL FIELD COACH v1</span>
        </div>
        <div className="jarvis-chips">
          <span className={`jarvis-chip ${isWatching ? "active pulse" : ""}`}>
            CAM {isWatching ? "ON" : "—"}
          </span>
          <span className={`jarvis-chip ${isListening ? "active pulse" : ""}`}>
            MIC {isListening ? "ON" : "—"}
          </span>
          <span
            className={`jarvis-chip accent ${isAnalysing ? "thinking pulse" : ""}`}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="jarvis-telemetry hud-boot" style={{ animationDelay: "0.12s" }}>
        <span>SYS {clock}</span>
        <span>SESS {shortSessionId(sessionId)}</span>
        <span>MEM {memoryTotal.toString().padStart(3, "0")}</span>
        <span className={isAnalysing ? "telemetry-hot" : ""}>
          {isAnalysing ? "CLAUDE SYNC" : "FEED LIVE"}
        </span>
      </div>

      {isListening && (
        <div className="jarvis-waveform hud-boot" style={{ animationDelay: "0.18s" }}>
          {audioLevels.map((level, index) => (
            <span
              key={index}
              className="jarvis-wave-bar"
              style={{ transform: `scaleY(${level})` }}
            />
          ))}
        </div>
      )}

      <div
        className={`jarvis-hero hud-bracket severity-${hero.severity} hud-boot`}
        style={{ animationDelay: "0.22s" }}
        key={hero.text}
      >
        <p className="jarvis-hero-label">{hero.label}</p>
        <p className="jarvis-hero-text">{hero.text}</p>
        {isAnalysing && (
          <div className="jarvis-thinking" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      {coaching && (
        <div className="jarvis-ticker hud-boot" style={{ animationDelay: "0.28s" }}>
          <div className="jarvis-ticker-track">
            {[...coaching.observations.slice(0, 3), coaching.timeOnTaskNote]
              .filter(Boolean)
              .map((line) => (
                <p key={line}>{line}</p>
              ))}
          </div>
        </div>
      )}

      {latestTranscript && (
        <div className="jarvis-transcript hud-bracket hud-boot" style={{ animationDelay: "0.34s" }}>
          <span className="jarvis-transcript-label">Audio capture</span>
          <p className="jarvis-typewriter">{latestTranscript}</p>
        </div>
      )}

      <div className="jarvis-memory hud-bracket hud-boot" style={{ animationDelay: "0.4s" }}>
        <div className="jarvis-memory-header">
          <span>Training memory</span>
          <span>{memoryTotal} records</span>
        </div>
        <div className="jarvis-datastream" aria-hidden="true">
          {recentMemory.map((event) => (
            <span key={event.id}>{event.message}</span>
          ))}
        </div>
        {recentMemory.length === 0 ? (
          <p className="jarvis-muted">Ingesting frames into proprietary dataset…</p>
        ) : (
          <ul>
            {recentMemory.map((event) => (
              <li key={event.id}>{event.message}</li>
            ))}
          </ul>
        )}
      </div>

      {isWatching && (
        <div className="jarvis-rec" aria-hidden="true">
          <span className="jarvis-rec-dot" />
          REC
        </div>
      )}
    </div>
  );
}
