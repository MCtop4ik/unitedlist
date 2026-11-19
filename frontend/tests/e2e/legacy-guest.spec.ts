import { expect, test } from '@playwright/test';

const API = 'http://localhost:3001/api';

test('legacy guest identity is signed out and old guest tokens cannot write', async ({ page, request }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('gdul.guest', JSON.stringify({ id: 'local_player_one', displayName: 'PLAYER_ARCHIVE', token: 'old-guest-token' })));
  await page.reload();

  await expect(page.getByRole('link', { name: /SIGN IN \/ PROFILE/i })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('gdul.guest'))).toBeNull();

  await page.getByRole('button', { name: /Thinking Space II/i }).click();
  await expect(page.getByText('PLAYER_ARCHIVE')).toBeVisible();
  await page.keyboard.press('Escape');


  const rejected = await request.post(`${API}/progress`, {
    headers: { Authorization: 'Bearer old-guest-token' },
    data: { levelId: 149992717, percent: 50 },
  });
  expect(rejected.status()).toBe(401);
});
