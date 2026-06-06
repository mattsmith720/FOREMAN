"use client";

import { useEffect, useState } from "react";
import type { CoachingResponse, VisualCallout } from "@foreman/shared";
import type { ActivityItem } from "../lib/activity-feed";
import { CoachActivityFeed } from "./coach-activity-feed";
import { CoachDetailPanel } from "./coach-detail-panel";

export type CoachPanelSection =
  | "seeing"
  | "hearing"
  | "advice"
  | "highlights"
  | "feed";

interface CoachOverlayProps {
  coaching: CoachingResponse | null;
  status: string;
  isListening: boolean;
  isWatching: boolean;
  isAnalysing: boolean;
  latestTranscript: string | null;
  frameCount: number;
  lastAnalyseMs: number | null;
  activity: ActivityItem[];
  callouts: VisualCallout[];
  activeCalloutIndex: number;
  onCalloutSelect: (index: number) => void;
  voiceReady: boolean;
  livePanelOpen?: boolean;
  showPipeline?: boolean;
  onSectionOpen?: () => void;
}

function pickHeroCue(
  coaching: CoachingResponse | null,
  callouts: VisualCallout[],
  activeCalloutIndex: number,
): {
  text: string;
  severity: "info" | "warning" | "critical";
  label: string;
} {
  const active = callouts[activeCalloutIndex];
  if (active) {
    return {
      text: active.message,
      severity: active.severity,
      label: active.label,
    };
  }

  if (!coaching) {
    return {
      text: "Point the camera at the job.",
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
    return { text: next, severity: "info", label: "Next" };
  }

  const observation = coaching.observations[0];
  if (observation) {
    return { text: observation, severity: "info", label: "Seeing" };
  }

  return {
    text: coaching.timeOnTaskNote || "Analyzing…",
    severity: "info",
    label: "Foreman",
  };
}

const CALLOUT_CATEGORY_LABELS: Record<VisualCallout["category"], string> = {
  quality: "Quality",
  safety: "Safety",
  pitch: "Pitch",
  upsell: "Upsell",
  cleanliness: "Clean",
  damage: "Damage",
  time: "Time",
};

const PANEL_TITLES: Record<CoachPanelSection, string> = {
  seeing: "What Foreman sees",
  hearing: "What Foreman hears",
  advice: "Coaching advice",
  highlights: "On-screen highlights",
  feed: "Live activity feed",
};

export function CoachOverlay({
  coaching,
  status,
  isListening,
  isWatching,
  isAnalysing,
  latestTranscript,
  frameCount,
  lastAnalyseMs,
  activity,
  callouts,
  activeCalloutIndex,
  onCalloutSelect,
  voiceReady,
  livePanelOpen = false,
  showPipeline = false,
  onSectionOpen,
}: CoachOverlayProps) {
  const [openSection, setOpenSection] = useState<CoachPanelSection | null>(
    null,
  );

  const hero = pickHeroCue(coaching, callouts, activeCalloutIndex);
  const seeing = coaching?.observations[0] ?? null;

  useEffect(() => {
    if (livePanelOpen) {
      setOpenSection(null);
    }
  }, [livePanelOpen]);

  const toggleSection = (section: CoachPanelSection) => {
    onSectionOpen?.();
    setOpenSection((current) => (current === section ? null : section));
  };

  return (
    <>
      <div className="coach-overlay" aria-live="polite">
        <header className="coach-top">
          <div className="coach-brand-block">
            <span className="coach-brand">Foreman</span>
            {isWatching && (
              <span className="coach-live-badge">
                <span className="coach-rec-dot" />
                LIVE
              </span>
            )}
            {voiceReady && (
              <span className="coach-voice-badge" title="ElevenLabs voice ready">
                Voice
              </span>
            )}
          </div>
          <div className="coach-status">
            <span className={`coach-dot ${isWatching ? "on" : ""}`}>Cam</span>
            <span className={`coach-dot ${isListening ? "on" : ""}`}>Mic</span>
            <span
              className={`coach-pill ${isAnalysing ? "analysing" : ""} ${status === "Error" ? "status-error" : ""}`}
            >
              {status}
            </span>
          </div>
        </header>

        {showPipeline && (
          <div className="coach-pipeline" aria-label="Pipeline">
            <span className={`pipe-step ${isWatching ? "on" : ""}`}>
              Cap {frameCount || "—"}
            </span>
            <span className="pipe-arrow">·</span>
            <span className={`pipe-step ${isAnalysing ? "on" : ""}`}>
              {isAnalysing ? "AI…" : lastAnalyseMs ? `${lastAnalyseMs}ms` : "AI"}
            </span>
            <span className="pipe-arrow">·</span>
            <span className={`pipe-step ${coaching ? "on" : ""}`}>Coach</span>
          </div>
        )}

        <div className="coach-dock">
          <div
            className={`coach-card severity-${hero.severity} ${isAnalysing ? "tracking" : ""}`}
          >
            <p className="coach-card-label">{hero.label}</p>
            <p className="coach-card-text">{hero.text}</p>
          </div>

          {(latestTranscript || isListening) && (
            <div className="coach-heard">
              <span className="coach-heard-label">Heard</span>
              <p
                className={`coach-heard-text ${!latestTranscript && isListening ? "coach-heard-placeholder" : ""}`}
              >
                {latestTranscript ?? "Listening…"}
              </p>
            </div>
          )}

          <nav className="coach-toolbar" aria-label="Coaching panels">
            <button
              type="button"
              className={`toolbar-btn ${openSection === "seeing" ? "active" : ""}`}
              onClick={() => toggleSection("seeing")}
            >
              Seeing
            </button>
            <button
              type="button"
              className={`toolbar-btn ${openSection === "hearing" ? "active" : ""}`}
              onClick={() => toggleSection("hearing")}
            >
              Hearing
            </button>
            <button
              type="button"
              className={`toolbar-btn ${openSection === "advice" ? "active" : ""}`}
              onClick={() => toggleSection("advice")}
            >
              Advice
            </button>
            <button
              type="button"
              className={`toolbar-btn ${openSection === "highlights" ? "active" : ""} ${callouts.length > 0 ? "has-data" : ""}`}
              onClick={() => toggleSection("highlights")}
            >
              Marks
            </button>
            <button
              type="button"
              className={`toolbar-btn ${openSection === "feed" ? "active" : ""}`}
              onClick={() => toggleSection("feed")}
            >
              Feed
            </button>
          </nav>
        </div>
      </div>

      <CoachDetailPanel
        open={openSection === "seeing"}
        title={PANEL_TITLES.seeing}
        onClose={() => setOpenSection(null)}
      >
        <p className="detail-prose">
          {seeing ?? (isAnalysing ? "Scanning the current frame…" : "No scene yet — start the job and point the camera.")}
        </p>
        {coaching && coaching.observations.length > 1 && (
          <ul className="detail-list">
            {coaching.observations.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </CoachDetailPanel>

      <CoachDetailPanel
        open={openSection === "hearing"}
        title={PANEL_TITLES.hearing}
        onClose={() => setOpenSection(null)}
      >
        <p className="detail-prose">
          {latestTranscript ??
            (isListening
              ? "Microphone active — waiting for speech."
              : "Microphone off or unavailable.")}
        </p>
      </CoachDetailPanel>

      <CoachDetailPanel
        open={openSection === "advice"}
        title={PANEL_TITLES.advice}
        onClose={() => setOpenSection(null)}
      >
        {coaching ? (
          <div className="coach-advice-grid">
            {coaching.installQualityFlags.length > 0 && (
              <section className="advice-block">
                <h4>Quality & safety</h4>
                <ul>
                  {coaching.installQualityFlags.map((flag) => (
                    <li key={flag.message} className={`sev-${flag.severity}`}>
                      {flag.message}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {coaching.salesPitchFeedback.length > 0 && (
              <section className="advice-block">
                <h4>Pitch & upsell</h4>
                <ul>
                  {coaching.salesPitchFeedback.map((item) => (
                    <li key={item.message}>{item.message}</li>
                  ))}
                </ul>
              </section>
            )}
            {coaching.nextSteps.length > 0 && (
              <section className="advice-block">
                <h4>Next steps</h4>
                <ul>
                  {coaching.nextSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </section>
            )}
            {coaching.timeOnTaskNote && (
              <section className="advice-block">
                <h4>Pacing</h4>
                <p className="detail-prose">{coaching.timeOnTaskNote}</p>
              </section>
            )}
          </div>
        ) : (
          <p className="detail-prose">Advice appears after the first frame analysis.</p>
        )}
      </CoachDetailPanel>

      <CoachDetailPanel
        open={openSection === "highlights"}
        title={PANEL_TITLES.highlights}
        onClose={() => setOpenSection(null)}
      >
        {callouts.length === 0 ? (
          <p className="detail-prose">No on-screen marks for this frame yet.</p>
        ) : (
          <div className="coach-callouts detail-callouts">
            {callouts.map((callout, index) => (
              <button
                key={`${callout.label}-${index}`}
                type="button"
                className={`callout-chip cat-${callout.category} sev-${callout.severity} ${index === activeCalloutIndex ? "active" : ""}`}
                onClick={() => onCalloutSelect(index)}
              >
                <span className="callout-chip-cat">
                  {CALLOUT_CATEGORY_LABELS[callout.category]}
                </span>
                {callout.label}
                <span className="callout-chip-msg">{callout.message}</span>
              </button>
            ))}
          </div>
        )}
      </CoachDetailPanel>

      <CoachDetailPanel
        open={openSection === "feed"}
        title={PANEL_TITLES.feed}
        onClose={() => setOpenSection(null)}
      >
        <CoachActivityFeed items={activity} />
      </CoachDetailPanel>
    </>
  );
}
