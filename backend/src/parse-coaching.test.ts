import assert from "node:assert/strict";
import test from "node:test";
import { parseCoachingResponse } from "./parse-coaching.js";

const validPayload = JSON.stringify({
  observations: ["Worker is on the roof securing rail brackets."],
  installQualityFlags: [
    {
      message: "Ensure fall protection anchor is visible and rated.",
      severity: "warning",
    },
  ],
  salesPitchFeedback: [],
  timeOnTaskNote: "Rail install looks on pace for a standard residential array.",
  nextSteps: ["Confirm rail spacing matches the panel layout plan."],
});

test("parseCoachingResponse accepts valid JSON", () => {
  const result = parseCoachingResponse(validPayload);
  assert.equal(result.observations.length, 1);
  assert.equal(result.installQualityFlags[0]?.severity, "warning");
});

test("parseCoachingResponse strips markdown fences", () => {
  const fenced = `\`\`\`json\n${validPayload}\n\`\`\``;
  const result = parseCoachingResponse(fenced);
  assert.equal(result.timeOnTaskNote.length > 0, true);
});

test("parseCoachingResponse rejects invalid shape", () => {
  assert.throws(() => parseCoachingResponse('{"observations":[]}'));
});
