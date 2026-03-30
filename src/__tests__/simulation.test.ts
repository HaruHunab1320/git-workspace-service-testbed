import {
  PHASE_DURATIONS,
  PHASE_ORDER,
  eva_nextPhase,
  eva_phaseToEmergencyLevel,
  eva_simulationTick,
  eva_checkOutcome,
  eva_phaseAlertMessage,
  eva_phaseAlertLevel,
} from '../systems/simulation';

describe('simulation pure logic', () => {
  describe('PHASE_DURATIONS', () => {
    it('has durations for all four phases', () => {
      expect(PHASE_DURATIONS.DETECTION).toBe(10);
      expect(PHASE_DURATIONS.APPROACH).toBe(15);
      expect(PHASE_DURATIONS.CONTACT).toBe(20);
      expect(PHASE_DURATIONS.RESOLUTION).toBe(10);
    });
  });

  describe('PHASE_ORDER', () => {
    it('lists phases in correct order', () => {
      expect(PHASE_ORDER).toEqual(['DETECTION', 'APPROACH', 'CONTACT', 'RESOLUTION']);
    });
  });

  describe('eva_nextPhase', () => {
    it('progresses DETECTION -> APPROACH', () => {
      expect(eva_nextPhase('DETECTION')).toBe('APPROACH');
    });

    it('progresses APPROACH -> CONTACT', () => {
      expect(eva_nextPhase('APPROACH')).toBe('CONTACT');
    });

    it('progresses CONTACT -> RESOLUTION', () => {
      expect(eva_nextPhase('CONTACT')).toBe('RESOLUTION');
    });

    it('returns null after RESOLUTION', () => {
      expect(eva_nextPhase('RESOLUTION')).toBeNull();
    });

    it('returns null for IDLE', () => {
      expect(eva_nextPhase('IDLE')).toBeNull();
    });
  });

  describe('eva_phaseToEmergencyLevel', () => {
    it('maps IDLE to ALERT', () => {
      expect(eva_phaseToEmergencyLevel('IDLE')).toBe('ALERT');
    });

    it('maps DETECTION to ALERT', () => {
      expect(eva_phaseToEmergencyLevel('DETECTION')).toBe('ALERT');
    });

    it('maps APPROACH to EMERGENCY', () => {
      expect(eva_phaseToEmergencyLevel('APPROACH')).toBe('EMERGENCY');
    });

    it('maps CONTACT to EMERGENCY', () => {
      expect(eva_phaseToEmergencyLevel('CONTACT')).toBe('EMERGENCY');
    });

    it('maps RESOLUTION to EMERGENCY', () => {
      expect(eva_phaseToEmergencyLevel('RESOLUTION')).toBe('EMERGENCY');
    });
  });

  describe('eva_simulationTick', () => {
    const baseParams = {
      angelHp: 100,
      nervIntegrity: 100,
      avgSyncRatio: 80,
      magiStatus: 'DISAGREE' as const,
    };

    it('returns no damage during DETECTION', () => {
      const result = eva_simulationTick({ ...baseParams, phase: 'DETECTION' });
      expect(result.angelHpDelta).toBe(0);
      expect(result.nervIntegrityDelta).toBe(0);
    });

    it('reduces NERV integrity during APPROACH', () => {
      const result = eva_simulationTick({ ...baseParams, phase: 'APPROACH' });
      expect(result.angelHpDelta).toBe(0);
      expect(result.nervIntegrityDelta).toBe(-0.5);
    });

    it('deals angel damage based on sync ratio during CONTACT', () => {
      const result = eva_simulationTick({ ...baseParams, phase: 'CONTACT' });
      expect(result.angelHpDelta).toBeCloseTo(-(80 / 100) * 3);
      expect(result.nervIntegrityDelta).toBe(-2);
    });

    it('reduces NERV damage during CONTACT when MAGI AGREE', () => {
      const result = eva_simulationTick({
        ...baseParams,
        phase: 'CONTACT',
        magiStatus: 'AGREE',
      });
      expect(result.nervIntegrityDelta).toBe(-1);
    });

    it('deals damage during RESOLUTION', () => {
      const result = eva_simulationTick({ ...baseParams, phase: 'RESOLUTION' });
      expect(result.angelHpDelta).toBe(-1);
      expect(result.nervIntegrityDelta).toBe(-0.5);
    });

    it('returns no damage for IDLE', () => {
      const result = eva_simulationTick({ ...baseParams, phase: 'IDLE' });
      expect(result.angelHpDelta).toBe(0);
      expect(result.nervIntegrityDelta).toBe(0);
    });
  });

  describe('eva_checkOutcome', () => {
    it('returns WIN when angelHp is 0', () => {
      expect(eva_checkOutcome(0, 50)).toBe('WIN');
    });

    it('returns WIN when angelHp is negative', () => {
      expect(eva_checkOutcome(-5, 50)).toBe('WIN');
    });

    it('returns LOSE when nervIntegrity is 0', () => {
      expect(eva_checkOutcome(50, 0)).toBe('LOSE');
    });

    it('returns LOSE when nervIntegrity is negative', () => {
      expect(eva_checkOutcome(50, -10)).toBe('LOSE');
    });

    it('returns PENDING when both are positive', () => {
      expect(eva_checkOutcome(50, 50)).toBe('PENDING');
    });

    it('returns WIN when both are 0 (angel dies first check)', () => {
      expect(eva_checkOutcome(0, 0)).toBe('WIN');
    });
  });

  describe('eva_phaseAlertMessage', () => {
    it('returns a message for each phase', () => {
      expect(eva_phaseAlertMessage('DETECTION')).toContain('detected');
      expect(eva_phaseAlertMessage('APPROACH')).toContain('approaching');
      expect(eva_phaseAlertMessage('CONTACT')).toContain('engaging');
      expect(eva_phaseAlertMessage('RESOLUTION')).toContain('resolution');
    });
  });

  describe('eva_phaseAlertLevel', () => {
    it('returns WARNING for DETECTION', () => {
      expect(eva_phaseAlertLevel('DETECTION')).toBe('WARNING');
    });

    it('returns CRITICAL for APPROACH', () => {
      expect(eva_phaseAlertLevel('APPROACH')).toBe('CRITICAL');
    });

    it('returns EMERGENCY for CONTACT', () => {
      expect(eva_phaseAlertLevel('CONTACT')).toBe('EMERGENCY');
    });

    it('returns CRITICAL for RESOLUTION', () => {
      expect(eva_phaseAlertLevel('RESOLUTION')).toBe('CRITICAL');
    });
  });
});
