/**
 * NERV Command Center — Global State Store
 * Zustand store that serves as the single source of truth for all application state.
 * All components subscribe to this store for reactive updates.
 */
import { create } from 'zustand';
import type {
  EmergencyLevel,
  MagiStatus,
  MagiSubSystem,
  MagiVotes,
  SystemAlert,
  SyncRatios,
  EvaPosition,
  HexCoordinate,
} from '../types/nerv.d';

// Re-export all types so consumers can import from either location
export type { EmergencyLevel, MagiStatus, MagiSubSystem, MagiVotes, SystemAlert, SyncRatios, EvaPosition, HexCoordinate };

/** Full shape of the NERV global state including data and actions */
export interface NervState {
  emergencyLevel: EmergencyLevel;
  syncRatio: number;
  syncRatios: SyncRatios;
  magiVotes: MagiVotes;
  magiStatus: MagiStatus;
  systemAlerts: SystemAlert[];
  evaPositions: EvaPosition[];
  angelDetected: boolean;

  /** Set the facility emergency level */
  setEmergencyLevel: (level: EmergencyLevel) => void;
  /** Set the global sync ratio (clamped 0–100) */
  setSyncRatio: (ratio: number) => void;
  /** Replace all sync ratios at once */
  setSyncRatios: (ratios: SyncRatios) => void;
  /** Update a single pilot's sync ratio (clamped 0–100) */
  updateSyncRatio: (pilotId: string, ratio: number) => void;
  /** @deprecated Use updateSyncRatio instead */
  updatePilotSyncRatio: (pilotId: string, ratio: number) => void;
  /** Merge partial MAGI votes and recompute magiStatus */
  setMagiVotes: (votes: Partial<MagiVotes>) => void;
  /** Directly set the MAGI consensus status */
  setMagiStatus: (status: MagiStatus) => void;
  /** Randomize all three MAGI votes and recompute consensus */
  randomizeMagiVotes: () => void;
  /** Push a new system alert */
  addSystemAlert: (alert: Omit<SystemAlert, 'id' | 'timestamp'>) => void;
  /** Clear all system alerts */
  clearSystemAlerts: () => void;
  /** Replace all EVA positions at once */
  setEvaPositions: (positions: EvaPosition[]) => void;
  /** Update or add a single EVA position on the hex grid */
  updateEvaPosition: (pilotId: string, unitId: string, hexCoordinate: HexCoordinate) => void;
  /** Remove an EVA position by pilot ID */
  removeEvaPosition: (pilotId: string) => void;
  /** Trigger angel detection: sets emergency state and adds PATTERN BLUE alert */
  triggerAngelDetected: () => void;
  /** Reset all emergency state back to NORMAL */
  resetEmergency: () => void;
}

/**
 * Compute MAGI consensus status from individual votes.
 * 2/3 or 3/3 majority → AGREE, 1/3 → CONFLICT, 0/3 → DISAGREE.
 * @param votes - The three MAGI component votes
 * @returns The derived consensus status
 */
export function eva_computeMagiStatus(votes: MagiVotes): MagiStatus {
  const approvals = [votes.melchior, votes.balthasar, votes.casper].filter(Boolean).length;
  if (approvals >= 2) return 'AGREE';
  if (approvals === 0) return 'DISAGREE';
  return 'CONFLICT';
}

/**
 * Check whether a specific MAGI subsystem approves based on current votes.
 * @param subSystem - The MAGI subsystem to check
 * @returns Whether the subsystem's vote is true (approve)
 */
export function eva_getMagiApproval(subSystem: MagiSubSystem): boolean {
  const state = useNervStore.getState();
  return state.magiVotes[subSystem];
}

/**
 * Calculate the clamped sync ratio for a pilot.
 * @param ratio - Raw sync ratio value
 * @returns Ratio clamped to 0–100 range
 */
export function eva_calculateSyncRatio(ratio: number): number {
  return Math.max(0, Math.min(100, ratio));
}

/** Generate a unique alert ID */
function generateAlertId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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

  setSyncRatio: (ratio) => set({ syncRatio: eva_calculateSyncRatio(ratio) }),

  setSyncRatios: (ratios) => set({ syncRatios: ratios }),

  updateSyncRatio: (pilotId, ratio) =>
    set((state) => ({
      syncRatios: { ...state.syncRatios, [pilotId]: eva_calculateSyncRatio(ratio) },
    })),

  updatePilotSyncRatio: (pilotId, ratio) =>
    set((state) => ({
      syncRatios: { ...state.syncRatios, [pilotId]: eva_calculateSyncRatio(ratio) },
    })),

  setMagiVotes: (votes) =>
    set((state) => {
      const newVotes = { ...state.magiVotes, ...votes };
      return {
        magiVotes: newVotes,
        magiStatus: eva_computeMagiStatus(newVotes),
      };
    }),

  setMagiStatus: (status) => set({ magiStatus: status }),

  randomizeMagiVotes: () =>
    set(() => {
      const newVotes: MagiVotes = {
        melchior: Math.random() > 0.5,
        balthasar: Math.random() > 0.5,
        casper: Math.random() > 0.5,
      };
      return {
        magiVotes: newVotes,
        magiStatus: eva_computeMagiStatus(newVotes),
      };
    }),

  addSystemAlert: (alert) =>
    set((state) => ({
      systemAlerts: [
        ...state.systemAlerts,
        {
          ...alert,
          id: generateAlertId(),
          timestamp: Date.now(),
        },
      ],
    })),

  clearSystemAlerts: () => set({ systemAlerts: [] }),

  setEvaPositions: (positions) => set({ evaPositions: positions }),

  updateEvaPosition: (pilotId, unitId, hexCoordinate) =>
    set((state) => {
      const existing = state.evaPositions.findIndex((p) => p.pilotId === pilotId);
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
      evaPositions: state.evaPositions.filter((p) => p.pilotId !== pilotId),
    })),

  triggerAngelDetected: () =>
    set((state) => ({
      angelDetected: true,
      emergencyLevel: 'EMERGENCY',
      systemAlerts: [
        ...state.systemAlerts,
        {
          id: generateAlertId(),
          message: '[SYSTEM_REPORT] ANGEL DETECTED - PATTERN BLUE CONFIRMED',
          level: 'EMERGENCY' as const,
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
