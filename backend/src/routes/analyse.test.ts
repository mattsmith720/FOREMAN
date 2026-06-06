import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import type { CoachingResponse } from "@foreman/shared";
import { registerAnalyseRoutes } from "./analyse.js";

const minimalCoaching: CoachingResponse = {
  observations: ["Looks good."],
  installQualityFlags: [],
  salesPitchFeedback: [],
  timeOnTaskNote: "On pace.",
  nextSteps: ["Continue install."],
  visualCallouts: [],
};

test("POST /analyse returns 413 for oversize image payload", async () => {
  const app = Fastify();
  await registerAnalyseRoutes(app, {
    isAnalysisConfigured: () => true,
    decodeImagePayload: () => ({
      base64: Buffer.alloc(5 * 1024 * 1024 + 1).toString("base64"),
      mediaType: "image/jpeg",
    }),
    validateImageBytes: () => ({ mediaType: "image/jpeg" }),
    requireSessionToken: () => true,
    isSupabaseConfigured: () => true,
    assertActiveSession: async () => {
      throw new Error("not expected");
    },
    getRecentSessionTranscript: async () => [],
    analyseImage: async () => minimalCoaching,
    persistFrame: async () => ({ frameId: "f", storageRef: "s" }),
  });

  const response = await app.inject({
    method: "POST",
    url: "/analyse",
    payload: { image: "abc" },
  });

  assert.equal(response.statusCode, 413);
  assert.equal(response.json().error, "Image payload too large");
  await app.close();
});

test("POST /analyse returns 400 for malformed JSON", async () => {
  const app = Fastify();
  await registerAnalyseRoutes(app);

  const response = await app.inject({
    method: "POST",
    url: "/analyse",
    headers: { "content-type": "application/json" },
    payload: '{"image":',
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.json().error, "Malformed JSON body");
  await app.close();
});

test("POST /analyse returns clean 5xx when provider throws", async () => {
  const app = Fastify();
  await registerAnalyseRoutes(app, {
    isAnalysisConfigured: () => true,
    decodeImagePayload: () => ({
      base64: Buffer.from("image").toString("base64"),
      mediaType: "image/jpeg",
    }),
    validateImageBytes: () => ({ mediaType: "image/jpeg" }),
    requireSessionToken: () => true,
    isSupabaseConfigured: () => true,
    assertActiveSession: async () => {
      throw new Error("not expected");
    },
    getRecentSessionTranscript: async () => [],
    analyseImage: async () => {
      throw new Error("provider stack trace secret");
    },
    persistFrame: async () => ({ frameId: "f", storageRef: "s" }),
  });

  const response = await app.inject({
    method: "POST",
    url: "/analyse",
    payload: { image: "abc" },
  });

  assert.equal(response.statusCode, 500);
  const body = response.json() as { error: string; stack?: string };
  assert.equal(body.error, "Analysis provider unavailable");
  assert.equal("stack" in body, false);
  assert.equal(body.error.includes("secret"), false);
  await app.close();
});
