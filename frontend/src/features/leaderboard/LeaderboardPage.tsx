import { useCallback, useEffect, useState } from 'react';
import type { LeaderboardEntry } from '@shared/types';
import { api } from '../../lib/api/client';
import { useAuth } from '../../app/providers';
import { onRecordsChanged } from '../../lib/events/records';
import { StatusBadge } from '../../components/shared/Badges';
import { EmptyState, LoadingState } from '../../components/shared/States';

export function LeaderboardPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<LeaderboardEntry[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [you, setYou] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.leaderboard()
      .then(async (payload) => {
        setItems(payload.data);
        setTotalPages(payload.totalPages);
        setTotal(payload.total);
        setError(null);
        if (session && !payload.data.some((item) => item.playerId === session.player.id)) {
          const profile = await api.player(session.player.id);
          setYou({
            rank: profile.data.leaderboardRank ?? 0,
            playerId: profile.data.id,
            displayName: profile.data.displayName,
            playerKind: 'account',
            points: profile.data.points,
            status: profile.data.status,
            completionCount: profile.data.completionCount ?? 0,
          });
        } else {
          setYou(null);
        }
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to load leaderboard.'))
      .finally(() => setLoading(false));
  }, [session?.player.id]);

  useEffect(load, [load]);
  useEffect(() => onRecordsChanged(load), [load]);

  return (
    <main className="container">
      <section className="hero">
        <div>
          <p className="eyebrow">RANKING / ACCOUNT PLAYERS</p>
          <h1 className="display">SITE BOARD.</h1>
          <p className="hero-copy">
            Points come from completions recorded by site accounts. Imported community
            records are statistics, not leaderboard entries.
          </p>
        </div>
        <div className="stat-panel">
          <div className="stat"><strong>{total.toLocaleString()}</strong><span>ACCOUNT PLAYERS</span></div>
          <div className="stat"><strong>{items[0]?.points.toLocaleString() ?? '0'}</strong><span>TOP SCORE</span></div>
          <div className="stat"><strong>{String(totalPages).padStart(2, '0')}</strong><span>PAGES</span></div>
        </div>
      </section>

      <div className="leaderboard-notice">IMPORTED RECORDS ARE NOT RANKED / SOURCE LABELS STAY ON LEVEL PAGES</div>

      {loading ? <LoadingState label="LOADING LEADERBOARD" /> : null}
      {!loading && error ? <EmptyState title="LEADERBOARD ERROR" body={error} action={<button className="button" onClick={load}>RETRY</button>} /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState title="NO PLAYERS YET" body="Create an account and record a completion to enter the site board." /> : null}
      {!loading && !error && items.length > 0 ? (
        <div className="table" style={{ marginTop: 16 }}>
          <div className="table-head" style={{ gridTemplateColumns: '56px 1fr 150px 150px 120px 90px' }}>
            <span>RANK</span><span>PLAYER</span><span>STATUS</span><span>POINTS</span><span>COMPLETIONS</span><span>TREND</span>
          </div>
          {items.map((item) => (
            <div key={item.playerId} className={`lb-row ${item.playerId === session?.player.id ? 'you' : ''}`}>
              <span className="lb-rank">{String(item.rank).padStart(2, '0')}</span>
              <span><span className="lb-name">{item.displayName}</span><span className="level-meta">{item.playerKind === 'legacy' ? 'LEGACY PROFILE' : 'ACCOUNT'} / POINTS FROM COMPLETIONS</span></span>
              <StatusBadge status={item.status} />
              <span className="lb-points">{item.points.toLocaleString()}</span>
              <span className="num completion-cell">{item.completionCount}<small>CLEARS</small></span>
              <span className="mono trend-cell">—</span>
            </div>
          ))}
          {you ? <div className="lb-row you"><span className="lb-rank">#{String(you.rank).padStart(3, '0')}</span><span><span className="lb-name">{you.displayName}</span><span className="level-meta">YOUR POSITION / OUTSIDE THIS PAGE</span></span><StatusBadge status={you.status} /><span className="lb-points">{you.points.toLocaleString()}</span><span className="num completion-cell">{you.completionCount}<small>CLEARS</small></span><span className="mono trend-cell">—</span></div> : null}
        </div>
      ) : null}
    </main>
  );
}
