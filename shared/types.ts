export type Zone =
  | 'all'
  | 'pointercrate-main'
  | 'pointercrate-extended'
  | 'aredl'
  | 'gddl';

export type PlayerKind = 'account' | 'legacy';
export type LevelZone = 'pointercrate' | 'aredl' | 'gddl';
export type Status = 'ROOKIE' | 'PLAYER' | 'SKILLED' | 'EXTREME' | 'LEGEND';
export type Length = 'tiny' | 'short' | 'medium' | 'long' | 'xl';
export type VerificationStatus = 'verified' | 'stat' | 'unknown';

export interface Level {
  levelId: number;
  name: string;
  author: string;
  zone: LevelZone;
  zoneRank: number;
  globalRank: number;
  difficulty: string;
  length: Length;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  song: string | null;
  completionCount: number;
}

export interface LocalCompletion {
  id: string;
  recordType: 'local';
  playerId: string;
  playerName: string;
  playerKind: PlayerKind;
  playerStatus: Status;
  playerPoints: number;
  levelId: number;
  levelName?: string | null;
  percent: 100;
  completedAt: string;
  videoUrl: string | null;
}

export interface ImportedCompletion {
  id: string;
  recordType: 'imported';
  source: 'pointercrate' | 'aredl' | 'gddl';
  playerName: string;
  levelId: number;
  percent: number;
  completedAt: string | null;
  proofUrl: string | null;
  verificationStatus: VerificationStatus;
}

export type Completion = LocalCompletion | ImportedCompletion;

export interface Player {
  id: string;
  displayName: string;
  points: number;
  status: Status;
  createdAt: string;
  leaderboardRank: number | null;
  completionCount?: number;
  progressCount?: number;
  bestCompletion?: Level | null;
}

export interface Progress {
  id: string;
  playerId: string;
  levelId: number;
  percent: number;
  updatedAt: string;
}

export interface AccountSession {
  data: Player;
  account: { email: string };
  token: string;
  expiresAt: string;
}

export interface AuthMe {
  data: { player: Player; account: { email: string } };
  expiresAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  playerKind: PlayerKind;
  points: number;
  status: Status;
  completionCount: number;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface LevelDetail {
  level: Level;
  zoneView: Zone;
  completionCount: number;
  localCompletionCount: number;
  importedCompletionCount: number;
}

export interface SourceStatus {
  source: 'pointercrate' | 'aredl' | 'gddl';
  ok: boolean;
  lastUpdated: string;
  stale: boolean;
}

export interface ApiError {
  error: { code: string; message: string; field?: string };
}
