import { isLiveCoachBusy } from "./coach-live";
import { fetchVoiceConfig } from "./voice-config";
import { fetchVoiceSpeak } from "./voice-speak";
import {
  isVoicePlaying,
  playAudioBlob,
  stopVoicePlayback,
  unlockAudio,
} from "./voice-player";

let enabled = true;
let ttsAvailable = false;
let initPromise: Promise<void> | null = null;
let speakGeneration = 0;
let lastSpokeAt = 0;
const MIN_GAP_MS = 5000;

/** Call inside a user gesture (consent/start tap) to unlock iOS audio. */
export function unlockCoachVoice(): void {
  unlockAudio();
}

async function ensureInit(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const config = await fetchVoiceConfig();
      ttsAvailable = config.ttsAvailable;
    } catch {
      ttsAvailable = false;
    }
  })();

  return initPromise;
}

export function setCoachVoiceEnabled(value: boolean): void {
  enabled = value;
  if (!value) {
    speakGeneration++;
    stopVoicePlayback();
  }
}

export function isCoachVoiceEnabled(): boolean {
  return enabled && ttsAvailable;
}

export function isCoachVoiceAvailable(): boolean {
  return ttsAvailable;
}

/** ElevenLabs Australian male TTS for coaching cues. */
export async function speakCoachLine(text: string, severity?: string): Promise<void> {
  const isCritical = severity === "critical";

  // Throttle routine cues so we don't cut a line off mid-sentence every frame;
  // critical safety calls always interrupt.
  if (!isCritical && (isVoicePlaying() || Date.now() - lastSpokeAt < MIN_GAP_MS)) {
    return;
  }

  const generation = ++speakGeneration;

  await ensureInit();

  if (
    generation !== speakGeneration ||
    !enabled ||
    !ttsAvailable ||
    typeof window === "undefined" ||
    isLiveCoachBusy()
  ) {
    return;
  }

  try {
    const blob = await fetchVoiceSpeak(text);

    if (
      generation !== speakGeneration ||
      !enabled ||
      isLiveCoachBusy()
    ) {
      return;
    }

    lastSpokeAt = Date.now();
    await playAudioBlob(blob);
  } catch {
    // Non-fatal — coaching still visible on screen
  }
}

export async function initCoachVoice(): Promise<boolean> {
  await ensureInit();
  return ttsAvailable;
}
