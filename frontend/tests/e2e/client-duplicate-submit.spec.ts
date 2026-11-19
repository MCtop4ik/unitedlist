import { expect, test } from '@playwright/test';
import { createMockApi } from './support/mock-api';

test('repeated submission while pending creates exactly one request', async ({ page }) => {
  const api = await createMockApi(page, { delayRegister: true });
  await page.goto('/profile');
  await page.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('EMAIL').fill('duplicate@example.com');
  await dialog.getByLabel('DISPLAY NAME').fill('DUPLICATE_NAME');
  await dialog.getByLabel('PASSWORD').fill('correct horse battery');

  await dialog.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  await expect(dialog.getByRole('button', { name: 'WORKING…' })).toBeDisabled();
  await dialog.getByLabel('PASSWORD').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  expect(api.requests.filter((request) => request.path === '/api/auth/register')).toHaveLength(1);

  api.releaseRegister();
  await expect(dialog).toBeHidden();
  expect(api.requests.filter((request) => request.path === '/api/auth/register')).toHaveLength(1);
});
