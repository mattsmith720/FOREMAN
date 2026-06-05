import Anthropic from "@anthropic-ai/sdk";
import { isAnalysisConfigured } from "./config.js";
import {
  buildVoiceAdviceUserPrompt,
  VOICE_ADVICE_SYSTEM,
} from "./prompts/voice-advice.js";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export async function answerVoiceAdvice(input: {
  question: string;
  jobType?: string;
  recentTranscript?: string[];
}): Promise<string> {
  if (!isAnalysisConfigured()) {
    throw new Error("ANTHROPIC_API_KEY is not set for voice advice");
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

  const response = await client.messages.create({
    model,
    max_tokens: 300,
    system: VOICE_ADVICE_SYSTEM,
    messages: [
      {
        role: "user",
        content: buildVoiceAdviceUserPrompt(input),
      },
    ],
  });

  const block = response.content.find((part) => part.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("No text reply from Claude");
  }

  return block.text.trim();
}
