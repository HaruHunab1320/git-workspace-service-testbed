import {
  ANGEL_NAMES,
  PHASE_DURATIONS,
  PHASE_ORDER,
  eva_nextPhase,
  eva_pickAngel,
  eva_computeCombatDamage,
  eva_phaseAlertMessage,
  eva_initialSimulationState,
} from '../simulation/engine';

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
    it('returns values in expected ranges', () => {
      const result = eva_computeCombatDamage({ 'pilot-01': 80, 'pilot-02': 60 });
      // avg = 70, angelDamage = 70/20 + random(0-2) = 3.5 + [0,2] => [3.5, 5.5]
      expect(result.angelDamage).toBeGreaterThanOrEqual(3);
      expect(result.angelDamage).toBeLessThanOrEqual(6);
      // nervDamage = 1 + random(0-4) => [1, 5]
      expect(result.nervDamage).toBeGreaterThanOrEqual(1);
      expect(result.nervDamage).toBeLessThanOrEqual(5);
    });

    it('uses default avg of 50 when no sync ratios', () => {
      const result = eva_computeCombatDamage({});
      // avg = 50, angelDamage = 50/20 + random(0-2) = 2.5 + [0,2] => [2.5, 4.5]
      expect(result.angelDamage).toBeGreaterThanOrEqual(2);
      expect(result.angelDamage).toBeLessThanOrEqual(5);
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
    it('returns correct defaults', () => {
      const state = eva_initialSimulationState();
      expect(state.phase).toBe('IDLE');
      expect(state.outcome).toBe('PENDING');
      expect(state.isPaused).toBe(false);
      expect(state.phaseTimeRemaining).toBe(0);
      expect(state.phaseElapsed).toBe(0);
      expect(state.angelHp).toBe(100);
      expect(state.nervDefense).toBe(100);
      expect(state.currentAngelName).toBe('');
    });
  });
});
