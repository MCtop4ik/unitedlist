import type { Status } from '@shared/types';

export function pointsFor(globalRank: number) {
  return Math.max(1, Math.round(5000 / Math.pow(globalRank, 0.55)));
}

export function statusFor(points: number): Status {
  if (points >= 30000) return 'LEGEND';
  if (points >= 15000) return 'EXTREME';
  if (points >= 5000) return 'SKILLED';
  if (points >= 1000) return 'PLAYER';
  return 'ROOKIE';
}
