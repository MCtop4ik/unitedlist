import { expect, test } from '@playwright/test';
import { createMockApi } from './support/mock-api';

async function openRegister(page: import('@playwright/test').Page) {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  return page.getByRole('dialog');
}

test('registration validates required fields and invalid input without requests', async ({ page }) => {
  const api = await createMockApi(page);
  const dialog = await openRegister(page);

  await dialog.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  await expect(dialog.getByText('Enter a valid email address.')).toBeVisible();

  await dialog.getByLabel('EMAIL').fill('valid@example.com');
  await dialog.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  await expect(dialog.getByText('Display name must be 2-32 characters.')).toBeVisible();

  await dialog.getByLabel('DISPLAY NAME').fill('VALID_NAME');
  await dialog.getByLabel('PASSWORD').fill('short');
  await dialog.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  await expect(dialog.getByText('Password must be 8-128 characters.')).toBeVisible();
  expect(api.requests.filter((request) => request.path === '/api/auth/register')).toHaveLength(0);
});

test('registration shows a server error and recovers on retry', async ({ page }) => {
  const api = await createMockApi(page, { registerError: { status: 409, message: 'An account with this email already exists.' } });
  const dialog = await openRegister(page);
  await dialog.getByLabel('EMAIL').fill('taken@example.com');
  await dialog.getByLabel('DISPLAY NAME').fill('TAKEN_NAME');
  await dialog.getByLabel('PASSWORD').fill('correct horse battery');
  await dialog.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  await expect(dialog.getByText('An account with this email already exists.')).toBeVisible();
  expect(api.requests.filter((request) => request.path === '/api/auth/register')).toHaveLength(1);

  api.setRegisterError(null);
  await dialog.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  await expect(dialog).toBeHidden();
  expect(api.requests.filter((request) => request.path === '/api/auth/register')).toHaveLength(2);
});

test('dialogs open and close through visible controls and Escape', async ({ page }) => {
  await createMockApi(page);
  let dialog = await openRegister(page);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: 'SIGN IN' }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: /WELCOME BACK/i })).toBeVisible();
  await dialog.getByLabel('EMAIL').fill('valid@example.com');
  await dialog.getByRole('button', { name: 'SIGN IN' }).click();
  await expect(dialog.getByText('Enter your password.')).toBeVisible();
  await dialog.getByRole('button', { name: 'CANCEL' }).click();
  await expect(dialog).toBeHidden();
});
