import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { ImportedCompletion, Level, SourceStatus, Zone } from '../../../shared/types.js';
import { aredlLevels } from './sources/aredl.js';
import { pointercrateLevelCompletions, pointercrateLevels } from './sources/pointercrate.js';
import type { SourceLevel } from './sources/types.js';

type CatalogLoader = () => Promise<SourceLevel[]>;
interface ImportedRow { id: string; levelId: number; source: 'pointercrate' | 'aredl' | 'gddl'; playerName: string; percent: number; completedAt: string | null; proofUrl: string | null; verificationStatus: 'verified' | 'stat' | 'unknown'; }

export class LiveCatalog {
  levels: Level[] = [];
  byId = new Map<number, Level>();
  imported = new Map<number, ImportedCompletion[]>();
  sourceStatus: SourceStatus[] = [
    { source: 'pointercrate', ok: true, lastUpdated: new Date().toISOString(), stale: false },
    { source: 'aredl', ok: true, lastUpdated: new Date().toISOString(), stale: false },
    { source: 'gddl', ok: true, lastUpdated: new Date().toISOString(), stale: false },
  ];
  lastFetched = 0;
  private refreshing = false;
  private loader: CatalogLoader;
  private ttlMs: number;
  private liveCompletionLoader?: (level: Level) => Promise<ImportedCompletion[]>;
  private liveCompletions = new Map<number, { at: number; rows: ImportedCompletion[] }>();
  private liveRequests = new Map<number, Promise<ImportedCompletion[]>>();

  constructor(options: { levels: Level[]; imported?: ImportedCompletion[]; loader?: CatalogLoader; liveCompletions?: (level: Level) => Promise<ImportedCompletion[]>; ttlMs?: number }) {
    this.levels = [...options.levels].sort((a, b) => a.globalRank - b.globalRank);
    this.byId = new Map(this.levels.map((level) => [level.levelId, level]));
    for (const row of options.imported ?? []) {
      const list = this.imported.get(row.levelId) ?? [];
      list.push(row);
      this.imported.set(row.levelId, list);
    }
    this.loader = options.loader ?? (async () => this.levels.map((level) => ({ ...level })));
    this.liveCompletionLoader = options.liveCompletions;
    this.ttlMs = options.ttlMs ?? 10 * 60 * 1000;
    this.lastFetched = Date.now();
  }

  static fromSnapshot(options: { ttlMs?: number } = {}) {
    const levels = JSON.parse(readFileSync(fileURLToPath(new URL('../../../data/levels.json', import.meta.url)), 'utf8')).levels as Level[];
    let imported: ImportedCompletion[] = [];
    try {
      const mock = JSON.parse(readFileSync(fileURLToPath(new URL('../../../data/mock-db.json', import.meta.url)), 'utf8')) as { imported?: ImportedRow[] };
      imported = (mock.imported ?? []).map((row) => ({ ...row, recordType: 'imported' as const }));
    } catch { /* imported snapshot is optional */ }
    const gddl = levels.filter((level) => level.zone === 'gddl');
    const loader = async () => {
      const pc = await pointercrateLevels();
      const pcIds = new Set(pc.map((level) => level.levelId));
      const aredl = await aredlLevels(pcIds);
      return [...pc, ...aredl, ...gddl];
    };
    return new LiveCatalog({ levels, imported, loader, liveCompletions: pointercrateLevelCompletions, ttlMs: options.ttlMs });
  }

  maybeRefresh() {
    if (this.refreshing || Date.now() - this.lastFetched < this.ttlMs) return;
    this.refreshing = true;
    this.loader()
      .then((levels) => this.replace(levels))
      .catch(() => { this.sourceStatus = this.sourceStatus.map((row) => ({ ...row, ok: false, stale: true })); })
      .finally(() => { this.refreshing = false; });
  }

  async refreshNow() {
    const levels = await this.loader();
    this.replace(levels);
    return this.levels;
  }

