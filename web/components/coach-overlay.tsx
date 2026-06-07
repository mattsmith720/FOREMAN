"use client";

import { useEffect, useMemo, useState } from "react";
import type { CoachingResponse, VisualCallout } from "@foreman/shared";
import type { ActivityItem } from "../lib/activity-feed";
import type { JobPhaseId } from "../lib/job-phase";
import { jobPhaseLabel } from "../lib/job-phase";
import { pickSpokenCue } from "../lib/pick-spoken-cue";
import { CoachActivityFeed } from "./coach-activity-feed";
import { CoachDetailPanel } from "./coach-detail-panel";

interface CoachOverlayProps {
  coaching: CoachingResponse | null;
  status: string;
  isListening: boolean;
  isWatching: boolean;
  isAnalysing: boolean;
  jobPhase: JobPhaseId;
  latestTranscript: string | null;
  frameCount: number;
  lastAnalyseMs: number | null;
  activity: ActivityItem[];
  callouts: VisualCallout[];
  activeCalloutIndex: number;
  onCalloutSelect: (index: number) => void;
  livePanelOpen?: boolean;
  showPipeline?: boolean;
  onDetailsOpen?: () => void;
}

function pickHeroCue(
  coaching: CoachingResponse | null,
  callouts: VisualCallout[],
  activeCalloutIndex: number,
  jobPhase: JobPhaseId,
): {
  text: string;
  severity: "info" | "warning" | "critical";
  label: string;
} {
  const spoken = pickSpokenCue(coaching, jobPhase);
  if (spoken) {
    const label =
      spoken.severity === "critical"
        ? "Safety"
        : spoken.severity === "warning"
          ? "Quality"
          : "Foreman";
    return { text: spoken.text, severity: spoken.severity, label };
  }

  const active = callouts[activeCalloutIndex];
  if (active) {
    return {
      text: active.message,
      severity: active.severity,
      label: active.label,
    };
  }

  if (!coaching) {
    const idle =
      jobPhase === "customer_pitch"
        ? "Point the camera at the customer conversation."
        : jobPhase === "site_survey"
          ? "Walk the site — Foreman will coach from what it sees."
          : "Point the camera at the job.";
    return { text: idle, severity: "info", label: "Foreman" };
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

  if (jobPhase === "customer_pitch") {
    const pitch = coaching.salesPitchFeedback[0];
    if (pitch) {
      return { text: pitch.message, severity: pitch.severity, label: "Pitch" };
    }
  }

  const pitch = coaching.salesPitchFeedback[0];
  if (pitch && jobPhase !== "solar_install") {
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

type HeroCue = {
  text: string;
  severity: "info" | "warning" | "critical";
  label: string;
};

function collectCues(
  coaching: CoachingResponse | null,
  callouts: VisualCallout[],
): HeroCue[] {
  if (!coaching) {
    return [];
  }

  const cues: HeroCue[] = [];

  for (const callout of callouts) {
    cues.push({
      text: callout.message,
      severity: callout.severity,
      label: callout.label,
    });
  }

  for (const flag of coaching.installQualityFlags) {
    cues.push({
      text: flag.message,
      severity: flag.severity,
      label: flag.severity === "critical" ? "Safety" : "Quality",
    });
  }

  for (const pitch of coaching.salesPitchFeedback) {
    cues.push({
      text: pitch.message,
      severity: pitch.severity,
      label: "Pitch",
    });
  }

  for (const step of coaching.nextSteps) {
    cues.push({ text: step, severity: "info", label: "Next" });
  }

  for (const observation of coaching.observations) {
    cues.push({ text: observation, severity: "info", label: "Seeing" });
  }

  if (coaching.timeOnTaskNote) {
    cues.push({
      text: coaching.timeOnTaskNote,
      severity: "info",
      label: "Pacing",
    });
  }

  // Severity-first so the hero card (allCues[0]) never buries a critical safety
  // call behind a lower-severity visual callout that happened to be listed first.
  const severityRank: Record<string, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  cues.sort(
    (a, b) => (severityRank[a.severity] ?? 3) - (severityRank[b.severity] ?? 3),
  );

  const seen = new Set<string>();
  return cues.filter((cue) => {
    const key = `${cue.label}:${cue.text}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
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

interface CoachDetailsBodyProps {
  coaching: CoachingResponse | null;
  isAnalysing: boolean;
  isListening: boolean;
  latestTranscript: string | null;
  callouts: VisualCallout[];
  activeCalloutIndex: number;
  onCalloutSelect: (index: number) => void;
  activity: ActivityItem[];
  showActivityFeed: boolean;
}

function CoachDetailsBody({
  coaching,
  isAnalysing,
  isListening,
  latestTranscript,
  callouts,
  activeCalloutIndex,
  onCalloutSelect,
  activity,
  showActivityFeed,
}: CoachDetailsBodyProps) {
  const seeing = coaching?.observations[0] ?? null;

  return (
    <div className="coach-details-sheet">
      <section className="details-section">
        <h4>Seeing</h4>
        <p className="detail-prose">
          {seeing ??
            (isAnalysing
              ? "Scanning the current frame…"
              : "No scene yet — point the camera at the job.")}
        </p>
        {coaching && coaching.observations.length > 1 && (
          <ul className="detail-list">
            {coaching.observations.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="details-section">
        <h4>Heard</h4>
        <p className="detail-prose">
          {latestTranscript ??
            (isListening
              ? "Microphone active — waiting for speech."
              : "Microphone off or unavailable.")}
        </p>
      </section>

      <section className="details-section">
        <h4>Advice</h4>
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
          <p className="detail-prose">Advice appears after the first analysis.</p>
        )}
      </section>

      <section className="details-section">
        <h4>Marks</h4>
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
      </section>

      {showActivityFeed && (
        <section className="details-section">
          <h4>Activity</h4>
          <CoachActivityFeed items={activity} />
        </section>
      )}
    </div>
  );
}

export function CoachOverlay({
  coaching,
  status,
  isListening,
  isWatching,
  isAnalysing,
  jobPhase,
  latestTranscript,
  frameCount,
  lastAnalyseMs,
  activity,
  callouts,
  activeCalloutIndex,
  onCalloutSelect,
  livePanelOpen = false,
  showPipeline = false,
  onDetailsOpen,
}: CoachOverlayProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [manualCueIndex, setManualCueIndex] = useState(0);

  const defaultHero = pickHeroCue(
    coaching,
    callouts,
    activeCalloutIndex,
    jobPhase,
  );
  const allCues = useMemo(
    () => collectCues(coaching, callouts),
    [coaching, callouts],
  );

  const hero =
    allCues.length > 0
      ? allCues[manualCueIndex % allCues.length]
      : defaultHero;

  const hasDetails =
    Boolean(coaching) ||
    Boolean(latestTranscript) ||
    callouts.length > 0 ||
    activity.length > 0;

  useEffect(() => {
    setManualCueIndex(0);
  }, [coaching]);

  useEffect(() => {
    if (livePanelOpen) {
      setDetailsOpen(false);
    }
  }, [livePanelOpen]);

  const openDetails = () => {
    onDetailsOpen?.();
    setDetailsOpen(true);
  };

  return (
    <>
      <div className="coach-overlay" aria-live="polite">
        {isWatching && (
          <header className="coach-top coach-top-minimal">
            <span className="coach-phase-chip">{jobPhaseLabel(jobPhase)}</span>
            <span
              className={`coach-pill ${isAnalysing ? "analysing" : ""} ${status === "Error" ? "status-error" : ""}`}
            >
              {status}
            </span>
          </header>
        )}

        {showPipeline && isWatching && (
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
          <button
            type="button"
            className={`coach-card severity-${hero.severity} ${isAnalysing ? "tracking" : ""}`}
            onClick={() => {
              if (allCues.length > 1) {
                setManualCueIndex((current) => (current + 1) % allCues.length);
              }
            }}
            aria-label={
              allCues.length > 1
                ? "Coaching cue, tap to cycle"
                : "Coaching cue"
            }
          >
            <p className="coach-card-label">
              {hero.label}
              {allCues.length > 1 && (
                <span className="coach-cue-index">
                  {(manualCueIndex % allCues.length) + 1}/{allCues.length}
                </span>
              )}
            </p>
            <p className="coach-card-text" key={hero.text}>
              {hero.text}
            </p>
          </button>

          {isWatching && (
            <button
              type="button"
              className={`toolbar-btn details-btn ${detailsOpen ? "active" : ""} ${hasDetails ? "has-data" : ""}`}
              onClick={openDetails}
              aria-expanded={detailsOpen}
            >
              Details
            </button>
          )}
        </div>
      </div>

      <CoachDetailPanel
        open={detailsOpen}
        title="Job details"
        onClose={() => setDetailsOpen(false)}
      >
        <CoachDetailsBody
          coaching={coaching}
          isAnalysing={isAnalysing}
          isListening={isListening}
          latestTranscript={latestTranscript}
          callouts={callouts}
          activeCalloutIndex={activeCalloutIndex}
          onCalloutSelect={onCalloutSelect}
          activity={activity}
          showActivityFeed={showPipeline}
        />
      </CoachDetailPanel>
    </>
  );
}
