import {
  ANGEL_NAMES,
  PHASE_DURATIONS,
  PHASE_ORDER,
  AT_FIELD_BASE_STRENGTH,
  AT_FIELD_EROSION_SYNC_THRESHOLD,
  AT_FIELD_DAMAGE_ABSORPTION,
  DIFFICULTY_MULTIPLIERS,
  STREAK_THRESHOLD,
  DEFAULT_MAGI_TIEBREAK_WEIGHTS,
  eva_nextPhase,
  eva_pickAngel,
  eva_computeCombatDamage,
  eva_phaseAlertMessage,
  eva_initialSimulationState,
  eva_computeATFieldErosion,
  eva_tickATField,
  eva_initialATFieldState,
  eva_resolveMagiTieBreak,
  eva_computeDifficultyTier,
  eva_updatePerformanceRecord,
  eva_initialPerformanceRecord,
  eva_scaledAngelHp,
} from '../simulation/engine';
import type { ATFieldState, PerformanceRecord, MagiVotes } from '../types/nerv.d';

describe('simulation engine', () => {
  describe('eva_nextPhase', () => {
    it('returns APPROACH after DETECTION', () => {
      expect(eva_nextPhase('DETECTION')).toBe('APPROACH');
    });

    it('returns CONTACT after APPROACH', () => {
      expect(eva_nextPhase('APPROACH')).toBe('CONTACT');
    });

    it('returns RESOLUTION after CONTACT', () => {
      expect(eva_nextPhase('CONTACT')).toBe('RESOLUTION');
    });

    it('returns null after RESOLUTION', () => {
      expect(eva_nextPhase('RESOLUTION')).toBeNull();
    });

    it('returns null for IDLE', () => {
      expect(eva_nextPhase('IDLE')).toBeNull();
    });
  });

  describe('eva_pickAngel', () => {
    it('returns a name from ANGEL_NAMES', () => {
      const name = eva_pickAngel();
      expect(ANGEL_NAMES).toContain(name);
    });
  });

  describe('eva_computeCombatDamage', () => {
    it('returns values in expected ranges without AT Field', () => {
      const result = eva_computeCombatDamage({ 'pilot-01': 80, 'pilot-02': 60 });
      expect(result.angelDamage).toBeGreaterThanOrEqual(3);
      expect(result.angelDamage).toBeLessThanOrEqual(6);
      expect(result.nervDamage).toBeGreaterThanOrEqual(1);
      expect(result.nervDamage).toBeLessThanOrEqual(5);
    });

    it('uses default avg of 50 when no sync ratios', () => {
      const result = eva_computeCombatDamage({});
      expect(result.angelDamage).toBeGreaterThanOrEqual(0.5);
      expect(result.angelDamage).toBeLessThanOrEqual(5);
    });

    it('reduces angel damage when AT Field is active', () => {
      const activeField: ATFieldState = { strength: 50, isActive: true, erosionApplied: 0 };
      const result = eva_computeCombatDamage({ 'pilot-01': 80 }, activeField);
      expect(result.angelDamage).toBeLessThanOrEqual(2);
    });

    it('does not reduce angel damage when AT Field is down', () => {
      const downField: ATFieldState = { strength: 0, isActive: false, erosionApplied: 80 };
      const result = eva_computeCombatDamage({ 'pilot-01': 80 }, downField);
      expect(result.angelDamage).toBeGreaterThanOrEqual(3.5);
    });

    it('scales NERV damage by difficulty', () => {
      const results: number[] = [];
      for (let i = 0; i < 50; i++) {
        const result = eva_computeCombatDamage({}, undefined, 'EXTREME');
        results.push(result.nervDamage);
      }
      const avg = results.reduce((a, b) => a + b, 0) / results.length;
      expect(avg).toBeGreaterThan(3);
    });
  });

  describe('eva_phaseAlertMessage', () => {
    it('returns non-empty strings for each phase', () => {
      for (const phase of PHASE_ORDER) {
        const msg = eva_phaseAlertMessage(phase, 'SACHIEL');
        expect(msg.length).toBeGreaterThan(0);
        expect(msg).toContain('SACHIEL');
      }
    });

    it('returns a message for IDLE as well', () => {
      const msg = eva_phaseAlertMessage('IDLE', 'RAMIEL');
      expect(msg.length).toBeGreaterThan(0);
    });
  });

  describe('PHASE_DURATIONS', () => {
    it('has values for all phases', () => {
      expect(PHASE_DURATIONS.IDLE).toBe(0);
      expect(PHASE_DURATIONS.DETECTION).toBe(10);
      expect(PHASE_DURATIONS.APPROACH).toBe(15);
      expect(PHASE_DURATIONS.CONTACT).toBe(20);
      expect(PHASE_DURATIONS.RESOLUTION).toBe(10);
    });
  });

  describe('eva_initialSimulationState', () => {
    it('returns correct defaults including AT Field', () => {
      const state = eva_initialSimulationState();
      expect(state.phase).toBe('IDLE');
      expect(state.outcome).toBe('PENDING');
      expect(state.isPaused).toBe(false);
      expect(state.phaseTimeRemaining).toBe(0);
      expect(state.phaseElapsed).toBe(0);
      expect(state.angelHp).toBe(100);
      expect(state.nervDefense).toBe(100);
      expect(state.currentAngelName).toBe('');
      expect(state.atField).toEqual({
        strength: 0,
        isActive: false,
        erosionApplied: 0,
      });
    });
  });
});

