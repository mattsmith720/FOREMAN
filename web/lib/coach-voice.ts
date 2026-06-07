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
// Per-severity cooldowns so a routine cue doesn't repeat every frame and a quiet
// observation can't crowd out a warning. Critical safety calls bypass the gate.
const COOLDOWN_MS: Record<string, number> = {
  critical: 0,
  warning: 3000,
  info: 8000,
};
const DEFAULT_COOLDOWN_MS = 5000;
const lastSpokeAtByCategory = new Map<string, number>();

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
  const category = severity ?? "info";
  const cooldownMs = COOLDOWN_MS[category] ?? DEFAULT_COOLDOWN_MS;

  // Throttle routine cues per severity so we don't cut a line off mid-sentence
  // every frame and a low-priority line can't crowd out a warning; critical
  // safety calls always interrupt.
  if (
    !isCritical &&
    (isVoicePlaying() ||
      Date.now() - (lastSpokeAtByCategory.get(category) ?? 0) < cooldownMs)
  ) {
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

    lastSpokeAtByCategory.set(category, Date.now());
    await playAudioBlob(blob);
  } catch {
    // Non-fatal — coaching still visible on screen
  }
}

export async function initCoachVoice(): Promise<boolean> {
  await ensureInit();
  return ttsAvailable;
}
