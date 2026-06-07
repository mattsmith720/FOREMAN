#!/usr/bin/env npx tsx
/**
 * LP3 — capture real product screenshots from live demo mode.
 * Usage: DEMO_BASE=https://foreman-phi.vercel.app npx tsx scripts/capture-demo-assets.ts
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.env.DEMO_BASE ?? "https://foreman-phi.vercel.app";
const OUT = join(import.meta.dirname, "..", "public", "assets");

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();

  await page.goto(`${BASE}/demo`, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(OUT, "feature-evidence.png"), fullPage: false });
  await page.screenshot({ path: join(OUT, "hero-poster.png"), fullPage: false });

  await page.getByRole("button", { name: /start demo job/i }).click();

  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(700);
    const capture = page.getByRole("button", { name: /capture shot/i });
    if (await capture.isVisible().catch(() => false)) {
      if (i === 2) {
        await page.screenshot({ path: join(OUT, "feature-coaching.png"), fullPage: false });
      }
      await capture.click();
      await page.waitForTimeout(900);
    }
    const next = page.getByRole("button", { name: /next shot|fix and continue|continue/i });
    if (await next.isVisible().catch(() => false)) {
      await next.click();
    }
  }

  await page.waitForSelector("text=Demo complete", { timeout: 30_000 }).catch(() => undefined);
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT, "feature-pack.png"), fullPage: false });

  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(OUT, "feature-dashboard.png"), fullPage: false });

  await context.close();
  await browser.close();

  console.log(`Assets written to ${OUT}`);
  console.log("Rename the Playwright video in public/assets/ to hero-demo.webm if present.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
