import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const N = 32768;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const MAX_MEM = 64 * 1024 * 1024;
const DUMMY_SALT = '00000000000000000000000000000000';

function derive(password: string, salt: string, n = N, r = R, p = P) {
  return scryptSync(password, salt, KEY_LENGTH, { N: n, r, p, maxmem: MAX_MEM });
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = derive(password, salt).toString('hex');
  return `scrypt$${N}$${R}$${P}$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, rawN, rawR, rawP, salt, rawHash] = parts;
  if (!rawN || !rawR || !rawP || !salt || !rawHash) return false;
  const n = Number(rawN);
  const r = Number(rawR);
  const p = Number(rawP);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  if (n < 1024 || n > 1_048_576 || (n & (n - 1)) !== 0 || r < 1 || p < 1) return false;
  try {
    const expected = Buffer.from(rawHash, 'hex');
    const actual = derive(password, salt, n, r, p);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function dummyVerify(password: string) {
  try {
    derive(password, DUMMY_SALT);
  } catch {
    void password;
  }
}
