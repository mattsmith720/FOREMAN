"use client";

import type { CoachingResponse } from "@foreman/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { analyseFrame } from "../lib/analyse";
import { checkApiHealth } from "../lib/health";
import {
  initCoachVoice,
  setCoachVoiceEnabled,
  speakCoachLine,
  unlockCoachVoice,
} from "../lib/coach-voice";
import {
  createActivity,
  type ActivityItem,
} from "../lib/activity-feed";
import { pickActiveCalloutIndex } from "../lib/pick-active-callout";
import { PhoneAudioSource } from "../lib/phone-audio-source";
import { PhoneFrameSource } from "../lib/phone-frame-source";
import {
  getSession,
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
import { CoachOverlay } from "./coach-overlay";
import { CoachScanOverlay } from "./coach-scan-overlay";
import {
  CaptureHealth,
  type CaptureHealthStats,
} from "./capture-health";
import { endLiveCoach } from "../lib/coach-live";
import { syncLiveVisionContext } from "../lib/live-vision-sync";
import { AUTO_JOB_PHASE, type JobPhaseId } from "../lib/job-phase";
import {
  applyComplianceEvidence,
  buildInstallCaptureMeta,
  createComplianceSessionState,
  type ComplianceSessionState,
} from "../lib/compliance-evidence-handler";
import {
  complianceProgress,
  downloadEvidenceManifest,
  nextComplianceShot,
} from "../lib/compliance-pack";
import { downloadEvidencePack } from "../lib/evidence-pack";
import { frameInstrumentation } from "../lib/frame-instrumentation";
import { planVerdictCue } from "../lib/verdict-cue-delivery";
import {
  awaitGeoForEvidence,
  captureGeoFix,
  geoDeniedVoiceLine,
  type GeoFix,
} from "../lib/geolocation";
import { interactionModeForPhase } from "../lib/interaction-mode";
import {
  ensureCostModelSynced,
  estimateSessionCostUsd,
} from "../lib/session-cost";
import { SessionSpendCap } from "../lib/session-spend-cap";
import {
  CONSENT_VERSION,
  loadWorkerProfile,
  saveWorkerProfile,
} from "../lib/worker-profile";
import { startOfflineSync } from "../lib/offline-sync";
import {
  enqueueAnalyseFrame,
  enqueueEvidencePack,
  enqueueTranscribeChunk,
  formatOfflineStatusMessage,
  isRetriableApiFailure,
  subscribeOfflineUiState,
  type OfflineUiState,
} from "../lib/offline-queue";
import { SessionSummary } from "./session-summary";
import { clearSessionToken } from "../lib/session-auth";
import {
  backendStatusMessage,
  type BackendStatus,
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
  cueE2eMs: null,
  estCostUsd: null,
  persistQueued: false,
  micMime: null,
  chunkKb: null,
};

// Cap the transcription backlog so a stalled uplink on weak 4G can't grow it
// without bound (~16s of audio); oldest/stalest chunks are shed first.
const MAX_AUDIO_QUEUE = 4;

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
  const audioQueueRef = useRef<Blob[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const framesCapturedRef = useRef(0);
  const transcriptRef = useRef<string[]>([]);
  const lastHeroRef = useRef<string>("");
  const consentAtRef = useRef<string | null>(null);
  const geoRef = useRef<GeoFix | null>(null);
  const complianceStateRef = useRef<ComplianceSessionState>(
    createComplianceSessionState(),
  );
  const spendCapRef = useRef<SessionSpendCap | null>(null);
  const complianceAccelerateRef = useRef(false);

  const [status, setStatus] = useState<CoachStatus>("idle");
  const [isPaused, setIsPaused] = useState(false);
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
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("unknown");
  const [workerName, setWorkerName] = useState("");
  const [offlineUi, setOfflineUi] = useState<OfflineUiState | null>(null);
  const jobPhaseRef = useRef<JobPhaseId>(AUTO_JOB_PHASE);
  const workerNameRef = useRef<string>("");
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

  // Hydrate the per-device profile so repeat opens skip consent + name typing.
  // (Camera/mic still need one Start tap — a browser gesture requirement.)
  useEffect(() => {
    const profile = loadWorkerProfile();
    if (profile.workerName) {
      setWorkerName(profile.workerName);
    }
    if (profile.consentAt && profile.consentVersion === CONSENT_VERSION) {
      consentAtRef.current = profile.consentAt;
      hasConsentedRef.current = true;
      setHasConsented(true);
    }
  }, []);

  const prewarmBackend = useCallback(async () => {
    // Render free tier cold-starts in 30–60s. Wake it as soon as the worker
    // consents so the first Start job isn't a confusing dead wait.
    setBackendStatus("waking");
    let settled = false;
    const slowTimer = setTimeout(() => {
      if (!settled) {
        setBackendStatus("slow");
      }
    }, 8000);
    try {
      await checkApiHealth();
      settled = true;
      setBackendStatus("ready");
    } catch {
      settled = true;
      setBackendStatus("slow");
    } finally {
      clearTimeout(slowTimer);
    }
  }, []);

  // Prewarm the backend on mount so a Render cold start overlaps the worker
  // reading the consent/phase screen — not their first Start.
  useEffect(() => {
    void prewarmBackend();
  }, [prewarmBackend]);

  useEffect(() => {
    hasConsentedRef.current = hasConsented;
  }, [hasConsented]);

  // Auto-recover from a cold-start "slow" state without making the worker tap
  // Retry — poll health until Render is awake, then flip to ready.
  useEffect(() => {
    if (backendStatus !== "slow") {
      return;
    }
    const id = setInterval(() => {
      void checkApiHealth()
        .then(() => setBackendStatus("ready"))
        .catch(() => undefined);
    }, 7000);
    return () => clearInterval(id);
  }, [backendStatus]);

  useEffect(() => {
    workerNameRef.current = workerName;
    saveWorkerProfile({ workerName: workerName.trim() });
  }, [workerName]);

  useEffect(() => startOfflineSync(), []);
  useEffect(() => subscribeOfflineUiState(setOfflineUi), []);

  useEffect(() => {
    setCoachVoiceEnabled(true);
    void initCoachVoice();
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

      const result = await transcribeAudioChunk(
        blob,
        sessionId,
        workerNameRef.current.trim() || "worker",
      );
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
        spendCapRef.current?.recordTranscribe();
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
        // Queue behind the in-flight upload so a slow link doesn't drop chunks;
        // cap the backlog and shed the oldest (stalest) beyond the cap.
        const queue = audioQueueRef.current;
        queue.push(blob);
        if (queue.length > MAX_AUDIO_QUEUE) {
          queue.splice(0, queue.length - MAX_AUDIO_QUEUE);
        }
        return;
      }

      transcribingRef.current = true;

      try {
        await transcribeChunk(blob, sessionId);
      } catch (err) {
        if (isRetriableApiFailure(err)) {
          await enqueueTranscribeChunk({
            sessionId,
            blob,
            speaker: workerNameRef.current.trim() || "worker",
          });
          setWarningMessage("Voice chunk queued — will upload when back online.");
        } else {
          const message =
            err instanceof Error ? err.message : "Transcription failed";
          setWarningMessage(message);
        }
      } finally {
        transcribingRef.current = false;
        const next = audioQueueRef.current.shift();
        if (next) {
          void handleAudioChunk(next);
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

  // Pause/Resume: suspend capture + voice without ending the session, so a
  // worker can step away mid-job. The camera stream stays live (no re-prompt),
  // mirroring the audio pause/resume above. Maps to a glasses gesture later.
  const pauseJob = useCallback(async () => {
    frameSourceRef.current?.pause();
    await pauseJobAudio();
    setIsPaused(true);
    pushActivity("system", "Job paused — capture and coaching stopped");
    void speakCoachLine("Paused. Tap resume when you're ready.", "critical");
  }, [pauseJobAudio, pushActivity]);

  const resumeJob = useCallback(async () => {
    setIsPaused(false);
    frameSourceRef.current?.resume();
    await resumeJobAudio();
    pushActivity("system", "Job resumed — coaching live");
    void speakCoachLine("Back on. Coaching again.", "critical");
  }, [resumeJobAudio, pushActivity]);

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
      framesCapturedRef.current += 1;
      setFrameCount(framesCapturedRef.current);

      const frameKb = Math.round((image.length * 3) / 4 / 1024);
      const startedAt = performance.now();

      if (debugMode) {
        setHealthStats((current) => ({ ...current, frameKb }));
      }

      try {
        const capturedAt = new Date().toISOString();

        const result = await analyseFrame(image, {
          sessionId: sessionIdRef.current,
          context: { jobType: jobPhaseRef.current },
          recentTranscript: transcriptRef.current,
          captureMeta:
            jobPhaseRef.current === "solar_install"
              ? buildInstallCaptureMeta(
                  geoRef.current,
                  complianceStateRef.current.captured,
                  capturedAt,
                )
              : undefined,
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

        const complianceOutcome = applyComplianceEvidence(
          result.coaching,
          jobPhaseRef.current,
          complianceStateRef.current,
          geoRef.current,
          capturedAt,
        );
        complianceStateRef.current = complianceOutcome.state;
        for (const line of complianceOutcome.voiceLines) {
          void speakCoachLine(line.text, line.severity);
        }
        if (complianceOutcome.facingMode) {
          void frameSourceRef.current?.setFacingMode(complianceOutcome.facingMode);
        }

        const verdict = planVerdictCue(
          result.coaching,
          jobPhaseRef.current,
          lastHeroRef.current,
        );
        const postAnalyseInstrumentation = frameInstrumentation({
          debugMode,
          frameKb,
          analyseMs,
          startedAt,
          framesCaptured: framesCapturedRef.current,
          transcriptChunkCount: transcriptRef.current.length,
          spokenCueAttempt: verdict !== null,
        });

        if (debugMode) {
          setHealthStats((current) => ({
            ...current,
            ...postAnalyseInstrumentation.healthPatch,
          }));
          pushActivity("saved", "Frame queued for job log");
        }

        if (verdict) {
          lastHeroRef.current = verdict.cue.text;
          const cueE2eMs = postAnalyseInstrumentation.onCueAttempt();
          if (debugMode && cueE2eMs > 0) {
            setHealthStats((current) => ({
              ...current,
              cueE2eMs,
              estCostUsd: estimateSessionCostUsd(
                framesCapturedRef.current,
                transcriptRef.current.length,
              ),
            }));
          }
          void speakCoachLine(verdict.cue.text, verdict.cue.severity);
        } else if (debugMode) {
          setHealthStats((current) => ({
            ...current,
            estCostUsd: estimateSessionCostUsd(
              framesCapturedRef.current,
              transcriptRef.current.length,
            ),
          }));
        }

        complianceAccelerateRef.current = complianceOutcome.accelerateCapture;
      } catch (err) {
        const sessionId = sessionIdRef.current;
        if (sessionId && isRetriableApiFailure(err)) {
          await enqueueAnalyseFrame({
            sessionId,
            image,
            context: { jobType: jobPhaseRef.current },
            recentTranscript: transcriptRef.current,
            captureMeta:
              jobPhaseRef.current === "solar_install"
                ? buildInstallCaptureMeta(
                    geoRef.current,
                    complianceStateRef.current.captured,
                    new Date().toISOString(),
                  )
                : undefined,
          });
          setWarningMessage(
            "Connection weak — frame saved locally, coaching paused until sync.",
          );
        } else {
          const message = err instanceof Error ? err.message : "Analysis failed";
          setWarningMessage(message);
        }
        setStatus("running");
      } finally {
        analysingRef.current = false;
        const pending = pendingFrameRef.current;
        pendingFrameRef.current = null;
        if (pending) {
          void handleFrame(pending);
        } else {
          frameSourceRef.current?.captureNow({
            accelerate: complianceAccelerateRef.current,
          });
          complianceAccelerateRef.current = false;
        }
      }
    },
    [debugMode, pushActivity],
  );

  const stopJob = useCallback(async () => {
    const sessionId = sessionIdRef.current;

    await endLiveCoach();

    await releaseWakeLock();
    await audioSourceRef.current?.stop();
    audioSourceRef.current = null;
    setMicActive(false);
    setIsPaused(false);
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
      if (
        jobPhaseRef.current === "solar_install" &&
        complianceStateRef.current.records.length > 0
      ) {
        const { done, total } = complianceProgress(
          complianceStateRef.current.captured,
        );
        let packLine = `Evidence pack ${done} of ${total} shots saved.`;
        try {
          await downloadEvidencePack(sessionId);
        } catch (err) {
          if (isRetriableApiFailure(err)) {
            await enqueueEvidencePack(sessionId);
            packLine = `Evidence pack queued — ${done} of ${total} shots saved locally.`;
          } else {
            downloadEvidenceManifest(sessionId, complianceStateRef.current.records);
            packLine = `Evidence manifest ${done} of ${total} shots saved.`;
          }
        }
        void speakCoachLine(packLine, "info");
      }
    } catch {
      // Never dead-end the worker: the job data is already saved server-side.
      // Try to show whatever counts we can and mark the summary as pending.
      try {
        const fallback = await getSession(sessionId);
        sessionIdRef.current = null;
        setActiveSessionId(null);
        setEndedSession(
          fallback.session.summary &&
            !fallback.session.summary.startsWith("Summarising")
            ? fallback.session
            : {
                ...fallback.session,
                summary: "Summary pending — your job data is saved.",
              },
        );
        setStoredCounts(fallback.stored);
        setCoaching(null);
        setStatus("idle");
        setWarningMessage(
          "Job saved. The summary is still finalising in the background.",
        );
      } catch {
        sessionIdRef.current = null;
        setActiveSessionId(null);
        setCoaching(null);
        setStatus("idle");
        setWarningMessage(
          "Job ended and your data is saved. Couldn't reach the server to finalise the summary — it will finish in the background.",
        );
      }
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
    setIsPaused(false);
    audioQueueRef.current = [];
    complianceStateRef.current = createComplianceSessionState();
    spendCapRef.current = new SessionSpendCap();
    geoRef.current = null;
    void ensureCostModelSynced();
    void captureGeoFix().then((fix) => {
      geoRef.current = fix;
    });
    framesCapturedRef.current = 0;
    setFrameCount(0);
    setLastAnalyseMs(null);
    setActiveCalloutIndex(0);
    setHealthStats(EMPTY_HEALTH);
    lastHeroRef.current = "";
    // Drop any stale token from a prior job before issuing a fresh one.
    clearSessionToken();

    try {
      await checkApiHealth();

      const session = await startSession({
        worker: workerNameRef.current.trim() || undefined,
        jobType: jobPhaseRef.current,
        notes: "Phone session — auto-detect job type",
        consentAt: consentAtRef.current ?? undefined,
      });
      sessionIdRef.current = session.id;
      setActiveSessionId(session.id);
      pushActivity("system", "Job session started — live coaching active");

      const source = new PhoneFrameSource(video, canvas, {
        includeAudio: true,
        mode: interactionModeForPhase(jobPhaseRef.current),
        stampMeta:
          jobPhaseRef.current === "solar_install"
            ? () => ({
                capturedAt: new Date().toISOString(),
                lat: geoRef.current?.lat ?? null,
                lng: geoRef.current?.lng ?? null,
              })
            : undefined,
        spendCap: spendCapRef.current ?? undefined,
        onSpendCapWarning: () => {
          void speakCoachLine(
            "Session spend is getting high — wrap up when you can.",
            "warning",
          );
        },
      });
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
      // Audible "recording on" confirmation — the primary signal for the
      // screenless / hands-free case (critical bypasses the cue throttle).
      void speakCoachLine(
        "Foreman is recording and coaching now. I'll call out anything important.",
        "critical",
      );
      if (jobPhaseRef.current === "solar_install") {
        const firstShot = nextComplianceShot(
          complianceStateRef.current.captured,
        );
        if (firstShot) {
          void speakCoachLine(firstShot.prompt, "info");
        }
      }
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

  // One tap to go live: unlock audio (iOS), record consent once, remember the
  // profile, then start. During the job itself the worker never taps.
  const beginJob = useCallback(async () => {
    unlockCoachVoice();
    const geo = await awaitGeoForEvidence();
    geoRef.current = geo;
    if (!geo) {
      const denied = geoDeniedVoiceLine();
      void speakCoachLine(denied.text, denied.severity);
    }
    if (!hasConsentedRef.current) {
      const at = new Date().toISOString();
      consentAtRef.current = at;
      hasConsentedRef.current = true;
      setHasConsented(true);
      saveWorkerProfile({ consentAt: at, consentVersion: CONSENT_VERSION });
    }
    saveWorkerProfile({
      workerName: workerNameRef.current.trim(),
    });
    await startJob();
  }, [startJob]);

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
      clearSessionToken();
    };
  }, []);

  const isActive = recordingIndicatorVisible(status);

  const latestTranscript =
    transcriptLines[transcriptLines.length - 1] ?? null;

  return (
    <div
      className="camera-app"
      data-coaching-live={
        isActive && !isPaused && !endedSession ? "true" : undefined
      }
    >
      <div className="camera-stage">
        <video
          ref={videoRef}
          className="camera-feed"
          autoPlay
          muted
          playsInline
        />
        {!isActive && !endedSession && (
          <div className="camera-placeholder boot-screen consent-overlay">
            <p className="boot-title">Foreman</p>
            {!hasConsented && (
              <p className="consent-copy consent-copy--short">
                Camera and mic record this job for coaching and training. Only
                start if everyone on site is OK with that.
              </p>
            )}
            <label className="boot-worker-label">
              Your name (optional)
              <input
                type="text"
                className="worker-name-input"
                value={workerName}
                onChange={(event) => setWorkerName(event.target.value)}
                placeholder="e.g. Alex"
                autoComplete="name"
                maxLength={80}
              />
            </label>
            <button
              type="button"
              className="button button-primary boot-start"
              onClick={() => void beginJob()}
            >
              {hasConsented ? "Start job" : "I understand — start job"}
            </button>
            {(backendStatus === "waking" || backendStatus === "slow") && (
              <p className="boot-muted boot-waking" role="status">
                {backendStatusMessage(backendStatus)}
              </p>
            )}
          </div>
        )}
        {isActive &&
          interactionModeForPhase(jobPhaseRef.current) === "scan" &&
          status !== "summarising" && <CoachScanOverlay active />}

        {isActive && (
          <div
            className={`recording-indicator${isPaused ? " paused" : ""}`}
            data-testid="recording-indicator"
            role="status"
            aria-live="polite"
          >
            <span className="recording-indicator-dot" aria-hidden="true" />
            <span>{isPaused ? "PAUSED" : "REC"}</span>
          </div>
        )}

        {hasConsented && !endedSession && (
          <CoachOverlay
            coaching={coaching}
            status={isPaused ? "Paused" : STATUS_LABELS[status]}
            isListening={micActive}
            isWatching={isActive && !isPaused}
            isAnalysing={!isPaused && status === "analysing"}
            jobPhase={AUTO_JOB_PHASE}
            latestTranscript={latestTranscript}
            frameCount={frameCount}
            lastAnalyseMs={lastAnalyseMs}
            activity={activity}
            callouts={coaching?.visualCallouts ?? []}
            activeCalloutIndex={activeCalloutIndex}
            onCalloutSelect={setActiveCalloutIndex}
            showPipeline={debugMode}
            minimal
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
            clearSessionToken();
            setEndedSession(null);
            setStoredCounts(null);
            setErrorMessage(null);
            setWarningMessage(null);
            setStatus("idle");
            setIsPaused(false);
          }}
        />
      )}

      {errorMessage && (
        <p className="error-banner" role="alert">
          {errorMessage}
        </p>
      )}
      {offlineUi && offlineUi.queued.total > 0 && !errorMessage && (
        <p className="warning-banner offline-queue-banner" role="status">
          {formatOfflineStatusMessage(offlineUi)}
        </p>
      )}
      {warningMessage && !errorMessage && (
        <p className="warning-banner" role="status">
          {warningMessage}
        </p>
      )}

      {!endedSession && activeSessionId && (
        <footer className="controls controls--simple">
          <button
            type="button"
            className="button button-primary controls-end"
            disabled={status === "summarising"}
            onClick={() => void stopJob()}
          >
            End job
          </button>
        </footer>
      )}
    </div>
  );
}
