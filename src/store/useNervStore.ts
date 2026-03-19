import { create } from 'zustand';

export type EmergencyLevel = 'NORMAL' | 'ALERT' | 'EMERGENCY';

export interface MagiVotes {
  melchior: boolean;
  balthasar: boolean;
  casper: boolean;
}

export interface NervState {
  emergencyLevel: EmergencyLevel;
  syncRatio: number;
  magiVotes: MagiVotes;
  setEmergencyLevel: (level: EmergencyLevel) => void;
  setSyncRatio: (ratio: number) => void;
  setMagiVotes: (votes: MagiVotes) => void;
}

export const useNervStore = create<NervState>((set) => ({
  emergencyLevel: 'NORMAL',
  syncRatio: 0,
  magiVotes: { melchior: false, balthasar: false, casper: false },
  setEmergencyLevel: (level) => set({ emergencyLevel: level }),
  setSyncRatio: (ratio) => set({ syncRatio: ratio }),
  setMagiVotes: (votes) => set({ magiVotes: votes }),
}));
