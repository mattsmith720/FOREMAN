import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { assertNoHorizontalOverflow, assertTapTargets } from "./helpers/geometry";
import { MARKETING_VIEWPORTS, VIEWPORTS } from "./matrix";

for (const viewportKey of MARKETING_VIEWPORTS) {
  test.describe(`welcome @ ${viewportKey}`, () => {
    test.use({ viewport: VIEWPORTS[viewportKey] });

    test("geometry + a11y", async ({ page }) => {
      await page.goto("/welcome");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await assertNoHorizontalOverflow(page);
      const tapIssues = await assertTapTargets(page);
      expect(tapIssues).toEqual([]);

      const axe = await new AxeBuilder({ page }).analyze();
      const serious = axe.results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(serious).toEqual([]);
    });
  });
}
