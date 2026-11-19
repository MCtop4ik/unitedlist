import { useCallback, useEffect, useState } from 'react';
import { Tabs } from '../../components/ui';
import type { Completion, Level, Player, Progress } from '@shared/types';
import { api } from '../../lib/api/client';
import { useAuth } from '../../app/providers';
import { onRecordsChanged } from '../../lib/events/records';
import { EmptyState, LoadingState } from '../../components/shared/States';
import { AuthDialog, type AuthMode } from '../auth/AuthDialog';

type ProgressWithLevel = Progress & { level: Level | null };

export function ProfilePage() {
  const { session, status } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [player, setPlayer] = useState<Player | null>(null);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [progress, setProgress] = useState<ProgressWithLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerId = session?.player.id;

  const load = useCallback(() => {
    if (!playerId) return;
    setLoading(true);
    setError(null);
    Promise.all([api.player(playerId), api.playerCompletions(playerId), api.playerProgress(playerId)])
      .then(([profile, completionResponse, progressResponse]) => {
        setPlayer(profile.data);
        setCompletions(completionResponse.data);
        setProgress(progressResponse.data);
      })
      .catch((err: unknown) => {
        setPlayer(null);
        setError(err instanceof Error ? err.message : 'Unable to load profile.');
      })
      .finally(() => setLoading(false));
  }, [playerId]);

  useEffect(load, [load]);
  useEffect(() => onRecordsChanged(load), [load]);

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  if (status === 'loading') return <main className="container"><LoadingState label="CHECKING SESSION" /></main>;

  if (!session) {
    return (
      <main className="container" style={{ paddingTop: 48 }}>
        <p className="eyebrow">ACCOUNT / SERVER-BACKED PROFILE</p>
        <h1 className="profile-title">SIGN IN /<br />SAVE YOUR RECORDS.</h1>
        <p className="section-copy">Create an account to record progress and completions. Your records follow you to any device.</p>
        <EmptyState
          title="ACCOUNT REQUIRED"
          body="Sign in to see your profile, or create an account to start recording."
          action={(
            <div className="actions" style={{ justifyContent: 'flex-start' }}>
              <button className="button primary" onClick={() => openAuth('signin')}>SIGN IN</button>
              <button className="button" onClick={() => openAuth('register')}>CREATE ACCOUNT</button>
            </div>
          )}
        />
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} initialMode={authMode} />
      </main>
    );
  }

  if (loading) return <main className="container"><LoadingState label="LOADING PROFILE" /></main>;

  if (!player) {
    return (
      <main className="container" style={{ paddingTop: 48 }}>
        <EmptyState
          title="PROFILE UNAVAILABLE"
          body={error ?? 'The account profile could not be loaded.'}
          action={<button className="button" onClick={load}>RETRY</button>}
        />
      </main>
    );
  }

  return (
    <main className="container">
      <section className="profile-hero">
        <div>
          <p className="eyebrow">ACCOUNT PROFILE / SERVER-BACKED</p>
          <h1 className="profile-title">{player.displayName}</h1>
          <div className="badge-row">
            <span className="helper">SINCE {new Date(player.createdAt).toLocaleDateString('en-GB')} / CROSS-DEVICE</span>
          </div>
        </div>
        <div className="stat-cards">
          <div className="stat-card"><strong>{String(player.completionCount ?? 0).padStart(3, '0')}</strong><span>COMPLETIONS</span></div>
          <div className="stat-card"><strong>{String(player.progressCount ?? 0).padStart(3, '0')}</strong><span>IN PROGRESS</span></div>
          <div className="stat-card"><strong>{player.bestCompletion ? `#${player.bestCompletion.globalRank}` : '—'}</strong><span>BEST CLEAR</span></div>
        </div>
      </section>

      <Tabs.Root defaultValue="overview">
        <Tabs.List className="tabs simple profile-tabs" aria-label="Profile sections">
          <Tabs.Trigger className="tab" value="overview">OVERVIEW</Tabs.Trigger>
          <Tabs.Trigger className="tab" value="completions">COMPLETIONS / {String(completions.length).padStart(3, '0')}</Tabs.Trigger>
          <Tabs.Trigger className="tab" value="progress">PROGRESS / {String(progress.length).padStart(3, '0')}</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="overview">
          <div className="profile-grid">
            <section>
              <h2 className="section-title">RECENT COMPLETIONS</h2>
              <p className="helper">NEWEST FIRST / ACCOUNT RECORDS</p>
              <CompletionTable items={completions.slice(0, 6)} />
            </section>
            <section className="panel dark">
              <div className="panel-head">IN PROGRESS / BEST % PER LEVEL</div>
              {progress.length === 0 ? <p className="helper" style={{ padding: 16 }}>NOTHING IN PROGRESS</p> : progress.slice(0, 5).map((item) => (
                <div key={item.id} className="progress-item">
                  <div className="progress-item-head"><span>{item.level?.name ?? `LEVEL ${item.levelId}`}</span><span>{item.percent}%</span></div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${item.percent}%` }} /></div>
                </div>
              ))}
            </section>
          </div>
        </Tabs.Content>
        <Tabs.Content value="completions">
          <h2 className="section-title">ALL COMPLETIONS</h2>
          <CompletionTable items={completions} />
        </Tabs.Content>
        <Tabs.Content value="progress">
          <h2 className="section-title">CURRENT PROGRESS</h2>
          <div className="panel">
            {progress.length === 0 ? <p className="helper" style={{ padding: 16 }}>NO PROGRESS RECORDED</p> : progress.map((item) => (
              <div key={item.id} className="progress-item">
                <div className="progress-item-head"><span>{item.level?.name ?? `LEVEL ${item.levelId}`}</span><span>{item.percent}%</span></div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${item.percent}%` }} /></div>
              </div>
            ))}
          </div>
        </Tabs.Content>
      </Tabs.Root>

      <p className="helper" style={{ marginTop: 24 }}>ACCOUNT PROFILE / CROSS-DEVICE / SERVER-BACKED</p>
    </main>
  );
}

function CompletionTable({ items }: { items: Completion[] }) {
  if (items.length === 0) return <p className="helper">NO COMPLETIONS YET</p>;
  return (
    <div className="panel">
      {items.map((item) => (
        <div key={item.id} className="list-row">
          <span className="mono muted">{item.recordType === 'local' ? 'ACCOUNT' : item.source.toUpperCase()}</span>
          <span><strong>{item.recordType === 'local' ? (item.levelName ?? `LEVEL ${item.levelId}`) : item.playerName}</strong></span>
          <span className="mono">{item.completedAt ? new Date(item.completedAt).toLocaleDateString('en-GB') : '—'}</span>
          <span className="mono" style={{ textAlign: 'right' }}>{item.recordType === 'local' ? '—' : item.verificationStatus.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}
