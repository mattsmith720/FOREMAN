"use client";

import type { CoachingResponse } from "@foreman/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { analyseFrame } from "../lib/analyse";
import { checkApiHealth } from "../lib/health";
import {
  initCoachVoice,
  isCoachVoiceAvailable,
  setCoachVoiceEnabled,
  speakCoachLine,
} from "../lib/coach-voice";
import { fetchVoiceConfig, type VoiceConfig } from "../lib/voice-config";
import {
  createActivity,
  type ActivityItem,
} from "../lib/activity-feed";
import { pickActiveCalloutIndex } from "../lib/pick-active-callout";
import { PhoneAudioSource } from "../lib/phone-audio-source";
import { PhoneFrameSource } from "../lib/phone-frame-source";
import {
  startSession,
  stopSession,
  type SessionCounts,
  type SessionRow,
} from "../lib/sessions";
import { transcribeAudioChunk } from "../lib/transcribe";
import {
  refreshWakeLockIfNeeded,
  releaseWakeLock,
  requestWakeLock,
} from "../lib/wake-lock";
import { CoachAnnotations } from "./coach-annotations";
import { CoachOverlay } from "./coach-overlay";
import { CoachScanOverlay } from "./coach-scan-overlay";
import {
  CaptureHealth,
  type CaptureHealthStats,
} from "./capture-health";
import { endLiveCoach } from "../lib/coach-live";
import { syncLiveVisionContext } from "../lib/live-vision-sync";
import { CoachLivePanel } from "./coach-live-panel";
import {
  DEFAULT_JOB_PHASE,
  JobPhasePicker,
} from "./job-phase-picker";
import { jobPhaseLabel, type JobPhaseId } from "../lib/job-phase";
import { SessionSummary } from "./session-summary";
import {
  canCapture,
  recordingIndicatorVisible,
  type CaptureStatus,
} from "./consent-gate-policy";

type CoachStatus = CaptureStatus;

const STATUS_LABELS: Record<CoachStatus, string> = {
  idle: "Ready",
  running: "Live",
  analysing: "Analyzing…",
  summarising: "Summarising…",
  error: "Error",
};

const EMPTY_HEALTH: CaptureHealthStats = {
  frameKb: null,
  analyseMs: null,
  persistQueued: false,
  micMime: null,
  chunkKb: null,
};

function formatStartJobError(err: unknown): string {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Open the https:// URL — camera and microphone require a secure connection.";
  }

  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError") {
      return "Allow camera and microphone in your browser settings, then try again.";
    }
    if (err.name === "NotFoundError") {
      return "No camera found on this device.";
    }
  }

  return err instanceof Error ? err.message : "Could not start job";
}

