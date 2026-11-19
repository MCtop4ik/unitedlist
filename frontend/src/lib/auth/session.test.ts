import { beforeEach, describe, expect, it } from 'vitest';
import { clearLegacyGuest, clearSession, loadSession, saveSession } from './session';
import type { Player } from '@shared/types';

const player: Player = {
  id: 'acct_test',
  displayName: 'TEST',
  createdAt: '2026-11-19T00:00:00.000Z',
};

beforeEach(() => localStorage.clear());

describe('session storage', () => {
  it('saves, loads, and clears a session', () => {
    saveSession({ token: 'token', expiresAt: '2026-12-19T00:00:00.000Z', player });
    expect(loadSession()).toEqual({ token: 'token', expiresAt: '2026-12-19T00:00:00.000Z', player });
    clearSession();
    expect(loadSession()).toBeNull();
  });

  it('ignores malformed stored data', () => {
    localStorage.setItem('gdul.session', '{not json');
    expect(loadSession()).toBeNull();
    localStorage.setItem('gdul.session', JSON.stringify({ token: 'token' }));
    expect(loadSession()).toBeNull();
    localStorage.setItem('gdul.session', JSON.stringify({ token: 'token', expiresAt: 'soon', player: { id: 1 } }));
    expect(loadSession()).toBeNull();
  });

  it('removes the legacy guest key', () => {
    localStorage.setItem('gdul.guest', JSON.stringify({ id: 'local', token: 'old' }));
    clearLegacyGuest();
    expect(localStorage.getItem('gdul.guest')).toBeNull();
  });
});
