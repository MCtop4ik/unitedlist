import { expect, test } from '@playwright/test';

test('account registration, persistence, sign-out, and second-device sign-in', async ({ page, browser }) => {
  const suffix = Date.now().toString().slice(-6);
  const email = `auth-${suffix}@example.com`;
  const displayName = `AUTH_${suffix}`;
  const password = 'correct horse battery';

  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/profile');
  await page.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('EMAIL').fill(email);
  await dialog.getByLabel('DISPLAY NAME').fill(displayName);
  await dialog.getByLabel('PASSWORD').fill(password);
  await dialog.getByRole('button', { name: 'CREATE ACCOUNT' }).click();

  await expect(page.getByRole('heading', { name: displayName })).toBeVisible();
  await expect(page.getByRole('button', { name: /Account menu/ })).toContainText(displayName);

  await page.reload();
  await expect(page.getByRole('heading', { name: displayName })).toBeVisible();

  await page.getByRole('button', { name: /Account menu/ }).click();
  await page.getByRole('menuitem', { name: 'SIGN OUT' }).click();
  await expect(page.getByRole('heading', { name: /SIGN IN/ })).toBeVisible();

  await page.getByRole('button', { name: 'SIGN IN' }).click();
  const signInDialog = page.getByRole('dialog');
  await signInDialog.getByLabel('EMAIL').fill(email);
  await signInDialog.getByLabel('PASSWORD').fill(password);
  await signInDialog.getByRole('button', { name: 'SIGN IN' }).click();
  await expect(page.getByRole('heading', { name: displayName })).toBeVisible();

  const second = await browser.newContext();
  const secondPage = await second.newPage();
  await secondPage.goto('/profile');
  await secondPage.getByRole('button', { name: 'SIGN IN' }).click();
  const secondDialog = secondPage.getByRole('dialog');
  await secondDialog.getByLabel('EMAIL').fill(email);
  await secondDialog.getByLabel('PASSWORD').fill(password);
  await secondDialog.getByRole('button', { name: 'SIGN IN' }).click();
  await expect(secondPage.getByRole('heading', { name: displayName })).toBeVisible();
  await second.close();
});
