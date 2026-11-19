import type { Page, Route } from '@playwright/test';
import { artemis, emptyPage, grief, levelDetail, levelPage, playerProfile, sourceStatus } from './fixtures';

export interface MockRequest {
  method: string;
  path: string;
  body: any;
}

interface RegisterError {
  status: number;
  message: string;
}

export interface MockApiOptions {
  delayRegister?: boolean;
  registerError?: RegisterError | null;
  emptyCatalog?: boolean;
  delayCatalog?: boolean;
  failCatalogOnce?: boolean;
}

export async function createMockApi(page: Page, options: MockApiOptions = {}) {
  const requests: MockRequest[] = [];
  const state = {
    player: null as ReturnType<typeof playerProfile> | null,
    email: 'mock@example.com',
    progressPercent: 0,
    registerError: options.registerError ?? null,
    catalogError: options.failCatalogOnce ?? false,
  };

  let releaseRegister: () => void = () => undefined;
  let releaseCatalog: () => void = () => undefined;
  const registerGate = options.delayRegister ? new Promise<void>((resolve) => { releaseRegister = resolve; }) : null;
  const catalogGate = options.delayCatalog ? new Promise<void>((resolve) => { releaseCatalog = resolve; }) : null;

  const fulfill = (route: Route, status: number, payload: unknown) => route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });

  const fail = (route: Route, status: number, message: string) => fulfill(route, status, { error: { code: 'TEST_ERROR', message } });

  await page.route(/https?:\/\/[^/]+\/api\/.*/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    let body: any = null;
    try { body = request.postDataJSON(); } catch { body = null; }
    requests.push({ method, path: path + url.search, body });

    if (path === '/api/source-status' && method === 'GET') {
      return fulfill(route, 200, { data: sourceStatus });
    }

    if (path === '/api/levels' && method === 'GET') {
      if (catalogGate) await catalogGate;
      if (options.emptyCatalog) return fulfill(route, 200, emptyPage());
      if (state.catalogError) return fail(route, 500, 'Catalog unavailable.');
      return fulfill(route, 200, levelPage());
    }

    if (path === '/api/auth/register' && method === 'POST') {
      if (registerGate) await registerGate;
      if (state.registerError) return fail(route, state.registerError.status, state.registerError.message);
      state.player = playerProfile(String(body?.displayName ?? 'MOCK_PLAYER'));
      state.email = String(body?.email ?? state.email);
      return fulfill(route, 201, {
        data: state.player,
        account: { email: state.email },
        token: 'mock-token',
        expiresAt: '2026-12-19T00:00:00.000Z',
      });
    }

    if (path === '/api/auth/login' && method === 'POST') {
      state.player = playerProfile('MOCK_SIGNIN', state.progressPercent ? 1 : 0);
      return fulfill(route, 200, {
        data: state.player,
        account: { email: state.email },
        token: 'mock-token',
        expiresAt: '2026-12-19T00:00:00.000Z',
      });
    }

    if (path === '/api/auth/me' && method === 'GET') {
      if (!state.player) return fail(route, 401, 'Sign in required.');
      return fulfill(route, 200, {
        data: { player: { ...state.player, progressCount: state.progressPercent ? 1 : 0 }, account: { email: state.email } },
        expiresAt: '2026-12-19T00:00:00.000Z',
      });
    }

    if (path === '/api/auth/logout' && method === 'POST') {
      return route.fulfill({ status: 204, body: '' });
    }

    if (path === '/api/progress' && method === 'POST') {
      state.progressPercent = Number(body?.percent ?? 0);
      return fulfill(route, 200, {
        data: {
          id: 'progress_mock',
          playerId: state.player?.id ?? 'acct_mock',
          levelId: Number(body?.levelId),
          percent: state.progressPercent,
          updatedAt: '2026-11-19T00:00:00.000Z',
        },
      });
    }

    const levelMatch = path.match(/^\/api\/levels\/(\d+)$/);
    if (levelMatch && method === 'GET') {
      const level = Number(levelMatch[1]) === artemis.levelId ? artemis : grief;
      return fulfill(route, 200, levelDetail(level));
    }

    if (/^\/api\/levels\/\d+\/completions$/.test(path) && method === 'GET') {
      return fulfill(route, 200, emptyPage());
    }

    const progressMatch = path.match(/^\/api\/players\/[^/]+\/progress$/);
    if (progressMatch && method === 'GET') {
      const data = state.progressPercent
        ? [{ id: 'progress_mock', playerId: state.player?.id ?? 'acct_mock', levelId: grief.levelId, percent: state.progressPercent, updatedAt: '2026-11-19T00:00:00.000Z' }]
        : [];
      return fulfill(route, 200, { data, page: 1, perPage: 50, total: data.length, totalPages: 1 });
    }

    if (/^\/api\/players\/[^/]+\/completions$/.test(path) && method === 'GET') {
      return fulfill(route, 200, emptyPage());
    }

    if (/^\/api\/players\/[^/]+$/.test(path) && method === 'GET') {
      const player = state.player ?? playerProfile('MOCK_PLAYER');
      return fulfill(route, 200, { data: { ...player, progressCount: state.progressPercent ? 1 : 0 } });
    }

    return fail(route, 404, `No mock for ${method} ${path}`);
  });

  return {
    requests,
    releaseRegister,
    releaseCatalog,
    setRegisterError: (error: RegisterError | null) => { state.registerError = error; },
    setCatalogError: (value: boolean) => { state.catalogError = value; },
    state,
  };
}
