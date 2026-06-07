import { test, expect } from "@playwright/test";

test.describe("landing accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", {
        name: /coaching and training from maintenance jobs/i,
      }),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("has skip link or main landmark", async ({ page }) => {
    const skipLink = page.getByRole("link", { name: /skip to (main|content)/i });
    const main = page.locator("main");

    const hasSkip = (await skipLink.count()) > 0;
    const hasMain = (await main.count()) > 0;

    expect(hasSkip || hasMain).toBe(true);
    if (hasMain) {
      await expect(main.first()).toBeVisible();
    }
  });

  test("heading order: exactly one h1", async ({ page }) => {
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(/coaching and training from maintenance jobs/i);

    const headings = await page.locator("h1, h2, h3, h4, h5, h6").evaluateAll((els) =>
      els.map((el) => Number(el.tagName.slice(1))),
    );
    let prior = 0;
    for (const level of headings) {
      if (prior > 0) {
        expect(level).toBeLessThanOrEqual(prior + 1);
      }
      prior = level;
    }
  });

  test("buttons have accessible names", async ({ page }) => {
    const buttons = page.getByRole("button");
    await expect(buttons.first()).toBeVisible();
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toHaveAccessibleName(/.+/);
    }
  });

  test("focus styles smoke: keyboard focus shows visible indicator", async ({ page }) => {
    const hasVisibleFocusRing = (el: Element) => {
      const styles = getComputedStyle(el);
      const outlineVisible =
        styles.outlineStyle !== "none" && parseFloat(styles.outlineWidth) > 0;
      const shadowVisible = styles.boxShadow !== "none" && styles.boxShadow.length > 0;
      return outlineVisible || shadowVisible;
    };

    await expect(page.getByRole("link", { name: /skip to content/i })).toBeVisible();

    const interactive = page.locator(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    await expect(interactive.first()).toBeVisible();
    const count = await interactive.count();
    expect(count).toBeGreaterThan(0);

    let foundFocusRing = false;
    for (let i = 0; i < Math.min(count, 24); i++) {
      await page.keyboard.press("Tab");
      const focused = page.locator(":focus-visible");
      if ((await focused.count()) === 0) continue;

      const ring = await focused.first().evaluate(hasVisibleFocusRing);
      if (ring) {
        foundFocusRing = true;
        break;
      }
    }

    expect(foundFocusRing).toBe(true);
  });
});
