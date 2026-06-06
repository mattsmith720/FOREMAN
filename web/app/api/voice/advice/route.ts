import { z } from "zod";
import {
  createProxyErrorResponse,
  proxyToBackend,
} from "../../../../lib/proxy-backend";
import {
  isElevenLabsTtsConfigured,
  synthesizeElevenLabsSpeech,
} from "../../../../lib/elevenlabs-tts";

export const maxDuration = 60;

const adviceSchema = z.object({
  question: z.string().min(1).max(2000),
  jobType: z.string().max(200).optional(),
  recentTranscript: z.array(z.string().max(2000)).max(20).optional(),
  includeAudio: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = adviceSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const wantsAudio =
      parsed.data.includeAudio !== false && isElevenLabsTtsConfigured();

    const backendResponse = await proxyToBackend(
      "/voice/advice",
      new Request(request.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          includeAudio: wantsAudio ? false : parsed.data.includeAudio,
        }),
      }),
      {
        timeoutMs: 55_000,
        maxBodyBytes: 500_000,
      },
    );

    const payload = (await backendResponse.json()) as {
      reply?: string;
      error?: string;
      audioBase64?: string;
      audioMime?: string;
    };

    if (!backendResponse.ok) {
      return Response.json(payload, { status: backendResponse.status });
    }

    if (!wantsAudio || !payload.reply) {
      return Response.json(payload, { status: 200 });
    }

    try {
      const audio = await synthesizeElevenLabsSpeech(payload.reply);
      return Response.json({
        reply: payload.reply,
        audioBase64: Buffer.from(audio).toString("base64"),
        audioMime: "audio/mpeg",
      });
    } catch (error) {
      console.error("Vercel ElevenLabs advice TTS failed", error);
      return Response.json({ reply: payload.reply }, { status: 200 });
    }
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy voice advice request");
  }
}