// ── AT Field Mechanics ──────────────────────────────────────────────────────

describe('AT Field mechanics', () => {
  describe('eva_computeATFieldErosion', () => {
    it('returns 0 when no pilots have sync ratios', () => {
      expect(eva_computeATFieldErosion({})).toBe(0);
    });

    it('returns 0 when all pilots are below threshold', () => {
      expect(eva_computeATFieldErosion({
        'p1': AT_FIELD_EROSION_SYNC_THRESHOLD - 1,
        'p2': 10,
      })).toBe(0);
    });

    it('computes erosion from pilots above threshold', () => {
      const erosion = eva_computeATFieldErosion({ 'p1': 80, 'p2': 60 });
      expect(erosion).toBeCloseTo(11.2);
    });

    it('excludes pilots below threshold from erosion', () => {
      const erosion = eva_computeATFieldErosion({ 'p1': 80, 'p2': 10 });
      expect(erosion).toBeCloseTo(6.4);
    });
  });

  describe('eva_tickATField', () => {
    it('reduces strength by erosion amount', () => {
      const field: ATFieldState = { strength: 50, isActive: true, erosionApplied: 0 };
      const result = eva_tickATField(field, 10);
      expect(result.strength).toBe(40);
      expect(result.isActive).toBe(true);
      expect(result.erosionApplied).toBe(10);
    });

    it('deactivates when strength reaches 0', () => {
      const field: ATFieldState = { strength: 5, isActive: true, erosionApplied: 75 };
      const result = eva_tickATField(field, 10);
      expect(result.strength).toBe(0);
      expect(result.isActive).toBe(false);
      expect(result.erosionApplied).toBe(85);
    });

    it('does not erode inactive fields', () => {
      const field: ATFieldState = { strength: 0, isActive: false, erosionApplied: 80 };
      const result = eva_tickATField(field, 10);
      expect(result).toEqual(field);
    });

    it('accumulates erosion across ticks', () => {
      let field: ATFieldState = { strength: 30, isActive: true, erosionApplied: 0 };
      field = eva_tickATField(field, 10);
      field = eva_tickATField(field, 10);
      field = eva_tickATField(field, 10);
      expect(field.strength).toBe(0);
      expect(field.isActive).toBe(false);
      expect(field.erosionApplied).toBe(30);
    });
  });

  describe('eva_initialATFieldState', () => {
    it('creates AT Field with base strength at NORMAL difficulty', () => {
      const field = eva_initialATFieldState('NORMAL');
      expect(field.strength).toBe(AT_FIELD_BASE_STRENGTH);
      expect(field.isActive).toBe(true);
      expect(field.erosionApplied).toBe(0);
    });

    it('scales strength by difficulty tier', () => {
      const easy = eva_initialATFieldState('EASY');
      const hard = eva_initialATFieldState('HARD');
      const extreme = eva_initialATFieldState('EXTREME');

      expect(easy.strength).toBeLessThan(AT_FIELD_BASE_STRENGTH);
      expect(hard.strength).toBeGreaterThan(AT_FIELD_BASE_STRENGTH);
      expect(extreme.strength).toBeGreaterThan(hard.strength);
    });

    it('defaults to NORMAL when no tier specified', () => {
      const field = eva_initialATFieldState();
      expect(field.strength).toBe(AT_FIELD_BASE_STRENGTH);
    });
  });
});

