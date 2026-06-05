let enabled = true;

export function setJarvisVoiceEnabled(value: boolean): void {
  enabled = value;
}

export function speakJarvisLine(text: string, severity?: string): void {
  if (!enabled || typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }

  if (severity !== "critical" && severity !== "warning") {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = 0.95;
  window.speechSynthesis.speak(utterance);
}
