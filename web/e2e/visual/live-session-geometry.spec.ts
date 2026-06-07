import { test, expect } from "@playwright/test";
import {
  assertNoHorizontalOverflow,
  assertTapTargets,
  collectVisibleInteractives,
  findIntersectingPairs,
} from "./helpers/geometry";
import { installFieldAppMocks, startMockedJob } from "../helpers/mock-field-app";

test.describe("live session geometry @ iphone14", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await installFieldAppMocks(page);
  });

  test("geometry while recording", async ({ page }) => {
    await startMockedJob(page);
    await expect(page.getByRole("button", { name: "End job" })).toBeVisible();

    await assertNoHorizontalOverflow(page);

    const interactives = await collectVisibleInteractives(page);
    const overlaps = findIntersectingPairs(interactives);
    expect(
      overlaps,
      `overlapping interactives: ${JSON.stringify(overlaps)}`,
    ).toEqual([]);

    const tapIssues = await assertTapTargets(page);
    expect(tapIssues, tapIssues.join("\n")).toEqual([]);
  });
});
