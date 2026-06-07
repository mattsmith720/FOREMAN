"use client";

import type { CoachingResponse } from "@foreman/shared";
import { useCallback, useMemo, useState } from "react";
import { complianceProgress } from "../lib/compliance-pack";
import {
  buildDemoEvidencePackZip,
  DEMO_CAPTURE_STEPS,
  DEMO_SESSION_ID,
  downloadDemoEvidencePack,
  formatPackValidationReport,
  PLANTED_DEFECT,
  validateDemoEvidencePack,
  type DemoCaptureStep,
  type PackValidationReport,
} from "../lib/demo-job";
import { pickSpokenCue } from "../lib/pick-spoken-cue";
import { CoachAnnotations } from "./coach-annotations";

type DemoPhase = "idle" | "capture" | "analysing" | "verdict" | "complete";

interface CapturedShot {
  step: DemoCaptureStep;
  capturedAt: string;
}

function heroFromCoaching(coaching: CoachingResponse): {
  text: string;
  severity: "info" | "warning" | "critical";
  label: string;
} {
  const spoken = pickSpokenCue(coaching, "solar_install");
  if (spoken) {
    const label =
      spoken.severity === "critical"
        ? "Safety"
        : spoken.severity === "warning"
          ? "Quality"
          : "Foreman";
    return { text: spoken.text, severity: spoken.severity, label };
  }

  const flag = coaching.installQualityFlags[0];
  if (flag) {
    return {
      text: flag.message,
      severity: flag.severity,
      label: flag.severity === "critical" ? "Safety" : "Quality",
    };
  }

  return {
    text: coaching.nextSteps[0] ?? coaching.observations[0] ?? "Shot captured.",
    severity: "info",
    label: "Foreman",
  };
}

