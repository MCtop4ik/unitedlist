import { describe, expect, it } from 'vitest';
import { pointsFor, statusFor } from '../../src/lib/ranking/points';

function pointsForCompletions(ranks: number[]) {
  return ranks.reduce((sum, rank) => sum + pointsFor(rank), 0);
}

describe('ranking recalculation', () => {
  it('is deterministic and only counts completed levels', () => {
    expect(pointsForCompletions([1, 10, 100])).toBe(pointsForCompletions([1, 10, 100]));
    expect(pointsForCompletions([])).toBe(0);
  });

  it('derives stable statuses from recalculated points', () => {
    expect(statusFor(pointsForCompletions([1, 2, 3]))).toBe('SKILLED');
    expect(statusFor(15000)).toBe('EXTREME');
    expect(statusFor(pointsForCompletions([1000]))).toBe('ROOKIE');
  });
});
