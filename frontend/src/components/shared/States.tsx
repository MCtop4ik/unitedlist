import type { ReactNode } from 'react';

export function LoadingState({ label = 'LOADING' }: { label?: string }) {
  return (
    <div className="loading-page" aria-live="polite">
      {label}
      <div className="loading-lines" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton loading-line" />)}
      </div>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-banner" role="alert">
      <strong>SOURCE UNAVAILABLE</strong>
      <span>{message}</span>
      {onRetry ? <button className="button" onClick={onRetry}>RETRY →</button> : null}
    </div>
  );
}
