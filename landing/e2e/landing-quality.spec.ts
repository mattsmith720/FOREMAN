import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const VIEWPORTS = [
  { name: "android", width: 360, height: 800 },
  { name: "iphone14", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

for (const vp of VIEWPORTS) {
  test.describe(`landing @ ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("sections present + no horizontal overflow", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("heading", { name: /your evidence and your coaching/i })).toBeVisible();
      await expect(page.getByRole("heading", { name: /solar compliance shouldn't be this hard/i })).toBeVisible();
      await expect(page.getByRole("heading", { name: /compliance layer for your crew/i })).toBeVisible();
      await expect(page.getByRole("heading", { name: /frequently asked questions/i })).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(overflow).toBe(false);
    });

    test("axe serious/critical = 0", async ({ page }) => {
      await page.goto("/");
      const results = await new AxeBuilder({ page }).analyze();
      const bad = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(bad).toEqual([]);
    });
  });
}

test("lead API validates payload", async ({ request }) => {
  const res = await request.post("/api/leads", {
    data: { name: "", company: "x", crewSize: "1", email: "not-an-email" },
  });
  expect(res.status()).toBe(400);
});
