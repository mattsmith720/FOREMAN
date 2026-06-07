import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTrainingModuleUserPrompt,
  trainingModuleSchema,
} from "./training-module.js";

test("buildTrainingModuleUserPrompt includes job type and session data", () => {
  const prompt = buildTrainingModuleUserPrompt({
    worker: "Dave",
    jobType: "panel_clean",
    notes: "Annual plan visit",
    summary: "Good coverage on lower row.",
    frames: [{ ts: "2026-01-01T00:00:00Z", analysis: { observations: ["Rinsing"] } }],
    coachingEvents: [
      {
        ts: "2026-01-01T00:00:01Z",
        category: "quality",
        message: "Missed lower edge",
        severity: "warning",
      },
    ],
    transcriptSegments: [
      { ts: "2026-01-01T00:00:02Z", text: "Starting final rinse", speaker: "worker" },
    ],
  });

  assert.match(prompt, /panel_clean/);
  assert.match(prompt, /Dave/);
  assert.match(prompt, /Missed lower edge/);
  assert.match(prompt, /Starting final rinse/);
});

test("trainingModuleSchema accepts a valid module shape", () => {
  const result = trainingModuleSchema.safeParse({
    title: "Panel clean · residential visit",
    jobType: "panel_clean",
    worker: "Dave",
    summary: "Demonstrates standard scrub and rinse on a Brisbane array.",
    learningObjectives: ["Complete lower-row coverage", "Document before/after"],
    steps: [
      {
        stepNumber: 1,
        title: "Setup",
        instruction: "Stage hoses and confirm harness before stepping on roof.",
        safetyNote: "Harness clipped before ladder transition.",
      },
      {
        stepNumber: 2,
        title: "Pre-rinse",
        instruction: "Knock off loose debris before scrubbing.",
      },
      {
        stepNumber: 3,
        title: "Final rinse",
        instruction: "Rinse all rows including lower edge.",
        commonMistake: "Leaving streaks on bottom row.",
      },
    ],
    commonMistakes: ["Skipping lower edge"],
    quizQuestions: [
      {
        question: "When do you clip the harness?",
        answer: "Before moving onto the roof.",
      },
      {
        question: "Why pre-rinse?",
        answer: "To remove loose debris before scrubbing.",
      },
    ],
    onboardingScript:
      "Today we follow Dave's panel clean: harness first, pre-rinse, scrub, final rinse including lower edge.",
  });

  assert.ok(result.success, result.success ? "" : JSON.stringify(result.error.issues));
});
