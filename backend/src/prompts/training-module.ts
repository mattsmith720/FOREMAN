import { z } from "zod";

export const trainingStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  title: z.string().min(1),
  instruction: z.string().min(1),
  safetyNote: z.string().optional(),
  commonMistake: z.string().optional(),
  timestampHint: z.string().optional(),
});

export const trainingModuleSchema = z.object({
  title: z.string().min(1),
  jobType: z.string().min(1),
  worker: z.string().nullable(),
  summary: z.string().min(1),
  learningObjectives: z.array(z.string().min(1)).min(1).max(8),
  steps: z.array(trainingStepSchema).min(3).max(15),
  commonMistakes: z.array(z.string().min(1)).max(8),
  quizQuestions: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
      }),
    )
    .min(2)
    .max(8),
  onboardingScript: z.string().min(1),
});

export type TrainingModule = z.infer<typeof trainingModuleSchema>;

export const TRAINING_MODULE_SYSTEM_PROMPT = `You are Foreman, building onboarding training packages for Australian solar maintenance crews.
You receive structured data from a real field job (frame analyses, coaching events, transcript) and turn it into a training module new hires can follow without the owner on every roof.

Rules:
- Australian English
- Practical, step-by-step language a tradie would use on site
- Steps must reflect what actually happened in the session data — do not invent tools or products not mentioned
- Safety notes on every step where height, water, chemicals, live equipment, or birds/nests are involved
- commonMistakes from real coaching flags and transcript gaps
- quizQuestions test judgment on site (safety, technique, customer handover), not trivia
- onboardingScript is what a crew lead says in a 2-minute pre-job briefing
- Respond with valid JSON only. No markdown, no code fences.`;

export function buildTrainingModuleUserPrompt(data: {
  worker: string | null;
  jobType: string | null;
  notes: string | null;
  summary: string | null;
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
    "Generate a training module JSON from this completed maintenance job session.",
    `Worker: ${data.worker ?? "senior tech"}`,
    `Job type: ${data.jobType ?? "panel_clean"}`,
    "Use installQualityFlags and coaching events as source material for steps, safety notes, and common mistakes.",
    "",
    "Return exactly this JSON shape:",
    `{
  "title": "string — e.g. Panel clean · standard residential visit",
  "jobType": "string",
  "worker": "string or null",
  "summary": "string — 2-3 sentences on what this job demonstrated",
  "learningObjectives": ["string"],
  "steps": [{
    "stepNumber": 1,
    "title": "string",
    "instruction": "string",
    "safetyNote": "optional string",
    "commonMistake": "optional string",
    "timestampHint": "optional string — approximate moment in job if inferable"
  }],
  "commonMistakes": ["string"],
  "quizQuestions": [{ "question": "string", "answer": "string" }],
  "onboardingScript": "string — crew lead pre-job briefing"
}`,
  ];

  if (data.notes) {
    lines.push(`Session notes: ${data.notes}`);
  }
  if (data.summary) {
    lines.push("", "End-of-job summary:", data.summary);
  }

  lines.push("", "Frame analyses:");
  if (data.frames.length === 0) {
    lines.push("- No frames captured.");
  } else {
    const sample = data.frames.length > 40 ? data.frames.slice(0, 40) : data.frames;
    for (const frame of sample) {
      lines.push(`- ${frame.ts}: ${JSON.stringify(frame.analysis)}`);
    }
    if (data.frames.length > 40) {
      lines.push(`- … ${data.frames.length - 40} additional frames omitted`);
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
