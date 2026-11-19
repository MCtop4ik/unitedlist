import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Tabs, Popover, DropdownMenu, Checkbox } from '../../components/ui';
import type { Level, SourceStatus } from '@shared/types';
import { api } from '../../lib/api/client';
import { useAuth } from '../../app/providers';
import { apiZone, catalogQuery, readCatalogState, type CatalogState } from '../../lib/url-state/catalog';
import { LevelThumb } from '../../components/shared/LevelThumb';
import { ZoneBadge } from '../../components/shared/Badges';
import { EmptyState, ErrorState, LoadingState } from '../../components/shared/States';
import { LevelDialog } from '../level/LevelDialog';

const DIFFICULTIES = ['Extreme', 'Insane', 'Hard', 'Medium', 'Easy', 'Official'];
const LENGTHS = [['xl', 'XL'], ['long', 'L'], ['medium', 'M'], ['short', 'S'], ['tiny', 'T']] as const;

export function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => readCatalogState(params), [params]);
  const { session } = useAuth();
  const [search, setSearch] = useState(state.q);
  const [levels, setLevels] = useState<Level[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceStatus, setSourceStatus] = useState<SourceStatus[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<CatalogState>) => {
    const next = { ...state, ...patch };
    setParams(catalogQuery(next));
  };

  useEffect(() => {
    setSearch(state.q);
  }, [state.q]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== state.q) update({ q: search, page: 1 });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.levels({
      zone: apiZone(state),
      q: state.q,
      difficulty: state.difficulty.join(','),
      length: state.length.join(','),
      status: session ? state.status : '',
      playerId: session && state.status ? session.player.id : undefined,
      sort: state.sort,
      page: state.page,
      perPage: 20,
    })
      .then((payload) => {
        if (cancelled) return;
        setLevels(payload.data);
        setTotal(payload.total);
        setTotalPages(payload.totalPages);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load the catalog.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [state.zone, state.division, state.q, state.difficulty.join(','), state.length.join(','), state.status, state.sort, state.page, session?.player.id]);

  const loadStatus = () => {
    api.sourceStatus().then((payload) => setSourceStatus(payload.data)).catch(() => undefined);
  };
  useEffect(loadStatus, []);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if ((event.key === '/' && !typing) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const degraded = sourceStatus.filter((source) => !source.ok);
  const hero = state.zone === 'pointercrate'
    ? { eyebrow: 'ZONE / POINTERCRATE / DIFFICULTY 001–150', title: <>THE TOP<br />150.</>, copy: `The strongest levels in the game. ${state.division === 'main' ? 'Main holds positions 001–075.' : 'Extended continues positions 076–150.'}` }
    : state.zone === 'aredl'
      ? { eyebrow: 'ZONE / AREDL / EXTREME DEMONS', title: <>EXTREME.<br />OUTSIDE 150.</>, copy: 'Every rated extreme demon that is not already placed in the Pointercrate top 150.' }
      : state.zone === 'gddl'
        ? { eyebrow: 'ZONE / GDDL / THE REST OF THE LADDER', title: <>THE REST.<br />ALL LEVELS.</>, copy: 'The remaining GDDL catalog, ordered by community rating. Harder levels appear first.' }
        : { eyebrow: 'GEOMETRY DASH / UNIFIED DIFFICULTY INDEX', title: <>ONE LIST.<br />ALL DEMONS.</>, copy: 'Every ranked demon, one source of truth. Browse the global order, jump between Pointercrate, AREDL and GDDL, then open a level to see who cleared it.' };

  return (
    <main className="container">
      <section className="hero">
        <div>
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1 className="display">{hero.title}</h1>
          <p className="hero-copy">{hero.copy}</p>
        </div>
        <div className="stat-panel">
          <div className="stat"><strong>{total.toLocaleString()}</strong><span>Matching levels</span></div>
          <div className="stat"><strong>03</strong><span>Source lists</span></div>
          <div className="stat"><strong>04</strong><span>Zone views</span></div>
        </div>
      </section>

      <Tabs.Root value={state.zone} onValueChange={(zone) => update({ zone, page: 1, division: 'main' })}>
        <Tabs.List className="tabs" aria-label="Zones">
          <Tabs.Trigger className="tab" value="all">ALL</Tabs.Trigger>
          <Tabs.Trigger className="tab" value="pointercrate">POINTERCRATE</Tabs.Trigger>
          <Tabs.Trigger className="tab" value="aredl">AREDL</Tabs.Trigger>
          <Tabs.Trigger className="tab" value="gddl">GDDL</Tabs.Trigger>
          <span className="tab-note">GLOBAL ORDER / LOCAL SNAPSHOT</span>
        </Tabs.List>
        {['all', 'pointercrate', 'aredl', 'gddl'].map((zone) => (
          <Tabs.Content key={zone} value={zone} forceMount />
        ))}
      </Tabs.Root>

      {state.zone === 'pointercrate' ? (
        <Tabs.Root value={state.division} onValueChange={(division) => update({ division: division === 'extended' ? 'extended' : 'main', page: 1 })}>
          <Tabs.List className="subtabs" aria-label="Pointercrate divisions">
            <Tabs.Trigger className="subtab" value="main">MAIN / 001–075</Tabs.Trigger>
            <Tabs.Trigger className="subtab" value="extended">EXTENDED / 076–150</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="main" forceMount />
          <Tabs.Content value="extended" forceMount />
        </Tabs.Root>
      ) : null}

      <div className="toolbar">
        <div className="search">
          <svg className="search-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
            <circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="10" y1="10" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="2" />
          </svg>
          <input
            ref={searchRef}
            aria-label="Search level or author"
            placeholder="SEARCH LEVEL OR AUTHOR"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <FilterControl state={state} hasProfile={Boolean(session)} onApply={(difficulty, length, status) => update({ difficulty, length, status, page: 1 })} />
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="tool-button">SORT / {state.sort.toUpperCase()} ▾</DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="menu" align="end">
              {['global', 'zone', 'name', 'completions'].map((sort) => (
                <DropdownMenu.Item
                  key={sort}
                  className="subtab"
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: state.sort === sort ? 'var(--acid)' : 'transparent' }}
                  onSelect={() => update({ sort, page: 1 })}
                >
                  {sort.toUpperCase()}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        <span className="result-count">{total.toLocaleString()} MATCHES</span>
      </div>

      {degraded.length ? (
        <ErrorState
          message={`${degraded.map((source) => source.source.toUpperCase()).join(', ')} unavailable. Showing the last known catalog.`}
          onRetry={() => {
            loadStatus();
            api.levels({ zone: apiZone(state), page: state.page, perPage: 20 }).then((payload) => { setLevels(payload.data); setTotal(payload.total); }).catch(() => undefined);
          }}
        />
      ) : null}

      {loading ? <LoadingState label="FETCHING CATALOG" /> : null}
      {!loading && error ? <EmptyState title="CATALOG ERROR" body={error} action={<button className="button" onClick={() => update({ page: state.page })}>RETRY</button>} /> : null}
      {!loading && !error && levels.length === 0 ? (
        <EmptyState title="NO LEVELS MATCH" body="Try a shorter name, a different difficulty, or clear the zone filter." action={<button className="button" onClick={() => setParams(new URLSearchParams())}>RESET FILTERS</button>} />
      ) : null}
      {!loading && !error && levels.length > 0 ? (
        <>
          <div className="table" aria-label="Level catalog">
            <div className="table-head">
              <span>RANK</span><span aria-hidden="true" /><span>LEVEL</span><span>ZONE</span><span>DIFFICULTY</span><span>LENGTH</span><span>OPEN</span>
            </div>
            {levels.map((level) => (
              <button key={level.levelId} className="level-row" data-level-id={level.levelId} onClick={() => setSelectedLevel(level.levelId)}>
                <span className="level-rank">{String(level.globalRank).padStart(3, '0')}</span>
                <LevelThumb src={level.thumbnailUrl} name={level.name} />
                <span>
                  <span className="level-title">{level.name}</span>
                  <span className="level-meta">BY {level.author}</span>
                </span>
                <ZoneBadge zone={level.zone} />
                <span className="num difficulty-cell">{level.difficulty.toUpperCase()}</span>
                <span className="num length-cell">{level.length.toUpperCase()}</span>
                <span className="num row-open" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
          <Pagination page={state.page} totalPages={totalPages} total={total} onChange={(page) => update({ page })} />
        </>
      ) : null}

      {selectedLevel ? <LevelDialog levelId={selectedLevel} onClose={() => setSelectedLevel(null)} /> : null}
    </main>
  );
}

function FilterControl({ state, hasProfile, onApply }: { state: CatalogState; hasProfile: boolean; onApply: (difficulty: string[], length: string[], status: string) => void }) {
  const [open, setOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<string[]>(state.difficulty);
  const [length, setLength] = useState<string[]>(state.length);
  const [status, setStatus] = useState(state.status);

  useEffect(() => {
    setDifficulty(state.difficulty);
    setLength(state.length);
    setStatus(state.status);
  }, [state.difficulty.join(','), state.length.join(','), state.status]);

  const toggle = (values: string[], value: string) => values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
  const activeCount = difficulty.length + length.length + (status ? 1 : 0);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="tool-button">FILTERS {activeCount ? activeCount : ''} ▾</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="popover" align="start">
          <strong className="mono">FILTERS / {activeCount} ACTIVE</strong>
          <p className="helper">DIFFICULTY</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DIFFICULTIES.map((value) => (
              <label key={value} style={{ display: 'flex', gap: 6, alignItems: 'center', fontFamily: 'var(--mono)', fontSize: 9 }}>
                <Checkbox.Root className="page-btn" style={{ width: 18, height: 18 }} checked={difficulty.includes(value)} onCheckedChange={() => setDifficulty((current) => toggle(current, value))}>
                  <Checkbox.Indicator>✓</Checkbox.Indicator>
                </Checkbox.Root>
                {value.toUpperCase()}
              </label>
            ))}
          </div>
          <p className="helper">LENGTH</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {LENGTHS.map(([value, label]) => (
              <label key={value} style={{ display: 'flex', gap: 6, alignItems: 'center', fontFamily: 'var(--mono)', fontSize: 9 }}>
                <Checkbox.Root className="page-btn" style={{ width: 18, height: 18 }} checked={length.includes(value)} onCheckedChange={() => setLength((current) => toggle(current, value))}>
                  <Checkbox.Indicator>✓</Checkbox.Indicator>
                </Checkbox.Root>
                {label}
              </label>
            ))}
          </div>
          <p className="helper">COMPLETION STATUS</p>
          {hasProfile ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="tool-button" style={{ width: '100%' }}>{status ? status.toUpperCase() : 'ANY'} ▾</DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="menu" align="start">
                  {[{ value: '', label: 'ANY' }, { value: 'completed', label: 'COMPLETED' }, { value: 'in-progress', label: 'IN PROGRESS' }].map((item) => (
                    <DropdownMenu.Item key={item.value || 'any'} className="subtab menu-item" onSelect={() => setStatus(item.value)}>{item.label}</DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <>
              <p className="helper">SIGN IN TO FILTER BY COMPLETION STATUS.</p>
              <Link className="button" to="/profile" style={{ display: 'inline-flex', alignItems: 'center' }}>SIGN IN →</Link>
            </>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="button" onClick={() => { setDifficulty([]); setLength([]); setStatus(''); }}>RESET</button>
            <button className="button primary" style={{ flex: 1 }} onClick={() => { onApply(difficulty, length, status); setOpen(false); }}>APPLY</button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Pagination({ page, totalPages, total, onChange }: { page: number; totalPages: number; total: number; onChange: (page: number) => void }) {
  const visible = new Set<number>([1, totalPages]);
  for (let value = page - 2; value <= page + 2; value += 1) {
    if (value >= 1 && value <= totalPages) visible.add(value);
  }
  const sorted = [...visible].sort((a, b) => a - b);
  const items: (number | string)[] = [];
  let previous: number | null = null;
  sorted.forEach((value) => {
    if (previous !== null && value - previous > 1) items.push('gap');
    items.push(value);
    previous = value;
  });
  return (
    <div className="pagination">
      <span>SHOWING PAGE {page} OF {totalPages} / {total.toLocaleString()}</span>
      <span className="spacer" />
      <button className="page-btn" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}>←</button>
      {items.map((item, index) => typeof item === 'number'
        ? <button key={item} className="page-btn" aria-current={item === page ? 'page' : undefined} onClick={() => onChange(item)}>{item}</button>
        : <span key={`gap-${index}`} className="page-gap" aria-hidden="true">…</span>)}
      <button className="page-btn" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}>→</button>
    </div>
  );
}
