import type { SimulationPhase, SimulationState, SyncRatios } from '../types/nerv.d';

export const ANGEL_NAMES = [
  'SACHIEL',
  'SHAMSHEL',
  'RAMIEL',
  'GAGHIEL',
  'ISRAFEL',
  'SANDALPHON',
  'ZERUEL',
];

export const PHASE_DURATIONS: Record<SimulationPhase, number> = {
  IDLE: 0,
  DETECTION: 10,
  APPROACH: 15,
  CONTACT: 20,
  RESOLUTION: 10,
};

export const PHASE_ORDER: SimulationPhase[] = [
  'DETECTION',
  'APPROACH',
  'CONTACT',
  'RESOLUTION',
];

export function eva_nextPhase(current: SimulationPhase): SimulationPhase | null {
  const idx = PHASE_ORDER.indexOf(current);
  if (idx === -1 || idx === PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[idx + 1];
}

export function eva_pickAngel(): string {
  return ANGEL_NAMES[Math.floor(Math.random() * ANGEL_NAMES.length)];
}

export function eva_computeCombatDamage(syncRatios: SyncRatios): {
  angelDamage: number;
  nervDamage: number;
} {
  const values = Object.values(syncRatios);
  const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 50;
  const angelDamage = avg / 20 + Math.random() * 2;
  const nervDamage = 1 + Math.random() * 4;
  return { angelDamage, nervDamage };
}

export function eva_phaseAlertMessage(phase: SimulationPhase, angelName: string): string {
  switch (phase) {
    case 'DETECTION':
      return `PATTERN BLUE CONFIRMED — ${angelName} DETECTED ON SENSORS`;
    case 'APPROACH':
      return `PHASE TRANSITION: APPROACH — ${angelName} CLOSING DISTANCE`;
    case 'CONTACT':
      return `PHASE TRANSITION: CONTACT — ${angelName} ENGAGED, DEPLOYING EVA UNITS`;
    case 'RESOLUTION':
      return `PHASE TRANSITION: RESOLUTION — FINAL COMBAT ASSESSMENT FOR ${angelName}`;
    default:
      return `SIMULATION STATUS UPDATE — ${angelName}`;
  }
}

export function eva_initialSimulationState(): SimulationState {
  return {
    phase: 'IDLE',
    outcome: 'PENDING',
    isPaused: false,
    phaseTimeRemaining: 0,
    phaseElapsed: 0,
    angelHp: 100,
    nervDefense: 100,
    currentAngelName: '',
  };
}
