import type { FastifyInstance } from "fastify";
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

const speakSchema = z.object({
  text: z.string().min(1).max(2000),
});

const adviceSchema = z.object({
  question: z.string().min(1).max(2000),
  jobType: z.string().max(200).optional(),
  recentTranscript: z.array(z.string().max(2000)).max(20).optional(),
  includeAudio: z.boolean().optional(),
});

export async function registerVoiceRoutes(app: FastifyInstance): Promise<void> {
  app.get("/voice/config", async (_request, reply) => {
    const agentConfigured = Boolean(getElevenLabsAgentId());

    return reply.send({
      ttsAvailable: isElevenLabsConfigured(),
      liveAvailable: isElevenLabsConfigured() && agentConfigured,
      agentConfigured,
      voiceId: getElevenLabsVoiceId(),
      voiceLabel: "Australian male (Charlie)",
    });
  });

  app.post(
    "/voice/speak",
    {
      config: {
        rateLimit: { max: 30, timeWindow: "1 minute" },
      },
    },
    async (request, reply) => {
      if (!isElevenLabsConfigured()) {
        return reply.status(503).send({
          error: "ELEVENLABS_API_KEY is not set for voice synthesis",
        });
      }

      const parsed = speakSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid request" });
      }

      try {
        const audio = await synthesizeSpeech(parsed.data.text);
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
    if (!isElevenLabsConfigured()) {
      return reply.status(503).send({
        error: "ELEVENLABS_API_KEY is not set for live voice coach",
      });
    }

    if (!getElevenLabsAgentId()) {
      return reply.status(503).send({
        error:
          "ELEVENLABS_AGENT_ID is not set. Create a ConvAI agent in ElevenLabs or use Ask coach mode.",
      });
    }

    try {
      const signedUrl = await getConvaiSignedUrl();
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
    },
    async (request, reply) => {
      const parsed = adviceSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid request" });
      }

      try {
        const replyText = await answerVoiceAdvice(parsed.data);

        if (parsed.data.includeAudio !== false && isElevenLabsConfigured()) {
          const audio = await synthesizeSpeech(replyText);
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
