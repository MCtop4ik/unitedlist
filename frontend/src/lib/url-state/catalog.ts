export interface CatalogState {
  zone: string;
  division: 'main' | 'extended';
  q: string;
  difficulty: string[];
  length: string[];
  status: string;
  sort: string;
  page: number;
}

export function readCatalogState(search: URLSearchParams): CatalogState {
  return {
    zone: search.get('zone') ?? 'all',
    division: search.get('division') === 'extended' ? 'extended' : 'main',
    q: search.get('q') ?? '',
    difficulty: (search.get('difficulty') ?? '').split(',').filter(Boolean),
    length: (search.get('length') ?? '').split(',').filter(Boolean),
    status: search.get('status') ?? '',
    sort: search.get('sort') ?? 'global',
    page: Math.max(1, Number(search.get('page') ?? 1)),
  };
}

export function catalogQuery(state: CatalogState) {
  const query = new URLSearchParams();
  if (state.zone !== 'all') query.set('zone', state.zone);
  if (state.zone === 'pointercrate') query.set('division', state.division);
  if (state.q) query.set('q', state.q);
  if (state.difficulty.length) query.set('difficulty', state.difficulty.join(','));
  if (state.length.length) query.set('length', state.length.join(','));
  if (state.status) query.set('status', state.status);
  if (state.sort !== 'global') query.set('sort', state.sort);
  if (state.page > 1) query.set('page', String(state.page));
  return query;
}

export function apiZone(state: CatalogState) {
  if (state.zone === 'pointercrate') {
    return state.division === 'extended' ? 'pointercrate-extended' : 'pointercrate-main';
  }
  return state.zone;
}
