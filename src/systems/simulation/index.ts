import type {
  SimulationPhase,
  SimulationOutcome,
  EmergencyLevel,
  MagiStatus,
  SystemAlert,
} from '../../types/nerv.d';

/** Phase durations in seconds */
export const PHASE_DURATIONS: Record<Exclude<SimulationPhase, 'IDLE'>, number> = {
  DETECTION: 10,
  APPROACH: 15,
  CONTACT: 20,
  RESOLUTION: 10,
};

/** Phase order for automatic progression */
export const PHASE_ORDER: SimulationPhase[] = [
  'DETECTION',
  'APPROACH',
  'CONTACT',
  'RESOLUTION',
];

/** Returns the next phase, or null if at the end */
export function eva_nextPhase(current: SimulationPhase): SimulationPhase | null {
  const idx = PHASE_ORDER.indexOf(current);
  if (idx === -1 || idx === PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[idx + 1];
}

/** Maps phase to emergency level for store integration */
export function eva_phaseToEmergencyLevel(phase: SimulationPhase): EmergencyLevel {
  if (phase === 'IDLE' || phase === 'DETECTION') return 'ALERT';
  return 'EMERGENCY';
}

/**
 * Compute one tick (1 second) of simulation.
 * Returns a delta object describing state changes.
 * Pure function, no side effects.
 */
export function eva_simulationTick(params: {
  phase: SimulationPhase;
  angelHp: number;
  nervIntegrity: number;
  avgSyncRatio: number;
  magiStatus: MagiStatus;
}): {
  angelHpDelta: number;
  nervIntegrityDelta: number;
} {
  const { phase, avgSyncRatio, magiStatus } = params;

  switch (phase) {
    case 'DETECTION':
      return { angelHpDelta: 0, nervIntegrityDelta: 0 };

    case 'APPROACH':
      return { angelHpDelta: 0, nervIntegrityDelta: -0.5 };

    case 'CONTACT': {
      const angelDamage = -(avgSyncRatio / 100) * 3;
      const nervDamage = magiStatus === 'AGREE' ? -1 : -2;
      return { angelHpDelta: angelDamage, nervIntegrityDelta: nervDamage };
    }

    case 'RESOLUTION':
      return { angelHpDelta: -1, nervIntegrityDelta: -0.5 };

    default:
      return { angelHpDelta: 0, nervIntegrityDelta: 0 };
  }
}

/** Determine outcome: WIN if angelHp <= 0, LOSE if nervIntegrity <= 0, else PENDING */
export function eva_checkOutcome(angelHp: number, nervIntegrity: number): SimulationOutcome {
  if (angelHp <= 0) return 'WIN';
  if (nervIntegrity <= 0) return 'LOSE';
  return 'PENDING';
}

/** Generate the system alert message appropriate for entering a phase */
export function eva_phaseAlertMessage(phase: SimulationPhase): string {
  switch (phase) {
    case 'DETECTION':
      return '[MAGI] Angel pattern detected - initiating analysis';
    case 'APPROACH':
      return '[TACTICAL] Angel approaching Tokyo-3 perimeter';
    case 'CONTACT':
      return '[COMBAT] EVA units engaging angel - AT Field contact';
    case 'RESOLUTION':
      return '[TACTICAL] Entering resolution phase - final strike authorized';
    default:
      return '[SYSTEM] Simulation state change';
  }
}

/** Get alert level for a phase transition */
export function eva_phaseAlertLevel(phase: SimulationPhase): SystemAlert['level'] {
  switch (phase) {
    case 'DETECTION':
      return 'WARNING';
    case 'APPROACH':
      return 'CRITICAL';
    case 'CONTACT':
      return 'EMERGENCY';
    case 'RESOLUTION':
      return 'CRITICAL';
    default:
      return 'INFO';
  }
}
