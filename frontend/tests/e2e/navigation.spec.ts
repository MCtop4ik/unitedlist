import { expect, test } from '@playwright/test';

test('leaderboard is absent from navigation and the old URL', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Leaderboard/i })).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: /OPEN NAVIGATION/i }).click();
  await expect(page.getByRole('menuitem', { name: /LEADERBOARD/i })).toHaveCount(0);
  await page.keyboard.press('Escape');

  await page.goto('/leaderboard');
  await expect(page.getByRole('heading', { name: /ONE LIST/i })).toBeVisible();
  await expect(page.getByText(/SITE BOARD|TOP SCORE|LEADERBOARD ERROR/i)).toHaveCount(0);
});
