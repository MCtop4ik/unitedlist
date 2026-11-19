import { describe, expect, it } from 'vitest';
import { pointsFor, statusFor } from './points';

describe('ranking', () => {
  it('uses a top-heavy curve', () => {
    expect(pointsFor(1)).toBe(5000);
    expect(pointsFor(10)).toBeLessThan(5000);
    expect(pointsFor(1000)).toBeLessThan(pointsFor(10));
  });

  it('derives status from points', () => {
    expect(statusFor(0)).toBe('ROOKIE');
    expect(statusFor(1000)).toBe('PLAYER');
    expect(statusFor(5000)).toBe('SKILLED');
    expect(statusFor(15000)).toBe('EXTREME');
    expect(statusFor(30000)).toBe('LEGEND');
  });
});
