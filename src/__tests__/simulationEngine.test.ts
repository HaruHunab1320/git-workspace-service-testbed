import {
  ANGEL_NAMES,
  PHASE_DURATIONS,
  PHASE_ORDER,
  PHASE_DAMAGE_MULTIPLIERS,
  eva_nextPhase,
  eva_pickAngel,
  eva_computeCombatDamage,
  eva_phaseAlertMessage,
  eva_initialSimulationState,
  eva_fluctuateSyncRatio,
} from '../simulation/engine';
import { useNervStore, eva_computeMagiStatus, eva_calculateSyncRatio } from '../store/useNervStore';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { eva_magiVote, getMagiApproval, eva_computeConsensus, MAGI_LABELS } from '../systems/magi/index';

// ---------------------------------------------------------------------------
// Helper to reset store between tests
// ---------------------------------------------------------------------------
function resetStore() {
  useNervStore.setState({
    emergencyLevel: 'NORMAL',
    syncRatio: 100,
    syncRatios: {},
    magiVotes: { melchior: false, balthasar: false, casper: false },
    magiStatus: 'DISAGREE',
    systemAlerts: [],
    evaPositions: [],
    angelDetected: false,
    simulation: eva_initialSimulationState(),
    pilots: [],
  });
}

// ===========================================================================
// 1. Pure utility functions from engine.ts
// ===========================================================================
describe('simulation engine utilities', () => {
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

    it('returns null after RESOLUTION (terminal phase)', () => {
      expect(eva_nextPhase('RESOLUTION')).toBeNull();
    });

    it('returns null for IDLE (not in phase order)', () => {
      expect(eva_nextPhase('IDLE')).toBeNull();
    });
  });

  describe('eva_pickAngel', () => {
    it('returns a name from ANGEL_NAMES', () => {
      const name = eva_pickAngel();
      expect(ANGEL_NAMES).toContain(name);
    });

    it('returns different names over many calls (randomness)', () => {
      const names = new Set(Array.from({ length: 50 }, () => eva_pickAngel()));
      expect(names.size).toBeGreaterThan(1);
    });
  });

  describe('eva_computeCombatDamage', () => {
    it('returns values in expected ranges with sync ratios (legacy call)', () => {
      const result = eva_computeCombatDamage({ 'pilot-01': 80, 'pilot-02': 60 });
      expect(result.angelDamage).toBeGreaterThanOrEqual(0);
      expect(result.nervDamage).toBeGreaterThanOrEqual(0);
    });

    it('uses default avg of 50 when no sync ratios', () => {
      const result = eva_computeCombatDamage({});
      expect(result.angelDamage).toBeGreaterThanOrEqual(0);
      expect(result.nervDamage).toBeGreaterThanOrEqual(0);
    });

    it('higher sync ratios produce higher angel damage on average', () => {
      let highSyncTotal = 0;
      let lowSyncTotal = 0;
      const iterations = 200;
      for (let i = 0; i < iterations; i++) {
        highSyncTotal += eva_computeCombatDamage({ p1: 100 }, { phase: 'CONTACT' }).angelDamage;
        lowSyncTotal += eva_computeCombatDamage({ p1: 20 }, { phase: 'CONTACT' }).angelDamage;
      }
      expect(highSyncTotal / iterations).toBeGreaterThan(lowSyncTotal / iterations);
    });

    it('returns zero damage for DETECTION phase', () => {
      const result = eva_computeCombatDamage({ p1: 100 }, { phase: 'DETECTION' });
      expect(result.angelDamage).toBe(0);
      expect(result.nervDamage).toBe(0);
    });

    it('returns zero damage for IDLE phase', () => {
      const result = eva_computeCombatDamage({ p1: 100 }, { phase: 'IDLE' });
      expect(result.angelDamage).toBe(0);
      expect(result.nervDamage).toBe(0);
    });

    it('applies damage during APPROACH phase', () => {
      let total = 0;
      for (let i = 0; i < 50; i++) {
        total += eva_computeCombatDamage({ p1: 80 }, { phase: 'APPROACH' }).angelDamage;
      }
      expect(total / 50).toBeGreaterThan(0);
    });

    it('applies damage during RESOLUTION phase', () => {
      let total = 0;
      for (let i = 0; i < 50; i++) {
        total += eva_computeCombatDamage({ p1: 80 }, { phase: 'RESOLUTION' }).angelDamage;
      }
      expect(total / 50).toBeGreaterThan(0);
    });

    it('MAGI AGREE multiplier (1.5x) increases angel damage', () => {
      let withMagi = 0;
      let withoutMagi = 0;
      const iterations = 200;
      for (let i = 0; i < iterations; i++) {
        withMagi += eva_computeCombatDamage({ p1: 80 }, { phase: 'CONTACT', magiAgreed: true }).angelDamage;
        withoutMagi += eva_computeCombatDamage({ p1: 80 }, { phase: 'CONTACT', magiAgreed: false }).angelDamage;
      }
      expect(withMagi / iterations).toBeGreaterThan(withoutMagi / iterations);
    });

    it('CONTACT deals more angel damage than APPROACH on average', () => {
      let contactTotal = 0;
      let approachTotal = 0;
      const iterations = 200;
      for (let i = 0; i < iterations; i++) {
        contactTotal += eva_computeCombatDamage({ p1: 80 }, { phase: 'CONTACT' }).angelDamage;
        approachTotal += eva_computeCombatDamage({ p1: 80 }, { phase: 'APPROACH' }).angelDamage;
      }
      expect(contactTotal / iterations).toBeGreaterThan(approachTotal / iterations);
    });
  });

  describe('PHASE_DAMAGE_MULTIPLIERS', () => {
    it('IDLE and DETECTION have zero multipliers', () => {
      expect(PHASE_DAMAGE_MULTIPLIERS.IDLE).toEqual({ angel: 0, nerv: 0 });
      expect(PHASE_DAMAGE_MULTIPLIERS.DETECTION).toEqual({ angel: 0, nerv: 0 });
    });

    it('APPROACH has lower multipliers than CONTACT', () => {
      expect(PHASE_DAMAGE_MULTIPLIERS.APPROACH.angel).toBeLessThan(PHASE_DAMAGE_MULTIPLIERS.CONTACT.angel);
    });

    it('RESOLUTION has highest angel multiplier', () => {
      expect(PHASE_DAMAGE_MULTIPLIERS.RESOLUTION.angel).toBeGreaterThan(PHASE_DAMAGE_MULTIPLIERS.CONTACT.angel);
    });
  });

  describe('eva_fluctuateSyncRatio', () => {
    it('returns a value within 0–100', () => {
      for (let i = 0; i < 100; i++) {
        const result = eva_fluctuateSyncRatio(50);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
      }
    });

    it('clamps at lower boundary', () => {
      // With input 0, output should still be >= 0
      for (let i = 0; i < 50; i++) {
        expect(eva_fluctuateSyncRatio(0)).toBeGreaterThanOrEqual(0);
      }
    });

    it('clamps at upper boundary', () => {
      for (let i = 0; i < 50; i++) {
        expect(eva_fluctuateSyncRatio(100)).toBeLessThanOrEqual(100);
      }
    });

    it('stays close to the input value (max ±2 delta)', () => {
      for (let i = 0; i < 100; i++) {
        const result = eva_fluctuateSyncRatio(50);
        expect(result).toBeGreaterThanOrEqual(48);
        expect(result).toBeLessThanOrEqual(52);
      }
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

    it('includes the angel name in every phase message', () => {
      const angelName = 'ZERUEL';
      for (const phase of [...PHASE_ORDER, 'IDLE' as const]) {
        expect(eva_phaseAlertMessage(phase, angelName)).toContain(angelName);
      }
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

    it('all durations are non-negative', () => {
      for (const phase of Object.keys(PHASE_DURATIONS)) {
        expect(PHASE_DURATIONS[phase as keyof typeof PHASE_DURATIONS]).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('PHASE_ORDER', () => {
    it('contains exactly four combat phases in sequence', () => {
      expect(PHASE_ORDER).toEqual(['DETECTION', 'APPROACH', 'CONTACT', 'RESOLUTION']);
    });

    it('does not include IDLE', () => {
      expect(PHASE_ORDER).not.toContain('IDLE');
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

    it('returns a fresh object each call (no shared references)', () => {
      const a = eva_initialSimulationState();
      const b = eva_initialSimulationState();
      expect(a).toEqual(b);
      expect(a).not.toBe(b);
    });
  });
});

// ===========================================================================
// 2. Store-based simulation integration
// ===========================================================================
describe('store simulation integration', () => {
  beforeEach(() => resetStore());

  describe('full lifecycle', () => {
    it('start → tick through DETECTION → advance → reaches APPROACH', () => {
      useNervStore.getState().startSimulation();
      const sim = useNervStore.getState().simulation;
      expect(sim.phase).toBe('DETECTION');
      expect(sim.phaseTimeRemaining).toBe(PHASE_DURATIONS.DETECTION);

      for (let i = 0; i < PHASE_DURATIONS.DETECTION; i++) {
        useNervStore.getState().tickSimulation();
      }
      expect(useNervStore.getState().simulation.phase).toBe('APPROACH');
    });

    it('progresses through all four phases via ticking', () => {
      useNervStore.getState().startSimulation();

      // Tick through DETECTION (no damage)
      for (let i = 0; i < PHASE_DURATIONS.DETECTION; i++) {
        useNervStore.getState().tickSimulation();
      }
      expect(useNervStore.getState().simulation.phase).toBe('APPROACH');

      // Tick through APPROACH (damage happens — reset HP to prevent early end)
      for (let i = 0; i < PHASE_DURATIONS.APPROACH; i++) {
        useNervStore.getState().tickSimulation();
        const cur = useNervStore.getState().simulation;
        if (cur.phase !== 'IDLE') {
          useNervStore.setState((s) => ({
            simulation: { ...s.simulation, angelHp: 90, nervDefense: 90 },
          }));
        }
      }
      expect(useNervStore.getState().simulation.phase).toBe('CONTACT');

      // Tick through CONTACT (heavy damage — reset HP each tick)
      for (let i = 0; i < PHASE_DURATIONS.CONTACT; i++) {
        useNervStore.getState().tickSimulation();
        const cur = useNervStore.getState().simulation;
        if (cur.phase !== 'IDLE') {
          useNervStore.setState((s) => ({
            simulation: { ...s.simulation, angelHp: 80, nervDefense: 80 },
          }));
        }
      }
      expect(useNervStore.getState().simulation.phase).toBe('RESOLUTION');
    });
  });

  describe('combat damage across phases', () => {
    it('DETECTION tick does NOT reduce HP', () => {
      useNervStore.getState().startSimulation();
      expect(useNervStore.getState().simulation.phase).toBe('DETECTION');
      useNervStore.getState().tickSimulation();
      expect(useNervStore.getState().simulation.angelHp).toBe(100);
      expect(useNervStore.getState().simulation.nervDefense).toBe(100);
    });

    it('APPROACH tick reduces angelHp and nervDefense', () => {
      useNervStore.getState().startSimulation();
      useNervStore.setState((s) => ({
        simulation: {
          ...s.simulation,
          phase: 'APPROACH' as const,
          phaseTimeRemaining: 15,
          phaseElapsed: 0,
          angelHp: 100,
          nervDefense: 100,
        },
        syncRatios: { 'p1': 80 },
      }));

      useNervStore.getState().tickSimulation();
      const sim = useNervStore.getState().simulation;
      expect(sim.angelHp).toBeLessThan(100);
      expect(sim.nervDefense).toBeLessThan(100);
    });

    it('CONTACT tick reduces angelHp and nervDefense', () => {
      useNervStore.getState().startSimulation();
      useNervStore.setState((s) => ({
        simulation: {
          ...s.simulation,
          phase: 'CONTACT' as const,
          phaseTimeRemaining: 20,
          phaseElapsed: 0,
          angelHp: 100,
          nervDefense: 100,
        },
        syncRatios: { 'p1': 80 },
      }));

      useNervStore.getState().tickSimulation();
      const sim = useNervStore.getState().simulation;
      expect(sim.angelHp).toBeLessThan(100);
      expect(sim.nervDefense).toBeLessThan(100);
    });

    it('RESOLUTION tick reduces angelHp and nervDefense', () => {
      useNervStore.getState().startSimulation();
      useNervStore.setState((s) => ({
        simulation: {
          ...s.simulation,
          phase: 'RESOLUTION' as const,
          phaseTimeRemaining: 10,
          phaseElapsed: 0,
          angelHp: 100,
          nervDefense: 100,
        },
        syncRatios: { 'p1': 80 },
      }));

      useNervStore.getState().tickSimulation();
      const sim = useNervStore.getState().simulation;
      expect(sim.angelHp).toBeLessThan(100);
      expect(sim.nervDefense).toBeLessThan(100);
    });

    it('triggers VICTORY when angelHp reaches 0 during CONTACT', () => {
      useNervStore.getState().startSimulation();
      useNervStore.setState((s) => ({
        simulation: {
          ...s.simulation,
          phase: 'CONTACT' as const,
          phaseTimeRemaining: 20,
          angelHp: 1,
          nervDefense: 100,
        },
        syncRatios: { 'p1': 100 },
      }));

      useNervStore.getState().tickSimulation();
      expect(useNervStore.getState().simulation.outcome).toBe('VICTORY');
      expect(useNervStore.getState().simulation.phase).toBe('IDLE');
    });

    it('triggers DEFEAT when nervDefense reaches 0 during CONTACT', () => {
      useNervStore.getState().startSimulation();
      useNervStore.setState((s) => ({
        simulation: {
          ...s.simulation,
          phase: 'CONTACT' as const,
          phaseTimeRemaining: 20,
          angelHp: 100,
          nervDefense: 1,
        },
        syncRatios: {},
      }));

      useNervStore.getState().tickSimulation();
      expect(useNervStore.getState().simulation.outcome).toBe('DEFEAT');
      expect(useNervStore.getState().simulation.phase).toBe('IDLE');
    });
  });

  describe('MAGI multiplier in combat', () => {
    it('MAGI AGREE increases angel damage during combat ticks', () => {
      // Test with MAGI AGREE
      let totalDamageWithMagi = 0;
      let totalDamageWithout = 0;
      const runs = 30;

      for (let i = 0; i < runs; i++) {
        resetStore();
        useNervStore.getState().startSimulation();
        useNervStore.getState().setMagiVotes({ melchior: true, balthasar: true, casper: true });
        useNervStore.setState((s) => ({
          simulation: {
            ...s.simulation,
            phase: 'CONTACT' as const,
            phaseTimeRemaining: 20,
            angelHp: 100,
            nervDefense: 100,
          },
          syncRatios: { 'p1': 80 },
        }));
        useNervStore.getState().tickSimulation();
        totalDamageWithMagi += 100 - useNervStore.getState().simulation.angelHp;
      }

      for (let i = 0; i < runs; i++) {
        resetStore();
        useNervStore.getState().startSimulation();
        // Leave MAGI at DISAGREE
        useNervStore.setState((s) => ({
          simulation: {
            ...s.simulation,
            phase: 'CONTACT' as const,
            phaseTimeRemaining: 20,
            angelHp: 100,
            nervDefense: 100,
          },
          syncRatios: { 'p1': 80 },
        }));
        useNervStore.getState().tickSimulation();
        totalDamageWithout += 100 - useNervStore.getState().simulation.angelHp;
      }

      expect(totalDamageWithMagi / runs).toBeGreaterThan(totalDamageWithout / runs);
    });
  });

  describe('sync ratio fluctuation during combat', () => {
    it('fluctuates active pilot sync ratios during combat phase tick', () => {
      resetStore();
      useNervStore.getState().addPilot({
        id: 'p1', name: 'Shinji', status: 'ACTIVE', evaUnitId: 'EVA-01', syncRatio: 75,
      });
      useNervStore.getState().startSimulation();
      useNervStore.setState((s) => ({
        simulation: {
          ...s.simulation,
          phase: 'CONTACT' as const,
          phaseTimeRemaining: 20,
          angelHp: 100,
          nervDefense: 100,
        },
      }));

      const before = useNervStore.getState().syncRatios['p1'];
      // Tick several times — at least one should show fluctuation
      let changed = false;
      for (let i = 0; i < 20; i++) {
        useNervStore.getState().tickSimulation();
        const after = useNervStore.getState().syncRatios['p1'];
        if (after !== before) {
          changed = true;
          break;
        }
        // Reset HP to prevent early resolution
        useNervStore.setState((s) => ({
          simulation: { ...s.simulation, angelHp: 100, nervDefense: 100 },
        }));
      }
      expect(changed).toBe(true);
    });

    it('does NOT fluctuate inactive pilot sync ratios', () => {
      resetStore();
      useNervStore.getState().addPilot({
        id: 'p1', name: 'Shinji', status: 'INACTIVE', evaUnitId: null, syncRatio: 75,
      });
      useNervStore.getState().startSimulation();
      useNervStore.setState((s) => ({
        simulation: {
          ...s.simulation,
          phase: 'CONTACT' as const,
          phaseTimeRemaining: 20,
          angelHp: 100,
          nervDefense: 100,
        },
      }));

      const before = useNervStore.getState().syncRatios['p1'];
      useNervStore.getState().tickSimulation();
      expect(useNervStore.getState().syncRatios['p1']).toBe(before);
    });

    it('does NOT fluctuate sync ratios during DETECTION (non-combat)', () => {
      resetStore();
      useNervStore.getState().addPilot({
        id: 'p1', name: 'Shinji', status: 'ACTIVE', evaUnitId: 'EVA-01', syncRatio: 75,
      });
      useNervStore.getState().startSimulation();
      // Should be in DETECTION
      const before = useNervStore.getState().syncRatios['p1'];
      useNervStore.getState().tickSimulation();
      // DETECTION is non-combat, so sync ratios shouldn't change
      expect(useNervStore.getState().syncRatios['p1']).toBe(before);
    });
  });

  describe('advancePhase resolution logic', () => {
    it('VICTORY when angelHp < nervDefense after RESOLUTION', () => {
      useNervStore.getState().startSimulation();
      useNervStore.setState((s) => ({
        simulation: {
          ...s.simulation,
          phase: 'RESOLUTION' as const,
          angelHp: 30,
          nervDefense: 70,
        },
      }));

      useNervStore.getState().advancePhase();
      const state = useNervStore.getState();
      expect(state.simulation.outcome).toBe('VICTORY');
      expect(state.angelDetected).toBe(false);
      expect(state.emergencyLevel).toBe('NORMAL');
    });

    it('DEFEAT when angelHp >= nervDefense after RESOLUTION', () => {
      useNervStore.getState().startSimulation();
      useNervStore.setState((s) => ({
        simulation: {
          ...s.simulation,
          phase: 'RESOLUTION' as const,
          angelHp: 70,
          nervDefense: 30,
        },
      }));

      useNervStore.getState().advancePhase();
      const state = useNervStore.getState();
      expect(state.simulation.outcome).toBe('DEFEAT');
      expect(state.emergencyLevel).toBe('EMERGENCY');
    });

    it('equal angelHp and nervDefense at RESOLUTION end results in DEFEAT', () => {
      useNervStore.getState().startSimulation();
      useNervStore.setState((s) => ({
        simulation: {
          ...s.simulation,
          phase: 'RESOLUTION' as const,
          angelHp: 50,
          nervDefense: 50,
        },
      }));
      useNervStore.getState().advancePhase();
      expect(useNervStore.getState().simulation.outcome).toBe('DEFEAT');
    });
  });

  describe('damageAngel / damageNerv', () => {
    it('damageAngel reduces angelHp, clamped to 0', () => {
      useNervStore.getState().startSimulation();
      useNervStore.getState().damageAngel(30);
      expect(useNervStore.getState().simulation.angelHp).toBe(70);
      useNervStore.getState().damageAngel(200);
      expect(useNervStore.getState().simulation.angelHp).toBe(0);
    });

    it('damageNerv reduces nervDefense, clamped to 0', () => {
      useNervStore.getState().startSimulation();
      useNervStore.getState().damageNerv(40);
      expect(useNervStore.getState().simulation.nervDefense).toBe(60);
      useNervStore.getState().damageNerv(200);
      expect(useNervStore.getState().simulation.nervDefense).toBe(0);
    });
  });

  describe('pause / resume', () => {
    it('tickSimulation is a no-op when paused', () => {
      useNervStore.getState().startSimulation();
      const before = useNervStore.getState().simulation.phaseTimeRemaining;
      useNervStore.getState().pauseSimulation();
      useNervStore.getState().tickSimulation();
      expect(useNervStore.getState().simulation.phaseTimeRemaining).toBe(before);
    });

    it('tickSimulation is a no-op when in IDLE phase', () => {
      useNervStore.getState().tickSimulation();
      expect(useNervStore.getState().simulation.phase).toBe('IDLE');
      expect(useNervStore.getState().simulation.phaseTimeRemaining).toBe(0);
    });

    it('resume allows ticking to continue', () => {
      useNervStore.getState().startSimulation();
      useNervStore.getState().pauseSimulation();
      useNervStore.getState().resumeSimulation();
      const before = useNervStore.getState().simulation.phaseTimeRemaining;
      useNervStore.getState().tickSimulation();
      expect(useNervStore.getState().simulation.phaseTimeRemaining).toBe(before - 1);
    });
  });

  describe('emergency level transitions', () => {
    it('DETECTION/APPROACH set ALERT level', () => {
      useNervStore.getState().startSimulation();
      useNervStore.getState().advancePhase(); // → APPROACH
      expect(useNervStore.getState().emergencyLevel).toBe('ALERT');
    });

    it('CONTACT/RESOLUTION set EMERGENCY level', () => {
      useNervStore.getState().startSimulation();
      useNervStore.getState().advancePhase(); // APPROACH
      useNervStore.getState().advancePhase(); // CONTACT
      expect(useNervStore.getState().emergencyLevel).toBe('EMERGENCY');
    });
  });

  describe('system alerts', () => {
    it('startSimulation adds initial alert with PATTERN BLUE', () => {
      useNervStore.getState().startSimulation();
      const alerts = useNervStore.getState().systemAlerts;
      expect(alerts.length).toBeGreaterThanOrEqual(1);
      expect(alerts[0].message).toContain('PATTERN BLUE');
    });

    it('each phase advance adds a new alert', () => {
      useNervStore.getState().startSimulation();
      const initial = useNervStore.getState().systemAlerts.length;
      useNervStore.getState().advancePhase();
      expect(useNervStore.getState().systemAlerts.length).toBe(initial + 1);
    });

    it('advancePhase alert includes angel name', () => {
      useNervStore.getState().startSimulation();
      const angelName = useNervStore.getState().simulation.currentAngelName;
      useNervStore.getState().advancePhase();
      const alerts = useNervStore.getState().systemAlerts;
      expect(alerts[alerts.length - 1].message).toContain(angelName);
    });

    it('VICTORY resolveSimulation adds INFO-level alert', () => {
      useNervStore.getState().startSimulation();
      useNervStore.getState().resolveSimulation('VICTORY');
      const alerts = useNervStore.getState().systemAlerts;
      const last = alerts[alerts.length - 1];
      expect(last.message).toContain('ANGEL NEUTRALIZED');
      expect(last.level).toBe('INFO');
    });

    it('DEFEAT resolveSimulation adds EMERGENCY-level alert', () => {
      useNervStore.getState().startSimulation();
      useNervStore.getState().resolveSimulation('DEFEAT');
      const alerts = useNervStore.getState().systemAlerts;
      const last = alerts[alerts.length - 1];
      expect(last.message).toContain('EVACUATION ORDER');
      expect(last.level).toBe('EMERGENCY');
    });
  });

  describe('reset', () => {
    it('returns all state to initial values', () => {
      useNervStore.getState().startSimulation();
      useNervStore.getState().advancePhase();
      useNervStore.getState().resetSimulation();

      const state = useNervStore.getState();
      expect(state.simulation).toEqual(eva_initialSimulationState());
      expect(state.angelDetected).toBe(false);
      expect(state.emergencyLevel).toBe('NORMAL');
      expect(state.systemAlerts).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('tickSimulation increments phaseElapsed', () => {
      useNervStore.getState().startSimulation();
      expect(useNervStore.getState().simulation.phaseElapsed).toBe(0);
      useNervStore.getState().tickSimulation();
      expect(useNervStore.getState().simulation.phaseElapsed).toBe(1);
    });

    it('advancePhase sets correct phaseTimeRemaining for each phase', () => {
      useNervStore.getState().startSimulation();
      expect(useNervStore.getState().simulation.phaseTimeRemaining).toBe(PHASE_DURATIONS.DETECTION);

      useNervStore.getState().advancePhase();
      expect(useNervStore.getState().simulation.phaseTimeRemaining).toBe(PHASE_DURATIONS.APPROACH);

      useNervStore.getState().advancePhase();
      expect(useNervStore.getState().simulation.phaseTimeRemaining).toBe(PHASE_DURATIONS.CONTACT);

      useNervStore.getState().advancePhase();
      expect(useNervStore.getState().simulation.phaseTimeRemaining).toBe(PHASE_DURATIONS.RESOLUTION);
    });

    it('advancePhase resets phaseElapsed to 0', () => {
      useNervStore.getState().startSimulation();
      useNervStore.getState().tickSimulation();
      useNervStore.getState().tickSimulation();
      expect(useNervStore.getState().simulation.phaseElapsed).toBe(2);
      useNervStore.getState().advancePhase();
      expect(useNervStore.getState().simulation.phaseElapsed).toBe(0);
    });

    it('multiple simulations can be run sequentially', () => {
      useNervStore.getState().startSimulation();
      useNervStore.getState().resolveSimulation('VICTORY');
      useNervStore.getState().resetSimulation();
      expect(useNervStore.getState().simulation).toEqual(eva_initialSimulationState());

      useNervStore.getState().startSimulation();
      expect(useNervStore.getState().simulation.phase).toBe('DETECTION');
      expect(useNervStore.getState().simulation.angelHp).toBe(100);
      expect(ANGEL_NAMES).toContain(useNervStore.getState().simulation.currentAngelName);
    });
  });
});

// ===========================================================================
// 3. MAGI subsystem utilities
// ===========================================================================
describe('MAGI subsystem utilities', () => {
  beforeEach(() => resetStore());

  describe('MAGI_LABELS', () => {
    it('has labels for all three subsystems', () => {
      expect(MAGI_LABELS.melchior).toEqual({ name: 'MELCHIOR-1', designation: 'SCIENTIST' });
      expect(MAGI_LABELS.balthasar).toEqual({ name: 'BALTHASAR-2', designation: 'MOTHER' });
      expect(MAGI_LABELS.casper).toEqual({ name: 'CASPER-3', designation: 'WOMAN' });
    });
  });

  describe('eva_magiVote', () => {
    it('returns false when subsystem has not voted', () => {
      expect(eva_magiVote('melchior')).toBe(false);
    });

    it('returns true when subsystem has voted approve', () => {
      useNervStore.getState().setMagiVotes({ melchior: true });
      expect(eva_magiVote('melchior')).toBe(true);
      expect(eva_magiVote('balthasar')).toBe(false);
    });
  });

  describe('getMagiApproval', () => {
    it('delegates to eva_magiVote', () => {
      useNervStore.getState().setMagiVotes({ casper: true });
      expect(getMagiApproval('casper')).toBe(true);
      expect(getMagiApproval('melchior')).toBe(false);
    });
  });

  describe('eva_computeConsensus', () => {
    it('returns true when 2/3 or 3/3 vote approve', () => {
      expect(eva_computeConsensus({ melchior: true, balthasar: true, casper: false })).toBe(true);
      expect(eva_computeConsensus({ melchior: true, balthasar: true, casper: true })).toBe(true);
    });

    it('returns false when 0/3 or 1/3 vote approve', () => {
      expect(eva_computeConsensus({ melchior: true, balthasar: false, casper: false })).toBe(false);
      expect(eva_computeConsensus({ melchior: false, balthasar: false, casper: false })).toBe(false);
    });
  });
});

// ===========================================================================
// 4. Store helper functions
// ===========================================================================
describe('store helper functions', () => {
  describe('eva_computeMagiStatus', () => {
    it('returns AGREE for 2/3 or 3/3', () => {
      expect(eva_computeMagiStatus({ melchior: true, balthasar: true, casper: true })).toBe('AGREE');
      expect(eva_computeMagiStatus({ melchior: true, balthasar: false, casper: true })).toBe('AGREE');
    });

    it('returns CONFLICT for 1/3', () => {
      expect(eva_computeMagiStatus({ melchior: false, balthasar: true, casper: false })).toBe('CONFLICT');
    });

    it('returns DISAGREE for 0/3', () => {
      expect(eva_computeMagiStatus({ melchior: false, balthasar: false, casper: false })).toBe('DISAGREE');
    });
  });

  describe('eva_calculateSyncRatio', () => {
    it('clamps to 0-100 range', () => {
      expect(eva_calculateSyncRatio(-10)).toBe(0);
      expect(eva_calculateSyncRatio(0)).toBe(0);
      expect(eva_calculateSyncRatio(50)).toBe(50);
      expect(eva_calculateSyncRatio(100)).toBe(100);
      expect(eva_calculateSyncRatio(150)).toBe(100);
    });
  });
});

// ===========================================================================
// 5. Pilot management and simulation interaction
// ===========================================================================
describe('pilot-simulation interaction', () => {
  beforeEach(() => resetStore());

  it('addPilot registers sync ratio in syncRatios map', () => {
    useNervStore.getState().addPilot({
      id: 'p1', name: 'Shinji', status: 'ACTIVE', evaUnitId: 'EVA-01', syncRatio: 85,
    });
    expect(useNervStore.getState().syncRatios['p1']).toBe(85);
  });

  it('addPilot is idempotent (duplicate IDs ignored)', () => {
    const store = useNervStore.getState();
    store.addPilot({ id: 'p1', name: 'Shinji', status: 'ACTIVE', evaUnitId: 'EVA-01', syncRatio: 85 });
    store.addPilot({ id: 'p1', name: 'Clone', status: 'ACTIVE', evaUnitId: 'EVA-01', syncRatio: 99 });
    expect(useNervStore.getState().pilots).toHaveLength(1);
    expect(useNervStore.getState().pilots[0].name).toBe('Shinji');
  });

  it('removePilot cleans up syncRatios', () => {
    useNervStore.getState().addPilot({
      id: 'p1', name: 'Shinji', status: 'ACTIVE', evaUnitId: 'EVA-01', syncRatio: 85,
    });
    useNervStore.getState().removePilot('p1');
    expect(useNervStore.getState().pilots).toHaveLength(0);
    expect(useNervStore.getState().syncRatios['p1']).toBeUndefined();
  });

  it('setPilotSyncRatio updates both pilots array and syncRatios map', () => {
    useNervStore.getState().addPilot({
      id: 'p1', name: 'Shinji', status: 'ACTIVE', evaUnitId: 'EVA-01', syncRatio: 85,
    });
    useNervStore.getState().setPilotSyncRatio('p1', 42);
    expect(useNervStore.getState().pilots[0].syncRatio).toBe(42);
    expect(useNervStore.getState().syncRatios['p1']).toBe(42);
  });

  it('setPilotSyncRatio clamps to 0-100', () => {
    useNervStore.getState().addPilot({
      id: 'p1', name: 'Shinji', status: 'ACTIVE', evaUnitId: 'EVA-01', syncRatio: 50,
    });
    useNervStore.getState().setPilotSyncRatio('p1', 200);
    expect(useNervStore.getState().pilots[0].syncRatio).toBe(100);
    useNervStore.getState().setPilotSyncRatio('p1', -50);
    expect(useNervStore.getState().pilots[0].syncRatio).toBe(0);
  });

  it('pilot sync ratios affect combat damage during ticks', () => {
    useNervStore.getState().addPilot({
      id: 'p1', name: 'Shinji', status: 'ACTIVE', evaUnitId: 'EVA-01', syncRatio: 95,
    });

    useNervStore.getState().startSimulation();
    useNervStore.setState((s) => ({
      simulation: {
        ...s.simulation,
        phase: 'CONTACT' as const,
        phaseTimeRemaining: 20,
        angelHp: 100,
        nervDefense: 100,
      },
    }));

    useNervStore.getState().tickSimulation();
    expect(useNervStore.getState().simulation.angelHp).toBeLessThan(100);
    expect(useNervStore.getState().simulation.nervDefense).toBeLessThan(100);
  });
});

// ===========================================================================
// 6. SimulationEngine class (orchestrator)
// ===========================================================================
describe('SimulationEngine class', () => {
  let engine: SimulationEngine;

  beforeEach(() => {
    jest.useFakeTimers();
    resetStore();
    engine = new SimulationEngine();
  });

  afterEach(() => {
    engine.destroy();
    jest.useRealTimers();
  });

  describe('start', () => {
    it('starts the simulation and begins DETECTION phase', () => {
      engine.start();
      const sim = useNervStore.getState().simulation;
      expect(sim.phase).toBe('DETECTION');
      expect(sim.phaseTimeRemaining).toBe(PHASE_DURATIONS.DETECTION);
      expect(useNervStore.getState().angelDetected).toBe(true);
    });

    it('is idempotent (calling start twice does not create double intervals)', () => {
      engine.start();
      engine.start(); // second call should be no-op
      const sim = useNervStore.getState().simulation;
      expect(sim.phase).toBe('DETECTION');
    });

    it('isRunning() returns true after start', () => {
      engine.start();
      expect(engine.isRunning()).toBe(true);
    });
  });

  describe('tick interval', () => {
    it('decrements phaseTimeRemaining after interval ticks', () => {
      engine.start();
      const before = useNervStore.getState().simulation.phaseTimeRemaining;
      jest.advanceTimersByTime(1_000);
      expect(useNervStore.getState().simulation.phaseTimeRemaining).toBe(before - 1);
    });

    it('increments phaseElapsed after interval ticks', () => {
      engine.start();
      jest.advanceTimersByTime(2_000);
      expect(useNervStore.getState().simulation.phaseElapsed).toBe(2);
    });
  });

  describe('phase progression', () => {
    it('progresses through DETECTION → APPROACH after duration', () => {
      engine.start();
      jest.advanceTimersByTime(PHASE_DURATIONS.DETECTION * 1_000);
      expect(useNervStore.getState().simulation.phase).toBe('APPROACH');
    });

    it('progresses through all phases with sufficient time', () => {
      engine.start();

      // DETECTION
      jest.advanceTimersByTime(PHASE_DURATIONS.DETECTION * 1_000);
      expect(useNervStore.getState().simulation.phase).toBe('APPROACH');

      // APPROACH — damage happens, reset HP each tick to prevent early end
      for (let i = 0; i < PHASE_DURATIONS.APPROACH; i++) {
        jest.advanceTimersByTime(1_000);
        if (useNervStore.getState().simulation.phase !== 'IDLE') {
          useNervStore.setState((s) => ({
            simulation: { ...s.simulation, angelHp: 90, nervDefense: 90 },
          }));
        }
      }
      expect(useNervStore.getState().simulation.phase).toBe('CONTACT');
    });
  });

  describe('pause / resume', () => {
    it('pauses the simulation and stops ticking', () => {
      engine.start();
      jest.advanceTimersByTime(2_000);
      engine.pause();

      expect(useNervStore.getState().simulation.isPaused).toBe(true);
      expect(engine.isRunning()).toBe(false);

      const elapsed = useNervStore.getState().simulation.phaseElapsed;
      jest.advanceTimersByTime(5_000);
      expect(useNervStore.getState().simulation.phaseElapsed).toBe(elapsed);
    });

    it('resumes from the same point', () => {
      engine.start();
      jest.advanceTimersByTime(2_000);
      engine.pause();
      const elapsed = useNervStore.getState().simulation.phaseElapsed;

      engine.resume();
      expect(useNervStore.getState().simulation.isPaused).toBe(false);
      expect(engine.isRunning()).toBe(true);

      jest.advanceTimersByTime(1_000);
      expect(useNervStore.getState().simulation.phaseElapsed).toBe(elapsed + 1);
    });
  });

  describe('reset', () => {
    it('stops interval and returns all state to initial values', () => {
      engine.start();
      jest.advanceTimersByTime(5_000);
      engine.reset();

      expect(engine.isRunning()).toBe(false);
      const state = useNervStore.getState();
      expect(state.simulation.phase).toBe('IDLE');
      expect(state.simulation.outcome).toBe('PENDING');
      expect(state.simulation.angelHp).toBe(100);
      expect(state.simulation.nervDefense).toBe(100);
      expect(state.angelDetected).toBe(false);
      expect(state.emergencyLevel).toBe('NORMAL');
    });
  });

  describe('destroy', () => {
    it('cleans up interval without resetting state', () => {
      engine.start();
      jest.advanceTimersByTime(3_000);
      const phaseBefore = useNervStore.getState().simulation.phase;

      engine.destroy();
      expect(engine.isRunning()).toBe(false);
      // State should remain as-is
      expect(useNervStore.getState().simulation.phase).toBe(phaseBefore);
    });
  });

  describe('auto-stop on simulation end', () => {
    it('stops interval when simulation reaches VICTORY', () => {
      engine.start();
      // Force victory state
      useNervStore.setState((s) => ({
        simulation: {
          ...s.simulation,
          phase: 'CONTACT' as const,
          phaseTimeRemaining: 20,
          angelHp: 1,
          nervDefense: 100,
        },
        syncRatios: { p1: 100 },
      }));

      jest.advanceTimersByTime(1_000);
      expect(useNervStore.getState().simulation.outcome).toBe('VICTORY');

      // Next tick should detect IDLE and clear interval
      jest.advanceTimersByTime(1_000);
      expect(engine.isRunning()).toBe(false);
    });
  });

  describe('store integration', () => {
    it('calls triggerAngelDetected via startSimulation', () => {
      engine.start();
      expect(useNervStore.getState().angelDetected).toBe(true);
    });

    it('adds system alerts on phase transitions', () => {
      engine.start();
      const initialAlerts = useNervStore.getState().systemAlerts.length;
      jest.advanceTimersByTime(PHASE_DURATIONS.DETECTION * 1_000);
      expect(useNervStore.getState().systemAlerts.length).toBeGreaterThan(initialAlerts);
    });
  });
});
