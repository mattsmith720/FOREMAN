let enabled = true;

export function setJarvisVoiceEnabled(value: boolean): void {
  enabled = value;
}

export function speakJarvisLine(text: string, severity?: string): void {
  if (!enabled || typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = severity === "critical" ? 0.95 : 1.08;
  utterance.pitch = severity === "critical" ? 0.85 : 1;
  window.speechSynthesis.speak(utterance);
}
