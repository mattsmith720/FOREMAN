import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { SUMMARISING_PLACEHOLDER } from "../stuck-summary.js";
import { registerSessionRoutes } from "./sessions.js";

const SESSION_ID = "f5e2d446-71e8-48cf-b13a-2f3ecf781f40";

test("POST /sessions/start returns 400 for malformed JSON", async () => {
  const app = Fastify();
  await registerSessionRoutes(app);

  const response = await app.inject({
    method: "POST",
    url: "/sessions/start",
    headers: { "content-type": "application/json" },
    payload: '{"worker":',
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.json().error, "Malformed JSON body");
  await app.close();
});

test("POST /sessions/start returns clean 5xx when storage provider throws", async () => {
  const app = Fastify();
  await registerSessionRoutes(app, {
    isSupabaseConfigured: () => true,
    createSession: async () => {
      throw new Error("db stack trace with secret");
    },
    signSessionToken: () => "token",
    requireSessionToken: () => true,
    getSession: async () => {
      throw new Error("not expected");
    },
    getSessionCounts: async () => ({
      frames: 0,
      coaching_events: 0,
      labels: 0,
      transcript_segments: 0,
    }),
    claimSessionEnd: async () => null,
    needsSummaryRetry: () => false,
    completeSessionSummary: async () => ({
      id: "f5e2d446-71e8-48cf-b13a-2f3ecf781f40",
      started_at: new Date().toISOString(),
      ended_at: null,
      worker: null,
      job_type: null,
      notes: null,
      summary: null,
    }),
  });

  const response = await app.inject({
    method: "POST",
    url: "/sessions/start",
    payload: { worker: "Jamie" },
  });

  assert.equal(response.statusCode, 500);
  const body = response.json() as { error: string; stack?: string };
  assert.equal(body.error, "Session storage unavailable");
  assert.equal("stack" in body, false);
  assert.equal(body.error.includes("secret"), false);
  await app.close();
});

test("POST /sessions/:id/stop retries stuck summarising placeholder", async () => {
  const app = Fastify();
  let summaryCalls = 0;

  await registerSessionRoutes(app, {
    isSupabaseConfigured: () => true,
    createSession: async () => {
      throw new Error("not expected");
    },
    signSessionToken: () => "token",
    requireSessionToken: () => true,
    getSession: async () => ({
      id: SESSION_ID,
      started_at: "2026-06-05T09:00:00Z",
      ended_at: "2026-06-05T10:00:00Z",
      worker: null,
      job_type: null,
      notes: null,
      summary: SUMMARISING_PLACEHOLDER,
    }),
    getSessionCounts: async () => ({
      frames: 2,
      coaching_events: 1,
      labels: 1,
      transcript_segments: 0,
    }),
    claimSessionEnd: async () => null,
    needsSummaryRetry: (session) =>
      Boolean(session.ended_at && session.summary === SUMMARISING_PLACEHOLDER),
    completeSessionSummary: async () => {
      summaryCalls += 1;
      return {
        id: SESSION_ID,
        started_at: "2026-06-05T09:00:00Z",
        ended_at: "2026-06-05T10:00:00Z",
        worker: null,
        job_type: null,
        notes: null,
        summary: "Install completed. Panels aligned; customer briefed on monitoring app.",
      };
    },
  });

  const response = await app.inject({
    method: "POST",
    url: `/sessions/${SESSION_ID}/stop`,
  });

  assert.equal(response.statusCode, 200);
  assert.equal(summaryCalls, 1);
  const body = response.json() as {
    session: { summary: string };
    stored: { frames: number };
  };
  assert.equal(
    body.session.summary,
    "Install completed. Panels aligned; customer briefed on monitoring app.",
  );
  assert.equal(body.stored.frames, 2);
  await app.close();
});
