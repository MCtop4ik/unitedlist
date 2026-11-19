import { expect, test } from '@playwright/test';
import { createTestAccount } from './support/account';

async function chooseStatus(page: import('@playwright/test').Page, status: 'COMPLETED' | 'IN PROGRESS') {
  await page.getByRole('button', { name: /FILTERS/i }).click();
  await page.getByRole('button', { name: /ANY ▾|COMPLETED ▾|IN PROGRESS ▾/ }).click();
  await page.getByRole('menuitem', { name: status }).click();
  await page.getByRole('button', { name: 'APPLY' }).click();
}

test('completion-status filters change the real catalog results', async ({ page, request }) => {
  await createTestAccount(request, page, {
    prefix: 'FILTER',
    completions: [149992717],
    progress: [{ levelId: 148598469, percent: 50 }],
  });

  await chooseStatus(page, 'COMPLETED');
  await expect(page.locator('.result-count')).toHaveText('1 MATCHES');
  await expect(page.getByRole('button', { name: /GRIEF/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Artemis 13/i })).toHaveCount(0);

  await chooseStatus(page, 'IN PROGRESS');
  await expect(page.locator('.result-count')).toHaveText('1 MATCHES');
  await expect(page.getByRole('button', { name: /Artemis 13/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /GRIEF/i })).toHaveCount(0);

  await page.getByRole('button', { name: /FILTERS/i }).click();
  await page.getByRole('button', { name: 'RESET' }).click();
  await page.getByRole('button', { name: 'APPLY' }).click();
  await expect(page.locator('.result-count')).toHaveText('10,247 MATCHES');
});
