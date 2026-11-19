import { expect, test } from '@playwright/test';
import { expectInViewport } from './support/layout';

test('auth actions are reachable on short screens and tabs fill the row', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/profile');
  await page.getByRole('button', { name: 'CREATE ACCOUNT' }).click();
  const dialog = page.getByRole('dialog');
  await expectInViewport(dialog.getByRole('button', { name: 'CREATE ACCOUNT' }), page);
  await expectInViewport(dialog.getByRole('button', { name: 'CANCEL' }), page);
  await page.keyboard.press('Escape');

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: 'SIGN IN' }).click();
  const desktopDialog = page.getByRole('dialog');
  const list = desktopDialog.locator('.tabs');
  const tabs = desktopDialog.locator('.tab');
  const listBox = await list.boundingBox();
  const first = await tabs.nth(0).boundingBox();
  const second = await tabs.nth(1).boundingBox();
  expect(listBox).not.toBeNull();
  expect(first).not.toBeNull();
  expect(second).not.toBeNull();
  if (listBox && first && second) {
    expect(first.width + second.width).toBeGreaterThanOrEqual(listBox.width - 6);
  }
  await expectInViewport(desktopDialog.getByRole('button', { name: 'SIGN IN' }), page);
});
