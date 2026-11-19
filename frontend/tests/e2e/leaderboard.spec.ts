import { expect, test } from '@playwright/test';

const API = 'http://localhost:3001/api';

test('leaderboard is account-only, deterministic, and ignores progress points', async ({ request, page }) => {
  const suffix = Date.now().toString().slice(-6);
  const first = await request.post(`${API}/auth/register`, {
    data: { email: `tie-a-${suffix}@example.com`, displayName: `TIE_A_${suffix}`, password: 'correct horse battery' },
  });
  const second = await request.post(`${API}/auth/register`, {
    data: { email: `tie-b-${suffix}@example.com`, displayName: `TIE_B_${suffix}`, password: 'correct horse battery' },
  });
  const a = await first.json();
  const b = await second.json();
  await request.post(`${API}/progress`, {
    headers: { Authorization: `Bearer ${a.token}` },
    data: { levelId: 149992717, percent: 50 },
  });

  const boardResponse = await request.get(`${API}/leaderboard?perPage=100`);
  const board = await boardResponse.json();
  const aRow = board.data.find((row: { playerId: string }) => row.playerId === a.data.id);
  const bRow = board.data.find((row: { playerId: string }) => row.playerId === b.data.id);
  expect(aRow.points).toBe(0);
  expect(bRow.points).toBe(0);
  const order = board.data
    .filter((row: { playerId: string }) => [a.data.id, b.data.id].includes(row.playerId))
    .map((row: { playerId: string }) => row.playerId);
  const secondBoard = await (await request.get(`${API}/leaderboard?perPage=100`)).json();
  const secondOrder = secondBoard.data
    .filter((row: { playerId: string }) => [a.data.id, b.data.id].includes(row.playerId))
    .map((row: { playerId: string }) => row.playerId);
  expect(secondOrder).toEqual(order);
  expect(board.data.some((row: { displayName: string }) => ['Doggie', 'wPopoff', 'Zoink'].includes(row.displayName))).toBe(false);

  const pointsPlayer = await request.post(`${API}/auth/register`, {
    data: { email: `points-${suffix}@example.com`, displayName: `POINTS_${suffix}`, password: 'correct horse battery' },
  });
  const pointsPlayerData = await pointsPlayer.json();
  const before = await (await request.get(`${API}/leaderboard?perPage=100`)).json();
  const beforeRow = before.data.find((row: { playerId: string }) => row.playerId === pointsPlayerData.data.id);
  await request.post(`${API}/completions`, {
    headers: { Authorization: `Bearer ${pointsPlayerData.token}` },
    data: { levelId: 149992717 },
  });
  const after = await (await request.get(`${API}/leaderboard?perPage=100`)).json();
  const afterRow = after.data.find((row: { playerId: string }) => row.playerId === pointsPlayerData.data.id);
  expect(afterRow.points).toBe(5000);
  expect(afterRow.rank).toBeLessThan(beforeRow.rank);

  await page.goto('/leaderboard');
  await expect(page.getByText('IMPORTED RECORDS ARE NOT RANKED')).toBeVisible();
  await expect(page.getByText('NOVA')).toBeVisible();
  await expect(page.getByText('Doggie')).toHaveCount(0);
});
