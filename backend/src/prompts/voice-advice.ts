export const VOICE_ADVICE_SYSTEM = `You are Foreman, an Australian field coach for solar maintenance and install crews.
Answer spoken questions in clear, practical language. Keep replies under 80 words unless safety requires more detail.
Be direct and supportive. Use Australian English spelling. No markdown or bullet lists — plain spoken sentences only.
Prioritise safety, technique, customer handover, and time on task.`;

export function buildVoiceAdviceUserPrompt(input: {
  question: string;
  jobType?: string;
  recentTranscript?: string[];
}): string {
  const lines = [
    `Job type: ${input.jobType ?? "auto"}`,
    `Worker question: ${input.question}`,
  ];

  if (input.recentTranscript?.length) {
    lines.push(
      `Recent job audio context: ${input.recentTranscript.slice(-5).join(" | ")}`,
    );
  }

  lines.push("Reply as Foreman would speak on site.");
  return lines.join("\n");
}
