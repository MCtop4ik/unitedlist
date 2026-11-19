import { expect, test } from '@playwright/test';
import { createTestAccount } from './support/account';
import { expectNoHorizontalScroll } from './support/layout';

test('profile tab border matches the tab content and stays usable at 320px', async ({ page, request }) => {
  await createTestAccount(request, page, { prefix: 'TABS' });
  await page.goto('/profile');

  const list = page.locator('.profile-tabs');
  const tabs = list.locator('.tab');
  const listBox = await list.boundingBox();
  const widths = await tabs.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().width));
  expect(listBox).not.toBeNull();
  if (!listBox) return;
  const sum = widths.reduce((total, width) => total + width, 0);
  expect(listBox.width).toBeLessThan(600);
  expect(Math.abs(listBox.width - sum)).toBeLessThanOrEqual(6);

  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/profile');
  await expectNoHorizontalScroll(page);
  await expect(page.getByRole('tab', { name: /COMPLETIONS/ })).toBeVisible();
});
