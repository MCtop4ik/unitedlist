import { expect, test } from '@playwright/test';
import { expectInViewport, expectNoHorizontalScroll } from './support/layout';

const API = 'http://localhost:3001/api';
const LONG_NAME = ('LONG' + Date.now().toString().slice(-6) + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ').slice(0, 32);

test('long display names and 320px viewports do not overflow horizontally', async ({ page, request, browser }) => {
  const suffix = Date.now().toString().slice(-6);
  const registered = await request.post(`${API}/auth/register`, {
    data: { email: `long-${suffix}@example.com`, displayName: LONG_NAME, password: 'correct horse battery' },
  });
  const payload = await registered.json();
  await page.goto('/');
  await page.evaluate((session) => localStorage.setItem('gdul.session', JSON.stringify(session)), {
    token: payload.token,
    expiresAt: payload.expiresAt,
    player: payload.data,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expectNoHorizontalScroll(page);
  await expectInViewport(page.getByRole('button', { name: /Account menu/i }), page);
  await expectInViewport(page.getByRole('button', { name: /Open navigation/i }), page);

  await page.goto('/profile');
  await expectNoHorizontalScroll(page);
  await expect(page.getByRole('heading', { name: LONG_NAME })).toBeVisible();
  await expectInViewport(page.getByRole('button', { name: /Account menu/i }), page);


  const anonymous = await browser.newContext();
  const mobile = await anonymous.newPage();
  await mobile.setViewportSize({ width: 320, height: 568 });
  await mobile.goto('/');
  await expectNoHorizontalScroll(mobile);
  await expectInViewport(mobile.getByRole('link', { name: /SIGN IN \/ PROFILE/i }), mobile);
  await expectInViewport(mobile.getByRole('button', { name: /Open navigation/i }), mobile);
  const gddl = mobile.getByRole('tab', { name: 'GDDL' });
  await gddl.scrollIntoViewIfNeeded();
  await expect(gddl).toBeVisible();
  await expectInViewport(gddl, mobile);
  await anonymous.close();
});

test('catalog has no horizontal overflow across the mobile width matrix', async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 640 }, { width: 375, height: 667 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expectNoHorizontalScroll(page);
  }
});
