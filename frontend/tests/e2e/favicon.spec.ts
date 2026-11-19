import { expect, test } from '@playwright/test';

test('favicon is served without a console 404', async ({ page, request }) => {
  const response = await request.get('http://localhost:5173/favicon.svg');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('image/svg+xml');

  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().toLowerCase().includes('favicon')) errors.push(message.text());
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});
