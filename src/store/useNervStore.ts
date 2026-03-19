import { create } from 'zustand'

export type EmergencyLevel = 'NORMAL' | 'ALERT' | 'EMERGENCY'

export type MagiStatus = 'AGREE' | 'DISAGREE' | 'CONFLICT'

export interface MagiVotes {
  melchior: boolean
  balthasar: boolean
  casper: boolean
}

export interface SystemAlert {
  id: string
  message: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  timestamp: number
}

export interface NervState {
  emergencyLevel: EmergencyLevel
  syncRatios: Record<string, number>
  magiStatus: MagiStatus
  magiVotes: MagiVotes
  systemAlerts: SystemAlert[]
  setEmergencyLevel: (level: EmergencyLevel) => void
  setSyncRatios: (ratios: Record<string, number>) => void
  setMagiStatus: (status: MagiStatus) => void
  setMagiVotes: (votes: MagiVotes) => void
  addSystemAlert: (alert: SystemAlert) => void
  clearSystemAlerts: () => void
}

function deriveMagiStatus(votes: MagiVotes): MagiStatus {
  const count = [votes.melchior, votes.balthasar, votes.casper].filter(Boolean).length
  if (count === 3) return 'AGREE'
  if (count >= 2) return 'AGREE'
  if (count === 0) return 'DISAGREE'
  return 'CONFLICT'
}

export const useNervStore = create<NervState>((set) => ({
  emergencyLevel: 'NORMAL',
  syncRatios: {},
  magiStatus: 'AGREE',
  magiVotes: {
    melchior: true,
    balthasar: true,
    casper: false,
  },
  systemAlerts: [],
  setEmergencyLevel: (level) => set({ emergencyLevel: level }),
  setSyncRatios: (ratios) => set({ syncRatios: ratios }),
  setMagiStatus: (status) => set({ magiStatus: status }),
  setMagiVotes: (votes) => set({ magiVotes: votes, magiStatus: deriveMagiStatus(votes) }),
  addSystemAlert: (alert) => set((state) => ({ systemAlerts: [...state.systemAlerts, alert] })),
  clearSystemAlerts: () => set({ systemAlerts: [] }),
}))
