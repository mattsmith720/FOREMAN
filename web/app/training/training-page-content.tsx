"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { JOB_PHASES, jobPhaseLabel, type JobPhaseId } from "../../lib/job-phase";

type TrainingStep = {
  stepNumber: number;
  title: string;
  instruction: string;
  safetyNote?: string;
  commonMistake?: string;
};

type TrainingModule = {
  title: string;
  jobType: string;
  worker: string | null;
  summary: string;
  learningObjectives: string[];
  steps: TrainingStep[];
  commonMistakes: string[];
  quizQuestions: Array<{ question: string; answer: string }>;
  onboardingScript: string;
};

export function TrainingPageContent() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState("");
  const [opsPassword, setOpsPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [module, setModule] = useState<TrainingModule | null>(null);

  useEffect(() => {
    const fromQuery = searchParams.get("session")?.trim();
    if (fromQuery) {
      setSessionId(fromQuery);
    }
  }, [searchParams]);

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault();
    const id = sessionId.trim();
    if (!id) {
      setError("Enter a session id from a completed job.");
      setState("error");
      return;
    }

    setState("loading");
    setError(null);
    setModule(null);

    try {
      const headers: Record<string, string> = {};
      if (opsPassword.trim()) {
        headers["x-ops-password"] = opsPassword.trim();
      }

      const endpoint = opsPassword.trim()
        ? `/api/ops/sessions/${id}/training-module`
        : `/api/sessions/${id}/training-module`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
      });
      const body = (await res.json()) as {
        error?: string;
        module?: TrainingModule;
      };
      if (!res.ok || !body.module) {
        throw new Error(body.error ?? "Generation failed");
      }
      setModule(body.module);
      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Generation failed");
    }
  }

  return (
    <main className="training-page">
      <h1>Training module</h1>
      <p className="training-lead">
        Turn a completed maintenance job into an onboarding package for new hires.
        Upload or record a job first, then paste the session id here.
      </p>

      <form className="training-form" onSubmit={(event) => void handleGenerate(event)}>
        <label>
          Session id
          <input
            type="text"
            value={sessionId}
            onChange={(event) => setSessionId(event.target.value)}
            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            autoComplete="off"
          />
        </label>
        <label>
          Ops password (for completed jobs)
          <input
            type="password"
            value={opsPassword}
            onChange={(event) => setOpsPassword(event.target.value)}
            placeholder="Crew lead password"
            autoComplete="current-password"
          />
        </label>
        <button
          type="submit"
          className="button button-primary"
          disabled={state === "loading"}
        >
          {state === "loading" ? "Generating…" : "Generate training module"}
        </button>
      </form>

      {error && <p className="training-error">{error}</p>}

      {module && (
        <article className="training-module">
          <header>
            <h2>{module.title}</h2>
            <p className="training-meta">
              {jobPhaseLabel(module.jobType as JobPhaseId)} ·{" "}
              {module.worker ?? "Senior tech demo"}
            </p>
            <p>{module.summary}</p>
          </header>

          <section>
            <h3>Learning objectives</h3>
            <ul>
              {module.learningObjectives.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Steps</h3>
            <ol>
              {module.steps.map((step) => (
                <li key={step.stepNumber}>
                  <strong>
                    {step.stepNumber}. {step.title}
                  </strong>
                  <p>{step.instruction}</p>
                  {step.safetyNote && (
                    <p className="training-safety">Safety: {step.safetyNote}</p>
                  )}
                  {step.commonMistake && (
                    <p className="training-mistake">
                      Common mistake: {step.commonMistake}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {module.commonMistakes.length > 0 && (
            <section>
              <h3>Watch for on site</h3>
              <ul>
                {module.commonMistakes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3>Quick quiz</h3>
            {module.quizQuestions.map((q) => (
              <details key={q.question} className="training-quiz">
                <summary>{q.question}</summary>
                <p>{q.answer}</p>
              </details>
            ))}
          </section>

          <section>
            <h3>Pre-job briefing script</h3>
            <p className="training-script">{module.onboardingScript}</p>
          </section>
        </article>
      )}

      <p className="training-hint">
        Supported job types:{" "}
        {JOB_PHASES.filter((p) => p.group === "maintenance")
          .map((p) => p.label)
          .join(", ")}
      </p>
    </main>
  );
}
