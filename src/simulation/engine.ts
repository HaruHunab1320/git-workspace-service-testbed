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

/** Per-phase damage multipliers for angel and NERV damage */
export const PHASE_DAMAGE_MULTIPLIERS: Record<SimulationPhase, { angel: number; nerv: number }> = {
  IDLE: { angel: 0, nerv: 0 },
  DETECTION: { angel: 0, nerv: 0 },
  APPROACH: { angel: 0.5, nerv: 0.3 },
  CONTACT: { angel: 1.5, nerv: 0.8 },
  RESOLUTION: { angel: 2.0, nerv: 1.2 },
};

export function eva_computeCombatDamage(
  syncRatios: SyncRatios,
  options?: { phase?: SimulationPhase; magiAgreed?: boolean },
): {
  angelDamage: number;
  nervDamage: number;
} {
  const phase = options?.phase ?? 'CONTACT';
  const multipliers = PHASE_DAMAGE_MULTIPLIERS[phase];

  // No damage during non-combat phases
  if (multipliers.angel === 0 && multipliers.nerv === 0) {
    return { angelDamage: 0, nervDamage: 0 };
  }

  const values = Object.values(syncRatios);
  const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 50;
  const syncFactor = avg / 100;
  const magiMultiplier = options?.magiAgreed ? 1.5 : 1.0;

  const angelDamage = multipliers.angel * syncFactor * magiMultiplier + Math.random() * 2;
  const nervDamage = multipliers.nerv + Math.random() * 4;
  return { angelDamage, nervDamage };
}

/**
 * Apply random fluctuation to a sync ratio value.
 * @returns The new sync ratio, clamped to 0–100.
 */
export function eva_fluctuateSyncRatio(current: number): number {
  const delta = (Math.random() - 0.5) * 4;
  return Math.max(0, Math.min(100, current + delta));
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
    totalElapsed: 0,
    phaseElapsed: 0,
    angelHp: 100,
    nervDefense: 100,
    currentAngelName: '',
  };
}
