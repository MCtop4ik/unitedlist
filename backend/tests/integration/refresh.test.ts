import { describe, expect, it } from 'vitest';
import { LiveCatalog } from '../../src/services/live-catalog.js';
import { testLevels } from '../helpers/db.js';

describe('live catalog refresh', () => {
  it('dedupes levels, applies zone priority, and ranks them', async () => {
    const catalog = new LiveCatalog({
      levels: testLevels,
      ttlMs: Number.POSITIVE_INFINITY,
      loader: async () => [
        { levelId: 10, name: 'New PC', author: 'a', zone: 'pointercrate', zoneRank: 1, difficulty: 'Extreme', length: 'xl', thumbnailUrl: null, videoUrl: null },
        { levelId: 11, name: 'New AREDL', author: 'b', zone: 'aredl', zoneRank: 1, difficulty: 'Extreme', length: 'xl', thumbnailUrl: null, videoUrl: null },
        { levelId: 10, name: 'Duplicate', author: 'c', zone: 'gddl', zoneRank: 1, difficulty: 'Hard', length: 'medium', thumbnailUrl: null, videoUrl: null },
      ],
    });
    const levels = await catalog.refreshNow();
    expect(levels).toHaveLength(2);
    expect(levels[0]?.levelId).toBe(10);
    expect(levels[0]?.globalRank).toBe(1);
    expect(levels[1]?.globalRank).toBe(2);
  });
});
