import Anthropic from "@anthropic-ai/sdk";
import {
  getSession,
  getSessionCoachingEvents,
  getSessionFrames,
  type SessionRow,
} from "./db/sessions.js";
import { getSessionTranscriptSegments } from "./db/transcript.js";
import {
  SUMMARY_SYSTEM_PROMPT,
  buildSummaryUserPrompt,
} from "./prompts/summary.js";

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

export async function summariseSession(sessionId: string): Promise<string> {
  const session = await getSession(sessionId);
  const [frames, coachingEvents, transcriptSegments] = await Promise.all([
    getSessionFrames(sessionId),
    getSessionCoachingEvents(sessionId),
    getSessionTranscriptSegments(sessionId),
  ]);

  const client = getClient();
  const response = await client.messages.create({
    model: getModel(),
    max_tokens: 1024,
    system: SUMMARY_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildSummaryUserPrompt({
          worker: session.worker,
          jobType: session.job_type,
          notes: session.notes,
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
    throw new Error("Model returned no summary text");
  }

  return text;
}

export type { SessionRow };
