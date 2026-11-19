import type { LevelZone, VerificationStatus } from '../../../../shared/types.js';

export interface SourceLevel {
  levelId: number;
  name: string;
  author: string;
  zone: LevelZone;
  zoneRank: number;
  difficulty: string;
  length: 'tiny' | 'short' | 'medium' | 'long' | 'xl';
  thumbnailUrl: string | null;
  videoUrl: string | null;
}
export interface SourceCompletion {
  id: string;
  source: 'pointercrate' | 'aredl' | 'gddl';
  playerName: string;
  levelId: number;
  percent: number;
  completedAt: string | null;
  proofUrl: string | null;
  verificationStatus: VerificationStatus;
}
export interface SourceSnapshot {
  levels: SourceLevel[];
  completions: SourceCompletion[];
  fetched: Record<'pointercrate' | 'aredl' | 'gddl', number>;
}
