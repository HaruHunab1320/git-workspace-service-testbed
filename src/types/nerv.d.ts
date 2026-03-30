/**
 * NERV Command Center — Shared Type Definitions
 * Canonical type source for all components, store, and tests.
 * All shared types MUST be imported from this file.
 */

/** Facility threat level */
export type EmergencyLevel = 'NORMAL' | 'ALERT' | 'EMERGENCY';

/** MAGI consensus status derived from tripartite voting */
export type MagiStatus = 'AGREE' | 'DISAGREE' | 'CONFLICT';

/** MAGI subsystem identifier */
export type MagiSubSystem = 'melchior' | 'balthasar' | 'casper';

/** Individual MAGI component votes */
export interface MagiVotes {
  melchior: boolean;
  balthasar: boolean;
  casper: boolean;
}

/** System alert with severity level */
export interface SystemAlert {
  id: string;
  message: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
  timestamp: number;
}

/** Per-pilot synchronization ratios keyed by pilot ID */
export interface SyncRatios {
  [pilotId: string]: number;
}

/** Pilot record */
export interface Pilot {
  id: string;
  name: string;
  syncRate: number;
  status: 'ACTIVE' | 'INACTIVE' | 'BERSERK';
}

/** Simulation combat phases */
export type SimulationPhase = 'IDLE' | 'DETECTION' | 'APPROACH' | 'CONTACT' | 'RESOLUTION';

/** Simulation outcome */
export type SimulationOutcome = 'PENDING' | 'VICTORY' | 'DEFEAT';

/** Full simulation state */
export interface SimulationState {
  phase: SimulationPhase;
  outcome: SimulationOutcome;
  isPaused: boolean;
  phaseTimeRemaining: number;
  phaseElapsed: number;
  angelHp: number;
  nervDefense: number;
  currentAngelName: string;
}

/** Pilot status for panel management */
export type PilotStatus = 'ACTIVE' | 'INACTIVE' | 'BERSERK';

/** EVA unit identifiers */
export type EvaUnitId = 'EVA-00' | 'EVA-01' | 'EVA-02' | 'EVA-03';

/** Pilot record with EVA assignment */
export interface PilotRecord {
  id: string;
  name: string;
  status: PilotStatus;
  evaUnitId: EvaUnitId | null;
  syncRatio: number;
}

/** Hex coordinate on the GeoFront grid (numeric struct for type safety) */
export interface HexCoordinate {
  row: number;
  col: number;
}

/** Real-time EVA unit position on the GeoFront hex grid */
export interface EvaPosition {
  pilotId: string;
  unitId: string;
  hexCoordinate: HexCoordinate;
  timestamp: number;
}
