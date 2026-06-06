import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { withRetry } from "./retry.js";

describe("withRetry", () => {
  it("retries once for retryable response state", async () => {
    let attempts = 0;

    const response = await withRetry(
      async () => {
        attempts += 1;
        if (attempts === 1) {
          return new Response("retry", { status: 503 });
        }
        return new Response("ok", { status: 200 });
      },
      {
        retries: 1,
        baseDelayMs: 0,
        shouldRetryResult: (result) => result.status >= 500,
      },
    );

    assert.equal(attempts, 2);
    assert.equal(response.status, 200);
  });

  it("does not retry when retries are disabled", async () => {
    let attempts = 0;

    await assert.rejects(
      withRetry(
        async () => {
          attempts += 1;
          throw new TypeError("network down");
        },
        {
          retries: 0,
          shouldRetryError: () => true,
        },
      ),
      /network down/,
    );

    assert.equal(attempts, 1);
  });
});
