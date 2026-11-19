import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/domain/password.js';

describe('password hashing', () => {
  it('stores a versioned scrypt verifier without the plaintext', () => {
    const stored = hashPassword('correct horse battery');
    expect(stored.startsWith('scrypt$32768$8$1$')).toBe(true);
    expect(stored).not.toContain('correct horse battery');
    expect(verifyPassword('correct horse battery', stored)).toBe(true);
    expect(verifyPassword('wrong password', stored)).toBe(false);
  });

  it('uses a unique salt per verifier', () => {
    const first = hashPassword('same password');
    const second = hashPassword('same password');
    expect(first).not.toBe(second);
    expect(verifyPassword('same password', first)).toBe(true);
    expect(verifyPassword('same password', second)).toBe(true);
  });

  it('rejects malformed verifiers instead of throwing', () => {
    expect(verifyPassword('password', 'plaintext')).toBe(false);
    expect(verifyPassword('password', 'scrypt$not-a-number$8$1$salt$hash')).toBe(false);
    expect(verifyPassword('password', 'scrypt$32768$8$1$salt$zz')).toBe(false);
  });
});
