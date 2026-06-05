let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

export function stopVoicePlayback(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
}

export function playAudioBlob(blob: Blob): Promise<void> {
  stopVoicePlayback();

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    currentUrl = url;
    const audio = new Audio(url);
    currentAudio = audio;

    audio.onended = () => {
      stopVoicePlayback();
      resolve();
    };
    audio.onerror = () => {
      stopVoicePlayback();
      reject(new Error("Audio playback failed"));
    };

    void audio.play().catch(reject);
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
