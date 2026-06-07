"use client";

import { useCallback, useRef, useState } from "react";
import { analyseFrame } from "../lib/analyse";
import {
  initCoachVoice,
  speakCoachLine,
  unlockCoachVoice,
} from "../lib/coach-voice";
import { DEFAULT_JOB_PHASE } from "../lib/job-phase";
import { PhoneFrameSource } from "../lib/phone-frame-source";
import { pickSpokenCue } from "../lib/pick-spoken-cue";

type HudStatus = "idle" | "live" | "error";

/**
 * Minimal heads-up display for the Meta Ray-Ban Display (~600x600). A separate
 * thin client from the phone app: it captures from the device camera, runs the
 * same /analyse pipeline (no session / no persistence — ephemeral display), and
 * shows ONLY the single hero coaching line big while voice carries the detail.
 * No controls during a job — hands-free by design.
 */
export function HudCoach() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<PhoneFrameSource | null>(null);
  const analysingRef = useRef(false);
  const lastSpokenRef = useRef("");

  const [status, setStatus] = useState<HudStatus>("idle");
  const [line, setLine] = useState("");
  const [severity, setSeverity] = useState<"info" | "warning" | "critical">(
    "info",
  );
  const [error, setError] = useState<string | null>(null);

  const handleFrame = useCallback(async (image: string) => {
    if (analysingRef.current) {
      return;
    }
    analysingRef.current = true;
    try {
      const { coaching } = await analyseFrame(image, {
        context: { jobType: DEFAULT_JOB_PHASE },
      });
      const cue = pickSpokenCue(coaching, DEFAULT_JOB_PHASE);
      if (cue) {
        setLine(cue.text);
        setSeverity(cue.severity);
        if (cue.text !== lastSpokenRef.current) {
          lastSpokenRef.current = cue.text;
          void speakCoachLine(cue.text, cue.severity);
        }
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coaching unavailable");
    } finally {
      analysingRef.current = false;
      sourceRef.current?.captureNow();
    }
  }, []);

  const start = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      return;
    }
    unlockCoachVoice();
    void initCoachVoice();
    setError(null);
    try {
      const source = new PhoneFrameSource(video, canvas, {
        includeAudio: false,
      });
      source.onFrame((frame) => {
        void handleFrame(frame.data);
      });
      await source.start();
      sourceRef.current = source;
      setStatus("live");
      void speakCoachLine("Foreman heads-up display on.", "critical");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start camera");
      setStatus("error");
    }
  }, [handleFrame]);

  return (
    <div className="hud-root">
      <div className="hud-square">
        <video ref={videoRef} className="hud-feed" autoPlay muted playsInline />
        <canvas ref={canvasRef} className="hud-canvas" aria-hidden="true" />

        {status === "live" && <span className="hud-dot" aria-hidden="true" />}

        {status !== "live" ? (
          <button
            type="button"
            className="hud-start"
            onClick={() => void start()}
          >
            Start HUD
          </button>
        ) : (
          <p
            className={`hud-line sev-${severity}`}
            role="status"
            aria-live="polite"
          >
            {line || "Watching the job…"}
          </p>
        )}

        {error && (
          <p className="hud-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
