import { create } from 'zustand';

export type EmergencyLevel = 'NORMAL' | 'ALERT' | 'EMERGENCY';

export type MagiStatus = 'AGREE' | 'DISAGREE' | 'CONFLICT';

export interface MagiVotes {
  melchior: boolean;
  balthasar: boolean;
  casper: boolean;
}

export interface SystemAlert {
  id: string;
  message: string;
  level: EmergencyLevel;
  timestamp: number;
}

export interface SyncRatios {
  [pilotId: string]: number;
}

export interface NervState {
  emergencyLevel: EmergencyLevel;
  syncRatio: number;
  syncRatios: SyncRatios;
  magiVotes: MagiVotes;
  magiStatus: MagiStatus;
  systemAlerts: SystemAlert[];
  setEmergencyLevel: (level: EmergencyLevel) => void;
  setSyncRatio: (ratio: number) => void;
  setSyncRatios: (ratios: SyncRatios) => void;
  setMagiVotes: (votes: MagiVotes) => void;
  addSystemAlert: (alert: SystemAlert) => void;
  clearSystemAlerts: () => void;
}

function deriveMagiStatus(votes: MagiVotes): MagiStatus {
  const count = [votes.melchior, votes.balthasar, votes.casper].filter(Boolean).length;
  if (count === 3) return 'AGREE';
  if (count === 0) return 'DISAGREE';
  return 'CONFLICT';
}

export const useNervStore = create<NervState>((set) => ({
  emergencyLevel: 'NORMAL',
  syncRatio: 0,
  syncRatios: {},
  magiVotes: { melchior: false, balthasar: false, casper: false },
  magiStatus: 'DISAGREE',
  systemAlerts: [],
  setEmergencyLevel: (level) => set({ emergencyLevel: level }),
  setSyncRatio: (ratio) => set({ syncRatio: ratio }),
  setSyncRatios: (ratios) => set({ syncRatios: ratios }),
  setMagiVotes: (votes) => set({ magiVotes: votes, magiStatus: deriveMagiStatus(votes) }),
  addSystemAlert: (alert) => set((state) => ({ systemAlerts: [...state.systemAlerts, alert] })),
  clearSystemAlerts: () => set({ systemAlerts: [] }),
}));