// ── MAGI Tie-Break Logic ────────────────────────────────────────────────────

describe('MAGI tie-break logic', () => {
  describe('eva_resolveMagiTieBreak', () => {
    it('returns AGREE for 3/3 unanimous approval', () => {
      const votes: MagiVotes = { melchior: true, balthasar: true, casper: true };
      expect(eva_resolveMagiTieBreak(votes)).toBe('AGREE');
    });

    it('returns AGREE for 2/3 majority', () => {
      expect(eva_resolveMagiTieBreak({ melchior: true, balthasar: true, casper: false })).toBe('AGREE');
      expect(eva_resolveMagiTieBreak({ melchior: true, balthasar: false, casper: true })).toBe('AGREE');
      expect(eva_resolveMagiTieBreak({ melchior: false, balthasar: true, casper: true })).toBe('AGREE');
    });

    it('returns DISAGREE for 0/3 unanimous rejection', () => {
      const votes: MagiVotes = { melchior: false, balthasar: false, casper: false };
      expect(eva_resolveMagiTieBreak(votes)).toBe('DISAGREE');
    });

    it('resolves 1/3 CONFLICT — melchior cannot override alone with default weights', () => {
      const votes: MagiVotes = { melchior: true, balthasar: false, casper: false };
      expect(eva_resolveMagiTieBreak(votes)).toBe('DISAGREE');
    });

    it('resolves 1/3 CONFLICT — lower weight cannot override', () => {
      const votes: MagiVotes = { melchior: false, balthasar: true, casper: false };
      expect(eva_resolveMagiTieBreak(votes)).toBe('DISAGREE');
    });

    it('uses custom weights to allow override', () => {
      const weights = { melchior: 10, balthasar: 1, casper: 2 };
      const votes: MagiVotes = { melchior: true, balthasar: false, casper: false };
      expect(eva_resolveMagiTieBreak(votes, weights)).toBe('AGREE');
    });

    it('custom weights — lone approver with lower weight still loses', () => {
      const weights = { melchior: 10, balthasar: 1, casper: 2 };
      const votes: MagiVotes = { melchior: false, balthasar: true, casper: false };
      expect(eva_resolveMagiTieBreak(votes, weights)).toBe('DISAGREE');
    });
  });
});

// ── Dynamic Difficulty Scaling ──────────────────────────────────────────────

