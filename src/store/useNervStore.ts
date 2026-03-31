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
  SimulationOutcome,
  PilotStatus,
  PilotRecord,
  EvaUnitId,
  PerformanceRecord,
  DifficultyTier,
  ATFieldState,
  MagiTieBreakWeights,
} from '../types/nerv.d';
import {
  eva_initialSimulationState,
  eva_pickAngel,
  eva_nextPhase,
  eva_computeCombatDamage,
  eva_phaseAlertMessage,
  eva_computeATFieldErosion,
  eva_tickATField,
  eva_initialATFieldState,
  eva_initialPerformanceRecord,
  eva_updatePerformanceRecord,
  eva_scaledAngelHp,
  eva_resolveMagiTieBreak,
  eva_fluctuateSyncRatio,
  PHASE_DURATIONS,
  PHASE_DAMAGE_MULTIPLIERS,
} from '../simulation/engine';

// Re-export all types so consumers can import from either location
export type { EmergencyLevel, MagiStatus, MagiSubSystem, MagiVotes, SystemAlert, SyncRatios, EvaPosition, HexCoordinate, SimulationState, SimulationOutcome, PilotStatus, PilotRecord, EvaUnitId, PerformanceRecord, DifficultyTier, ATFieldState, MagiTieBreakWeights };

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
  simulation: SimulationState;
  pilots: PilotRecord[];
  performanceRecord: PerformanceRecord;
  magiTieBreakWeights: MagiTieBreakWeights;

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

  /** Start a new angel attack simulation */
  startSimulation: () => void;
  /** Pause the running simulation */
  pauseSimulation: () => void;
  /** Resume a paused simulation */
  resumeSimulation: () => void;
  /** Reset simulation to initial state */
  resetSimulation: () => void;
  /** Advance to next simulation phase */
  advancePhase: () => void;
  /** Process one simulation tick (called every second) */
  tickSimulation: () => void;
  /** Deal damage to the angel */
  damageAngel: (amount: number) => void;
  /** Deal damage to NERV defense */
  damageNerv: (amount: number) => void;
  /** Resolve simulation with outcome */
  resolveSimulation: (outcome: SimulationOutcome) => void;
  /** Reset performance record and difficulty */
  resetPerformanceRecord: () => void;
  /** Set MAGI tie-break priority weights */
  setMagiTieBreakWeights: (weights: MagiTieBreakWeights) => void;

  /** Add a new pilot */
  addPilot: (pilot: PilotRecord) => void;
  /** Remove a pilot by ID */
  removePilot: (pilotId: string) => void;
  /** Update a pilot's status */
  setPilotStatus: (pilotId: string, status: PilotStatus) => void;
  /** Assign an EVA unit to a pilot */
  assignEvaUnit: (pilotId: string, evaUnitId: EvaUnitId | null) => void;
  /** Update a pilot's sync ratio */
  setPilotSyncRatio: (pilotId: string, ratio: number) => void;
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
  pilots: [],
  performanceRecord: eva_initialPerformanceRecord(),
  magiTieBreakWeights: { melchior: 3, balthasar: 1, casper: 2 },

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
        magiStatus: eva_resolveMagiTieBreak(newVotes, state.magiTieBreakWeights),
      };
    }),

  setMagiStatus: (status) => set({ magiStatus: status }),

  randomizeMagiVotes: () =>
    set((state) => {
      const newVotes: MagiVotes = {
        melchior: Math.random() > 0.5,
        balthasar: Math.random() > 0.5,
        casper: Math.random() > 0.5,
      };
      return {
        magiVotes: newVotes,
        magiStatus: eva_resolveMagiTieBreak(newVotes, state.magiTieBreakWeights),
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

  simulation: eva_initialSimulationState(),

  startSimulation: () =>
    set((state) => {
      const angelName = eva_pickAngel();
      const tier = state.performanceRecord.difficultyTier;
      return {
        simulation: {
          phase: 'DETECTION' as const,
          outcome: 'PENDING' as const,
          isPaused: false,
          phaseTimeRemaining: PHASE_DURATIONS.DETECTION,
          totalElapsed: 0,
          phaseElapsed: 0,
          angelHp: eva_scaledAngelHp(tier),
          nervDefense: 100,
          currentAngelName: angelName,
          atField: eva_initialATFieldState(tier),
        },
        angelDetected: true,
        emergencyLevel: 'EMERGENCY' as const,
        systemAlerts: [
          ...state.systemAlerts,
          {
            id: generateAlertId(),
            message: eva_phaseAlertMessage('DETECTION', angelName),
            level: 'EMERGENCY' as const,
            timestamp: Date.now(),
          },
          {
            id: generateAlertId(),
            message: `AT FIELD DETECTED — STRENGTH ${Math.round(eva_initialATFieldState(tier).strength)}% — DIFFICULTY: ${tier}`,
            level: 'WARNING' as const,
            timestamp: Date.now(),
          },
        ],
      };
    }),

  pauseSimulation: () =>
    set((state) => ({
      simulation: { ...state.simulation, isPaused: true },
    })),

  resumeSimulation: () =>
    set((state) => ({
      simulation: { ...state.simulation, isPaused: false },
    })),

  resetSimulation: () =>
    set({
      simulation: eva_initialSimulationState(),
      angelDetected: false,
      emergencyLevel: 'NORMAL' as const,
      systemAlerts: [],
    }),

  advancePhase: () =>
    set((state) => {
      const nextPhase = eva_nextPhase(state.simulation.phase);
      if (nextPhase === null) {
        // RESOLUTION ended — resolve based on HP comparison
        const outcome = state.simulation.angelHp < state.simulation.nervDefense ? 'VICTORY' : 'DEFEAT';
        const alertMsg =
          outcome === 'VICTORY'
            ? 'ANGEL NEUTRALIZED — PATTERN BLUE CLEARED'
            : 'NERV DEFENSE COMPROMISED — EVACUATION ORDER ISSUED';
        const alertLevel = outcome === 'VICTORY' ? ('INFO' as const) : ('EMERGENCY' as const);
        return {
          simulation: {
            ...state.simulation,
            phase: 'IDLE' as const,
            outcome,
            isPaused: false,
          },
          ...(outcome === 'VICTORY'
            ? { angelDetected: false, emergencyLevel: 'NORMAL' as const, systemAlerts: [] }
            : {}),
          systemAlerts: [
            ...(outcome === 'VICTORY' ? [] : state.systemAlerts),
            {
              id: generateAlertId(),
              message: alertMsg,
              level: alertLevel,
              timestamp: Date.now(),
            },
          ],
        };
      }
      const emergencyLevel = (nextPhase === 'CONTACT' || nextPhase === 'RESOLUTION')
        ? 'EMERGENCY' as const
        : 'ALERT' as const;
      return {
        simulation: {
          ...state.simulation,
          phase: nextPhase,
          phaseTimeRemaining: PHASE_DURATIONS[nextPhase],
          phaseElapsed: 0,
        },
        emergencyLevel,
        systemAlerts: [
          ...state.systemAlerts,
          {
            id: generateAlertId(),
            message: eva_phaseAlertMessage(nextPhase, state.simulation.currentAngelName),
            level: emergencyLevel === 'EMERGENCY' ? ('EMERGENCY' as const) : ('WARNING' as const),
            timestamp: Date.now(),
          },
        ],
      };
    }),

  tickSimulation: () => {
    const state = useNervStore.getState();
    if (state.simulation.phase === 'IDLE' || state.simulation.isPaused) return;

    const sim = state.simulation;
    const newTimeRemaining = sim.phaseTimeRemaining - 1;
    const newElapsed = sim.phaseElapsed + 1;
    const newTotalElapsed = sim.totalElapsed + 1;
    const tier = state.performanceRecord.difficultyTier;

    // Determine whether this phase deals combat damage
    const phaseMult = PHASE_DAMAGE_MULTIPLIERS[sim.phase];
    const isCombatPhase = phaseMult.angel > 0 || phaseMult.nerv > 0;

    if (isCombatPhase) {
      // Fluctuate sync ratios for active/berserk pilots
      const pilots = state.pilots;
      const newSyncRatios = { ...state.syncRatios };
      for (const pilot of pilots) {
        if (pilot.status === 'ACTIVE' || pilot.status === 'BERSERK') {
          const current = newSyncRatios[pilot.id] ?? pilot.syncRatio;
          newSyncRatios[pilot.id] = eva_fluctuateSyncRatio(current);
        }
      }

      // Erode AT Field each tick during combat
      const erosion = eva_computeATFieldErosion(newSyncRatios);
      const updatedATField = eva_tickATField(sim.atField, erosion);

      // AT Field state change alerts
      const alerts = [...state.systemAlerts];
      if (sim.atField.isActive && !updatedATField.isActive) {
        alerts.push({
          id: generateAlertId(),
          message: 'AT FIELD NEUTRALIZED — ANGEL CORE EXPOSED',
          level: 'CRITICAL' as const,
          timestamp: Date.now(),
        });
      }

      const magiAgreed = state.magiStatus === 'AGREE';
      const { angelDamage, nervDamage } = eva_computeCombatDamage(
        newSyncRatios,
        { phase: sim.phase, magiAgreed, atField: updatedATField, difficultyTier: tier },
      );
      const newAngelHp = Math.max(0, sim.angelHp - angelDamage);
      const newNervDefense = Math.max(0, sim.nervDefense - nervDamage);

      if (newAngelHp <= 0) {
        set({ syncRatios: newSyncRatios });
        state.resolveSimulation('VICTORY');
        return;
      }
      if (newNervDefense <= 0) {
        set({ syncRatios: newSyncRatios });
        state.resolveSimulation('DEFEAT');
        return;
      }

      set({
        syncRatios: newSyncRatios,
        simulation: {
          ...sim,
          phaseTimeRemaining: newTimeRemaining,
          phaseElapsed: newElapsed,
          totalElapsed: newTotalElapsed,
          angelHp: newAngelHp,
          nervDefense: newNervDefense,
          atField: updatedATField,
        },
        systemAlerts: alerts,
      });

      if (newTimeRemaining <= 0) {
        useNervStore.getState().advancePhase();
      }
      return;
    }

    set({
      simulation: {
        ...sim,
        phaseTimeRemaining: newTimeRemaining,
        phaseElapsed: newElapsed,
        totalElapsed: newTotalElapsed,
      },
    });

    if (newTimeRemaining <= 0) {
      useNervStore.getState().advancePhase();
    }
  },

  damageAngel: (amount) =>
    set((state) => ({
      simulation: {
        ...state.simulation,
        angelHp: Math.max(0, state.simulation.angelHp - amount),
      },
    })),

  damageNerv: (amount) =>
    set((state) => ({
      simulation: {
        ...state.simulation,
        nervDefense: Math.max(0, state.simulation.nervDefense - amount),
      },
    })),

  resolveSimulation: (outcome) =>
    set((state) => {
      const updatedRecord = (outcome === 'VICTORY' || outcome === 'DEFEAT')
        ? eva_updatePerformanceRecord(state.performanceRecord, outcome)
        : state.performanceRecord;
      const alertMsg =
        outcome === 'VICTORY'
          ? 'ANGEL NEUTRALIZED — PATTERN BLUE CLEARED'
          : 'NERV DEFENSE COMPROMISED — EVACUATION ORDER ISSUED';
      const alertLevel = outcome === 'VICTORY' ? ('INFO' as const) : ('EMERGENCY' as const);

      const alerts: SystemAlert[] = [
        ...state.systemAlerts,
        {
          id: generateAlertId(),
          message: alertMsg,
          level: alertLevel,
          timestamp: Date.now(),
        },
      ];

      // Notify if difficulty changed
      if (updatedRecord.difficultyTier !== state.performanceRecord.difficultyTier) {
        alerts.push({
          id: generateAlertId(),
          message: `MAGI ANALYSIS COMPLETE — THREAT LEVEL ADJUSTED TO ${updatedRecord.difficultyTier}`,
          level: 'WARNING' as const,
          timestamp: Date.now(),
        });
      }

      return {
        simulation: {
          ...state.simulation,
          phase: 'IDLE' as const,
          outcome,
          isPaused: false,
        },
        performanceRecord: updatedRecord,
        ...(outcome === 'VICTORY'
          ? { angelDetected: false, emergencyLevel: 'NORMAL' as const }
          : {}),
        systemAlerts: alerts,
      };
    }),

  resetPerformanceRecord: () =>
    set({ performanceRecord: eva_initialPerformanceRecord() }),

  setMagiTieBreakWeights: (weights) =>
    set((state) => ({
      magiTieBreakWeights: weights,
      magiStatus: eva_resolveMagiTieBreak(state.magiVotes, weights),
    })),

  addPilot: (pilot) =>
    set((state) => {
      if (state.pilots.some((p) => p.id === pilot.id)) return state;
      return {
        pilots: [...state.pilots, pilot],
        syncRatios: { ...state.syncRatios, [pilot.id]: pilot.syncRatio },
      };
    }),

  removePilot: (pilotId) =>
    set((state) => {
      const newRatios = { ...state.syncRatios };
      delete newRatios[pilotId];
      return {
        pilots: state.pilots.filter((p) => p.id !== pilotId),
        syncRatios: newRatios,
      };
    }),

  setPilotStatus: (pilotId, status) =>
    set((state) => ({
      pilots: state.pilots.map((p) =>
        p.id === pilotId ? { ...p, status } : p,
      ),
    })),

  assignEvaUnit: (pilotId, evaUnitId) =>
    set((state) => ({
      pilots: state.pilots.map((p) =>
        p.id === pilotId ? { ...p, evaUnitId } : p,
      ),
    })),

  setPilotSyncRatio: (pilotId, ratio) =>
    set((state) => {
      const clamped = eva_calculateSyncRatio(ratio);
      return {
        pilots: state.pilots.map((p) =>
          p.id === pilotId ? { ...p, syncRatio: clamped } : p,
        ),
        syncRatios: { ...state.syncRatios, [pilotId]: clamped },
      };
    }),
}));
