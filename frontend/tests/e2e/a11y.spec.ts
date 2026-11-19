import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function criticalViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious');
}

test('catalog, auth, dialog, and profile have no serious accessibility violations', async ({ page, request }) => {
  const suffix = Date.now().toString().slice(-6);
  await page.goto('/');
  expect(await criticalViolations(page)).toEqual([]);

  await page.getByRole('button', { name: /GRIEF/i }).click();
  expect(await criticalViolations(page)).toEqual([]);
  await page.keyboard.press('Escape');

  await page.goto('/profile');
  await page.getByRole('button', { name: 'SIGN IN' }).click();
  expect(await criticalViolations(page)).toEqual([]);
  await page.keyboard.press('Escape');

  const account = await request.post('http://localhost:3001/api/auth/register', {
    data: { email: `axe-${suffix}@example.com`, displayName: `AXE_${suffix}`, password: 'correct horse battery' },
  });
  const payload = await account.json();
  await page.addInitScript((session) => localStorage.setItem('gdul.session', JSON.stringify(session)), {
    token: payload.token,
    expiresAt: payload.expiresAt,
    player: payload.data,
  });
  await page.goto('/profile');
  expect(await criticalViolations(page)).toEqual([]);

});
