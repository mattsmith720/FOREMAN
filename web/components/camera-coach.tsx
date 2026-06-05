"use client";

import type { CoachingResponse } from "@foreman/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { analyseFrame } from "../lib/analyse";
import { checkApiHealth } from "../lib/health";
import { speakJarvisLine } from "../lib/jarvis-voice";
import { createMemoryEvent, type MemoryEvent } from "../lib/memory-feed";
import { PhoneAudioSource } from "../lib/phone-audio-source";
import { PhoneFrameSource } from "../lib/phone-frame-source";
import {
  startSession,
  stopSession,
  type SessionCounts,
  type SessionRow,
} from "../lib/sessions";
import { transcribeAudioChunk } from "../lib/transcribe";
import { releaseWakeLock, requestWakeLock } from "../lib/wake-lock";
import { JarvisHud } from "./jarvis-hud";
import { SessionSummary } from "./session-summary";

type CoachStatus =
  | "idle"
  | "running"
  | "analysing"
  | "summarising"
  | "error";

const STATUS_LABELS: Record<CoachStatus, string> = {
  idle: "Ready",
  running: "Live",
  analysing: "Thinking",
  summarising: "Summarising",
  error: "Error",
};

export function CameraCoach() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameSourceRef = useRef<PhoneFrameSource | null>(null);
  const audioSourceRef = useRef<PhoneAudioSource | null>(null);
  const analysingRef = useRef(false);
  const transcribingRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const transcriptRef = useRef<string[]>([]);
  const lastHeroRef = useRef<string>("");

  const [status, setStatus] = useState<CoachStatus>("idle");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [coaching, setCoaching] = useState<CoachingResponse | null>(null);
  const [transcriptLines, setTranscriptLines] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const [endedSession, setEndedSession] = useState<SessionRow | null>(null);
  const [storedCounts, setStoredCounts] = useState<SessionCounts | null>(null);
  const [memoryEvents, setMemoryEvents] = useState<MemoryEvent[]>([]);
  const [memoryTotal, setMemoryTotal] = useState(0);
  const [micActive, setMicActive] = useState(false);

  const pushMemory = useCallback((kind: MemoryEvent["kind"], message: string) => {
    const event = createMemoryEvent(kind, message);
    setMemoryEvents((current) => [...current.slice(-11), event]);
    setMemoryTotal((count) => count + 1);
  }, []);

  const handleAudioChunk = useCallback(
    async (blob: Blob) => {
      const sessionId = sessionIdRef.current;
      if (!sessionId || transcribingRef.current) {
        return;
      }

      transcribingRef.current = true;

      try {
        const result = await transcribeAudioChunk(blob, sessionId);
        if (result.text) {
          setTranscriptLines((current) => {
            const next = [...current.slice(-7), result.text];
            transcriptRef.current = next;
            return next;
          });
          if (result.persisted) {
            pushMemory("transcript", `Heard and stored: "${result.text}"`);
          }
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Transcription failed";
        setWarningMessage(message);
      } finally {
        transcribingRef.current = false;
      }
    },
    [pushMemory],
  );

  const handleFrame = useCallback(
    async (image: string) => {
      if (analysingRef.current || !sessionIdRef.current) {
        return;
      }

      analysingRef.current = true;
      setStatus("analysing");

      try {
        const result = await analyseFrame(image, {
          sessionId: sessionIdRef.current,
          context: { jobType: "solar_install" },
          recentTranscript: transcriptRef.current,
        });
        setCoaching(result.coaching);
        setErrorMessage(null);
        setStatus("running");

        if (result.persisted) {
          pushMemory("frame", "Frame analysed — adding to training memory");
          pushMemory(
            "coaching",
            `${result.coaching.observations[0] ?? "Coaching event"} logged`,
          );
          pushMemory("learning", "Dataset growing — sharper on every job");
        }

        const hero =
          result.coaching.installQualityFlags.find(
            (f) => f.severity === "critical" || f.severity === "warning",
          )?.message ??
          result.coaching.nextSteps[0] ??
          result.coaching.observations[0];

        if (hero && hero !== lastHeroRef.current) {
          lastHeroRef.current = hero;
          const severity =
            result.coaching.installQualityFlags[0]?.severity ?? "info";
          speakJarvisLine(hero, severity);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed";
        setWarningMessage(message);
        setStatus("running");
      } finally {
        analysingRef.current = false;
      }
    },
    [pushMemory],
  );

  const stopJob = useCallback(async () => {
    const sessionId = sessionIdRef.current;

    await releaseWakeLock();
    await audioSourceRef.current?.stop();
    audioSourceRef.current = null;
    setMicActive(false);
    await frameSourceRef.current?.stop();
    frameSourceRef.current = null;
    analysingRef.current = false;
    transcribingRef.current = false;

    if (!sessionId) {
      setStatus("idle");
      return;
    }

    setStatus("summarising");
    setErrorMessage(null);

    try {
      const result = await stopSession(sessionId);
      sessionIdRef.current = null;
      setActiveSessionId(null);
      setEndedSession(result.session);
      setStoredCounts(result.stored);
      setCoaching(null);
      setStatus("idle");
      pushMemory(
        "learning",
        `Job complete — ${result.stored.frames} frames in memory`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to end session";
      setErrorMessage(message);
      setStatus("error");
    }
  }, [pushMemory]);

  const startJob = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    setErrorMessage(null);
    setWarningMessage(null);
    setCoaching(null);
    setTranscriptLines([]);
    transcriptRef.current = [];
    setEndedSession(null);
    setStoredCounts(null);
    setMemoryEvents([]);
    setMemoryTotal(0);
    lastHeroRef.current = "";

    try {
      await checkApiHealth();

      const session = await startSession({
        jobType: "solar_install",
        notes: "Jarvis phone session — camera + mic",
      });
      sessionIdRef.current = session.id;
      setActiveSessionId(session.id);
      pushMemory("learning", "Job session started — memory active");

      const source = new PhoneFrameSource(video, canvas, { includeAudio: true });
      source.onFrame((frame) => {
        void handleFrame(frame.data);
      });

      await source.start();
      frameSourceRef.current = source;

      const stream = source.getStream();
      if (!stream || stream.getAudioTracks().length === 0) {
        setWarningMessage("Microphone unavailable — video only.");
      } else {
        const audio = new PhoneAudioSource(stream);
        audio.onChunk((blob) => {
          void handleAudioChunk(blob);
        });
        await audio.start();
        audioSourceRef.current = audio;
        setMicActive(true);
      }

      await requestWakeLock();
      setStatus("running");
    } catch (err) {
      const orphanedSessionId = sessionIdRef.current;
      sessionIdRef.current = null;
      setActiveSessionId(null);
      if (orphanedSessionId) {
        void stopSession(orphanedSessionId).catch(() => undefined);
      }
      const message =
        err instanceof Error ? err.message : "Could not start job";
      setErrorMessage(message);
      setStatus("error");
    }
  }, [handleAudioChunk, handleFrame, pushMemory]);

  useEffect(() => {
    return () => {
      void releaseWakeLock();
      void audioSourceRef.current?.stop();
      void frameSourceRef.current?.stop();
      const sessionId = sessionIdRef.current;
      if (sessionId) {
        void stopSession(sessionId).catch(() => undefined);
      }
    };
  }, []);

  const isActive =
    status === "running" ||
    status === "analysing" ||
    status === "summarising";

  const latestTranscript =
    transcriptLines[transcriptLines.length - 1] ?? null;

  return (
    <div className="camera-app jarvis-app">
      <div className="camera-stage jarvis-stage">
        <video
          ref={videoRef}
          className="camera-feed"
          autoPlay
          muted
          playsInline
        />
        {!isActive && hasConsented && (
          <div className="camera-placeholder">Tap Start job to begin</div>
        )}
        {!hasConsented && (
          <div className="camera-placeholder consent-overlay">
            <p>Foreman watches and listens like a tradie coach.</p>
            <button
              type="button"
              className="button button-primary"
              onClick={() => setHasConsented(true)}
            >
              I understand — enable camera &amp; mic
            </button>
          </div>
        )}

        {hasConsented && !endedSession && (
          <JarvisHud
            coaching={coaching}
            status={STATUS_LABELS[status]}
            isListening={micActive}
            isWatching={isActive}
            latestTranscript={latestTranscript}
            memoryEvents={memoryEvents}
            memoryTotal={memoryTotal}
          />
        )}

        <canvas ref={canvasRef} className="capture-canvas" aria-hidden="true" />
      </div>

      {endedSession && storedCounts && (
        <SessionSummary session={endedSession} stored={storedCounts} />
      )}

      {errorMessage && (
        <p className="error-banner" role="alert">
          {errorMessage}
        </p>
      )}
      {warningMessage && !errorMessage && (
        <p className="warning-banner" role="status">
          {warningMessage}
        </p>
      )}

      <footer className="controls jarvis-controls">
        <button
          type="button"
          className="button button-primary"
          disabled={!hasConsented || isActive}
          onClick={() => void startJob()}
        >
          Start job
        </button>
        <button
          type="button"
          className="button button-secondary"
          disabled={!activeSessionId || status === "summarising"}
          onClick={() => void stopJob()}
        >
          Stop job
        </button>
      </footer>
    </div>
  );
}