export function DemoCoach() {
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [captured, setCaptured] = useState<CapturedShot[]>([]);
  const [coaching, setCoaching] = useState<CoachingResponse | null>(null);
  const [activeCalloutIndex, setActiveCalloutIndex] = useState(0);
  const [packReport, setPackReport] = useState<PackValidationReport | null>(
    null,
  );

  const currentStep = DEMO_CAPTURE_STEPS[stepIndex] ?? null;
  const progress = complianceProgress(
    new Set(captured.map((shot) => shot.step.shotId)),
  );

  const callouts = useMemo(
    () => coaching?.visualCallouts ?? [],
    [coaching],
  );

  const hero = coaching ? heroFromCoaching(coaching) : null;

  const startDemo = useCallback(() => {
    setPhase("capture");
    setStepIndex(0);
    setCaptured([]);
    setCoaching(null);
    setPackReport(null);
    setActiveCalloutIndex(0);
  }, []);

  const finishDemo = useCallback((shots: CapturedShot[]) => {
    const zipBytes = buildDemoEvidencePackZip(
      shots.map((shot) => ({
        shotId: shot.step.shotId,
        imageSrc: shot.step.imageSrc,
        capturedAt: shot.capturedAt,
      })),
    );
    const report = validateDemoEvidencePack(zipBytes);
    setPackReport(report);
    downloadDemoEvidencePack(zipBytes);
    setPhase("complete");
  }, []);

  const runAnalysis = useCallback((step: DemoCaptureStep) => {
    setPhase("analysing");
    window.setTimeout(() => {
      setCoaching(step.coaching);
      setActiveCalloutIndex(0);
      setPhase(step.plantedDefect ? "verdict" : "capture");
    }, 650);
  }, []);

  const captureShot = useCallback(() => {
    if (!currentStep) return;

    const shot: CapturedShot = {
      step: currentStep,
      capturedAt: new Date().toISOString(),
    };
    setCaptured((prev) => [...prev, shot]);
    runAnalysis(currentStep);
  }, [currentStep, runAnalysis]);

  const goToNextOrFinish = useCallback(
    (shots: CapturedShot[]) => {
      if (stepIndex >= DEMO_CAPTURE_STEPS.length - 1) {
        finishDemo(shots);
        return;
      }
      setStepIndex((index) => index + 1);
      setCoaching(null);
      setPhase("capture");
    },
    [finishDemo, stepIndex],
  );

  const advanceAfterVerdict = useCallback(() => {
    setCaptured((shots) => {
      goToNextOrFinish(shots);
      return shots;
    });
  }, [goToNextOrFinish]);

  const nextShot = useCallback(() => {
    setCaptured((shots) => {
      goToNextOrFinish(shots);
      return shots;
    });
  }, [goToNextOrFinish]);

  if (phase === "idle") {
    return (
      <main className="camera-app">
        <section className="camera-placeholder demo-shell">
          <p className="demo-kicker">Program C · Lane C1</p>
          <h1>Foreman demo job</h1>
          <p className="demo-lead">
            One-tap scripted install using A1 CER fixtures. No API key — coaching
            comes from golden JSON and the evidence pack is validated offline.
          </p>
          <ul className="demo-bullets">
            <li>Guided compliance capture (6 shots)</li>
            <li>Planted shutdown-label defect on switchboard</li>
            <li>Pack validation call (A3 rules)</li>
          </ul>
          <button
            type="button"
            className="button button-primary demo-start"
            onClick={startDemo}
          >
            Start demo job
          </button>
          <p className="demo-footnote">Session {DEMO_SESSION_ID.slice(0, 8)}</p>
        </section>
      </main>
    );
  }

  if (phase === "complete" && packReport) {
    return (
      <main className="camera-app">
        <section className="summary-panel demo-complete">
          <h2>Demo complete</h2>
          <p className="summary-text">
            Six compliance shots captured from A1 fixtures. Foreman flagged the
            planted <strong>{PLANTED_DEFECT.defectClass}</strong> defect on the
            switchboard shot.
          </p>

          <div className="stored-counts">
            <p>
              <strong>Planted defect verdict</strong>
            </p>
            <p className={`demo-verdict demo-verdict--${PLANTED_DEFECT.compliant ? "pass" : "fail"}`}>
              {PLANTED_DEFECT.message}
            </p>
            <p>
              <strong>Evidence pack validation</strong>
            </p>
            <p className={`demo-pack-result demo-pack-result--${packReport.ok ? "pass" : "fail"}`}>
              {packReport.ok ? "PASS" : "FAIL"} — {packReport.presentShots.length}/
              {packReport.progress?.total ?? 6} guided shots
            </p>
            <pre className="demo-pack-log">{formatPackValidationReport(packReport)}</pre>
          </div>

          <button
            type="button"
            className="button button-primary summary-new-job"
            onClick={startDemo}
          >
            Run demo again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="camera-app">
      <div className="camera-stage">
        {currentStep && (
          <img
            className="camera-feed"
            src={currentStep.imageSrc}
            alt={`A1 fixture — ${currentStep.shotId}`}
          />
        )}

        {callouts.length > 0 && (
          <CoachAnnotations
            callouts={callouts}
            activeIndex={activeCalloutIndex}
            onSelect={setActiveCalloutIndex}
          />
        )}

        <div className="coach-overlay" aria-live="polite">
          <header className="coach-top coach-top-minimal">
            <span className="coach-phase-chip">Install · Demo</span>
            <span
              className={`coach-pill ${phase === "analysing" ? "analysing" : ""}`}
            >
              {phase === "analysing"
                ? "Analyzing…"
                : phase === "verdict"
                  ? "Defect found"
                  : "Live"}
            </span>
            <span className="coach-phase-chip">
              {progress.done}/{progress.total}
            </span>
          </header>

          {phase === "capture" && currentStep && !coaching && (
            <div className="coach-dock">
              <div className="coach-card severity-info">
                <p className="coach-card-label">Guided capture</p>
                <p className="coach-card-text">{currentStep.prompt}</p>
              </div>
              <button
                type="button"
                className="button button-primary"
                onClick={captureShot}
              >
                Capture shot
              </button>
            </div>
          )}

          {phase === "analysing" && (
            <div className="coach-dock">
              <div className="coach-card severity-info tracking">
                <p className="coach-card-label">Foreman</p>
                <p className="coach-card-text">Analyzing fixture frame…</p>
              </div>
            </div>
          )}

          {hero && (phase === "verdict" || (phase === "capture" && coaching)) && (
            <div className="coach-dock">
              <div className={`coach-card severity-${hero.severity}`}>
                <p className="coach-card-label">{hero.label}</p>
                <p className="coach-card-text">{hero.text}</p>
              </div>
              <button
                type="button"
                className="button button-primary"
                onClick={phase === "verdict" ? advanceAfterVerdict : nextShot}
              >
                {stepIndex >= DEMO_CAPTURE_STEPS.length - 1
                  ? "Finish job"
                  : "Next shot"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
