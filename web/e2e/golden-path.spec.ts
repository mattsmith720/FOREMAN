import { test, expect } from "@playwright/test";
import {
  installFieldAppMocks,
  MOCK_COACHING,
  MOCK_STOP_RESPONSE,
  startMockedJob,
} from "./helpers/mock-field-app";

test.beforeEach(async ({ page }) => {
  await installFieldAppMocks(page);
});

test("home shows consent before coaching", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "I understand — start job" }),
  ).toBeVisible();
});

test("full field lifecycle with mocked API", async ({ page }) => {
  await startMockedJob(page);

  await expect(page.getByTestId("recording-indicator")).toContainText("REC");

  await expect(page.locator(".coach-card-text")).toContainText(
    MOCK_COACHING.spokenCue.say,
    { timeout: 15_000 },
  );

  await page.getByRole("button", { name: "End job" }).click();

  await expect(
    page.getByRole("heading", { name: "Job complete" }),
  ).toBeVisible();
  await expect(page.locator(".summary-text")).toContainText(
    MOCK_STOP_RESPONSE.session.summary!,
  );
  await expect(page.locator(".summary-stats-line")).toContainText("2 frames");
  await expect(page.locator(".summary-stats-line")).toContainText(
    "1 coaching cue",
  );
});
