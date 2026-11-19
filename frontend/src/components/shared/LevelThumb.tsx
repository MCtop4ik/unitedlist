import { useState } from 'react';

export function LevelThumb({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div className="level-thumb" aria-label={`${name}: no preview`}>NO PREVIEW</div>;
  }
  return (
    <div className="level-thumb">
      <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} width={72} height={40} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}
