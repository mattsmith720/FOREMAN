import { isLiveCoachActive } from "./coach-live";
import { fetchVoiceConfig } from "./voice-config";
import { fetchVoiceSpeak } from "./voice-speak";
import { playAudioBlob, stopVoicePlayback } from "./voice-player";

let enabled = true;
let ttsAvailable = false;
let initPromise: Promise<void> | null = null;

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
export async function speakCoachLine(text: string, _severity?: string): Promise<void> {
  await ensureInit();

  if (
    !enabled ||
    !ttsAvailable ||
    typeof window === "undefined" ||
    isLiveCoachActive()
  ) {
    return;
  }

  try {
    const blob = await fetchVoiceSpeak(text);
    await playAudioBlob(blob);
  } catch {
    // Non-fatal — coaching still visible on screen
  }
}

export async function initCoachVoice(): Promise<boolean> {
  await ensureInit();
  return ttsAvailable;
}
