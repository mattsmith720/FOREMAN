import type { Locator, Page } from "@playwright/test";

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface InteractiveElement {
  selector: string;
  box: Box;
}

function intersects(a: Box, b: Box): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

export async function collectVisibleInteractives(
  page: Page,
): Promise<InteractiveElement[]> {
  return page.evaluate(() => {
    const nodes = Array.from(
      document.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="button"]:not([aria-disabled="true"])',
      ),
    );
    const out: InteractiveElement[] = [];
    for (const node of nodes) {
      const el = node as HTMLElement;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
        continue;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) {
        continue;
      }
      out.push({
        selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ""),
        box: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
      });
    }
    return out;
  });
}

export function findIntersectingPairs(
  elements: InteractiveElement[],
): Array<{ a: string; b: string }> {
  const pairs: Array<{ a: string; b: string }> = [];
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const left = elements[i]!;
      const right = elements[j]!;
      if (intersects(left.box, right.box)) {
        pairs.push({ a: left.selector, b: right.selector });
      }
    }
  }
  return pairs;
}

export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
  if (overflow) {
    throw new Error("Horizontal overflow detected");
  }
}

export async function assertTapTargets(
  page: Page,
  primaryMin = 48,
  secondaryMin = 44,
  gapMin = 8,
): Promise<string[]> {
  const issues: string[] = [];
  const elements = await collectVisibleInteractives(page);
  for (const el of elements) {
    const min = el.selector.includes("toolbar") ? secondaryMin : primaryMin;
    if (el.box.width < min - 0.5 || el.box.height < min - 0.5) {
      issues.push(
        `Tap target too small (${el.selector}): ${Math.round(el.box.width)}×${Math.round(el.box.height)}px`,
      );
    }
  }
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i]!;
      const b = elements[j]!;
      if (!intersects(a.box, b.box)) {
        continue;
      }
      const overlapW =
        Math.min(a.box.x + a.box.width, b.box.x + b.box.width) -
        Math.max(a.box.x, b.box.x);
      const overlapH =
        Math.min(a.box.y + a.box.height, b.box.y + b.box.height) -
        Math.max(a.box.y, b.box.y);
      if (overlapW > 2 && overlapH > 2) {
        issues.push(`Intersecting interactives: ${a.selector} × ${b.selector}`);
      }
    }
  }
  return issues;
}

export async function assertInViewport(page: Page, locator: Locator): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) {
    return;
  }
  const viewport = page.viewportSize();
  if (!viewport) {
    return;
  }
  if (
    box.x < -1 ||
    box.y < -1 ||
    box.x + box.width > viewport.width + 1 ||
    box.y + box.height > viewport.height + 1
  ) {
    throw new Error(`Element clipped by viewport: ${await locator.evaluate((el) => el.className)}`);
  }
}
