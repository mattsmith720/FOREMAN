import { Conversation } from "@elevenlabs/client";
import type { Conversation as LiveConversation } from "@elevenlabs/client";
import { fetchConvaiSignedUrl } from "./voice-speak";
import { stopVoicePlayback } from "./voice-player";

export type LiveCoachMode = "listening" | "speaking" | "connecting" | "idle";

export interface LiveCoachCallbacks {
  onModeChange?: (mode: LiveCoachMode) => void;
  onAgentMessage?: (message: string) => void;
  onUserMessage?: (message: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
  onVisionLinked?: (linked: boolean) => void;
}

let activeSession: LiveConversation | null = null;
let sessionGeneration = 0;
let lastContextFingerprint = "";
let lastContextAt = 0;

const MIN_CONTEXT_INTERVAL_MS = 3500;

const VISION_PREAMBLE =
  "Live camera context from the installer's phone (updates every few seconds). Treat this as what you can see on site right now. Do not say you received a system update or JSON — speak naturally as if you're watching with them.";

function isGenerationCurrent(generation: number): boolean {
  return generation === sessionGeneration;
}

async function disposeActiveSession(): Promise<void> {
  if (!activeSession) {
    return;
  }

  const session = activeSession;
  activeSession = null;
  resetVisionSyncState();

  try {
    await session.endSession();
  } catch {
    // Session may already be closed.
  }
}

export function isLiveCoachActive(): boolean {
  return activeSession !== null && activeSession.isOpen();
}

function resetVisionSyncState(): void {
  lastContextFingerprint = "";
  lastContextAt = 0;
}

/** Push Claude vision + transcript context into the live ElevenLabs agent. */
export function sendLiveVisionContext(text: string): boolean {
  if (!activeSession?.isOpen()) {
    return false;
  }

  const body = text.trim();
  if (!body) {
    return false;
  }

  const fingerprint = body.slice(0, 240);
  const now = Date.now();

  if (
    fingerprint === lastContextFingerprint &&
    now - lastContextAt < MIN_CONTEXT_INTERVAL_MS * 2
  ) {
    return false;
  }

  if (now - lastContextAt < MIN_CONTEXT_INTERVAL_MS) {
    return false;
  }

  activeSession.sendContextualUpdate(`${VISION_PREAMBLE}\n${body}`);
  lastContextFingerprint = fingerprint;
  lastContextAt = now;
  return true;
}

export function sendLiveSessionBootstrap(context: string | null): void {
  if (!activeSession?.isOpen()) {
    return;
  }

  activeSession.sendContextualUpdate(
    "The installer opened live voice coaching with the phone camera running. You will receive live camera scene updates in the background. Use them when they answer questions about what you see on the roof, panels, cabling, or customer interaction.",
  );

  if (context) {
    sendLiveVisionContext(context);
  }
}

export async function startLiveCoach(
  callbacks: LiveCoachCallbacks,
  initialVisionContext?: string | null,
): Promise<void> {
  if (isLiveCoachActive()) {
    return;
  }

  const generation = ++sessionGeneration;

  await disposeActiveSession();

  if (!isGenerationCurrent(generation)) {
    return;
  }

  stopVoicePlayback();
  resetVisionSyncState();
  callbacks.onModeChange?.("connecting");

  try {
    const signedUrl = await fetchConvaiSignedUrl();

    if (!isGenerationCurrent(generation)) {
      return;
    }

    const session = await Conversation.startSession({
      signedUrl,
      onConnect: () => {
        if (!isGenerationCurrent(generation)) {
          return;
        }

        callbacks.onModeChange?.("listening");
        callbacks.onVisionLinked?.(true);
        sendLiveSessionBootstrap(initialVisionContext ?? null);
      },
      onDisconnect: () => {
        if (activeSession === session) {
          activeSession = null;
        }
        resetVisionSyncState();
        callbacks.onVisionLinked?.(false);
        callbacks.onModeChange?.("idle");
        callbacks.onEnd?.();
      },
      onError: (message) => {
        callbacks.onError?.(message);
      },
      onMessage: ({ message, role }) => {
        if (role === "agent") {
          callbacks.onAgentMessage?.(message);
        } else {
          callbacks.onUserMessage?.(message);
        }
      },
      onModeChange: ({ mode }) => {
        callbacks.onModeChange?.(mode === "speaking" ? "speaking" : "listening");
      },
    });

    if (!isGenerationCurrent(generation)) {
      try {
        await session.endSession();
      } catch {
        // Superseded start — drop orphan session.
      }
      return;
    }

    activeSession = session;
  } catch (err) {
    if (isGenerationCurrent(generation)) {
      callbacks.onModeChange?.("idle");
      callbacks.onVisionLinked?.(false);
      const message =
        err instanceof Error ? err.message : "Could not start live coach";
      callbacks.onError?.(message);
      throw err;
    }
  }
}

export async function endLiveCoach(): Promise<void> {
  sessionGeneration++;
  await disposeActiveSession();
}
