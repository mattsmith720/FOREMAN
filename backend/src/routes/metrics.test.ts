import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import Fastify from "fastify";
import { registerMetricsRoutes } from "./metrics.js";

describe("metrics routes", () => {
  const app = Fastify();

  before(async () => {
    await registerMetricsRoutes(app);
  });

  after(async () => {
    await app.close();
  });

  it("GET /metrics/cost-model matches backend config defaults", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/metrics/cost-model",
    });

    assert.equal(response.statusCode, 200);
    const body = response.json() as {
      analyse_usd: number;
      transcribe_usd: number;
    };
    assert.equal(body.analyse_usd, 0.015);
    assert.equal(body.transcribe_usd, 0.0004);
  });

  it("POST /metrics/cue-e2e accepts spoken-cue-attempt latency", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/metrics/cue-e2e",
      payload: { ms: 1234 },
    });

    assert.equal(response.statusCode, 204);
  });
});
