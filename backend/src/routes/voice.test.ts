import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { registerVoiceRoutes } from "./voice.js";

test("POST /voice/speak returns 400 for malformed JSON", async () => {
  const app = Fastify();
  await registerVoiceRoutes(app);

  const response = await app.inject({
    method: "POST",
    url: "/voice/speak",
    headers: { "content-type": "application/json" },
    payload: '{"text":',
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.json().error, "Malformed JSON body");
  await app.close();
});

test("POST /voice/speak returns clean 5xx when provider throws", async () => {
  const app = Fastify();
  await registerVoiceRoutes(app, {
    getConvaiSignedUrl: async () => "https://example.com",
    getElevenLabsAgentId: () => "agent",
    getElevenLabsVoiceId: () => "voice",
    isElevenLabsConfigured: () => true,
    isOpenAiTtsConfigured: () => false,
    synthesizeSpeech: async () => {
      throw new Error("ElevenLabs secret stack trace");
    },
    answerVoiceAdvice: async () => "ok",
  });

  const response = await app.inject({
    method: "POST",
    url: "/voice/speak",
    payload: { text: "hello" },
  });

  assert.equal(response.statusCode >= 500 && response.statusCode < 600, true);
  const body = response.json() as { error: string; stack?: string };
  assert.equal("stack" in body, false);
  assert.equal(body.error.includes("secret"), false);
  await app.close();
});
