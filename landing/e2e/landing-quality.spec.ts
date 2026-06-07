import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const VIEWPORTS = [
  { name: "android", width: 360, height: 800 },
  { name: "iphone14", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

const MOBILE_390 = { width: 390, height: 844 } as const;

const NAV_LINKS = [
  { label: "Problem", href: "#pain", section: "#pain" },
  { label: "Flow", href: "#how-it-works", section: "#how-it-works" },
  { label: "Product", href: "#solution", section: "#solution" },
  { label: "Services", href: "#services", section: "#services" },
  { label: "FAQ", href: "#faq", section: "#faq" },
] as const;

async function assertNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(false);
}

function heroCtaRow(page: Page) {
  return page.locator("header.lp-hero .lp-cta-row");
}

function bookDemoCta(page: Page, root = heroCtaRow(page)) {
  return root
    .getByRole("link", { name: /book a demo/i })
    .or(root.getByRole("button", { name: /book a demo/i }));
}

async function openMobileMenu(page: Page) {
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.locator(".lp-mobile-nav-panel[data-open='true']")).toBeVisible();
}

for (const vp of VIEWPORTS) {
  test.describe(`landing @ ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("sections present + no horizontal overflow", async ({ page }) => {
      await page.goto("/");
      await expect(
        page.getByRole("heading", {
          name: /every job your best techs do becomes the training/i,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: /scaling a maintenance crew shouldn't mean scaling your training load/i,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /training layer for your maintenance business/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /frequently asked questions/i }),
      ).toBeVisible();

      await assertNoHorizontalScroll(page);
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

test.describe("landing navigation", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("primary nav links target in-page sections", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });

    for (const link of NAV_LINKS) {
      await expect(nav.getByRole("link", { name: link.label })).toHaveAttribute(
        "href",
        link.href,
      );
    }

    for (const link of NAV_LINKS) {
      await nav.getByRole("link", { name: link.label }).click();
      await expect(page.locator(link.section)).toBeInViewport();
    }
  });

  test("pilot strip links to book section", async ({ page }) => {
    await page.goto("/");
    const strip = page.locator(".lp-pilot-strip");
    await expect(strip.getByRole("link", { name: /book a demo/i })).toHaveAttribute(
      "href",
      "#book",
    );
  });
});

test.describe("landing hero", () => {
  test("hero CTAs are present", async ({ page }) => {
    await page.goto("/");
    const ctaRow = heroCtaRow(page);

    await expect(bookDemoCta(page, ctaRow)).toBeVisible();
    await expect(
      ctaRow.getByRole("link", { name: /see a maintenance visit/i }),
    ).toBeVisible();
    await expect(page.locator("#book")).toBeAttached();
  });
});

test.describe("landing FAQ", () => {
  test("FAQ items expand and collapse", async ({ page }) => {
    await page.goto("/");
    const faq = page.locator("#faq .lp-faq");

    const first = faq.getByRole("button", { name: "What is Foreman?" });
    const second = faq.getByRole("button", { name: "Do I need smart glasses?" });

    await expect(first).toHaveAttribute("aria-expanded", "true");
    await expect(faq.getByText(/AI layer for solar maintenance crews/)).toBeVisible();

    await second.scrollIntoViewIfNeeded();
    await second.click();
    await expect(faq.getByText(/phone-first today/)).toBeVisible();
    await expect(second).toHaveAttribute("aria-expanded", "true");
    await expect(first).toHaveAttribute("aria-expanded", "false");

    await second.click();
    await expect(faq.getByText(/phone-first today/)).toBeHidden();
    await expect(second).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("landing @ mobile 390px", () => {
  test.use({ viewport: MOBILE_390 });

  test("layout fits 390px viewport without horizontal scroll", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
    await assertNoHorizontalScroll(page);
  });

  test("mobile menu exposes nav links at 390px", async ({ page }) => {
    await page.goto("/");
    await openMobileMenu(page);

    const mobileNav = page.getByRole("navigation", { name: "Mobile" });
    for (const link of NAV_LINKS) {
      await expect(mobileNav.getByRole("link", { name: link.label })).toHaveAttribute(
        "href",
        link.href,
      );
    }
  });

  test("hero CTAs visible at 390px", async ({ page }) => {
    await page.goto("/");
    const ctaRow = heroCtaRow(page);

    await expect(bookDemoCta(page, ctaRow)).toBeVisible();
    await expect(
      ctaRow.getByRole("link", { name: /see a maintenance visit/i }),
    ).toBeVisible();
  });
});

test("lead API validates payload", async ({ request }) => {
  const res = await request.post("/api/leads", {
    data: { name: "", company: "x", crewSize: "1", email: "not-an-email" },
  });
  expect(res.status()).toBe(400);
});
