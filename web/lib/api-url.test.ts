import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { SAME_ORIGIN_API_BASE, getApiUrl } from "./api-url.js";

const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

afterEach(() => {
  if (typeof originalApiUrl === "string") {
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  } else {
    delete process.env.NEXT_PUBLIC_API_URL;
  }
});

describe("getApiUrl", () => {
  it("forces same-origin API base for absolute configured URLs", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://render.example.com";
    assert.equal(getApiUrl(), SAME_ORIGIN_API_BASE);
  });

  it("keeps same-origin relative API path", () => {
    process.env.NEXT_PUBLIC_API_URL = "/api/";
    assert.equal(getApiUrl(), SAME_ORIGIN_API_BASE);
  });
});
