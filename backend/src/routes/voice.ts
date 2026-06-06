import type { FastifyError, FastifyInstance } from "fastify";
import { z } from "zod";
import { toClientError } from "../api-error.js";
import {
  getConvaiSignedUrl,
  getElevenLabsAgentId,
  getElevenLabsVoiceId,
  isElevenLabsConfigured,
  synthesizeSpeech,
} from "../elevenlabs.js";
import { answerVoiceAdvice } from "../voice-advice.js";

const VOICE_BODY_LIMIT_BYTES = 2 * 1024 * 1024;
// Route-local fallback until shared body-size limits are centralized in config.ts.
const VOICE_ADVICE_TEXT_LIMIT_BYTES = 16 * 1024;

const speakSchema = z.object({
  text: z.string().min(1).max(2000),
});

const adviceSchema = z.object({
  question: z.string().min(1).max(2000),
  jobType: z.string().max(200).optional(),
  recentTranscript: z.array(z.string().max(2000)).max(20).optional(),
  includeAudio: z.boolean().optional(),
});

interface VoiceRouteDependencies {
  getConvaiSignedUrl: typeof getConvaiSignedUrl;
  getElevenLabsAgentId: typeof getElevenLabsAgentId;
  getElevenLabsVoiceId: typeof getElevenLabsVoiceId;
  isElevenLabsConfigured: typeof isElevenLabsConfigured;
  synthesizeSpeech: typeof synthesizeSpeech;
  answerVoiceAdvice: typeof answerVoiceAdvice;
}

const defaultDependencies: VoiceRouteDependencies = {
  getConvaiSignedUrl,
  getElevenLabsAgentId,
  getElevenLabsVoiceId,
  isElevenLabsConfigured,
  synthesizeSpeech,
  answerVoiceAdvice,
};

function contentLength(request: { headers: Record<string, unknown> }): number | null {
  const header = request.headers["content-length"];
  const raw = Array.isArray(header) ? header[0] : header;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function isPayloadTooLargeError(error: FastifyError): boolean {
  return error.statusCode === 413 || error.code === "FST_ERR_CTP_BODY_TOO_LARGE";
}

function isMalformedJsonError(error: FastifyError): boolean {
  return (
    error.code === "FST_ERR_CTP_INVALID_JSON_BODY" ||
    error.message.toLowerCase().includes("json")
  );
}

export async function registerVoiceRoutes(
  app: FastifyInstance,
  dependencies: VoiceRouteDependencies = defaultDependencies,
): Promise<void> {
  app.get("/voice/config", async (_request, reply) => {
    const agentConfigured = Boolean(dependencies.getElevenLabsAgentId());

    return reply.send({
      ttsAvailable: dependencies.isElevenLabsConfigured(),
      liveAvailable: dependencies.isElevenLabsConfigured() && agentConfigured,
      agentConfigured,
      voiceId: dependencies.getElevenLabsVoiceId(),
      voiceLabel: "Australian male (Charlie)",
    });
  });

  app.post(
    "/voice/speak",
    {
      config: {
        rateLimit: { max: 30, timeWindow: "1 minute" },
      },
      bodyLimit: VOICE_BODY_LIMIT_BYTES,
      preValidation: async (request, reply) => {
        const headerLength = contentLength(request);
        if (headerLength !== null && headerLength > VOICE_BODY_LIMIT_BYTES) {
          return reply.status(413).send({ error: "Payload too large" });
        }
        return undefined;
      },
      errorHandler: (error, request, reply) => {
        if (isPayloadTooLargeError(error)) {
          return reply.status(413).send({ error: "Payload too large" });
        }
        if (isMalformedJsonError(error)) {
          return reply.status(400).send({ error: "Malformed JSON body" });
        }
        request.log.error(error);
        return reply.status(500).send({ error: "Voice request failed" });
      },
    },
    async (request, reply) => {
      if (!dependencies.isElevenLabsConfigured()) {
        return reply.status(503).send({
          error: "ELEVENLABS_API_KEY is not set for voice synthesis",
        });
      }

      const parsed = speakSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid request" });
      }

      try {
        const audio = await dependencies.synthesizeSpeech(parsed.data.text);
        return reply
          .header("content-type", "audio/mpeg")
          .header("cache-control", "no-store")
          .send(audio);
      } catch (err) {
        request.log.error(err);
        const { statusCode, message } = toClientError(err, "Voice synthesis failed");
        return reply.status(statusCode).send({ error: message });
      }
    },
  );

  app.get("/voice/convai-url", async (request, reply) => {
    if (!dependencies.isElevenLabsConfigured()) {
      return reply.status(503).send({
        error: "ELEVENLABS_API_KEY is not set for live voice coach",
      });
    }

    if (!dependencies.getElevenLabsAgentId()) {
      return reply.status(503).send({
        error:
          "ELEVENLABS_AGENT_ID is not set. Create a ConvAI agent in ElevenLabs or use Ask coach mode.",
      });
    }

    try {
      const signedUrl = await dependencies.getConvaiSignedUrl();
      return reply.send({ signedUrl });
    } catch (err) {
      request.log.error(err);
      const { statusCode, message } = toClientError(
        err,
        "Failed to start live voice session",
      );
      return reply.status(statusCode).send({ error: message });
    }
  });

  app.post(
    "/voice/advice",
    {
      config: {
        rateLimit: { max: 15, timeWindow: "1 minute" },
      },
      bodyLimit: VOICE_BODY_LIMIT_BYTES,
      preValidation: async (request, reply) => {
        const headerLength = contentLength(request);
        if (headerLength !== null && headerLength > VOICE_BODY_LIMIT_BYTES) {
          return reply.status(413).send({ error: "Payload too large" });
        }
        return undefined;
      },
      errorHandler: (error, request, reply) => {
        if (isPayloadTooLargeError(error)) {
          return reply.status(413).send({ error: "Payload too large" });
        }
        if (isMalformedJsonError(error)) {
          return reply.status(400).send({ error: "Malformed JSON body" });
        }
        request.log.error(error);
        return reply.status(500).send({ error: "Voice advice request failed" });
      },
    },
    async (request, reply) => {
      const parsed = adviceSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid request" });
      }

      if (Buffer.byteLength(parsed.data.question, "utf8") > VOICE_ADVICE_TEXT_LIMIT_BYTES) {
        return reply.status(413).send({ error: "Question payload too large" });
      }

      try {
        let replyText: string;
        try {
          replyText = await dependencies.answerVoiceAdvice(parsed.data);
        } catch (providerErr) {
          request.log.error(providerErr);
          const { statusCode, message } = toClientError(
            providerErr,
            "Voice advice provider unavailable",
          );
          return reply.status(statusCode).send({ error: message });
        }

        if (
          parsed.data.includeAudio !== false &&
          dependencies.isElevenLabsConfigured()
        ) {
          let audio: Buffer;
          try {
            audio = await dependencies.synthesizeSpeech(replyText);
          } catch (providerErr) {
            request.log.error(providerErr);
            const { statusCode, message } = toClientError(
              providerErr,
              "Voice synthesis unavailable",
            );
            return reply.status(statusCode).send({ error: message });
          }
          return reply.send({
            reply: replyText,
            audioBase64: audio.toString("base64"),
            audioMime: "audio/mpeg",
          });
        }

        return reply.send({ reply: replyText });
      } catch (err) {
        request.log.error(err);
        const { statusCode, message } = toClientError(err, "Voice advice failed");
        return reply.status(statusCode).send({ error: message });
      }
    },
  );
}
