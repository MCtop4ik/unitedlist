import { expect, test } from '@playwright/test';

test('catalog renders within the 2-second budget', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /GRIEF/i })).toBeVisible();
  const started = Date.now();
  await page.goto('/');
  await expect(page.getByRole('button', { name: /GRIEF/i })).toBeVisible();
  expect(Date.now() - started).toBeLessThan(2000);
});

test('zone switch completes within the 2-second budget', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /GRIEF/i })).toBeVisible();
  const started = Date.now();
  await page.getByRole('tab', { name: 'POINTERCRATE' }).click();
  await expect(page.getByRole('tab', { name: /MAIN/i })).toBeVisible();
  expect(Date.now() - started).toBeLessThan(2000);
});
