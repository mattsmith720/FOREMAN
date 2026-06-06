import { isLiveCoachBusy } from "./coach-live";
import { fetchVoiceConfig } from "./voice-config";
import { fetchVoiceSpeak } from "./voice-speak";
import { playAudioBlob, stopVoicePlayback } from "./voice-player";

let enabled = true;
let ttsAvailable = false;
let initPromise: Promise<void> | null = null;
let speakGeneration = 0;

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
export async function speakCoachLine(text: string, _severity?: string): Promise<void> {
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

    await playAudioBlob(blob);
  } catch {
    // Non-fatal — coaching still visible on screen
  }
}

export async function initCoachVoice(): Promise<boolean> {
  await ensureInit();
  return ttsAvailable;
}
