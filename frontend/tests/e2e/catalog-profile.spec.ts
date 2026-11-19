import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('catalog searches, switches zones, and opens a level', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /ONE LIST/i })).toBeVisible();
  await page.getByRole('tab', { name: 'POINTERCRATE' }).click();
  await expect(page).toHaveURL(/zone=pointercrate/);
  await expect(page.getByRole('tab', { name: /MAIN/i })).toBeVisible();
  await page.getByRole('textbox', { name: /SEARCH LEVEL OR AUTHOR/i }).fill('GRIEF');
  await expect(page.getByRole('button', { name: /GRIEF/i })).toBeVisible();
  await page.getByRole('button', { name: /GRIEF/i }).click();
  await expect(page.getByRole('dialog')).toContainText('GRIEF');
  await expect(page.getByText('PLAYER_ARCHIVE')).toBeVisible();
});

test('player can create an account from the profile page', async ({ page }) => {
  const suffix = Date.now().toString().slice(-6);
  const displayName = `E2E_${suffix}`;
  await page.goto('/profile');
  await page.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('EMAIL').fill(`catalog-${suffix}@example.com`);
  await dialog.getByLabel('DISPLAY NAME').fill(displayName);
  await dialog.getByLabel('PASSWORD').fill('correct horse battery');
  await dialog.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  await expect(page.getByRole('heading', { name: displayName })).toBeVisible();
});

test('completion-status filter is gated without an account', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /FILTERS/i }).click();
  await expect(page.getByText(/SIGN IN TO FILTER BY COMPLETION STATUS/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'SIGN IN →' })).toBeVisible();
});

test('shared URL restores zone, division, search, filters, and sort', async ({ page }) => {
  await page.goto('/?zone=pointercrate&division=extended&q=00079&difficulty=Extreme&length=xl&sort=name');
  await expect(page.getByRole('textbox', { name: /SEARCH LEVEL OR AUTHOR/i })).toHaveValue('00079');
  await expect(page.getByRole('tab', { name: 'POINTERCRATE' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: /EXTENDED/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('button', { name: /00079/i })).toBeVisible();
});
