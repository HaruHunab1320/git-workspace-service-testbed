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
  severity: EmergencyLevel;
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
  addSystemAlert: (alert: Omit<SystemAlert, 'id' | 'timestamp'>) => void;
  clearSystemAlerts: () => void;
}

function computeMagiStatus(votes: MagiVotes): MagiStatus {
  const approvals = [votes.melchior, votes.balthasar, votes.casper].filter(Boolean).length;
  if (approvals >= 2) return 'AGREE';
  if (approvals === 0) return 'DISAGREE';
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
  setMagiVotes: (votes) => set({ magiVotes: votes, magiStatus: computeMagiStatus(votes) }),
  addSystemAlert: (alert) =>
    set((state) => ({
      systemAlerts: [
        ...state.systemAlerts,
        { ...alert, id: crypto.randomUUID(), timestamp: Date.now() },
      ],
    })),
  clearSystemAlerts: () => set({ systemAlerts: [] }),
}));