  private replace(levels: SourceLevel[]) {
    const unique = new Map<number, Level>();
    for (const level of levels) {
      if (!unique.has(level.levelId)) unique.set(level.levelId, { ...level, globalRank: 0, completionCount: 0, song: null });
    }
    const ordered = [...unique.values()];
    const priority: Record<string, number> = { pointercrate: 0, aredl: 1, gddl: 2 };
    ordered.sort((a, b) => priority[a.zone]! - priority[b.zone]! || a.zoneRank - b.zoneRank || a.levelId - b.levelId);
    ordered.forEach((level, index) => { level.globalRank = index + 1; });
    this.levels = ordered;
    this.byId = new Map(ordered.map((level) => [level.levelId, level]));
    this.lastFetched = Date.now();
    this.sourceStatus = this.sourceStatus.map((row) => ({ ...row, ok: true, stale: false, lastUpdated: new Date().toISOString() }));
  }

  get(levelId: number) {
    return this.byId.get(levelId) ?? null;
  }

  completionsFor(levelId: number): ImportedCompletion[] {
    return this.imported.get(levelId) ?? [];
  }

  async fetchCompletions(levelId: number): Promise<ImportedCompletion[]> {
    const level = this.get(levelId);
    if (!level || !this.liveCompletionLoader || level.zone !== 'pointercrate') return this.completionsFor(levelId);
    const cached = this.liveCompletions.get(levelId);
    if (cached && Date.now() - cached.at < 10_000) return cached.rows;
    const pending = this.liveRequests.get(levelId);
    if (pending) return pending;
    const request = this.liveCompletionLoader(level)
      .then((rows) => {
        this.liveCompletions.set(levelId, { at: Date.now(), rows });
        return rows;
      })
      .catch(() => cached?.rows ?? this.completionsFor(levelId))
      .finally(() => { this.liveRequests.delete(levelId); });
    this.liveRequests.set(levelId, request);
    return request;
  }

  list(query: any, filters?: { completed?: Set<number>; progress?: Set<number> }) {
    this.maybeRefresh();
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(query.perPage ?? 50)));
    const zone = String(query.zone ?? 'all');
    const q = String(query.q ?? '').toLowerCase();
    let items = this.levels.filter((level) => {
      if (!level.difficulty || Number(level.difficulty) === 0) return false;
      if (zone === 'pointercrate-main' && !(level.zone === 'pointercrate' && level.zoneRank <= 75)) return false;
      if (zone === 'pointercrate-extended' && !(level.zone === 'pointercrate' && level.zoneRank > 75)) return false;
      if (zone !== 'all' && zone !== 'pointercrate-main' && zone !== 'pointercrate-extended' && level.zone !== zone) return false;
      if (q && !`${level.name} ${level.author}`.toLowerCase().includes(q)) return false;
      const difficulties = String(query.difficulty ?? '').split(',').filter(Boolean);
      if (difficulties.length && !difficulties.includes(level.difficulty)) return false;
      const lengths = String(query.length ?? '').split(',').filter(Boolean);
      if (lengths.length && !lengths.includes(level.length)) return false;
      if (query.status === 'completed' && !filters?.completed?.has(level.levelId)) return false;
      if (query.status === 'in-progress') {
        if (!filters?.progress?.has(level.levelId)) return false;
        if (filters?.completed?.has(level.levelId)) return false;
      }
      return true;
    });
    const sort = String(query.sort ?? 'global');
    if (sort === 'name') items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'completions') items = [...items].sort((a, b) => b.completionCount - a.completionCount);
    else if (sort === 'zone') items = [...items].sort((a, b) => a.zoneRank - b.zoneRank);
    const total = items.length;
    return { data: items.slice((page - 1) * perPage, page * perPage), page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) };
  }

  getDetail(levelId: number, localCount: number, imported = this.completionsFor(levelId)) {
    const level = this.get(levelId);
    if (!level) return null;
    return {
      level: { ...level, completionCount: localCount + imported.length },
      zoneView: level.zone === 'pointercrate' ? (level.zoneRank <= 75 ? 'pointercrate-main' : 'pointercrate-extended') : level.zone as Zone,
      completionCount: localCount + imported.length,
      localCompletionCount: localCount,
      importedCompletionCount: imported.length,
    };
  }
}

