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
import { maxCalloutsForPhase } from "./prompts/analysis-phases.js";

// claude-sonnet-4-20250514 is deprecated (EOL 2026-06-15). Default to the
// current Sonnet; override per-env with ANTHROPIC_MODEL (e.g. Haiku for lower
// latency/cost — compare quality with `npm run eval-coaching`).
const DEFAULT_MODEL = "claude-sonnet-4-6";
// 512/1024 truncated the current Sonnet's richer JSON mid-response (esp. pitch
// frames with several feedback items) -> parse fallback -> empty coaching. 1500
// clears the full schema. Output tokens are billed only when generated, so a
// higher ceiling adds no cost/latency on shorter replies — it just prevents truncation.
const DEFAULT_MAX_TOKENS = 1500;
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

function getMaxTokens(): number {
  const raw = process.env.ANTHROPIC_MAX_TOKENS?.trim();
  if (!raw) {
    return DEFAULT_MAX_TOKENS;
  }
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_TOKENS;
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

function capCallouts(
  coaching: CoachingResponse,
  jobType?: string,
): CoachingResponse {
  const cap = maxCalloutsForPhase(jobType);
  const callouts = coaching.visualCallouts ?? [];
  if (callouts.length <= cap) {
    return coaching;
  }
  // Keep the most severe callouts so the cap drops noise, not safety; on a
  // severity tie, prefer safety/damage/quality over upsell/pitch/etc.
  const sevRank: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  const catRank: Record<string, number> = {
    safety: 0,
    damage: 1,
    quality: 2,
    cleanliness: 3,
    time: 4,
    pitch: 5,
    upsell: 6,
  };
  const trimmed = [...callouts]
    .sort(
      (a, b) =>
        (sevRank[a.severity] ?? 3) - (sevRank[b.severity] ?? 3) ||
        (catRank[a.category] ?? 9) - (catRank[b.category] ?? 9),
    )
    .slice(0, cap);
  return { ...coaching, visualCallouts: trimmed };
}

export async function analyseImage(
  input: AnalyseImageInput,
  dependencies: AnalyseImageDependencies = defaultAnalyseImageDependencies,
): Promise<CoachingResponse> {
  const client = dependencies.createClient();
  const model = getModel();
  const userPrompt = buildAnalysisUserPrompt(input.context);
  let lastError: unknown;
  let fallbackCoaching: CoachingResponse | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: getMaxTokens(),
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
        return capCallouts(parsed.coaching, input.context?.jobType);
      }
      // Retain a usable fallback so a later thrown attempt doesn't lose it.
      fallbackCoaching = parsed.coaching;
    } catch (err) {
      lastError = err;
      if (attempt === MAX_RETRIES) {
        break;
      }
    }
  }

  if (fallbackCoaching) {
    return capCallouts(fallbackCoaching, input.context?.jobType);
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
