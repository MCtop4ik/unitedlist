import { expect, test } from '@playwright/test';

const API = 'http://localhost:3001/api';

test('account and legacy completions are labeled distinctly', async ({ page, request }) => {
  const suffix = Date.now().toString().slice(-6);
  const displayName = `LABEL_${suffix}`;
  const registered = await request.post(`${API}/auth/register`, {
    data: { email: `label-${suffix}@example.com`, displayName, password: 'correct horse battery' },
  });
  const payload = await registered.json();
  await request.post(`${API}/completions`, {
    headers: { Authorization: `Bearer ${payload.token}` },
    data: { levelId: 119544028 },
  });

  await page.goto('/');
  await page.evaluate((session) => localStorage.setItem('gdul.session', JSON.stringify(session)), {
    token: payload.token,
    expiresAt: payload.expiresAt,
    player: payload.data,
  });
  await page.reload();
  await page.getByRole('button', { name: /Thinking Space II/i }).click();
  await expect(page.getByText('ACCOUNT', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('LEGACY', { exact: true }).first()).toBeVisible();
  await page.keyboard.press('Escape');

});
