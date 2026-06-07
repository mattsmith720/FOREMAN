import type { Page } from "@playwright/test";

export const MOCK_SESSION_ID = "e2e-session-001";

export const MOCK_COACHING = {
  observations: ["Tech rinsing lower panel row"],
  installQualityFlags: [],
  salesPitchFeedback: [],
  timeOnTaskNote: "",
  nextSteps: ["Rinse lower row before moving ladder"],
  visualCallouts: [],
  spokenCue: {
    say: "Rinse lower row before moving ladder",
    speak: true,
    severity: "warning",
  },
};

export const MOCK_STOP_RESPONSE = {
  session: {
    id: MOCK_SESSION_ID,
    started_at: "2026-06-06T10:00:00.000Z",
    ended_at: "2026-06-06T10:05:00.000Z",
    worker: "Test Tech",
    job_type: "panel_clean",
    notes: null,
    summary:
      "Panel clean looks thorough. Lower row rinsed before ladder move.",
  },
  stored: {
    frames: 2,
    coaching_events: 1,
    labels: 0,
    transcript_segments: 1,
  },
};

export const MOCK_TRAINING_MODULE = {
  title: "Panel clean — rinse sequence",
  jobType: "panel_clean",
  worker: "Test Tech",
  summary: "How to rinse lower rows safely before repositioning.",
  learningObjectives: ["Rinse before ladder moves"],
  steps: [
    {
      stepNumber: 1,
      title: "Lower row rinse",
      instruction: "Rinse the lowest row before moving the ladder.",
    },
  ],
  commonMistakes: ["Skipping rinse on shaded rows"],
  quizQuestions: [
    { question: "When do you rinse?", answer: "Before moving the ladder." },
  ],
  onboardingScript: "Today we rinse lower rows first.",
};

/** Mock backend proxies used by the field app lifecycle. */
export async function installFieldAppMocks(page: Page): Promise<void> {
  await page.route("**/api/health**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });

  await page.route("**/api/metrics/cost-model**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        analyse_usd: 0.015,
        transcribe_usd: 0.0004,
      }),
    });
  });

  await page.route("**/api/sessions/start**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        session: {
          id: MOCK_SESSION_ID,
          started_at: new Date().toISOString(),
          ended_at: null,
          worker: "Test Tech",
          job_type: "panel_clean",
          notes: null,
          summary: null,
        },
        token: "mock-session-token",
      }),
    });
  });

  await page.route("**/api/analyse**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ coaching: MOCK_COACHING }),
    });
  });

  await page.route("**/api/transcribe**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ text: "Checking the lower row now." }),
    });
  });

  await page.route(`**/api/sessions/${MOCK_SESSION_ID}/stop**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_STOP_RESPONSE),
    });
  });

  await page.route(
    `**/api/sessions/${MOCK_SESSION_ID}/training-module**`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ module: MOCK_TRAINING_MODULE }),
      });
    },
  );
}

export async function startMockedJob(page: Page): Promise<void> {
  await page.goto("/");
  await page
    .getByRole("button", { name: /I understand — start job|Start job/i })
    .click();
  await page.getByTestId("recording-indicator").waitFor({ state: "visible" });
}
