import Anthropic from "@anthropic-ai/sdk";
import { coachingResponseSchema } from "@foreman/shared";
import {
  getSession,
  getSessionCoachingEvents,
  getSessionFrames,
} from "./db/sessions.js";
import { getSessionTranscriptSegments } from "./db/transcript.js";
import {
  TRAINING_MODULE_SYSTEM_PROMPT,
  buildTrainingModuleUserPrompt,
  trainingModuleSchema,
  type TrainingModule,
} from "./prompts/training-module.js";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  return new Anthropic({ apiKey });
}

function getModel(): string {
  return process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model returned no JSON object");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function generateTrainingModule(
  sessionId: string,
): Promise<TrainingModule> {
  const session = await getSession(sessionId);
  const [frames, coachingEvents, transcriptSegments] = await Promise.all([
    getSessionFrames(sessionId),
    getSessionCoachingEvents(sessionId),
    getSessionTranscriptSegments(sessionId),
  ]);

  if (frames.length === 0 && transcriptSegments.length === 0) {
    throw new Error(
      "Session has no frames or transcript — upload or record a job first",
    );
  }

  const client = getClient();
  const response = await client.messages.create({
    model: getModel(),
    max_tokens: 4096,
    system: TRAINING_MODULE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildTrainingModuleUserPrompt({
          worker: session.worker,
          jobType: session.job_type,
          notes: session.notes,
          summary: session.summary,
          frames,
          coachingEvents,
          transcriptSegments,
        }),
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Model returned no training module text");
  }

  const parsed = trainingModuleSchema.safeParse(extractJsonObject(text));
  if (!parsed.success) {
    throw new Error(
      `Training module validation failed: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
    );
  }

  return {
    ...parsed.data,
    jobType: parsed.data.jobType || session.job_type || "auto",
    worker: parsed.data.worker ?? session.worker,
  };
}

/** Lightweight stats for export / training pipeline filters. */
export function sessionTrainingStats(session: {
  job_type: string | null;
  frames: Array<{ analysis: unknown }>;
}): {
  jobType: string;
  frameCount: number;
  coachingFlagCount: number;
} {
  let coachingFlagCount = 0;
  for (const frame of session.frames) {
    const parsed = coachingResponseSchema.safeParse(frame.analysis);
    if (parsed.success) {
      coachingFlagCount += parsed.data.installQualityFlags.length;
    }
  }
  return {
    jobType: session.job_type ?? "auto",
    frameCount: session.frames.length,
    coachingFlagCount,
  };
}
