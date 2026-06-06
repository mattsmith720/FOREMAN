import { z } from "zod";
import {
  createProxyErrorResponse,
  proxyBinaryToBackend,
} from "../../../../lib/proxy-backend";
import {
  isElevenLabsTtsConfigured,
  synthesizeElevenLabsSpeech,
} from "../../../../lib/elevenlabs-tts";

export const maxDuration = 30;

const speakSchema = z.object({
  text: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  try {
    const parsed = speakSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    if (isElevenLabsTtsConfigured()) {
      try {
        const audio = await synthesizeElevenLabsSpeech(parsed.data.text);
        return new Response(audio, {
          status: 200,
          headers: {
            "content-type": "audio/mpeg",
            "cache-control": "no-store",
          },
        });
      } catch (error) {
        console.error("Vercel ElevenLabs TTS failed, falling back to backend", error);
      }
    }

    return await proxyBinaryToBackend(
      "/voice/speak",
      new Request(request.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      }),
      {
        timeoutMs: 25_000,
        maxBodyBytes: 200_000,
      },
    );
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy voice speak request");
  }
}
