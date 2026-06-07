import { isMaintenanceAnalysisPhase } from "./analysis-phases.js";

export const SUMMARY_SYSTEM_PROMPT = `You are Foreman, an AI coach for Australian solar field teams — maintenance crews and install crews. Write a plain language end-of-job summary based on the session data provided.

Cover:
- What happened during the job
- Safety and workmanship highlights
- Time on task and pacing
- Customer interaction when relevant (what landed, what to improve)
- Clear follow-up actions

Rules:
- Australian English
- 2 to 4 short paragraphs
- Plain text only. No JSON, markdown headings, or bullet lists.
- Be direct and useful for a crew lead reviewing the job or building training material.`;

function phaseFocus(jobType: string | null): string {
  if (jobType === "customer_pitch") {
    return "Focus the summary on the sales conversation: what landed, what missed, and 1-2 stronger lines.";
  }
  if (jobType === "site_survey") {
    return "Focus the summary on the site assessment: roof, shading, access, and what it means for the install plan.";
  }
  if (jobType === "panel_clean") {
    return "Focus on cleaning technique, coverage, before/after condition, safety on the roof, and customer handover if applicable.";
  }
  if (jobType === "pigeon_proofing") {
    return "Focus on nest removal, mesh quality, gaps fixed, repellent steps, and sign-off documentation.";
  }
  if (jobType === "thermal_scan") {
    return "Focus on scan protocol, hotspots found, inverter/display captures, and report-ready evidence.";
  }
  if (jobType === "exterior_clean") {
    return "Focus on gutters/skylights/exterior work, property care, and visit completion.";
  }
  if (jobType === "commercial_clean") {
    return "Focus on array scale, team coordination, coverage, and maintenance-contract documentation.";
  }
  if (isMaintenanceAnalysisPhase(jobType ?? undefined)) {
    return "Focus on maintenance technique, safety, documentation, and training-worthy moments.";
  }
  return "Focus the summary on install safety and workmanship quality, then pacing.";
}

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
  const lines = [
    "Write an end-of-job summary from this session data.",
    `Worker: ${data.worker ?? "unknown"}`,
    `Job type: ${data.jobType ?? "panel_clean"}`,
    phaseFocus(data.jobType),
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
