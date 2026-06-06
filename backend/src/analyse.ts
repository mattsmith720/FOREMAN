import Anthropic from "@anthropic-ai/sdk";
import {
  coachingResponseSchema,
  type CoachingResponse,
} from "@foreman/shared";
import { parseCoachingResponseWithFallback } from "./parse-coaching.js";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  isAllowedImageType,
  isAnalysisConfigured,
} from "./config.js";
import {
  ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisUserPrompt,
  type SessionContext,
} from "./prompts/analysis.js";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const MAX_RETRIES = 3;

type ImageMediaType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export { isAnalysisConfigured };

export interface AnalyseImageInput {
  base64: string;
  mediaType: ImageMediaType;
  context?: SessionContext;
}

interface AnalyseImageDependencies {
  createClient: () => Anthropic;
  parseResponse: (raw: string) => {
    coaching: CoachingResponse;
    usedFallback: boolean;
  };
}

const defaultAnalyseImageDependencies: AnalyseImageDependencies = {
  createClient: getClient,
  parseResponse: parseCoachingResponseWithFallback,
};

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

function extractTextContent(
  content: Anthropic.Messages.ContentBlock[],
): string {
  const text = content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Model returned no text content");
  }

  return text;
}

export async function analyseImage(
  input: AnalyseImageInput,
  dependencies: AnalyseImageDependencies = defaultAnalyseImageDependencies,
): Promise<CoachingResponse> {
  const client = dependencies.createClient();
  const model = getModel();
  const userPrompt = buildAnalysisUserPrompt(input.context);
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: 1024,
        system: ANALYSIS_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: input.mediaType as "image/jpeg" | "image/png" | "image/webp",
                  data: input.base64,
                },
              },
              {
                type: "text",
                text: userPrompt,
              },
            ],
          },
        ],
      });

      const raw = extractTextContent(response.content);
      const parsed = dependencies.parseResponse(raw);
      if (!parsed.usedFallback || attempt === MAX_RETRIES) {
        return parsed.coaching;
      }
    } catch (err) {
      lastError = err;
      if (attempt === MAX_RETRIES) {
        break;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to parse coaching response");
}

export function decodeImagePayload(image: string): {
  base64: string;
  mediaType: ImageMediaType;
} {
  const dataUrlMatch = image.match(/^data:(image\/[a-z0-9+.-]+);base64,(.+)$/i);
  if (dataUrlMatch) {
    const mediaType = dataUrlMatch[1].toLowerCase();
    if (!isAllowedImageType(mediaType)) {
      throw new Error(
        `Unsupported image type. Allowed: ${ALLOWED_IMAGE_MIME_TYPES.join(", ")}`,
      );
    }
    return { mediaType: mediaType as ImageMediaType, base64: dataUrlMatch[2] };
  }

  return { mediaType: "image/jpeg", base64: image };
}

export { coachingResponseSchema };
