"use client";

import { useEffect, useState } from "react";
import { JOB_PHASES, type JobPhaseId } from "../../lib/job-phase";

type UploadState = "idle" | "uploading" | "processing" | "done" | "error";

export default function IngestPage() {
  const [worker, setWorker] = useState("");
  const [jobType, setJobType] = useState<JobPhaseId>("solar_install");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId || state !== "done") {
      return;
    }

    let cancelled = false;

    async function pollStatus() {
      try {
        const res = await fetch(`/api/ingest/${videoId}/status`);
        const body = (await res.json()) as {
          status?: string;
          framesExtracted?: number;
          error?: string;
        };
        if (cancelled) return;

        if (body.status === "ready") {
          setProcessingStatus(
            `Processed — ${body.framesExtracted ?? 0} frames in training dataset.`,
          );
          return;
        }
        if (body.status === "failed") {
          setProcessingStatus(body.error ?? "Processing failed — run process-videos locally.");
          return;
        }
        setProcessingStatus(
          body.status === "processing"
            ? "Extracting frames and audio…"
            : "Queued — processing runs when ffmpeg is available.",
        );
      } catch {
        if (!cancelled) {
          setProcessingStatus("Upload saved. Check status later in Supabase.");
        }
      }
    }

    void pollStatus();
    const interval = window.setInterval(() => void pollStatus(), 8000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [videoId, state]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setMessage("Choose a video from your camera roll.");
      setState("error");
      return;
    }

    setState("uploading");
    setMessage(null);

    try {
      const initRes = await fetch("/api/ingest/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worker: worker.trim() || undefined,
          jobType,
          fileName: file.name,
          mimeType: file.type || "video/mp4",
          byteSize: file.size,
        }),
      });

      const initBody = (await initRes.json()) as {
        error?: string;
        videoId?: string;
        signedUrl?: string;
        token?: string;
      };

      if (!initRes.ok || !initBody.signedUrl || !initBody.videoId) {
        throw new Error(initBody.error ?? "Upload init failed");
      }

      const uploadRes = await fetch(initBody.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "video/mp4",
          "x-upsert": "true",
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Storage upload failed (${uploadRes.status})`);
      }

      setState("processing");
      const completeRes = await fetch(`/api/ingest/${initBody.videoId}/complete`, {
        method: "POST",
      });
      const completeBody = (await completeRes.json()) as { error?: string; message?: string };

      if (!completeRes.ok) {
        throw new Error(completeBody.error ?? "Complete failed");
      }

      setVideoId(initBody.videoId);
      setState("done");
      setMessage(
        completeBody.message ??
          "Video saved. Frames and transcript will appear in the database after processing.",
      );
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <main className="ingest-page">
      <h1>Upload site video</h1>
      <p className="ingest-lead">
        After a job, upload a video from your phone. Foreman stores it, extracts frames and
        audio, and adds it to the training dataset.
      </p>

      <form className="ingest-form" onSubmit={(event) => void handleSubmit(event)}>
        <label>
          Your name
          <input
            type="text"
            value={worker}
            onChange={(event) => setWorker(event.target.value)}
            placeholder="e.g. Dave"
            autoComplete="name"
          />
        </label>

        <fieldset className="ingest-phases">
          <legend>Job type</legend>
          {JOB_PHASES.map((phase) => (
            <label key={phase.id} className="ingest-phase-label">
              <input
                type="radio"
                name="jobType"
                value={phase.id}
                checked={jobType === phase.id}
                onChange={() => setJobType(phase.id)}
              />
              {phase.label}
            </label>
          ))}
        </fieldset>

        <label>
          Video file
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <button
          type="submit"
          className="button button-primary ingest-submit"
          disabled={state === "uploading" || state === "processing"}
        >
          {state === "uploading"
            ? "Uploading…"
            : state === "processing"
              ? "Finishing…"
              : "Upload to Foreman"}
        </button>
      </form>

      {message && (
        <p className={state === "error" ? "ingest-error" : "ingest-status"}>{message}</p>
      )}
      {processingStatus && state === "done" && (
        <p className="ingest-status">{processingStatus}</p>
      )}
      {videoId && state === "done" && (
        <p className="ingest-meta">Video id: {videoId}</p>
      )}
    </main>
  );
}
