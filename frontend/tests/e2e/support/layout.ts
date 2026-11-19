import { expect, type Locator, type Page } from '@playwright/test';

export async function documentMetrics(page: Page) {
  return page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
}

export async function expectNoHorizontalScroll(page: Page) {
  const metrics = await documentMetrics(page);
  expect(metrics.scrollWidth, `document scrollWidth ${metrics.scrollWidth} exceeds viewport ${metrics.innerWidth}`).toBeLessThanOrEqual(metrics.innerWidth + 1);
  expect(metrics.bodyScrollWidth, `body scrollWidth ${metrics.bodyScrollWidth} exceeds viewport ${metrics.innerWidth}`).toBeLessThanOrEqual(metrics.innerWidth + 1);
}

export async function expectInViewport(locator: Locator, page: Page) {
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  expect(box, 'element has no bounding box').not.toBeNull();
  expect(viewport).not.toBeNull();
  if (!box || !viewport) return;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
}
