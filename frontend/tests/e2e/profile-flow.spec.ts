import { expect, test } from '@playwright/test';

const API = 'http://localhost:3001/api';

test('account profile, progress, completion, immutability, and session loss', async ({ page, request }) => {
  const suffix = Date.now().toString().slice(-6);
  const displayName = `PROFILE_${suffix}`;
  const registered = await request.post(`${API}/auth/register`, {
    data: { email: `profile-${suffix}@example.com`, displayName, password: 'correct horse battery' },
  });
  const payload = await registered.json();
  await page.goto('/');
  await page.evaluate((session) => localStorage.setItem('gdul.session', JSON.stringify(session)), {
    token: payload.token,
    expiresAt: payload.expiresAt,
    player: payload.data,
  });
  await page.reload();
  await page.getByRole('button', { name: /GRIEF/i }).click();
  await page.getByRole('button', { name: 'UPDATE PROGRESS' }).click();
  await page.getByLabel('BEST PERCENT / 1–99').fill('91');
  await page.getByRole('button', { name: 'SAVE 91%' }).click();
  await expect(page.getByText('PROGRESS SAVED', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('YOUR BEST / 91%')).toBeVisible();

  await page.getByRole('button', { name: 'UPDATE PROGRESS' }).click();
  await page.getByLabel('BEST PERCENT / 1–99').fill('50');
  await page.getByRole('button', { name: 'SAVE 50%' }).click();
  await expect(page.getByText('YOUR BEST / 91%')).toBeVisible();

  await page.getByRole('button', { name: 'UPDATE PROGRESS' }).click();
  await page.getByLabel('BEST PERCENT / 1–99').fill('95');
  await page.getByRole('button', { name: 'SAVE 95%' }).click();
  await expect(page.getByText('YOUR BEST / 95%')).toBeVisible();

  await page.getByRole('button', { name: 'RECORD COMPLETION' }).click();
  await page.getByRole('button', { name: 'CONFIRM COMPLETION' }).click();
  await expect(page.getByRole('button', { name: 'ALREADY COMPLETED' })).toBeDisabled();

  const duplicate = await request.post(`${API}/completions`, {
    headers: { Authorization: `Bearer ${payload.token}` },
    data: { levelId: 149992717 },
  });
  expect(duplicate.ok()).toBe(true);

  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: displayName })).toBeVisible();
  await expect(page.getByText('GRIEF')).toBeVisible();
  await expect(page.getByRole('tab', { name: /COMPLETIONS \/ 001/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /DELETE|REMOVE/i })).toHaveCount(0);

  await page.evaluate(() => localStorage.clear());
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: /SIGN IN/ })).toBeVisible();
  await expect(page.getByText(/ACCOUNT REQUIRED|SERVER-BACKED/i).first()).toBeVisible();
});
