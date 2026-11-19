import { useEffect, useState } from 'react';
import { AlertDialog, Dialog, Slider } from '../../components/ui';
import type { Completion, LevelDetail } from '@shared/types';
import { api } from '../../lib/api/client';
import { useAuth, useToast } from '../../app/providers';
import { ApiRequestError } from '../../lib/api/client';
import { emitRecordsChanged } from '../../lib/events/records';
import { SourceBadge, ZoneBadge } from '../../components/shared/Badges';
import { AuthGateDialog } from '../onboarding/OnboardingDialogs';
import { AuthDialog, type AuthMode } from '../auth/AuthDialog';

export function LevelDialog({ levelId, onClose }: { levelId: number; onClose: () => void }) {
  const { session, signOut } = useAuth();
  const { pushToast } = useToast();
  const [detail, setDetail] = useState<LevelDetail | null>(null);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [percent, setPercent] = useState(1);
  const [myProgress, setMyProgress] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    const playerId = session?.player.id;
    const playerProgress = playerId ? api.playerProgress(playerId) : Promise.resolve(null);
    const playerCompletions = playerId ? api.playerCompletions(playerId) : Promise.resolve(null);
    Promise.all([api.level(levelId), api.completions(levelId), playerProgress, playerCompletions])
      .then(([levelResponse, completionResponse, progressResponse, playerCompletionResponse]) => {
        setDetail(levelResponse.data);
        setCompletions(completionResponse.data);
        const storedProgress = progressResponse?.data.find((item) => item.levelId === levelId)?.percent ?? null;
        setMyProgress(storedProgress);
        setPercent(storedProgress ?? 1);
        setIsCompleted(Boolean(playerCompletionResponse?.data.some((item) => item.recordType === 'local' && item.levelId === levelId)));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to load level.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [levelId, session?.player.id]);

  const ensureProfile = (action: () => void) => {
    if (!session?.token) {
      setGateOpen(true);
      return;
    }
    action();
  };

  const recordCompletion = async () => {
    if (!session || !detail) return;
    setSaving(true);
    try {
      await api.completeLevel(session.token, detail.level.levelId);
      pushToast('COMPLETION SAVED', `${detail.level.name} / account record`);
      emitRecordsChanged();
      setConfirmOpen(false);
      load();
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) { signOut(); setGateOpen(true); }
      pushToast('COMPLETION FAILED', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveProgress = async () => {
    if (!session || !detail) return;
    setSaving(true);
    try {
      await api.saveProgress(session.token, detail.level.levelId, percent);
      pushToast('PROGRESS SAVED', `${detail.level.name} / ${percent}% / no points`);
      emitRecordsChanged();
      setProgressOpen(false);
      load();
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) { signOut(); setGateOpen(true); }
      pushToast('PROGRESS FAILED', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog" aria-describedby="level-description" onCloseAutoFocus={(event) => { event.preventDefault(); document.querySelector<HTMLElement>(`[data-level-id="${levelId}"]`)?.focus(); }}>
            <div className="dialog-head">
              <span className="mono">LEVEL / {detail ? String(detail.level.globalRank).padStart(3, '0') : '—'}</span>
              <Dialog.Title>{detail?.level.name ?? 'LOADING'}</Dialog.Title>
              <Dialog.Close className="dialog-close" aria-label="Close">×</Dialog.Close>
            </div>
            <div className="dialog-body">
              {loading ? <p className="mono">LOADING LEVEL…</p> : null}
              {error ? <p className="form-error">{error}</p> : null}
              {detail ? (
                <div className="dialog-grid">
                  <div>
                    <div className="detail-image">
                      {detail.level.thumbnailUrl ? <img src={detail.level.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'NO PREVIEW'}
                    </div>
                    <p className="helper" style={{ marginTop: 8 }}>PREVIEW / SOURCE SNAPSHOT</p>
                    <dl className="meta-grid">
                      <div><dt>AUTHOR</dt><dd>{detail.level.author}</dd></div>
                      <div><dt>ZONE</dt><dd>{detail.zoneView.replace('-', ' ')}</dd></div>
                      <div><dt>GLOBAL</dt><dd>#{detail.level.globalRank}</dd></div>
                      <div><dt>ZONE RANK</dt><dd>#{detail.level.zoneRank}</dd></div>
                      <div><dt>LENGTH</dt><dd>{detail.level.length}</dd></div>
                      <div><dt>COMPLETIONS</dt><dd>{detail.completionCount.toLocaleString()}</dd></div>
                    </dl>
                  </div>
                  <div>
                    <h2 className="detail-title">{detail.level.name}</h2>
                    <p className="detail-by">BY {detail.level.author}</p>
                    <div className="badge-row">
                      <ZoneBadge zone={detail.level.zone} />
                      <span className="status-pill">{detail.level.difficulty}</span>
                      <span className="status-pill">{detail.level.length.toUpperCase()}</span>
                    </div>
                    <p id="level-description" className="section-copy">
                      {detail.importedCompletionCount.toLocaleString()} imported community records and{' '}
                      {detail.localCompletionCount} account records. Imported entries are read-only and never enter the site board.
                    </p>
                    <div className="progress-item" style={{ padding: 0 }}>
                      <div className="progress-item-head"><span>YOUR BEST / {isCompleted ? 'COMPLETED' : myProgress != null ? `${myProgress}%` : '—'}</span><span>{session ? session.player.displayName : 'SIGNED OUT'}</span></div>
                      <div className="progress-track"><div className="progress-fill" style={{ width: `${isCompleted ? 100 : myProgress ?? 0}%` }} /></div>
                    </div>
                    <div className="actions">
                      <button className="button primary" disabled={isCompleted} onClick={() => ensureProfile(() => setConfirmOpen(true))}>{isCompleted ? 'ALREADY COMPLETED' : 'RECORD COMPLETION'}</button>
                      <button className="button" disabled={isCompleted} onClick={() => ensureProfile(() => setProgressOpen(true))}>UPDATE PROGRESS</button>
                    </div>
                    <div className="completion-list">
                      <div className="completion-row" style={{ fontWeight: 700 }}>
                        <span>PLAYER</span><span>SOURCE</span>
                      </div>
                      {completions.map((record) => (
                        <div key={record.id} className="completion-row">
                          <span className="completion-name">
                            {record.playerName}
                            {record.recordType === 'local' ? <span className="level-meta">{record.playerStatus}</span> : null}
                          </span>
                          {record.recordType === 'local'
                            ? <SourceBadge source="local" playerKind={record.playerKind} />
                            : <SourceBadge source={record.source} verification={record.verificationStatus} />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="dialog-overlay" />
          <AlertDialog.Content className="dialog small">
            <div className="dialog-head"><AlertDialog.Title>MARK AS COMPLETED?</AlertDialog.Title></div>
            <div className="dialog-body">
              <p className="section-copy">
                Record <strong>{detail?.level.name}</strong> as completed? This action cannot be undone
                from the player UI; corrections require an administrator.
              </p>
              <div className="actions">
                <AlertDialog.Cancel className="button">CANCEL</AlertDialog.Cancel>
                <button className="button primary" disabled={saving} onClick={recordCompletion}>{saving ? 'SAVING…' : 'CONFIRM COMPLETION'}</button>
              </div>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      <Dialog.Root open={progressOpen} onOpenChange={setProgressOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog small">
            <div className="dialog-head"><Dialog.Title>UPDATE BEST PROGRESS</Dialog.Title><Dialog.Close className="dialog-close">×</Dialog.Close></div>
            <div className="dialog-body">
              <div className="field">
                <label htmlFor="progress-value">BEST PERCENT / 1–99</label>
                <input id="progress-value" type="number" min={1} max={99} value={percent} onChange={(event) => setPercent(Math.max(1, Math.min(99, Number(event.target.value))))} />
              </div>
              <Slider.Root value={[percent]} min={1} max={99} step={1} onValueChange={([value]) => setPercent(value ?? 1)} style={{ marginTop: 20 }}>
                <Slider.Track style={{ position: 'relative', height: 10, border: 'var(--border)', background: 'var(--cream)' }}>
                  <Slider.Range style={{ position: 'absolute', height: '100%', background: 'var(--acid)' }} />
                </Slider.Track>
                <Slider.Thumb style={{ display: 'block', width: 20, height: 28, background: 'var(--ink)', border: 'var(--border)' }} aria-label="Progress percent" />
              </Slider.Root>
              <p className="helper">LOWER VALUES NEVER REPLACE THE BEST / PROGRESS AWARDS NO POINTS</p>
              <div className="actions">
                <Dialog.Close className="button">CANCEL</Dialog.Close>
                <button className="button primary" style={{ flex: 1 }} disabled={saving} onClick={saveProgress}>{saving ? 'SAVING…' : `SAVE ${percent}%`}</button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AuthGateDialog
        open={gateOpen}
        onOpenChange={setGateOpen}
        onSignIn={() => { setGateOpen(false); setAuthMode('signin'); }}
        onCreate={() => { setGateOpen(false); setAuthMode('register'); }}
      />
      <AuthDialog
        open={authMode !== null}
        onOpenChange={(open) => { if (!open) setAuthMode(null); }}
        initialMode={authMode ?? 'signin'}
      />
    </>
  );
}
