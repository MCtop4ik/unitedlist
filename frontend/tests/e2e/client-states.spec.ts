import { expect, test } from '@playwright/test';
import { createMockApi } from './support/mock-api';

test('catalog shows a loading state while the response is delayed', async ({ page }) => {
  const api = await createMockApi(page, { delayCatalog: true });
  await page.goto('/');
  await expect(page.getByText('FETCHING CATALOG')).toBeVisible();
  api.releaseCatalog();
  await expect(page.getByRole('button', { name: /GRIEF/i })).toBeVisible();
});

test('catalog shows an explicit empty state', async ({ page }) => {
  await createMockApi(page, { emptyCatalog: true });
  await page.goto('/');
  await expect(page.getByText('NO LEVELS MATCH')).toBeVisible();
});

test('catalog shows successful data', async ({ page }) => {
  await createMockApi(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: /GRIEF/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Artemis 13/i })).toBeVisible();
});

test('catalog error state is replaced by a successful retry', async ({ page }) => {
  const api = await createMockApi(page, { failCatalogOnce: true });
  await page.goto('/');
  await expect(page.getByText('CATALOG ERROR')).toBeVisible();
  api.setCatalogError(false);
  await page.getByRole('button', { name: 'RETRY' }).click();
  await expect(page.getByRole('button', { name: /GRIEF/i })).toBeVisible();
});
