import { execFileSync } from 'node:child_process';

export async function json(url: string): Promise<any> {
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'GDUnitedList/1.0' }, signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`${url} -> ${response.status}`);
    return await response.json();
  } catch (error) {
    try {
      const output = execFileSync('curl', ['-sS', '--max-time', '60', '-H', 'Accept: application/json', url], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
      return JSON.parse(output);
    } catch {
      throw error;
    }
  }
}

export async function mapLimit<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let index = 0;
  async function run() {
    while (index < items.length) {
      const current = items[index++];
      if (current === undefined) continue;
      try { results.push(await worker(current)); } catch { /* source item failure is non-fatal */ }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}
