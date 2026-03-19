import { create } from 'zustand'

export type EmergencyLevel = 'NORMAL' | 'ALERT' | 'EMERGENCY'

export interface NervState {
  emergencyLevel: EmergencyLevel
  syncRatio: number
  magiVotes: {
    melchior: boolean
    balthasar: boolean
    casper: boolean
  }
  setEmergencyLevel: (level: EmergencyLevel) => void
  setSyncRatio: (ratio: number) => void
  setMagiVotes: (votes: { melchior: boolean; balthasar: boolean; casper: boolean }) => void
}

export const useNervStore = create<NervState>((set) => ({
  emergencyLevel: 'NORMAL',
  syncRatio: 75,
  magiVotes: {
    melchior: true,
    balthasar: true,
    casper: false,
  },
  setEmergencyLevel: (level) => set({ emergencyLevel: level }),
  setSyncRatio: (ratio) => set({ syncRatio: Math.max(0, Math.min(100, ratio)) }),
  setMagiVotes: (votes) => set({ magiVotes: votes }),
}))
