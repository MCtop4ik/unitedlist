import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('mobile catalog and dialog close with Escape', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /ONE LIST/i })).toBeVisible();
  await page.getByRole('button', { name: /GRIEF/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('PREVIEW / SOURCE SNAPSHOT')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('keyboard shortcuts focus search and Escape returns focus to the row', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('/');
  await expect(page.getByRole('textbox', { name: /SEARCH LEVEL OR AUTHOR/i })).toBeFocused();
  const row = page.getByRole('button', { name: /GRIEF/i });
  await row.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(row).toBeFocused();
});

test('keyboard navigates zones, divisions, filters, and sort', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'ALL' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/zone=pointercrate/);
  const main = page.getByRole('tab', { name: /MAIN/ });
  await main.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/division=extended/);
  const filters = page.getByRole('button', { name: /FILTERS/ });
  await filters.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/FILTERS \/ \d+ ACTIVE/)).toBeVisible();
  await page.keyboard.press('Escape');
  const sort = page.getByRole('button', { name: /SORT \// });
  await sort.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'GLOBAL' })).toBeVisible();
  await page.keyboard.press('Escape');
});

test('mobile menu reaches leaderboard and profile', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /OPEN NAVIGATION/i }).click();
  await expect(page.getByRole('menuitem', { name: 'LEADERBOARD' })).toBeVisible();
  await page.getByRole('menuitem', { name: 'PROFILE' }).click();
  await expect(page).toHaveURL(/profile/);
});
