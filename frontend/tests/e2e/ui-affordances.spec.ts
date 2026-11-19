import { expect, test } from '@playwright/test';

test('sort trigger and menu options expose a pointer cursor', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: /SORT \// });
  expect(await trigger.evaluate((element) => getComputedStyle(element).cursor)).toBe('pointer');
  await trigger.click();
  const options = page.getByRole('menuitem');
  await expect(options).toHaveCount(4);
  for (const option of await options.all()) {
    expect(await option.evaluate((element) => getComputedStyle(element).cursor)).toBe('pointer');
  }
});