export function CameraCoach() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameSourceRef = useRef<PhoneFrameSource | null>(null);
  const audioSourceRef = useRef<PhoneAudioSource | null>(null);
  const analysingRef = useRef(false);
  const pendingFrameRef = useRef<string | null>(null);
  const transcribingRef = useRef(false);
  const pendingAudioChunkRef = useRef<Blob | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const transcriptRef = useRef<string[]>([]);
  const lastHeroRef = useRef<string>("");
  const consentAtRef = useRef<string | null>(null);

  const [status, setStatus] = useState<CoachStatus>("idle");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [coaching, setCoaching] = useState<CoachingResponse | null>(null);
  const [transcriptLines, setTranscriptLines] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const hasConsentedRef = useRef(hasConsented);
  const [endedSession, setEndedSession] = useState<SessionRow | null>(null);
  const [storedCounts, setStoredCounts] = useState<SessionCounts | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [frameCount, setFrameCount] = useState(0);
  const [lastAnalyseMs, setLastAnalyseMs] = useState<number | null>(null);
  const [activeCalloutIndex, setActiveCalloutIndex] = useState(0);
  const [micActive, setMicActive] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [healthStats, setHealthStats] = useState<CaptureHealthStats>(EMPTY_HEALTH);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig | null>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const [livePanelOpen, setLivePanelOpen] = useState(false);
  const [jobPhase, setJobPhase] = useState<JobPhaseId>(DEFAULT_JOB_PHASE);
  const jobPhaseRef = useRef<JobPhaseId>(DEFAULT_JOB_PHASE);

  const pushActivity = useCallback(
    (kind: ActivityItem["kind"], message: string) => {
      const item = createActivity(kind, message);
      setActivity((current) => [...current.slice(-19), item]);
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setDebugMode(new URLSearchParams(window.location.search).has("debug"));
  }, []);

  useEffect(() => {
    hasConsentedRef.current = hasConsented;
    if (hasConsented) {
      void checkApiHealth().catch(() => undefined);
    }
  }, [hasConsented]);

  useEffect(() => {
    jobPhaseRef.current = jobPhase;
  }, [jobPhase]);

  useEffect(() => {
    setCoachVoiceEnabled(true);
    void (async () => {
      await initCoachVoice();
      try {
        const config = await fetchVoiceConfig();
        setVoiceConfig(config);
      } catch {
        // Voice optional until backend is deployed with /voice routes
      }
    })();
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceOn((current) => {
      const next = !current;
      setCoachVoiceEnabled(next);
      return next;
    });
  }, []);

  const pauseJobAudio = useCallback(async () => {
    const audio = audioSourceRef.current;
    audioSourceRef.current = null;
    await audio?.stop();
    setMicActive(false);
  }, []);

  const transcribeChunk = useCallback(
    async (blob: Blob, sessionId: string) => {
      if (debugMode) {
        setHealthStats((current) => ({
          ...current,
          micMime: blob.type || "unknown",
          chunkKb: Math.round(blob.size / 1024),
        }));
      }

      const result = await transcribeAudioChunk(blob, sessionId);
      if (result.text) {
        setTranscriptLines((current) => {
          const next = [...current.slice(-7), result.text];
          transcriptRef.current = next;
          return next;
        });
        pushActivity("transcript", result.text);
        syncLiveVisionContext({
          coaching,
          recentTranscript: transcriptRef.current,
        });
        if (result.persisted) {
          pushActivity("saved", "Transcript stored");
        }
      }
    },
    [coaching, debugMode, pushActivity],
  );

  const handleAudioChunk = useCallback(
    async (blob: Blob) => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) {
        return;
      }

      if (transcribingRef.current) {
        pendingAudioChunkRef.current = blob;
        return;
      }

      transcribingRef.current = true;

      try {
        await transcribeChunk(blob, sessionId);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Transcription failed";
        setWarningMessage(message);
      } finally {
        transcribingRef.current = false;
        const pending = pendingAudioChunkRef.current;
        pendingAudioChunkRef.current = null;
        if (pending) {
          void handleAudioChunk(pending);
        }
      }
    },
    [transcribeChunk],
  );

  const resumeJobAudio = useCallback(async () => {
    if (!canCapture(hasConsentedRef.current)) {
      return;
    }

    const stream = mediaStream;
    const sessionId = sessionIdRef.current;
    if (!stream || !sessionId || audioSourceRef.current) {
      return;
    }

    try {
      const audio = new PhoneAudioSource(stream);
      audio.onChunk((blob) => {
        void handleAudioChunk(blob);
      });
      audio.onError((message) => {
        setWarningMessage(message);
        setMicActive(false);
      });
      await audio.start();
      audioSourceRef.current = audio;
      setMicActive(true);
    } catch {
      setMicActive(false);
    }
  }, [handleAudioChunk, mediaStream]);

  const handleFrame = useCallback(
    async (image: string) => {
      if (!sessionIdRef.current) {
        return;
      }

      if (analysingRef.current) {
        pendingFrameRef.current = image;
        return;
      }

      analysingRef.current = true;
      setStatus("analysing");
      setFrameCount((count) => count + 1);

      const frameKb = Math.round((image.length * 3) / 4 / 1024);
      const startedAt = performance.now();

      if (debugMode) {
        setHealthStats((current) => ({ ...current, frameKb }));
      }

      try {
        const result = await analyseFrame(image, {
          sessionId: sessionIdRef.current,
          context: { jobType: jobPhaseRef.current },
          recentTranscript: transcriptRef.current,
        });

        const analyseMs = Math.round(performance.now() - startedAt);
        setLastAnalyseMs(analyseMs);

        setCoaching(result.coaching);
        setErrorMessage(null);
        setStatus("running");

        const callouts = result.coaching.visualCallouts ?? [];
        const highlightIndex = pickActiveCalloutIndex(callouts);
        setActiveCalloutIndex(highlightIndex);

        const seeing = result.coaching.observations[0];
        if (seeing) {
          pushActivity("coaching", seeing);
        }

        syncLiveVisionContext({
          coaching: result.coaching,
          recentTranscript: transcriptRef.current,
        });

        if (debugMode) {
          setHealthStats((current) => ({
            ...current,
            analyseMs,
            persistQueued: true,
          }));
          // Persistence is fire-and-forget on the backend; the frame is queued
          // for the job log here and confirmed by the stored counts at job end.
          pushActivity("saved", "Frame queued for job log");
        }

        const hero =
          callouts[highlightIndex]?.message ??
          result.coaching.installQualityFlags.find(
            (f) => f.severity === "critical" || f.severity === "warning",
          )?.message ??
          result.coaching.nextSteps[0] ??
          result.coaching.observations[0];

        if (hero && hero !== lastHeroRef.current) {
          lastHeroRef.current = hero;
          const severity =
            callouts[highlightIndex]?.severity ??
            result.coaching.installQualityFlags[0]?.severity ??
            "info";
          void speakCoachLine(hero, severity);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed";
        setWarningMessage(message);
        setStatus("running");
      } finally {
        analysingRef.current = false;
        const pending = pendingFrameRef.current;
        pendingFrameRef.current = null;
        if (pending) {
          void handleFrame(pending);
        } else {
          frameSourceRef.current?.captureNow();
        }
      }
    },
    [debugMode, pushActivity],
  );

  const stopJob = useCallback(async () => {
    const sessionId = sessionIdRef.current;

    setLivePanelOpen(false);
    await endLiveCoach();

    await releaseWakeLock();
    await audioSourceRef.current?.stop();
    audioSourceRef.current = null;
    setMicActive(false);
    setMediaStream(null);
    await frameSourceRef.current?.stop();
    frameSourceRef.current = null;
    analysingRef.current = false;
    pendingFrameRef.current = null;
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
      pushActivity(
        "system",
        `Job complete — ${result.stored.frames} frames saved`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to end session";
      setErrorMessage(message);
      setStatus("error");
    }
  }, [pushActivity]);

  const startJob = useCallback(async () => {
    if (!canCapture(hasConsentedRef.current)) {
      setErrorMessage("Consent required");
      setStatus("error");
      return;
    }

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
    setActivity([]);
    pendingAudioChunkRef.current = null;
    setFrameCount(0);
    setLastAnalyseMs(null);
    setActiveCalloutIndex(0);
    setHealthStats(EMPTY_HEALTH);
    lastHeroRef.current = "";

    try {
      await checkApiHealth();

      const session = await startSession({
        jobType: jobPhaseRef.current,
        notes: `Phone session — ${jobPhaseLabel(jobPhaseRef.current)}`,
        consentAt: consentAtRef.current ?? undefined,
      });
      sessionIdRef.current = session.id;
      setActiveSessionId(session.id);
      pushActivity("system", "Job session started — live coaching active");

      const source = new PhoneFrameSource(video, canvas, { includeAudio: true });
      source.onFrame((frame) => {
        void handleFrame(frame.data);
      });

      await source.start();
      frameSourceRef.current = source;

      const stream = source.getStream();
      setMediaStream(stream);

      if (!stream || stream.getAudioTracks().length === 0) {
        setWarningMessage("Microphone unavailable — vision coaching only.");
      } else {
        try {
          const audio = new PhoneAudioSource(stream);
          audio.onChunk((blob) => {
            void handleAudioChunk(blob);
          });
          audio.onError((message) => {
            setWarningMessage(message);
            setMicActive(false);
          });
          await audio.start();
          audioSourceRef.current = audio;
          setMicActive(true);
        } catch (audioErr) {
          const detail =
            audioErr instanceof Error ? audioErr.message : "Mic capture failed";
          setWarningMessage(
            `Vision coaching active — mic offline (${detail}).`,
          );
          setMicActive(false);
        }
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
      setErrorMessage(formatStartJobError(err));
      setStatus("error");
    }
  }, [handleAudioChunk, handleFrame, pushActivity]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (status === "running" || status === "analysing") {
        void refreshWakeLockIfNeeded();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [status]);

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

  const isActive = recordingIndicatorVisible(status);

  const latestTranscript =
    transcriptLines[transcriptLines.length - 1] ?? null;

  return (
    <div className="camera-app">
      <div className="camera-stage">
        <video
          ref={videoRef}
          className="camera-feed"
          autoPlay
          muted
          playsInline
        />
        {!isActive && hasConsented && (
          <div className="camera-placeholder boot-screen">
            <p className="boot-title">Foreman</p>
            <p className="boot-sub">What are you doing on site?</p>
            <JobPhasePicker value={jobPhase} onChange={setJobPhase} />
            <p className="boot-muted">Tap Start job when you are ready</p>
          </div>
        )}
        {!hasConsented && (
          <div className="camera-placeholder consent-overlay boot-screen">
            <p className="boot-title">Foreman</p>
            <p>
              Foreman captures camera, microphone, and job context. Recordings
              are treated as sensitive personal data under Australian privacy
              rules (see CLAUDE.md). Tap I understand to continue.
            </p>
            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                consentAtRef.current = new Date().toISOString();
                setHasConsented(true);
              }}
            >
              I understand — continue
            </button>
          </div>
        )}
        {isActive && status === "analysing" && <CoachScanOverlay active />}

        {isActive && (
          <div
            className="recording-indicator"
            data-testid="recording-indicator"
            role="status"
            aria-live="polite"
          >
            <span className="recording-indicator-dot" aria-hidden="true" />
            <span>REC</span>
          </div>
        )}

        {hasConsented && !endedSession && isActive && (
          <CoachAnnotations
            callouts={coaching?.visualCallouts ?? []}
            activeIndex={activeCalloutIndex}
            onSelect={setActiveCalloutIndex}
          />
        )}

        {hasConsented && !endedSession && (
          <CoachOverlay
            coaching={coaching}
            status={STATUS_LABELS[status]}
            isListening={micActive}
            isWatching={isActive}
            isAnalysing={status === "analysing"}
            jobPhase={jobPhase}
            latestTranscript={latestTranscript}
            frameCount={frameCount}
            lastAnalyseMs={lastAnalyseMs}
            activity={activity}
            callouts={coaching?.visualCallouts ?? []}
            activeCalloutIndex={activeCalloutIndex}
            onCalloutSelect={setActiveCalloutIndex}
            livePanelOpen={livePanelOpen}
            showPipeline={debugMode}
            onDetailsOpen={() => setLivePanelOpen(false)}
          />
        )}

        {debugMode && hasConsented && (
          <CaptureHealth stats={healthStats} />
        )}

        <canvas ref={canvasRef} className="capture-canvas" aria-hidden="true" />
      </div>

      {endedSession && storedCounts && (
        <SessionSummary
          session={endedSession}
          stored={storedCounts}
          onStartNew={() => {
            setEndedSession(null);
            setStoredCounts(null);
            setErrorMessage(null);
            setWarningMessage(null);
            setStatus("idle");
          }}
        />
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

      <CoachLivePanel
        open={livePanelOpen}
        liveAvailable={voiceConfig?.liveAvailable ?? false}
        sessionId={activeSessionId}
        jobType={jobPhase}
        recentTranscript={transcriptLines}
        coaching={coaching}
        mediaStream={mediaStream}
        onClose={() => setLivePanelOpen(false)}
        onPauseJobAudio={() => void pauseJobAudio()}
        onResumeJobAudio={() => void resumeJobAudio()}
      />

      <footer className="controls">
        <button
          type="button"
          className="button button-primary"
          disabled={!hasConsented || isActive}
          onClick={() => void startJob()}
          title={`Start ${jobPhaseLabel(jobPhase)} job`}
        >
          Start {jobPhaseLabel(jobPhase).toLowerCase()}
        </button>
        <button
          type="button"
          className="button button-secondary"
          disabled={!activeSessionId || status === "summarising"}
          onClick={() => void stopJob()}
        >
          End job
        </button>
        {activeSessionId && isCoachVoiceAvailable() && (
          <button
            type="button"
            className={`button button-voice ${voiceOn ? "on" : ""}`}
            onClick={toggleVoice}
            aria-pressed={voiceOn}
            title="ElevenLabs reads coaching cues aloud"
          >
            Cue voice {voiceOn ? "on" : "off"}
          </button>
        )}
        {activeSessionId && voiceConfig?.liveAvailable && (
          <button
            type="button"
            className={`button button-voice ${livePanelOpen ? "on" : ""}`}
            onClick={() => setLivePanelOpen((open) => !open)}
          >
            {livePanelOpen ? "End talk" : "Talk live"}
          </button>
        )}
      </footer>
    </div>
  );
}
