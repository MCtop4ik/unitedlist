import { expect, test } from '@playwright/test';
import { expectInViewport } from './support/layout';

test('filter actions stay reachable on a short screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.getByRole('button', { name: /FILTERS/i }).click();

  const apply = page.getByRole('button', { name: 'APPLY' });
  const reset = page.getByRole('button', { name: 'RESET' });
  await reset.scrollIntoViewIfNeeded();
  await expectInViewport(reset, page);
  await apply.scrollIntoViewIfNeeded();
  await expectInViewport(apply, page);
  await apply.click();
  await expect(page.getByRole('button', { name: /FILTERS/i })).toBeVisible();
});
