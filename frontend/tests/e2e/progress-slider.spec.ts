import { expect, test } from '@playwright/test';
import { createTestAccount } from './support/account';
import { expectNoHorizontalScroll } from './support/layout';

test('progress control is a full-width progress bar with inset thumb on mobile', async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await createTestAccount(request, page, { prefix: 'SLIDER' });
  await page.getByRole('button', { name: /GRIEF/i }).click();
  await page.getByRole('button', { name: 'UPDATE PROGRESS' }).click();

  const dialog = page.getByRole('dialog', { name: 'UPDATE BEST PROGRESS' });
  const slider = dialog.locator('.progress-slider');
  const input = dialog.locator('input[type=number]');
  const box = await slider.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  expect(box.width).toBeGreaterThan(250);
  await expectNoHorizontalScroll(page);

  const geometry = async () => page.evaluate(() => {
    const root = document.querySelector('.progress-slider')!.getBoundingClientRect();
    const track = document.querySelector('.progress-slider-track')!.getBoundingClientRect();
    const range = document.querySelector('.progress-slider-range')!.getBoundingClientRect();
    const thumb = document.querySelector('.progress-slider-thumb')!.getBoundingClientRect();
    return { root: { left: root.left, right: root.right, width: root.width }, track: { left: track.left, right: track.right, width: track.width }, range: { width: range.width }, thumb: { left: thumb.left, right: thumb.right } };
  });

  await input.fill('1');
  const low = await geometry();
  expect(low.track.left).toBeGreaterThan(low.root.left);
  expect(low.track.right).toBeLessThan(low.root.right);
  expect(low.thumb.left).toBeGreaterThan(low.root.left);
  expect(low.thumb.right).toBeLessThan(low.root.right);

  await input.fill('99');
  const high = await geometry();
  expect(high.thumb.left).toBeGreaterThan(high.root.left);
  expect(high.thumb.right).toBeLessThan(high.root.right);
  expect(high.range.width).toBeGreaterThan(high.track.width * 0.9);

  await input.fill('50');
  const half = await geometry();
  expect(Math.abs(half.range.width - half.track.width / 2)).toBeLessThan(4);

  await input.fill('42');
  await expect(dialog.getByRole('slider')).toHaveAttribute('aria-valuenow', '42');
  await slider.click({ position: { x: Math.round(box.width * 0.25), y: Math.round(box.height / 2) } });
  const clickedValue = Number(await input.inputValue());
  expect(clickedValue).toBeGreaterThan(15);
  expect(clickedValue).toBeLessThan(40);

  await dialog.getByRole('slider').focus();
  await page.keyboard.press('ArrowRight');
  expect(Number(await input.inputValue())).toBe(clickedValue + 1);

  await dialog.getByRole('button', { name: /^SAVE \d+%$/ }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(/YOUR BEST \/ \d+%/)).toBeVisible();
  await expectNoHorizontalScroll(page);
});
