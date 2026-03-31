import type {
  SimulationPhase,
  SimulationState,
  SyncRatios,
  ATFieldState,
  DifficultyTier,
  PerformanceRecord,
  MagiVotes,
  MagiStatus,
  MagiTieBreakWeights,
} from '../types/nerv.d';

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

// ── AT Field Constants ──────────────────────────────────────────────────────

/** Base AT Field strength for a new angel */
export const AT_FIELD_BASE_STRENGTH = 80;

/** Minimum sync ratio required for a pilot to contribute to AT Field erosion */
export const AT_FIELD_EROSION_SYNC_THRESHOLD = 30;

/** AT Field erosion per tick per active pilot = syncRatio * this factor */
export const AT_FIELD_EROSION_FACTOR = 0.08;

/** Fraction of damage absorbed while AT Field is active (0–1) */
export const AT_FIELD_DAMAGE_ABSORPTION = 0.7;

// ── Difficulty Scaling Constants ────────────────────────────────────────────

/** Difficulty multipliers: angelHp, nervDamage, atFieldStrength */
export const DIFFICULTY_MULTIPLIERS: Record<DifficultyTier, { angelHp: number; nervDamage: number; atFieldStrength: number }> = {
  EASY:    { angelHp: 0.7,  nervDamage: 0.6,  atFieldStrength: 0.5 },
  NORMAL:  { angelHp: 1.0,  nervDamage: 1.0,  atFieldStrength: 1.0 },
  HARD:    { angelHp: 1.3,  nervDamage: 1.4,  atFieldStrength: 1.2 },
  EXTREME: { angelHp: 1.6,  nervDamage: 1.8,  atFieldStrength: 1.5 },
};

/** Streak thresholds for tier transitions */
export const STREAK_THRESHOLD = 3;

// ── MAGI Tie-Break Constants ────────────────────────────────────────────────

/** Default MAGI priority weights (scientist > woman > mother for combat decisions) */
export const DEFAULT_MAGI_TIEBREAK_WEIGHTS: MagiTieBreakWeights = {
  melchior: 3, // SCIENTIST — highest combat authority
  balthasar: 1, // MOTHER — lowest combat authority
  casper: 2,    // WOMAN — moderate combat authority
};

// ── Per-phase damage multipliers ────────────────────────────────────────────

/** Per-phase damage multipliers for angel and NERV damage */
export const PHASE_DAMAGE_MULTIPLIERS: Record<SimulationPhase, { angel: number; nerv: number }> = {
  IDLE: { angel: 0, nerv: 0 },
  DETECTION: { angel: 0, nerv: 0 },
  APPROACH: { angel: 0.5, nerv: 0.3 },
  CONTACT: { angel: 1.5, nerv: 0.8 },
  RESOLUTION: { angel: 2.0, nerv: 1.2 },
};

// ── Phase Logic ─────────────────────────────────────────────────────────────

