import { expect, test } from '@playwright/test';

test('leaderboard is reachable from desktop navigation and the mobile menu', async ({ page }) => {
  await page.goto('/');
  const desktopLink = page.getByRole('link', { name: 'Leaderboard' });
  await expect(desktopLink).toBeVisible();
  await desktopLink.click();
  await expect(page).toHaveURL(/\/leaderboard$/);
  await expect(page.getByRole('link', { name: 'Leaderboard' })).toHaveAttribute('aria-current', 'page');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: /OPEN NAVIGATION/i }).click();
  await page.getByRole('menuitem', { name: 'LEADERBOARD' }).click();
  await expect(page).toHaveURL(/\/leaderboard$/);
});
