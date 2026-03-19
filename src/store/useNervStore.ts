import { create } from 'zustand';
import type { EvaPosition, HexCoordinate } from '../types/nerv.d';

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
  evaPositions: EvaPosition[];
  angelDetected: boolean;

  setEmergencyLevel: (level: EmergencyLevel) => void;
  setSyncRatio: (ratio: number) => void;
  setSyncRatios: (ratios: SyncRatios) => void;
  updatePilotSyncRatio: (pilotId: string, ratio: number) => void;
  setMagiVotes: (votes: Partial<MagiVotes>) => void;
  randomizeMagiVotes: () => void;
  addSystemAlert: (alert: Omit<SystemAlert, 'id' | 'timestamp'>) => void;
  clearSystemAlerts: () => void;
  updateEvaPosition: (pilotId: string, unitId: string, hexCoordinate: HexCoordinate) => void;
  removeEvaPosition: (pilotId: string) => void;
  triggerAngelDetected: () => void;
  resetEmergency: () => void;
}

function computeMagiStatus(votes: MagiVotes): MagiStatus {
  const approvals = [votes.melchior, votes.balthasar, votes.casper].filter(Boolean).length;
  if (approvals === 3) return 'AGREE';
  if (approvals >= 2) return 'AGREE';
  if (approvals === 0) return 'DISAGREE';
  return 'CONFLICT';
}

export const useNervStore = create<NervState>((set) => ({
  emergencyLevel: 'NORMAL',
  syncRatio: 100,
  syncRatios: {},
  magiVotes: {
    melchior: false,
    balthasar: false,
    casper: false,
  },
  magiStatus: 'DISAGREE',
  systemAlerts: [],
  evaPositions: [],
  angelDetected: false,

  setEmergencyLevel: (level) => set({ emergencyLevel: level }),

  setSyncRatio: (ratio) => set({ syncRatio: Math.max(0, Math.min(100, ratio)) }),

  setSyncRatios: (ratios) => set({ syncRatios: ratios }),

  updatePilotSyncRatio: (pilotId, ratio) =>
    set((state) => ({
      syncRatios: { ...state.syncRatios, [pilotId]: Math.max(0, Math.min(100, ratio)) },
    })),

  setMagiVotes: (votes) =>
    set((state) => {
      const newVotes = { ...state.magiVotes, ...votes };
      return {
        magiVotes: newVotes,
        magiStatus: computeMagiStatus(newVotes),
      };
    }),

  randomizeMagiVotes: () =>
    set(() => {
      const newVotes = {
        melchior: Math.random() > 0.5,
        balthasar: Math.random() > 0.5,
        casper: Math.random() > 0.5,
      };
      return {
        magiVotes: newVotes,
        magiStatus: computeMagiStatus(newVotes),
      };
    }),

  addSystemAlert: (alert) =>
    set((state) => ({
      systemAlerts: [
        ...state.systemAlerts,
        {
          ...alert,
          id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          timestamp: Date.now(),
        },
      ],
    })),

  clearSystemAlerts: () => set({ systemAlerts: [] }),

  updateEvaPosition: (pilotId, unitId, hexCoordinate) =>
    set((state) => {
      const existing = state.evaPositions.findIndex((p: EvaPosition) => p.pilotId === pilotId);
      const newPosition: EvaPosition = { pilotId, unitId, hexCoordinate, timestamp: Date.now() };
      if (existing >= 0) {
        const updated = [...state.evaPositions];
        updated[existing] = newPosition;
        return { evaPositions: updated };
      }
      return { evaPositions: [...state.evaPositions, newPosition] };
    }),

  removeEvaPosition: (pilotId) =>
    set((state) => ({
      evaPositions: state.evaPositions.filter((p: EvaPosition) => p.pilotId !== pilotId),
    })),

  triggerAngelDetected: () =>
    set((state) => ({
      angelDetected: true,
      emergencyLevel: 'EMERGENCY',
      systemAlerts: [
        ...state.systemAlerts,
        {
          id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          message: '[SYSTEM_REPORT] ANGEL DETECTED - PATTERN BLUE CONFIRMED',
          level: 'EMERGENCY' as EmergencyLevel,
          timestamp: Date.now(),
        },
      ],
    })),

  resetEmergency: () =>
    set({
      angelDetected: false,
      emergencyLevel: 'NORMAL',
      systemAlerts: [],
    }),
}));
