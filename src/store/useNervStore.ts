import { create } from 'zustand';
import type { MagiStatus, SystemAlert, SyncRatios } from '../types/nerv';

export interface MagiVotes {
  melchior: boolean;
  balthasar: boolean;
  casper: boolean;
}

function deriveMagiStatus(votes: MagiVotes): MagiStatus {
  const count = [votes.melchior, votes.balthasar, votes.casper].filter(Boolean).length;
  if (count >= 2) return 'AGREE';
  if (count === 1) return 'CONFLICT';
  return 'DISAGREE';
}

export interface NervState {
  syncRatios: SyncRatios;
  magiVotes: MagiVotes;
  magiStatus: MagiStatus;
  systemAlerts: SystemAlert[];
  setSyncRatios: (ratios: SyncRatios) => void;
  setMagiVotes: (votes: MagiVotes) => void;
  addSystemAlert: (alert: SystemAlert) => void;
  clearSystemAlerts: () => void;
}

export const useNervStore = create<NervState>((set) => ({
  syncRatios: {},
  magiVotes: { melchior: false, balthasar: false, casper: false },
  magiStatus: 'DISAGREE',
  systemAlerts: [],
  setSyncRatios: (ratios) => set({ syncRatios: ratios }),
  setMagiVotes: (votes) => set({ magiVotes: votes, magiStatus: deriveMagiStatus(votes) }),
  addSystemAlert: (alert) =>
    set((state) => ({ systemAlerts: [...state.systemAlerts, alert] })),
  clearSystemAlerts: () => set({ systemAlerts: [] }),
}));
