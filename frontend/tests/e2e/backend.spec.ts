import { expect, test } from '@playwright/test';

const API = 'http://localhost:3001/api';

test('frontend works against the real backend with account sessions', async ({ page, request }) => {
  const suffix = Date.now().toString().slice(-6);
  const displayName = `REAL_${suffix}`;
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/profile');
  await page.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('EMAIL').fill(`real-${suffix}@example.com`);
  await dialog.getByLabel('DISPLAY NAME').fill(displayName);
  await dialog.getByLabel('PASSWORD').fill('correct horse battery');
  await dialog.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  await expect(page.getByRole('heading', { name: displayName })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: displayName })).toBeVisible();

  await page.goto('/');
  await page.getByRole('button', { name: /GRIEF/i }).click();
  await page.getByRole('button', { name: 'RECORD COMPLETION' }).click();
  await page.getByRole('button', { name: 'CONFIRM COMPLETION' }).click();
  await expect(page.getByRole('button', { name: 'ALREADY COMPLETED' })).toBeDisabled();

  await page.goto('/leaderboard');
  await expect(page.getByText(displayName)).toBeVisible();

  const unauthorized = await request.post(`${API}/completions`, { data: { levelId: 149992717 } });
  expect(unauthorized.status()).toBe(401);
});
