import assert from "node:assert/strict";
import test from "node:test";
import type Anthropic from "@anthropic-ai/sdk";
import { analyseImage } from "./analyse.js";
import { parseCoachingResponseWithFallback } from "./parse-coaching.js";

test("analyseImage falls back when model output is not valid coaching JSON", async () => {
  let calls = 0;
  const fakeClient = {
    messages: {
      create: async () => {
        calls += 1;
        return {
          content: [
            {
              type: "text",
              text: '{"not":"coaching"}',
            },
          ],
        };
      },
    },
  } as unknown as Anthropic;

  const coaching = await analyseImage(
    {
      base64: Buffer.from("fake-image").toString("base64"),
      mediaType: "image/jpeg",
    },
    {
      createClient: () => fakeClient,
      parseResponse: parseCoachingResponseWithFallback,
    },
  );

  assert.equal(calls, 3);
  assert.equal(coaching.installQualityFlags.length, 0);
  assert.equal(coaching.salesPitchFeedback.length, 0);
  assert.equal(coaching.nextSteps.length > 0, true);
});
