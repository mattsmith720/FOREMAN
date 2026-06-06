import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import Fastify from "fastify";
import { registerIngestRoutes } from "./ingest.js";

// These contract guards fire before any Supabase/DB access, so they run without
// a database. Pin a clean, unconfigured env so the guards are deterministic.
type Snap = {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  INGEST_WEBHOOK_SECRET?: string;
};
const KEYS: (keyof Snap)[] = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "INGEST_WEBHOOK_SECRET",
];
let snap: Snap;

before(() => {
  snap = {};
  for (const key of KEYS) {
    snap[key] = process.env[key];
    delete process.env[key];
  }
});

after(() => {
  for (const key of KEYS) {
    if (snap[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = snap[key];
    }
  }
});

test("POST /ingest/videos/init returns 503 when Supabase is not configured", async () => {
  const app = Fastify({ logger: false });
  await registerIngestRoutes(app);
  const res = await app.inject({
    method: "POST",
    url: "/ingest/videos/init",
    payload: { fileName: "job.mp4", mimeType: "video/mp4" },
  });
  assert.equal(res.statusCode, 503);
  await app.close();
});

test("POST /ingest/drive-webhook returns 401 without the webhook secret", async () => {
  const app = Fastify({ logger: false });
  await registerIngestRoutes(app);
  const res = await app.inject({
    method: "POST",
    url: "/ingest/drive-webhook",
    payload: { fileId: "x", fileName: "a.mp4", mimeType: "video/mp4" },
  });
  assert.equal(res.statusCode, 401);
  await app.close();
});

test("POST /ingest/process-pending returns 401 without the webhook secret", async () => {
  const app = Fastify({ logger: false });
  await registerIngestRoutes(app);
  const res = await app.inject({
    method: "POST",
    url: "/ingest/process-pending",
  });
  assert.equal(res.statusCode, 401);
  await app.close();
});

test("drive-webhook accepts the matching secret then validates the body", async () => {
  process.env.INGEST_WEBHOOK_SECRET = "test-secret";
  process.env.SUPABASE_URL = "";
  const app = Fastify({ logger: false });
  await registerIngestRoutes(app);
  // Correct secret passes auth; empty Supabase config then yields 503 (not 401).
  const res = await app.inject({
    method: "POST",
    url: "/ingest/drive-webhook",
    headers: { "x-ingest-webhook-secret": "test-secret" },
    payload: { fileId: "x", fileName: "a.mp4", mimeType: "video/mp4" },
  });
  assert.equal(res.statusCode, 503);
  delete process.env.INGEST_WEBHOOK_SECRET;
  delete process.env.SUPABASE_URL;
  await app.close();
});
