import { test, expect } from "@playwright/test";

test("home shows consent before coaching", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "I understand — start coaching" }),
  ).toBeVisible();
});
