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
  SimulationState,
} from '../types/nerv.d';
import {
  PHASE_DURATIONS,
  eva_nextPhase,
  eva_simulationTick,
  eva_checkOutcome,
  eva_phaseToEmergencyLevel,
  eva_phaseAlertMessage,
  eva_phaseAlertLevel,
} from '../systems/simulation';

// Re-export all types so consumers can import from either location
export type { EmergencyLevel, MagiStatus, MagiSubSystem, MagiVotes, SystemAlert, SyncRatios, EvaPosition, HexCoordinate, SimulationState };

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

  // --- Simulation State ---
  simulation: SimulationState;

  // --- Simulation Actions ---
  startSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  resetSimulation: () => void;
  /** Called every second by the component's interval. Advances timers, computes damage, transitions phases. */
  tickSimulation: () => void;
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

  // --- Simulation ---
  simulation: {
    phase: 'IDLE',
    status: 'STOPPED',
    outcome: 'PENDING',
    phaseTimeRemaining: 0,
    totalElapsed: 0,
    angelHp: 100,
    nervIntegrity: 100,
  },

  startSimulation: () =>
    set((state) => ({
      simulation: {
        phase: 'DETECTION',
        status: 'RUNNING',
        outcome: 'PENDING',
        phaseTimeRemaining: PHASE_DURATIONS.DETECTION,
        totalElapsed: 0,
        angelHp: 100,
        nervIntegrity: 100,
      },
      angelDetected: true,
      emergencyLevel: 'EMERGENCY' as const,
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

  pauseSimulation: () =>
    set((state) => ({
      simulation: { ...state.simulation, status: 'PAUSED' },
    })),

  resumeSimulation: () =>
    set((state) => ({
      simulation: { ...state.simulation, status: 'RUNNING' },
    })),

  resetSimulation: () =>
    set({
      simulation: {
        phase: 'IDLE',
        status: 'STOPPED',
        outcome: 'PENDING',
        phaseTimeRemaining: 0,
        totalElapsed: 0,
        angelHp: 100,
        nervIntegrity: 100,
      },
      angelDetected: false,
      emergencyLevel: 'NORMAL',
      systemAlerts: [],
    }),

  tickSimulation: () =>
    set((state) => {
      const sim = state.simulation;
      if (sim.status !== 'RUNNING') return {};

      // Compute average sync ratio from store
      const ratioValues = Object.values(state.syncRatios);
      const avgSyncRatio = ratioValues.length > 0
        ? ratioValues.reduce((a, b) => a + b, 0) / ratioValues.length
        : 50; // default if no pilots

      // Compute tick deltas
      const deltas = eva_simulationTick({
        phase: sim.phase,
        angelHp: sim.angelHp,
        nervIntegrity: sim.nervIntegrity,
        avgSyncRatio,
        magiStatus: state.magiStatus,
      });

      const newAngelHp = Math.max(0, Math.min(100, sim.angelHp + deltas.angelHpDelta));
      const newNervIntegrity = Math.max(0, Math.min(100, sim.nervIntegrity + deltas.nervIntegrityDelta));
      const newTotalElapsed = sim.totalElapsed + 1;
      const newPhaseTimeRemaining = sim.phaseTimeRemaining - 1;

      // Check outcome
      const outcome = eva_checkOutcome(newAngelHp, newNervIntegrity);

      if (outcome === 'WIN') {
        return {
          simulation: {
            ...sim,
            angelHp: newAngelHp,
            nervIntegrity: newNervIntegrity,
            totalElapsed: newTotalElapsed,
            phaseTimeRemaining: 0,
            outcome: 'WIN',
            status: 'COMPLETE',
            phase: 'IDLE',
          },
          angelDetected: false,
          emergencyLevel: 'NORMAL' as const,
          systemAlerts: [
            {
              id: generateAlertId(),
              message: '[VICTORY] Angel neutralized - all clear',
              level: 'INFO' as const,
              timestamp: Date.now(),
            },
          ],
        };
      }

      if (outcome === 'LOSE') {
        return {
          simulation: {
            ...sim,
            angelHp: newAngelHp,
            nervIntegrity: newNervIntegrity,
            totalElapsed: newTotalElapsed,
            phaseTimeRemaining: 0,
            outcome: 'LOSE',
            status: 'COMPLETE',
            phase: 'IDLE',
          },
          systemAlerts: [
            ...state.systemAlerts,
            {
              id: generateAlertId(),
              message: '[DEFEAT] NERV integrity compromised - facility lost',
              level: 'EMERGENCY' as const,
              timestamp: Date.now(),
            },
          ],
        };
      }

      // Randomize MAGI votes every 5 ticks during CONTACT
      let magiUpdates = {};
      if (sim.phase === 'CONTACT' && newTotalElapsed % 5 === 0) {
        const newVotes = {
          melchior: Math.random() > 0.5,
          balthasar: Math.random() > 0.5,
          casper: Math.random() > 0.5,
        };
        magiUpdates = {
          magiVotes: newVotes,
          magiStatus: eva_computeMagiStatus(newVotes),
        };
      }

      // Phase transition
      if (newPhaseTimeRemaining <= 0) {
        const nextPhase = eva_nextPhase(sim.phase);
        if (nextPhase === null) {
          // End of RESOLUTION with no outcome -> WIN
          return {
            simulation: {
              ...sim,
              angelHp: newAngelHp,
              nervIntegrity: newNervIntegrity,
              totalElapsed: newTotalElapsed,
              phaseTimeRemaining: 0,
              outcome: 'WIN',
              status: 'COMPLETE',
              phase: 'IDLE',
            },
            angelDetected: false,
            emergencyLevel: 'NORMAL' as const,
            systemAlerts: [
              {
                id: generateAlertId(),
                message: '[VICTORY] Angel neutralized - all clear',
                level: 'INFO' as const,
                timestamp: Date.now(),
              },
            ],
            ...magiUpdates,
          };
        }

        return {
          simulation: {
            ...sim,
            angelHp: newAngelHp,
            nervIntegrity: newNervIntegrity,
            totalElapsed: newTotalElapsed,
            phase: nextPhase,
            phaseTimeRemaining: PHASE_DURATIONS[nextPhase],
          },
          emergencyLevel: eva_phaseToEmergencyLevel(nextPhase),
          systemAlerts: [
            ...state.systemAlerts,
            {
              id: generateAlertId(),
              message: eva_phaseAlertMessage(nextPhase),
              level: eva_phaseAlertLevel(nextPhase),
              timestamp: Date.now(),
            },
          ],
          ...magiUpdates,
        };
      }

      return {
        simulation: {
          ...sim,
          angelHp: newAngelHp,
          nervIntegrity: newNervIntegrity,
          totalElapsed: newTotalElapsed,
          phaseTimeRemaining: newPhaseTimeRemaining,
        },
        ...magiUpdates,
      };
    }),
}));
