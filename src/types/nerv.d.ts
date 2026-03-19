export interface Pilot {
  id: string;
  name: string;
  syncRate: number;
  status: 'ACTIVE' | 'INACTIVE' | 'BERSERK';
}

export type MagiStatus = 'AGREE' | 'DISAGREE' | 'CONFLICT';

export interface SystemAlert {
  id: string;
  level: 'INFO' | 'WARNING' | 'EMERGENCY';
  message: string;
  timestamp: number;
}

export interface SyncRatios {
  [pilotId: string]: number;
}
