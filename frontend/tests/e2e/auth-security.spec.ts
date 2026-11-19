import { expect, test } from '@playwright/test';

const API = 'http://localhost:3001/api';

test('duplicate accounts, generic credentials, and signed-out write gate', async ({ page, request }) => {
  const suffix = Date.now().toString().slice(-6);
  const email = `security-${suffix}@example.com`;
  const displayName = `SEC_${suffix}`;
  const password = 'correct horse battery';
  await request.post(`${API}/auth/register`, { data: { email, displayName, password } });

  await page.goto('/');
  await page.evaluate(() => localStorage.clear());

  await page.goto('/profile');
  await page.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('EMAIL').fill(email);
  await dialog.getByLabel('DISPLAY NAME').fill(`OTHER_${suffix}`);
  await dialog.getByLabel('PASSWORD').fill(password);
  await dialog.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  await expect(dialog.getByText(/already exists/i)).toBeVisible();

  await dialog.getByLabel('EMAIL').fill(`other-${suffix}@example.com`);
  await dialog.getByLabel('DISPLAY NAME').fill(displayName);
  await dialog.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  await expect(dialog.getByText(/display name is already taken/i)).toBeVisible();

  await dialog.getByRole('tab', { name: 'SIGN IN' }).click();
  await dialog.getByLabel('EMAIL').fill(email);
  await dialog.getByLabel('PASSWORD').fill('wrong password');
  await dialog.getByRole('button', { name: 'SIGN IN' }).click();
  await expect(dialog.getByText('Email or password is incorrect.')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.goto('/');
  await page.getByRole('button', { name: /GRIEF/i }).click();
  await page.getByRole('button', { name: 'RECORD COMPLETION' }).click();
  await expect(page.getByText('ACCOUNT REQUIRED')).toBeVisible();
  await expect(page.getByRole('button', { name: 'SIGN IN' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'CREATE ACCOUNT' })).toBeVisible();
});
