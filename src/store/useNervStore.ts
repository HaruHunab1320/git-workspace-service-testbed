import { create } from 'zustand';
import type { EvaPosition } from '../types/nerv.d';

export type EmergencyLevel = 'NORMAL' | 'ALERT' | 'EMERGENCY';
export type MagiStatus = 'AGREE' | 'DISAGREE' | 'CONFLICT';

export interface MagiVotes {
  melchior: boolean;
  balthasar: boolean;
  casper: boolean;
}

export interface NervState {
  emergencyLevel: EmergencyLevel;
  syncRatios: Record<string, number>;
  magiStatus: MagiStatus;
  magiVotes: MagiVotes;
  systemAlerts: string[];
  evaPositions: EvaPosition[];

  // Legacy compat
  syncRatio: number;

  setEmergencyLevel: (level: EmergencyLevel) => void;
  setSyncRatio: (ratio: number) => void;
  setSyncRatios: (ratios: Record<string, number>) => void;
  setMagiVotes: (votes: MagiVotes) => void;
  setMagiStatus: (status: MagiStatus) => void;
  addSystemAlert: (alert: string) => void;
  clearSystemAlerts: () => void;
  setEvaPositions: (positions: EvaPosition[]) => void;
}

function deriveMagiStatus(votes: MagiVotes): MagiStatus {
  const count = [votes.melchior, votes.balthasar, votes.casper].filter(Boolean).length;
  if (count >= 2) return 'AGREE';
  if (count === 0) return 'DISAGREE';
  return 'CONFLICT';
}

export const useNervStore = create<NervState>((set) => ({
  emergencyLevel: 'NORMAL',
  syncRatios: {},
  magiStatus: 'DISAGREE',
  magiVotes: { melchior: false, balthasar: false, casper: false },
  systemAlerts: [],
  evaPositions: [],
  syncRatio: 0,

  setEmergencyLevel: (level) => set({ emergencyLevel: level }),
  setSyncRatio: (ratio) => set({ syncRatio: ratio }),
  setSyncRatios: (ratios) => set({ syncRatios: ratios }),
  setMagiVotes: (votes) => set({ magiVotes: votes, magiStatus: deriveMagiStatus(votes) }),
  setMagiStatus: (status) => set({ magiStatus: status }),
  addSystemAlert: (alert) => set((s) => ({ systemAlerts: [...s.systemAlerts, alert] })),
  clearSystemAlerts: () => set({ systemAlerts: [] }),
  setEvaPositions: (positions) => set({ evaPositions: positions }),
}));
