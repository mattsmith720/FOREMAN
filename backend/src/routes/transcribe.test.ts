import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { registerTranscribeRoutes } from "./transcribe.js";

test("POST /transcribe returns 413 for oversize audio payload", async () => {
  const app = Fastify();
  await registerTranscribeRoutes(app, {
    isTranscriptionConfigured: () => true,
    requireSessionToken: () => true,
    isSupabaseConfigured: () => true,
    assertActiveSession: async () => {
      throw new Error("not expected");
    },
    decodeAudioPayload: () => ({
      bytes: Buffer.alloc(10 * 1024 * 1024 + 1),
      mimeType: "audio/webm",
    }),
    validateAudioBytes: () => ({ mimeType: "audio/webm" }),
    transcribeAudio: async () => "ok",
    persistTranscriptSegment: async () => {
      throw new Error("not expected");
    },
  });

  const response = await app.inject({
    method: "POST",
    url: "/transcribe",
    payload: { audio: "abc" },
  });

  assert.equal(response.statusCode, 413);
  assert.equal(response.json().error, "Audio payload too large");
  await app.close();
});

test("POST /transcribe returns 400 for malformed JSON", async () => {
  const app = Fastify();
  await registerTranscribeRoutes(app);

  const response = await app.inject({
    method: "POST",
    url: "/transcribe",
    headers: { "content-type": "application/json" },
    payload: '{"audio":',
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.json().error, "Malformed JSON body");
  await app.close();
});

test("POST /transcribe returns clean 5xx when provider throws", async () => {
  const app = Fastify();
  await registerTranscribeRoutes(app, {
    isTranscriptionConfigured: () => true,
    requireSessionToken: () => true,
    isSupabaseConfigured: () => true,
    assertActiveSession: async () => {
      throw new Error("not expected");
    },
    decodeAudioPayload: () => ({
      bytes: Buffer.alloc(4_096),
      mimeType: "audio/webm",
    }),
    validateAudioBytes: () => ({ mimeType: "audio/webm" }),
    transcribeAudio: async () => {
      throw new Error("OpenAI upstream secret stack");
    },
    persistTranscriptSegment: async () => {
      throw new Error("not expected");
    },
  });

  const response = await app.inject({
    method: "POST",
    url: "/transcribe",
    payload: { audio: "abc" },
  });

  assert.equal(response.statusCode, 500);
  const body = response.json() as { error: string; stack?: string };
  assert.equal(body.error, "Transcription provider unavailable");
  assert.equal("stack" in body, false);
  assert.equal(body.error.includes("secret"), false);
  await app.close();
});
