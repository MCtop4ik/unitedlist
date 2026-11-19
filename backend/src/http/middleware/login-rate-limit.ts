import type { Response } from 'express';

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

interface Attempt {
  count: number;
  windowStart: number;
  blockedUntil: number;
}

export interface LoginLimiter {
  check(key: string): { blocked: boolean; retryAfterMs: number };
  failure(key: string): void;
  success(key: string): void;
}

export function loginKey(normalizedEmail: string, ip: string) {
  return `${normalizedEmail}|${ip}`;
}

export function createLoginLimiter(now: () => number = Date.now): LoginLimiter {
  const attempts = new Map<string, Attempt>();
  const prune = (timestamp: number) => {
    if (attempts.size < 1000) return;
    for (const [key, attempt] of attempts) {
      if (attempt.blockedUntil <= timestamp && attempt.windowStart + WINDOW_MS <= timestamp) attempts.delete(key);
    }
  };

  const active = (key: string, timestamp: number) => {
    const attempt = attempts.get(key);
    if (!attempt) return null;
    if (attempt.blockedUntil > timestamp) return attempt;
    if (attempt.windowStart + WINDOW_MS <= timestamp) {
      attempts.delete(key);
      return null;
    }
    return attempt;
  };

  return {
    check(key) {
      const timestamp = now();
      prune(timestamp);
      const attempt = active(key, timestamp);
      if (attempt?.blockedUntil && attempt.blockedUntil > timestamp) {
        return { blocked: true, retryAfterMs: attempt.blockedUntil - timestamp };
      }
      return { blocked: false, retryAfterMs: 0 };
    },
    failure(key) {
      const timestamp = now();
      const attempt = active(key, timestamp) ?? { count: 0, windowStart: timestamp, blockedUntil: 0 };
      attempt.count += 1;
      if (attempt.count >= MAX_FAILURES) attempt.blockedUntil = timestamp + BLOCK_MS;
      attempts.set(key, attempt);
    },
    success(key) {
      attempts.delete(key);
    },
  };
}

export function sendRateLimited(res: Response, retryAfterMs: number, message: string) {
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  res.setHeader('Retry-After', String(retryAfterSeconds));
  res.status(429).json({ error: { code: 'RATE_LIMITED', message } });
}
