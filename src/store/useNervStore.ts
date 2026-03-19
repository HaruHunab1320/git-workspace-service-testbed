import { create } from 'zustand';

export type EmergencyLevel = 'NORMAL' | 'ALERT' | 'EMERGENCY';
export type MagiStatus = 'AGREE' | 'DISAGREE' | 'CONFLICT';

export interface MagiVotes {
  melchior: boolean;
  balthasar: boolean;
  casper: boolean;
}

function computeMagiStatus(votes: MagiVotes): MagiStatus {
  const yesCount = [votes.melchior, votes.balthasar, votes.casper].filter(Boolean).length;
  if (yesCount >= 2) return 'AGREE';
  if (yesCount === 0) return 'DISAGREE';
  return 'CONFLICT';
}

export interface NervState {
  emergencyLevel: EmergencyLevel;
  syncRatio: number;
  syncRatios: Record<string, number>;
  magiVotes: MagiVotes;
  magiStatus: MagiStatus;
  systemAlerts: string[];
  setEmergencyLevel: (level: EmergencyLevel) => void;
  setSyncRatio: (ratio: number) => void;
  setSyncRatios: (ratios: Record<string, number>) => void;
  setMagiVotes: (votes: MagiVotes) => void;
  addSystemAlert: (alert: string) => void;
  clearSystemAlerts: () => void;
  triggerAngelDetected: (designation: string) => void;
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
    set((state) => ({ systemAlerts: [...state.systemAlerts, `[SYSTEM_REPORT] ${alert}`] })),
  clearSystemAlerts: () => set({ systemAlerts: [] }),
  triggerAngelDetected: (designation) =>
    set((state) => ({
      emergencyLevel: 'EMERGENCY',
      systemAlerts: [
        ...state.systemAlerts,
        `[SYSTEM_REPORT] ANGEL DETECTED — PATTERN BLUE CONFIRMED: ${designation}`,
      ],
    })),
}));
