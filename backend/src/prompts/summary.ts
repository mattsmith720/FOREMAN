export const SUMMARY_SYSTEM_PROMPT = `You are Foreman, an AI coach for solar installation field teams. Write a plain language end-of-job summary for the installer based on the session data provided.

Cover:
- What happened during the job
- Install quality and safety highlights
- Time on task and pacing
- Sales pitch performance: what the worker said, what landed, what missed, and 1 to 2 stronger lines they could use next time
- Clear follow-up actions

Rules:
- Australian English
- 2 to 4 short paragraphs
- Plain text only. No JSON, markdown headings, or bullet lists.
- Be direct and useful for a crew lead reviewing the job.`;

export function buildSummaryUserPrompt(data: {
  worker: string | null;
  jobType: string | null;
  notes: string | null;
  frames: Array<{ ts: string; analysis: unknown }>;
  coachingEvents: Array<{
    ts: string;
    category: string;
    message: string;
    severity: string;
  }>;
  transcriptSegments: Array<{
    ts: string;
    text: string;
    speaker: string | null;
  }>;
}): string {
  const phaseFocus =
    data.jobType === "customer_pitch"
      ? "Focus the summary on the sales conversation: what landed, what missed, and 1-2 stronger lines."
      : data.jobType === "site_survey"
        ? "Focus the summary on the site assessment: roof, shading, access, and what it means for the install plan."
        : "Focus the summary on install safety and workmanship quality, then pacing.";
  const lines = [
    "Write an end-of-job summary from this session data.",
    `Worker: ${data.worker ?? "unknown"}`,
    `Job type: ${data.jobType ?? "solar_install"}`,
    phaseFocus,
  ];

  if (data.notes) {
    lines.push(`Session notes: ${data.notes}`);
  }

  lines.push("", "Frame analyses:");
  if (data.frames.length === 0) {
    lines.push("- No frames captured.");
  } else {
    for (const frame of data.frames) {
      lines.push(`- ${frame.ts}: ${JSON.stringify(frame.analysis)}`);
    }
  }

  lines.push("", "Coaching events:");
  if (data.coachingEvents.length === 0) {
    lines.push("- No coaching events recorded.");
  } else {
    for (const event of data.coachingEvents) {
      lines.push(
        `- ${event.ts} [${event.category}/${event.severity}] ${event.message}`,
      );
    }
  }

  lines.push("", "Transcript:");
  if (data.transcriptSegments.length === 0) {
    lines.push("- No transcript captured.");
  } else {
    for (const segment of data.transcriptSegments) {
      const speaker = segment.speaker ?? "worker";
      lines.push(`- ${segment.ts} [${speaker}] ${segment.text}`);
    }
  }

  return lines.join("\n");
}
