"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CoachingResponse } from "@foreman/shared";
import {
  endLiveCoach,
  isLiveCoachActive,
  startLiveCoach,
  type LiveCoachMode,
} from "../lib/coach-live";
import { formatVisionContext } from "../lib/format-live-vision";
import { fetchVoiceAdvice } from "../lib/voice-speak";
import { playAudioBase64 } from "../lib/voice-player";
import { transcribeAudioChunk } from "../lib/transcribe";
import { CoachDetailPanel } from "./coach-detail-panel";

interface CoachLivePanelProps {
  open: boolean;
  liveAvailable: boolean;
  sessionId: string | null;
  recentTranscript: string[];
  coaching: CoachingResponse | null;
  mediaStream: MediaStream | null;
  onClose: () => void;
  onPauseJobAudio?: () => void;
  onResumeJobAudio?: () => void;
}

export function CoachLivePanel({
  open,
  liveAvailable,
  sessionId,
  recentTranscript,
  coaching,
  mediaStream,
  onClose,
  onPauseJobAudio,
  onResumeJobAudio,
}: CoachLivePanelProps) {
  const [liveStatus, setLiveStatus] = useState<LiveCoachMode>("idle");
  const [lastAgentLine, setLastAgentLine] = useState<string | null>(null);
  const [lastUserLine, setLastUserLine] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visionLinked, setVisionLinked] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopLive = useCallback(async () => {
    if (isLiveCoachActive()) {
      await endLiveCoach();
    }
    onResumeJobAudio?.();
    setLiveStatus("idle");
    setVisionLinked(false);
  }, [onResumeJobAudio]);

  const handleClose = useCallback(async () => {
    await stopLive();
    onClose();
  }, [onClose, stopLive]);

  const startLive = useCallback(async () => {
    setError(null);
    onPauseJobAudio?.();

    try {
      const initialContext = formatVisionContext({
        coaching,
        recentTranscript,
      });

      await startLiveCoach(
        {
          onModeChange: setLiveStatus,
          onAgentMessage: setLastAgentLine,
          onUserMessage: setLastUserLine,
          onError: setError,
          onVisionLinked: setVisionLinked,
          onEnd: () => {
            setVisionLinked(false);
            onResumeJobAudio?.();
          },
        },
        initialContext,
      );
    } catch (err) {
      onResumeJobAudio?.();
      const message =
        err instanceof Error ? err.message : "Live coach unavailable";
      setError(message);
    }
  }, [coaching, onPauseJobAudio, onResumeJobAudio, recentTranscript]);

  const startLiveRef = useRef(startLive);
  startLiveRef.current = startLive;

  const stopLiveRef = useRef(stopLive);
  stopLiveRef.current = stopLive;

  useEffect(() => {
    if (!open) {
      void stopLiveRef.current();
      return;
    }

    if (!liveAvailable) {
      return;
    }

    if (isLiveCoachActive()) {
      return;
    }

    void startLiveRef.current();

    return () => {
      void stopLiveRef.current();
    };
  }, [open, liveAvailable]);

  const askFromRecording = useCallback(async () => {
    if (!sessionId || asking) {
      return;
    }

    setAsking(true);
    setError(null);

    try {
      const blob = new Blob(chunksRef.current, {
        type: chunksRef.current[0]?.type || "audio/mp4",
      });
      chunksRef.current = [];

      if (blob.size < 500) {
        throw new Error("Hold the button longer and speak clearly");
      }

      const transcript = await transcribeAudioChunk(blob, sessionId);
      const question = transcript.text?.trim();
      if (!question) {
        throw new Error("Could not hear a question — try again");
      }

      setLastUserLine(question);

      const advice = await fetchVoiceAdvice({
        question,
        jobType: "solar_install",
        recentTranscript,
      });

      setLastAgentLine(advice.reply);

      if (advice.audioBase64) {
        await playAudioBase64(advice.audioBase64, advice.audioMime);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ask coach failed";
      setError(message);
    } finally {
      setAsking(false);
    }
  }, [asking, recentTranscript, sessionId]);

  const startAskRecording = useCallback(() => {
    if (!mediaStream || asking) {
      return;
    }

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("audio/mp4")
      ? "audio/mp4"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

    const recorder = mimeType
      ? new MediaRecorder(mediaStream, { mimeType })
      : new MediaRecorder(mediaStream);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      void askFromRecording();
    };

    recorder.start();
    recorderRef.current = recorder;
  }, [askFromRecording, asking, mediaStream]);

  const stopAskRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    recorderRef.current = null;
  }, []);

  if (!open) {
    return null;
  }

  return (
    <CoachDetailPanel
      open={open}
      title={liveAvailable ? "Live voice coach" : "Ask Foreman"}
      onClose={() => void handleClose()}
    >
      {liveAvailable ? (
        <div className="coach-live-body">
          <p className="coach-live-status">
            {liveStatus === "connecting" && "Connecting to ElevenLabs…"}
            {liveStatus === "listening" &&
              (visionLinked
                ? "Speak now — camera + mic linked. Foreman will talk back."
                : "Connecting microphone…")}
            {liveStatus === "speaking" && "Foreman is speaking…"}
            {liveStatus === "idle" && "Starting…"}
          </p>
          {visionLinked && (
            <p className="coach-live-vision-badge">Camera vision syncing live</p>
          )}
          <p className="coach-live-hint">
            Turn your volume up. Ask questions about what you see on site.
          </p>
          {lastUserLine && (
            <p className="coach-live-line user">
              <span>You</span> {lastUserLine}
            </p>
          )}
          {lastAgentLine && (
            <p className="coach-live-line agent">
              <span>Foreman</span> {lastAgentLine}
            </p>
          )}
        </div>
      ) : (
        <div className="coach-live-body">
          <p className="coach-live-status">
            Live agent not configured — hold to ask with TTS reply.
          </p>
          <button
            type="button"
            className="button button-primary coach-live-ptt"
            disabled={!sessionId || asking}
            onPointerDown={startAskRecording}
            onPointerUp={stopAskRecording}
            onPointerLeave={stopAskRecording}
          >
            {asking ? "Thinking…" : "Hold to ask"}
          </button>
        </div>
      )}

      {error && <p className="coach-live-error">{error}</p>}
    </CoachDetailPanel>
  );
}
