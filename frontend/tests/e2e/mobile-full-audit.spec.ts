import { expect, test } from '@playwright/test';
import { createTestAccount } from './support/account';
import { expectInViewport, expectNoHorizontalScroll } from './support/layout';

const matrix = [
  { width: 320, height: 568, label: '320x568' },
  { width: 360, height: 640, label: '360x640' },
  { width: 375, height: 667, label: '375x667' },
  { width: 390, height: 844, label: '390x844' },
  { width: 844, height: 390, label: '844x390-landscape' },
];

for (const viewport of matrix) {
  test(`primary flows stay usable at ${viewport.label}`, async ({ browser, request, page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await createTestAccount(request, page, { prefix: `M${viewport.width}` });

    await expectNoHorizontalScroll(page);
    if (viewport.width <= 720) {
      await expectInViewport(page.getByRole('button', { name: /Open navigation/i }), page);
      await expectInViewport(page.getByRole('button', { name: /Account menu/i }), page);
    } else {
      await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    }

    const gddl = page.getByRole('tab', { name: 'GDDL' });
    await gddl.scrollIntoViewIfNeeded();
    await expect(gddl).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.getByRole('button', { name: /FILTERS/i }).click();
    const apply = page.getByRole('button', { name: 'APPLY' });
    await apply.scrollIntoViewIfNeeded();
    await expectInViewport(apply, page);
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: /SORT \// }).click();
    await expect(page.getByRole('menuitem', { name: 'GLOBAL' })).toBeVisible();
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: /GRIEF/i }).click();
    const levelDialog = page.getByRole('dialog');
    await expect(levelDialog).toBeVisible();
    await expectNoHorizontalScroll(page);
    const levelClose = levelDialog.getByRole('button', { name: 'Close' });
    await levelClose.scrollIntoViewIfNeeded();
    await expectInViewport(levelClose, page);
    await page.keyboard.press('Escape');
    await expect(levelDialog).toBeHidden();

    await page.getByRole('button', { name: /Artemis 13/i }).click();
    await page.getByRole('button', { name: 'UPDATE PROGRESS' }).click();
    const progressDialog = page.getByRole('dialog', { name: 'UPDATE BEST PROGRESS' });
    const save = progressDialog.getByRole('button', { name: /^SAVE \d+%$/ });
    await save.scrollIntoViewIfNeeded();
    await expectInViewport(save, page);
    await expectNoHorizontalScroll(page);
    await page.getByRole('button', { name: 'CANCEL' }).click();
    await page.keyboard.press('Escape');

    await page.goto('/profile');
    await expectNoHorizontalScroll(page);
    await expect(page.getByRole('tab', { name: /COMPLETIONS/ })).toBeVisible();

    const anonymous = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const signedOut = await anonymous.newPage();
    await signedOut.goto('/profile');
    await signedOut.getByRole('button', { name: 'SIGN IN' }).click();
    const authDialog = signedOut.getByRole('dialog');
    const authSubmit = authDialog.getByRole('button', { name: 'SIGN IN' });
    const authCancel = authDialog.getByRole('button', { name: 'CANCEL' });
    await authSubmit.scrollIntoViewIfNeeded();
    await expectInViewport(authSubmit, signedOut);
    await expectInViewport(authCancel, signedOut);
    await expectNoHorizontalScroll(signedOut);
    await anonymous.close();
  });
}
