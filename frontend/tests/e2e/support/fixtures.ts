export const grief = {
  levelId: 149992717,
  name: 'GRIEF',
  author: 'icedcave',
  zone: 'pointercrate' as const,
  zoneRank: 1,
  globalRank: 1,
  difficulty: 'Extreme',
  length: 'xl' as const,
  thumbnailUrl: null,
  videoUrl: null,
  song: null,
  completionCount: 0,
};

export const artemis = {
  levelId: 148598469,
  name: 'Artemis 13',
  author: 'Mvngo',
  zone: 'pointercrate' as const,
  zoneRank: 2,
  globalRank: 2,
  difficulty: 'Extreme',
  length: 'xl' as const,
  thumbnailUrl: null,
  videoUrl: null,
  song: null,
  completionCount: 0,
};

export const sourceStatus = [
  { source: 'pointercrate' as const, ok: true, lastUpdated: '2026-11-19T00:00:00.000Z', stale: false },
  { source: 'aredl' as const, ok: true, lastUpdated: '2026-11-19T00:00:00.000Z', stale: false },
  { source: 'gddl' as const, ok: true, lastUpdated: '2026-11-19T00:00:00.000Z', stale: false },
];

export function levelPage(levels = [grief, artemis]) {
  return { data: levels, page: 1, perPage: 20, total: levels.length, totalPages: 1 };
}

export function emptyPage() {
  return { data: [], page: 1, perPage: 20, total: 0, totalPages: 1 };
}

export function levelDetail(level = grief) {
  return {
    data: {
      level,
      zoneView: 'pointercrate-main',
      completionCount: 0,
      localCompletionCount: 0,
      importedCompletionCount: 0,
    },
  };
}

export function playerProfile(displayName: string, progressCount = 0) {
  return {
    id: 'acct_mock',
    displayName,
    createdAt: '2026-11-19T00:00:00.000Z',
    completionCount: 0,
    progressCount,
    bestCompletion: null,
  };
}