export function eva_nextPhase(current: SimulationPhase): SimulationPhase | null {
  const idx = PHASE_ORDER.indexOf(current);
  if (idx === -1 || idx === PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[idx + 1];
}

export function eva_pickAngel(): string {
  return ANGEL_NAMES[Math.floor(Math.random() * ANGEL_NAMES.length)];
}

// ── Combat Damage ───────────────────────────────────────────────────────────

export function eva_computeCombatDamage(
  syncRatios: SyncRatios,
  options?: { phase?: SimulationPhase; magiAgreed?: boolean; atField?: ATFieldState; difficultyTier?: DifficultyTier },
): {
  angelDamage: number;
  nervDamage: number;
} {
  const phase = options?.phase ?? 'CONTACT';
  const multipliers = PHASE_DAMAGE_MULTIPLIERS[phase];
  const tier = options?.difficultyTier ?? 'NORMAL';
  const diffMultipliers = DIFFICULTY_MULTIPLIERS[tier];

  // No damage during non-combat phases
  if (multipliers.angel === 0 && multipliers.nerv === 0) {
    return { angelDamage: 0, nervDamage: 0 };
  }

  const values = Object.values(syncRatios);
  const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 50;
  const syncFactor = avg / 100;
  const magiMultiplier = options?.magiAgreed ? 1.5 : 1.0;

  let angelDamage = multipliers.angel * syncFactor * magiMultiplier + Math.random() * 2;

  // AT Field absorbs a fraction of damage to the angel while active
  const atField = options?.atField;
  if (atField && atField.isActive && atField.strength > 0) {
    angelDamage *= (1 - AT_FIELD_DAMAGE_ABSORPTION);
  }

  const nervDamage = (multipliers.nerv + Math.random() * 4) * diffMultipliers.nervDamage;
  return { angelDamage, nervDamage };
}

// ── AT Field Mechanics ──────────────────────────────────────────────────────

/**
 * Compute AT Field erosion for a single tick.
 * Each active pilot with sync ratio above the threshold contributes erosion.
 */
export function eva_computeATFieldErosion(syncRatios: SyncRatios): number {
  const values = Object.values(syncRatios);
  let totalErosion = 0;
  for (const sync of values) {
    if (sync >= AT_FIELD_EROSION_SYNC_THRESHOLD) {
      totalErosion += sync * AT_FIELD_EROSION_FACTOR;
    }
  }
  return totalErosion;
}

/**
 * Apply one tick of AT Field erosion and return the updated AT Field state.
 */
export function eva_tickATField(atField: ATFieldState, erosion: number): ATFieldState {
  if (!atField.isActive) return atField;
  const newStrength = Math.max(0, atField.strength - erosion);
  return {
    strength: newStrength,
    isActive: newStrength > 0,
    erosionApplied: atField.erosionApplied + erosion,
  };
}

/**
 * Create the initial AT Field state for a new angel engagement.
 */
export function eva_initialATFieldState(difficultyTier?: DifficultyTier): ATFieldState {
  const tier = difficultyTier ?? 'NORMAL';
  const multiplier = DIFFICULTY_MULTIPLIERS[tier].atFieldStrength;
  return {
    strength: AT_FIELD_BASE_STRENGTH * multiplier,
    isActive: true,
    erosionApplied: 0,
  };
}

// ── MAGI Tie-Break Logic ────────────────────────────────────────────────────

/**
 * Resolve a MAGI CONFLICT (1 approve, 2 reject) using weighted priority.
 * The single approving subsystem wins only if its weight strictly exceeds
 * the combined weight of dissenters. Otherwise the majority wins.
 */
export function eva_resolveMagiTieBreak(
  votes: MagiVotes,
  weights?: MagiTieBreakWeights,
): MagiStatus {
  const w = weights ?? DEFAULT_MAGI_TIEBREAK_WEIGHTS;
  const approvals = [votes.melchior, votes.balthasar, votes.casper].filter(Boolean).length;

  // No conflict: 0/3 → DISAGREE, 2/3 or 3/3 → AGREE
  if (approvals >= 2) return 'AGREE';
  if (approvals === 0) return 'DISAGREE';

  // 1/3 conflict: check if the lone approver has highest weight
  const approverWeight =
    (votes.melchior ? w.melchior : 0) +
    (votes.balthasar ? w.balthasar : 0) +
    (votes.casper ? w.casper : 0);

  const dissenterWeight =
    (!votes.melchior ? w.melchior : 0) +
    (!votes.balthasar ? w.balthasar : 0) +
    (!votes.casper ? w.casper : 0);

  if (approverWeight > dissenterWeight) return 'AGREE';
  return 'DISAGREE';
}

// ── Dynamic Difficulty Scaling ──────────────────────────────────────────────

/**
 * Determine difficulty tier from performance history.
 */
export function eva_computeDifficultyTier(record: PerformanceRecord): DifficultyTier {
  const tiers: DifficultyTier[] = ['EASY', 'NORMAL', 'HARD', 'EXTREME'];
  const currentIdx = tiers.indexOf(record.difficultyTier);

  if (record.currentStreak >= STREAK_THRESHOLD) {
    return tiers[Math.min(currentIdx + 1, tiers.length - 1)];
  }
  if (record.currentStreak <= -STREAK_THRESHOLD) {
    return tiers[Math.max(currentIdx - 1, 0)];
  }
  return record.difficultyTier;
}

/**
 * Update the performance record after a simulation outcome.
 */
export function eva_updatePerformanceRecord(
  record: PerformanceRecord,
  outcome: 'VICTORY' | 'DEFEAT',
): PerformanceRecord {
  const isWin = outcome === 'VICTORY';
  const newStreak = isWin
    ? (record.currentStreak > 0 ? record.currentStreak + 1 : 1)
    : (record.currentStreak < 0 ? record.currentStreak - 1 : -1);

  const updated: PerformanceRecord = {
    wins: record.wins + (isWin ? 1 : 0),
    losses: record.losses + (isWin ? 0 : 1),
    currentStreak: newStreak,
    difficultyTier: record.difficultyTier,
  };

  updated.difficultyTier = eva_computeDifficultyTier(updated);
  return updated;
}

/**
 * Create a fresh performance record.
 */
export function eva_initialPerformanceRecord(): PerformanceRecord {
  return {
    wins: 0,
    losses: 0,
    currentStreak: 0,
    difficultyTier: 'NORMAL',
  };
}

/**
 * Scale angel HP for the current difficulty tier.
 */
export function eva_scaledAngelHp(difficultyTier?: DifficultyTier): number {
  const tier = difficultyTier ?? 'NORMAL';
  return Math.round(100 * DIFFICULTY_MULTIPLIERS[tier].angelHp);
}

/**
 * Apply random fluctuation to a sync ratio value.
 * @returns The new sync ratio, clamped to 0–100.
 */
export function eva_fluctuateSyncRatio(current: number): number {
  const delta = (Math.random() - 0.5) * 4;
  return Math.max(0, Math.min(100, current + delta));
}

// ── Alert Messages ──────────────────────────────────────────────────────────

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

// ── Initial State ───────────────────────────────────────────────────────────

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
    atField: {
      strength: 0,
      isActive: false,
      erosionApplied: 0,
    },
  };
}
