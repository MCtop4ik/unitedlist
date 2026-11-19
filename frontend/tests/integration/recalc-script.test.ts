import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('recalculate-rankings script', () => {
  it('runs and reports recalculated players', () => {
    const output = execFileSync(resolve('../node_modules/.bin/tsx'), ['scripts/recalculate-rankings.ts'], {
      cwd: resolve('..'),
      encoding: 'utf8',
    });
    expect(output).toMatch(/Recalculated \d+ local players/);
  });
});
