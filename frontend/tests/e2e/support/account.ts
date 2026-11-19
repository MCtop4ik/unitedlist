import type { APIRequestContext, Page } from '@playwright/test';

export const API = 'http://localhost:3001/api';

export async function createTestAccount(
  request: APIRequestContext,
  page: Page,
  options: { prefix?: string; completions?: number[]; progress?: Array<{ levelId: number; percent: number }> } = {},
) {
  const suffix = Date.now().toString().slice(-6);
  const displayName = `${options.prefix ?? 'E2E'}_${suffix}`;
  const registered = await request.post(`${API}/auth/register`, {
    data: { email: `${displayName.toLowerCase()}@example.com`, displayName, password: 'correct horse battery' },
  });
  const payload = await registered.json();
  const auth = { Authorization: `Bearer ${payload.token}` };
  for (const levelId of options.completions ?? []) {
    await request.post(`${API}/completions`, { headers: auth, data: { levelId } });
  }
  for (const progress of options.progress ?? []) {
    await request.post(`${API}/progress`, { headers: auth, data: progress });
  }
  await page.goto('/');
  await page.evaluate((session) => localStorage.setItem('gdul.session', JSON.stringify(session)), {
    token: payload.token,
    expiresAt: payload.expiresAt,
    player: payload.data,
  });
  await page.reload();
  await page.waitForSelector('.level-row');
  return { id: payload.data.id as string, token: payload.token as string, displayName };
}
