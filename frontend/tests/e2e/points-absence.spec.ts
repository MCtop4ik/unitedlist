import { expect, test } from '@playwright/test';

const API = 'http://localhost:3001/api';

test('profiles and completion lists contain no points, rank, or skill status', async ({ page, request }) => {
  const suffix = Date.now().toString().slice(-6);
  const displayName = `NOPTS_${suffix}`;
  const registered = await request.post(`${API}/auth/register`, {
    data: { email: `nopts-${suffix}@example.com`, displayName, password: 'correct horse battery' },
  });
  const payload = await registered.json();
  await request.post(`${API}/completions`, {
    headers: { Authorization: `Bearer ${payload.token}` },
    data: { levelId: 149992717 },
  });

  await page.goto('/');
  await page.evaluate((session) => localStorage.setItem('gdul.session', JSON.stringify(session)), {
    token: payload.token,
    expiresAt: payload.expiresAt,
    player: payload.data,
  });
  await page.reload();

  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: displayName })).toBeVisible();
  await expect(page.getByText('COMPLETIONS', { exact: true })).toBeVisible();
  await expect(page.getByText('BEST CLEAR', { exact: true })).toBeVisible();
  await expect(page.getByText('POINTS', { exact: true })).toHaveCount(0);
  await expect(page.getByText('SITE RANK', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/ROOKIE|SKILLED|EXTREME|LEGEND/)).toHaveCount(0);

  await page.goto('/');
  await page.getByRole('button', { name: /GRIEF/i }).click();
  const dialog = page.getByRole('dialog');
  const completions = dialog.locator('.completion-list');
  await expect(completions.getByText('ACCOUNT', { exact: true }).first()).toBeVisible();
  await expect(completions.getByText(/\bPOINTS\b|\bROOKIE\b|\bSKILLED\b|\bLEGEND\b/)).toHaveCount(0);
  await expect(dialog.getByText(/PROGRESS AWARDS NO POINTS/i)).toHaveCount(0);
});
