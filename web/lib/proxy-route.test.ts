import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { POST as analysePost } from "../app/api/analyse/route.js";

const originalFetch = globalThis.fetch;
const originalBackendUrl = process.env.BACKEND_URL;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (typeof originalBackendUrl === "string") {
    process.env.BACKEND_URL = originalBackendUrl;
  } else {
    delete process.env.BACKEND_URL;
  }
});

describe("analyse route proxy errors", () => {
  it("returns structured json error when backend fetch fails", async () => {
    process.env.BACKEND_URL = "http://127.0.0.1:8080";
    globalThis.fetch = async () => {
      throw new TypeError("backend unavailable");
    };

    const request = new Request("http://localhost/api/analyse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image: "data:image/jpeg;base64,abc" }),
    });

    const response = await analysePost(request);
    const body = (await response.json()) as { ok?: boolean; error?: string };

    assert.equal(response.status, 502);
    assert.equal(body.ok, false);
    assert.equal(body.error, "Backend request failed");
  });
});
