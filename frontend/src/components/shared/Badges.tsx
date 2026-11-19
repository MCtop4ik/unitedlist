import type { LevelZone, PlayerKind, VerificationStatus } from '@shared/types';

export function ZoneBadge({ zone }: { zone: LevelZone }) {
  return <span className={`zone-pill ${zone === 'pointercrate' ? 'pc' : zone}`}>{zone.toUpperCase()}</span>;
}

export function SourceBadge({ source, verification, playerKind }: { source: string; verification?: VerificationStatus; playerKind?: PlayerKind }) {
  const label = source === 'local' && playerKind ? playerKind.toUpperCase() : source.toUpperCase();
  const tone = source === 'local' && playerKind ? playerKind : source;
  return (
    <span className={`source-pill ${tone}`}>
      {label}
      {verification ? ` / ${verification}` : ''}
    </span>
  );
}

