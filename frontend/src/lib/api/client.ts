import type {
  AccountSession,
  AuthMe,
  Completion,
  Level,
  LevelDetail,
  Paginated,
  Player,
  Progress,
  SourceStatus,
} from '@shared/types';

const BASE = '/api';

export class ApiRequestError extends Error {
  constructor(message: string, public status: number, public code?: string, public field?: string) { super(message); }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(BASE + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const payload = (await response.json().catch(() => null)) as T | { error?: { message?: string; code?: string; field?: string } } | null;
  if (!response.ok) {
    const error = payload && typeof payload === 'object' && 'error' in payload ? payload.error : undefined;
    throw new ApiRequestError(error?.message || `Request failed (${response.status})`, response.status, error?.code, error?.field);
  }
  return payload as T;
}

export interface CatalogParams {
  zone: string;
  q?: string;
  difficulty?: string;
  length?: string;
  status?: string;
  playerId?: string;
  sort?: string;
  page?: number;
  perPage?: number;
}

export const api = {
  levels(params: CatalogParams) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') search.set(key, String(value));
    });
    return request<Paginated<Level>>(`/levels?${search.toString()}`);
  },
  level(levelId: number) {
    return request<{ data: LevelDetail }>(`/levels/${levelId}`);
  },
  completions(levelId: number, page = 1, perPage = 20) {
    return request<Paginated<Completion>>(
      `/levels/${levelId}/completions?page=${page}&perPage=${perPage}`,
    );
  },
  register(email: string, displayName: string, password: string) {
    return request<AccountSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, displayName, password }),
    });
  },
  login(email: string, password: string) {
    return request<AccountSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  logout(token: string) {
    return request<void>('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  me(token: string) {
    return request<AuthMe>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  player(playerId: string) {
    return request<{ data: Player }>(`/players/${playerId}`);
  },
  playerCompletions(playerId: string, page = 1, perPage = 50) {
    return request<Paginated<Completion>>(
      `/players/${playerId}/completions?page=${page}&perPage=${perPage}`,
    );
  },
  playerProgress(playerId: string, page = 1, perPage = 50) {
    return request<Paginated<Progress & { level: Level | null }>>(
      `/players/${playerId}/progress?page=${page}&perPage=${perPage}`,
    );
  },
  saveProgress(token: string, levelId: number, percent: number) {
    return request<{ data: Progress }>('/progress', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ levelId, percent }),
    });
  },
  completeLevel(token: string, levelId: number) {
    return request<{ data: Completion }>('/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ levelId }),
    });
  },
  sourceStatus() {
    return request<{ data: SourceStatus[] }>('/source-status');
  },
  toggleSource(source: string) {
    return request<{ data: SourceStatus }>(`/source-status/${source}/toggle`, {
      method: 'POST',
    });
  },
};
