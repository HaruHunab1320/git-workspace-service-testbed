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
  angelDetected: boolean;

  setEmergencyLevel: (level: EmergencyLevel) => void;
  setSyncRatio: (ratio: number) => void;
  setMagiVotes: (votes: Partial<MagiVotes>) => void;
  randomizeMagiVotes: () => void;
  triggerAngelDetected: () => void;
  resetEmergency: () => void;
}

export const useNervStore = create<NervState>((set) => ({
  emergencyLevel: 'NORMAL',
  syncRatio: 100,
  magiVotes: {
    melchior: false,
    balthasar: false,
    casper: false,
  },
  angelDetected: false,

  setEmergencyLevel: (level) => set({ emergencyLevel: level }),

  setSyncRatio: (ratio) => set({ syncRatio: Math.max(0, Math.min(100, ratio)) }),

  setMagiVotes: (votes) =>
    set((state) => ({
      magiVotes: { ...state.magiVotes, ...votes },
    })),

  randomizeMagiVotes: () =>
    set({
      magiVotes: {
        melchior: Math.random() > 0.5,
        balthasar: Math.random() > 0.5,
        casper: Math.random() > 0.5,
      },
    }),

  triggerAngelDetected: () =>
    set({
      angelDetected: true,
      emergencyLevel: 'EMERGENCY',
    }),

  resetEmergency: () =>
    set({
      angelDetected: false,
      emergencyLevel: 'NORMAL',
    }),
}));
