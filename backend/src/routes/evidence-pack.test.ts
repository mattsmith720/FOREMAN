import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { registerEvidencePackRoutes } from "./evidence-pack.js";

const SESSION_ID = "f5e2d446-71e8-48cf-b13a-2f3ecf781f40";

test("GET /sessions/:id/evidence-pack returns zip attachment", async () => {
  const app = Fastify();
  const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

  await registerEvidencePackRoutes(app, {
    isSupabaseConfigured: () => true,
    requireSessionToken: () => true,
    buildEvidencePackZip: async () => zip,
  });

  const response = await app.inject({
    method: "GET",
    url: `/sessions/${SESSION_ID}/evidence-pack`,
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["content-type"], "application/zip");
  assert.match(
    String(response.headers["content-disposition"]),
    /foreman-evidence-f5e2d446\.zip/,
  );
  assert.ok(response.rawPayload.equals(zip));
  await app.close();
});

test("GET /sessions/:id/evidence-pack returns 400 for invalid session id", async () => {
  const app = Fastify();
  await registerEvidencePackRoutes(app, {
    isSupabaseConfigured: () => true,
    requireSessionToken: () => true,
    buildEvidencePackZip: async () => Buffer.alloc(0),
  });

  const response = await app.inject({
    method: "GET",
    url: "/sessions/not-a-uuid/evidence-pack",
  });

  assert.equal(response.statusCode, 400);
  await app.close();
});
