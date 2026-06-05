let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let playbackGeneration = 0;

function isBenignPlaybackError(err: unknown): boolean {
  if (!(err instanceof Error)) {
    return false;
  }

  if (err.name === "AbortError") {
    return true;
  }

  const message = err.message.toLowerCase();
  return message.includes("interrupted") || message.includes("new load");
}

function disposeCurrentAudio(): void {
  if (currentAudio) {
    const audio = currentAudio;
    currentAudio = null;
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio.removeAttribute("src");
  }

  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
}

export function stopVoicePlayback(): void {
  playbackGeneration++;
  disposeCurrentAudio();
}

export function playAudioBlob(blob: Blob): Promise<void> {
  const generation = ++playbackGeneration;
  disposeCurrentAudio();

  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    currentUrl = url;
    const audio = new Audio(url);
    currentAudio = audio;

    const finish = () => {
      if (generation !== playbackGeneration) {
        resolve();
        return;
      }

      disposeCurrentAudio();
      resolve();
    };

    audio.onended = finish;
    audio.onerror = finish;

    void audio.play().catch((err) => {
      if (generation !== playbackGeneration || isBenignPlaybackError(err)) {
        resolve();
        return;
      }

      finish();
    });
  });
}

export function playAudioBase64(base64: string, mime = "audio/mpeg"): Promise<void> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return playAudioBlob(new Blob([bytes], { type: mime }));
}
