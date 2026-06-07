import { test, expect } from "@playwright/test";
import {
  MOCK_SESSION_ID,
  MOCK_TRAINING_MODULE,
} from "./helpers/mock-field-app";

test("ops lists sessions and links to training", async ({ page }) => {
  await page.route("**/api/ops/sessions**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessions: [
          {
            id: MOCK_SESSION_ID,
            started_at: "2026-06-06T10:00:00.000Z",
            ended_at: "2026-06-06T10:05:00.000Z",
            worker: "Test Tech",
            job_type: "panel_clean",
            consent_at: "2026-06-06T10:00:00.000Z",
            frame_count: 2,
            transcript_count: 1,
            est_cost_usd: 0.03,
            summary_snippet: "Panel clean looks thorough.",
            stuck: false,
          },
        ],
        totals: { frames: 2, transcripts: 1, est_cost_usd: 0.03 },
      }),
    });
  });

  await page.route("**/api/ops/ingest**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ videos: [] }),
    });
  });

  await page.goto("/ops");
  await page.getByLabel("Ops password").fill("test-pass");
  await page.getByRole("button", { name: "Open" }).click();

  await expect(page.getByText("Test Tech")).toBeVisible();

  const trainingLink = page.getByRole("link", { name: "Training" });
  await expect(trainingLink).toBeVisible();
  await expect(trainingLink).toHaveAttribute(
    "href",
    `/training?session=${MOCK_SESSION_ID}`,
  );
});

test("training pre-fills session id from query", async ({ page }) => {
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

  await page.goto(`/training?session=${MOCK_SESSION_ID}`);
  await expect(page.getByLabel("Session id")).toHaveValue(MOCK_SESSION_ID);

  await page.getByRole("button", { name: "Generate training module" }).click();
  await expect(page.getByRole("heading", { name: MOCK_TRAINING_MODULE.title })).toBeVisible();
});