describe('dynamic difficulty scaling', () => {
  describe('eva_initialPerformanceRecord', () => {
    it('returns default NORMAL difficulty record', () => {
      const record = eva_initialPerformanceRecord();
      expect(record).toEqual({
        wins: 0,
        losses: 0,
        currentStreak: 0,
        difficultyTier: 'NORMAL',
      });
    });
  });

  describe('eva_updatePerformanceRecord', () => {
    it('tracks wins and increments streak', () => {
      let record = eva_initialPerformanceRecord();
      record = eva_updatePerformanceRecord(record, 'VICTORY');
      expect(record.wins).toBe(1);
      expect(record.losses).toBe(0);
      expect(record.currentStreak).toBe(1);
    });

    it('tracks losses and decrements streak', () => {
      let record = eva_initialPerformanceRecord();
      record = eva_updatePerformanceRecord(record, 'DEFEAT');
      expect(record.wins).toBe(0);
      expect(record.losses).toBe(1);
      expect(record.currentStreak).toBe(-1);
    });

    it('resets streak direction on outcome change', () => {
      let record = eva_initialPerformanceRecord();
      record = eva_updatePerformanceRecord(record, 'VICTORY');
      record = eva_updatePerformanceRecord(record, 'VICTORY');
      expect(record.currentStreak).toBe(2);

      record = eva_updatePerformanceRecord(record, 'DEFEAT');
      expect(record.currentStreak).toBe(-1);
    });

    it('increases difficulty after win streak threshold', () => {
      let record = eva_initialPerformanceRecord();
      for (let i = 0; i < STREAK_THRESHOLD; i++) {
        record = eva_updatePerformanceRecord(record, 'VICTORY');
      }
      expect(record.difficultyTier).toBe('HARD');
    });

    it('decreases difficulty after loss streak threshold', () => {
      let record = eva_initialPerformanceRecord();
      for (let i = 0; i < STREAK_THRESHOLD; i++) {
        record = eva_updatePerformanceRecord(record, 'DEFEAT');
      }
      expect(record.difficultyTier).toBe('EASY');
    });

    it('caps difficulty at EXTREME', () => {
      let record: PerformanceRecord = {
        wins: 10,
        losses: 0,
        currentStreak: STREAK_THRESHOLD - 1,
        difficultyTier: 'EXTREME',
      };
      record = eva_updatePerformanceRecord(record, 'VICTORY');
      expect(record.difficultyTier).toBe('EXTREME');
    });

    it('caps difficulty at EASY', () => {
      let record: PerformanceRecord = {
        wins: 0,
        losses: 10,
        currentStreak: -(STREAK_THRESHOLD - 1),
        difficultyTier: 'EASY',
      };
      record = eva_updatePerformanceRecord(record, 'DEFEAT');
      expect(record.difficultyTier).toBe('EASY');
    });
  });

  describe('eva_computeDifficultyTier', () => {
    it('stays at current tier with no streak', () => {
      const record: PerformanceRecord = {
        wins: 5, losses: 5, currentStreak: 0, difficultyTier: 'NORMAL',
      };
      expect(eva_computeDifficultyTier(record)).toBe('NORMAL');
    });

    it('increases tier on positive streak at threshold', () => {
      const record: PerformanceRecord = {
        wins: 5, losses: 0, currentStreak: STREAK_THRESHOLD, difficultyTier: 'NORMAL',
      };
      expect(eva_computeDifficultyTier(record)).toBe('HARD');
    });

    it('decreases tier on negative streak at threshold', () => {
      const record: PerformanceRecord = {
        wins: 0, losses: 5, currentStreak: -STREAK_THRESHOLD, difficultyTier: 'NORMAL',
      };
      expect(eva_computeDifficultyTier(record)).toBe('EASY');
    });
  });

  describe('eva_scaledAngelHp', () => {
    it('returns 100 for NORMAL', () => {
      expect(eva_scaledAngelHp('NORMAL')).toBe(100);
    });

    it('returns lower HP for EASY', () => {
      expect(eva_scaledAngelHp('EASY')).toBe(70);
    });

    it('returns higher HP for HARD', () => {
      expect(eva_scaledAngelHp('HARD')).toBe(130);
    });

    it('returns highest HP for EXTREME', () => {
      expect(eva_scaledAngelHp('EXTREME')).toBe(160);
    });

    it('defaults to NORMAL when no tier specified', () => {
      expect(eva_scaledAngelHp()).toBe(100);
    });
  });
});
