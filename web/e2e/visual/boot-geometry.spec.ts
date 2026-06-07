import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  assertNoHorizontalOverflow,
  assertTapTargets,
  collectVisibleInteractives,
  findIntersectingPairs,
} from "./helpers/geometry";
import { IN_JOB_VIEWPORTS, VIEWPORTS } from "./matrix";

for (const viewportKey of IN_JOB_VIEWPORTS) {
  const viewport = VIEWPORTS[viewportKey];

  test.describe(`boot/consent @ ${viewportKey}`, () => {
    test.use({ viewport });

    test("geometry + a11y", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      await expect(
        page.getByRole("button", { name: /start job/i }),
      ).toBeVisible();

      await assertNoHorizontalOverflow(page);

      const interactives = await collectVisibleInteractives(page);
      const overlaps = findIntersectingPairs(interactives);
      expect(overlaps, `overlapping interactives: ${JSON.stringify(overlaps)}`).toEqual(
        [],
      );

      const tapIssues = await assertTapTargets(page);
      expect(tapIssues, tapIssues.join("\n")).toEqual([]);

      const axe = await new AxeBuilder({ page })
        .disableRules(["color-contrast"])
        .analyze();
      const serious = axe.results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(serious).toEqual([]);
    });

    test("visual baseline", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      await expect(
        page.getByRole("button", { name: /start job/i }),
      ).toBeVisible();
      await expect(page).toHaveScreenshot(`boot-${viewportKey}.png`, {
        maxDiffPixelRatio: 0.02,
      });
    });
  });
}
