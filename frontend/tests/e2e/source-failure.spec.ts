import { expect, test } from '@playwright/test';

const API = 'http://localhost:3001/api';

test('source failure keeps stale catalog and retry recovers', async ({ request, page }) => {
  const toggle = await request.post(`${API}/source-status/aredl/toggle`);
  expect(toggle.ok()).toBe(true);
  try {
    await page.goto('/');
    await expect(page.getByRole('alert')).toContainText('SOURCE UNAVAILABLE');
    await expect(page.getByRole('button', { name: /GRIEF/i })).toBeVisible();
    await page.getByRole('button', { name: /GRIEF/i }).click();
    await expect(page.getByText(/POINTERCRATE \/ verified/i).first()).toBeVisible();
    await page.keyboard.press('Escape');

    await request.post(`${API}/source-status/aredl/toggle`);
    await page.getByRole('button', { name: /RETRY/ }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /GRIEF/i })).toBeVisible();
  } finally {
    const status = await request.get(`${API}/source-status`);
    const aredl = (await status.json()).data.find((row: { source: string }) => row.source === 'aredl');
    if (aredl && !aredl.ok) await request.post(`${API}/source-status/aredl/toggle`);
  }
});
