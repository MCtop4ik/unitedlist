import type { SourceLevel } from './types.js';
import { json } from './http.js';

const PAGE_SIZE = 25;
const CONCURRENCY = 4;

async function page(pageNumber: number): Promise<{ total: number; data: any[] }> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await json(`https://gdladder.com/api/levels?limit=${PAGE_SIZE}&page=${pageNumber}&excludeUnrated=true`);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
  throw lastError;
}

export async function gddlLevels(excluded: Set<number>): Promise<SourceLevel[]> {
  const first = await page(0);
  const total = Number(first.total) || first.data.length;
  const pageCount = Math.ceil(total / PAGE_SIZE);
  const pages: any[][] = Array.from({ length: pageCount }, () => []);
  pages[0] = first.data;
  let nextPage = 1;
  const run = async () => {
    while (nextPage < pageCount) {
      const current = nextPage++;
      pages[current] = (await page(current)).data;
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pageCount - 1) }, run));
  const rows = pages.flat().filter((row) => !excluded.has(row.id));
  rows.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.id - b.id);
  return rows.map((row, index) => ({
    levelId: row.id, name: row.name, author: row.publisherName ?? 'unknown', zone: 'gddl' as const,
    zoneRank: index + 1, difficulty: row.difficulty ?? 'Hard', length: 'medium' as const,
    thumbnailUrl: `https://levelthumbs.prevter.me/thumbnail/${row.id}/small`,
    videoUrl: row.showcase ? `https://www.youtube.com/watch?v=${row.showcase}` : null,
  }));
}
