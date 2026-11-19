import type { Player } from '@shared/types';

const SESSION_KEY = 'gdul.session';
const LEGACY_GUEST_KEY = 'gdul.guest';

export interface StoredSession {
  token: string;
  expiresAt: string;
  player: Player;
}

function isPlayer(value: unknown): value is Player {
  if (!value || typeof value !== 'object') return false;
  const player = value as Partial<Player>;
  return typeof player.id === 'string' && typeof player.displayName === 'string' && typeof player.createdAt === 'string';
}

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (typeof parsed.token !== 'string' || typeof parsed.expiresAt !== 'string' || !isPlayer(parsed.player)) return null;
    return { token: parsed.token, expiresAt: parsed.expiresAt, player: parsed.player };
  } catch {
    return null;
  }
}

export function saveSession(session: StoredSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function clearLegacyGuest() {
  localStorage.removeItem(LEGACY_GUEST_KEY);
}
