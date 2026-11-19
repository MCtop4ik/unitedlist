import { expect, test } from '@playwright/test';
import { createMockApi } from './support/mock-api';

/*
Coverage map (criteria 7–11):
7  duplicate submit -> client-duplicate-submit.spec.ts
8  visible component/dialog interactions -> client-forms.spec.ts
9  validation and error messages -> client-forms.spec.ts
10 loading/empty/success/error states -> client-states.spec.ts
11 full client journey -> this spec
*/

test('visitor creates an account and records progress from the level dialog', async ({ page }) => {
  await createMockApi(page);
  const name = `JOURNEY_${Date.now().toString().slice(-6)}`;

  await page.goto('/');
  await page.getByRole('button', { name: /GRIEF/i }).click();
  await page.getByRole('button', { name: 'UPDATE PROGRESS' }).click();
  await expect(page.getByText('ACCOUNT REQUIRED')).toBeVisible();

  await page.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  const auth = page.getByRole('dialog', { name: /MAKE IT PERMANENT/i });
  await auth.getByLabel('EMAIL').fill(`${name.toLowerCase()}@example.com`);
  await auth.getByLabel('DISPLAY NAME').fill(name);
  await auth.getByLabel('PASSWORD').fill('correct horse battery');
  await auth.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  await expect(auth).toBeHidden();

  await page.getByRole('button', { name: 'UPDATE PROGRESS' }).click();
  const progress = page.getByRole('dialog', { name: 'UPDATE BEST PROGRESS' });
  await progress.locator('input[type=number]').fill('64');
  await progress.getByRole('button', { name: 'SAVE 64%' }).click();
  await expect(progress).toBeHidden();
  await expect(page.getByText('YOUR BEST / 64%')).toBeVisible();

  await page.goto('/profile');
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await expect(page.getByText('64%')).toBeVisible();
});
