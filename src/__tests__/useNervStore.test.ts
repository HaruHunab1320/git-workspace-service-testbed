import { useNervStore } from '../store/useNervStore';
import { eva_initialSimulationState, ANGEL_NAMES } from '../simulation/engine';

/**
 * Integration tests for the useNervStore Zustand store.
 * These tests exercise the real store (no mocks) to verify
 * state mutations, MAGI consensus logic, and emergency protocols.
 */
describe('useNervStore', () => {
  beforeEach(() => {
    // Reset store to default state before each test
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
    });
  });

  describe('setEmergencyLevel', () => {
    it('sets emergency level to ALERT', () => {
      useNervStore.getState().setEmergencyLevel('ALERT');
      expect(useNervStore.getState().emergencyLevel).toBe('ALERT');
    });

    it('sets emergency level to EMERGENCY', () => {
      useNervStore.getState().setEmergencyLevel('EMERGENCY');
      expect(useNervStore.getState().emergencyLevel).toBe('EMERGENCY');
    });

    it('returns to NORMAL', () => {
      useNervStore.getState().setEmergencyLevel('EMERGENCY');
      useNervStore.getState().setEmergencyLevel('NORMAL');
      expect(useNervStore.getState().emergencyLevel).toBe('NORMAL');
    });
  });

  describe('setSyncRatio', () => {
    it('sets sync ratio to a valid value', () => {
      useNervStore.getState().setSyncRatio(75);
      expect(useNervStore.getState().syncRatio).toBe(75);
    });

    it('clamps sync ratio to 0 for negative values', () => {
      useNervStore.getState().setSyncRatio(-20);
      expect(useNervStore.getState().syncRatio).toBe(0);
    });

    it('clamps sync ratio to 100 for values above 100', () => {
      useNervStore.getState().setSyncRatio(200);
      expect(useNervStore.getState().syncRatio).toBe(100);
    });
  });

  describe('updatePilotSyncRatio', () => {
    it('sets a per-pilot sync ratio', () => {
      useNervStore.getState().updatePilotSyncRatio('pilot-01', 85);
      expect(useNervStore.getState().syncRatios['pilot-01']).toBe(85);
    });

    it('clamps per-pilot ratio to 0-100 range', () => {
      useNervStore.getState().updatePilotSyncRatio('pilot-02', 150);
      expect(useNervStore.getState().syncRatios['pilot-02']).toBe(100);

      useNervStore.getState().updatePilotSyncRatio('pilot-03', -10);
      expect(useNervStore.getState().syncRatios['pilot-03']).toBe(0);
    });

    it('preserves existing pilot ratios when updating another', () => {
      useNervStore.getState().updatePilotSyncRatio('pilot-01', 80);
      useNervStore.getState().updatePilotSyncRatio('pilot-02', 60);
      expect(useNervStore.getState().syncRatios['pilot-01']).toBe(80);
      expect(useNervStore.getState().syncRatios['pilot-02']).toBe(60);
    });
  });

  describe('MAGI consensus logic', () => {
    it('computes AGREE when all three vote true', () => {
      useNervStore.getState().setMagiVotes({ melchior: true, balthasar: true, casper: true });
      expect(useNervStore.getState().magiStatus).toBe('AGREE');
    });

    it('computes AGREE when 2/3 vote true', () => {
      useNervStore.getState().setMagiVotes({ melchior: true, balthasar: true, casper: false });
      expect(useNervStore.getState().magiStatus).toBe('AGREE');
    });

    it('computes CONFLICT when only 1/3 votes true', () => {
      useNervStore.getState().setMagiVotes({ melchior: true, balthasar: false, casper: false });
      expect(useNervStore.getState().magiStatus).toBe('CONFLICT');
    });

    it('computes DISAGREE when 0/3 vote true', () => {
      useNervStore.getState().setMagiVotes({ melchior: false, balthasar: false, casper: false });
      expect(useNervStore.getState().magiStatus).toBe('DISAGREE');
    });

    it('accepts partial vote updates and merges with existing', () => {
      useNervStore.getState().setMagiVotes({ melchior: true });
      expect(useNervStore.getState().magiVotes.melchior).toBe(true);
      expect(useNervStore.getState().magiVotes.balthasar).toBe(false);

      useNervStore.getState().setMagiVotes({ balthasar: true });
      expect(useNervStore.getState().magiVotes.melchior).toBe(true);
      expect(useNervStore.getState().magiVotes.balthasar).toBe(true);
      expect(useNervStore.getState().magiStatus).toBe('AGREE');
    });

    it('randomizeMagiVotes produces valid votes and recomputes status', () => {
      useNervStore.getState().randomizeMagiVotes();
      const state = useNervStore.getState();
      expect(typeof state.magiVotes.melchior).toBe('boolean');
      expect(typeof state.magiVotes.balthasar).toBe('boolean');
      expect(typeof state.magiVotes.casper).toBe('boolean');
      expect(['AGREE', 'DISAGREE', 'CONFLICT']).toContain(state.magiStatus);
    });
  });

  describe('system alerts', () => {
    it('adds a system alert', () => {
      useNervStore.getState().addSystemAlert({
        message: 'Test alert',
        level: 'WARNING',
      });
      const alerts = useNervStore.getState().systemAlerts;
      expect(alerts).toHaveLength(1);
      expect(alerts[0].message).toBe('Test alert');
      expect(alerts[0].id).toBeDefined();
      expect(alerts[0].timestamp).toBeDefined();
    });

    it('clears all system alerts', () => {
      useNervStore.getState().addSystemAlert({ message: 'Alert 1', level: 'WARNING' });
      useNervStore.getState().addSystemAlert({ message: 'Alert 2', level: 'EMERGENCY' });
      expect(useNervStore.getState().systemAlerts).toHaveLength(2);

      useNervStore.getState().clearSystemAlerts();
      expect(useNervStore.getState().systemAlerts).toHaveLength(0);
    });
  });

  describe('EVA positions', () => {
    it('adds a new EVA position', () => {
      useNervStore.getState().updateEvaPosition('pilot-01', 'EVA-01', { row: 3, col: 4 });
      const positions = useNervStore.getState().evaPositions;
      expect(positions).toHaveLength(1);
      expect(positions[0].pilotId).toBe('pilot-01');
      expect(positions[0].hexCoordinate).toEqual({ row: 3, col: 4 });
    });

    it('updates an existing EVA position', () => {
      useNervStore.getState().updateEvaPosition('pilot-01', 'EVA-01', { row: 3, col: 4 });
      useNervStore.getState().updateEvaPosition('pilot-01', 'EVA-01', { row: 5, col: 6 });
      const positions = useNervStore.getState().evaPositions;
      expect(positions).toHaveLength(1);
      expect(positions[0].hexCoordinate).toEqual({ row: 5, col: 6 });
    });

    it('removes an EVA position', () => {
      useNervStore.getState().updateEvaPosition('pilot-01', 'EVA-01', { row: 3, col: 4 });
      useNervStore.getState().removeEvaPosition('pilot-01');
      expect(useNervStore.getState().evaPositions).toHaveLength(0);
    });
  });

  describe('angel detection protocol', () => {
    it('triggerAngelDetected sets emergency state and adds alert', () => {
      useNervStore.getState().triggerAngelDetected();
      const state = useNervStore.getState();
      expect(state.angelDetected).toBe(true);
      expect(state.emergencyLevel).toBe('EMERGENCY');
      expect(state.systemAlerts).toHaveLength(1);
      expect(state.systemAlerts[0].message).toContain('PATTERN BLUE');
    });

    it('resetEmergency clears angel detection and emergency state', () => {
      useNervStore.getState().triggerAngelDetected();
      useNervStore.getState().resetEmergency();
      const state = useNervStore.getState();
      expect(state.angelDetected).toBe(false);
      expect(state.emergencyLevel).toBe('NORMAL');
      expect(state.systemAlerts).toHaveLength(0);
    });
  });

  describe('simulation — startSimulation', () => {
    it('sets phase to DETECTION and picks an angel name', () => {
      useNervStore.getState().startSimulation();
      const state = useNervStore.getState();
      expect(state.simulation.phase).toBe('DETECTION');
      expect(ANGEL_NAMES).toContain(state.simulation.currentAngelName);
      expect(state.simulation.phaseTimeRemaining).toBe(10);
      expect(state.simulation.angelHp).toBe(100);
      expect(state.simulation.nervDefense).toBe(100);
      expect(state.simulation.outcome).toBe('PENDING');
      expect(state.simulation.totalElapsed).toBe(0);
    });

    it('sets angelDetected true and emergencyLevel to EMERGENCY', () => {
      useNervStore.getState().startSimulation();
      const state = useNervStore.getState();
      expect(state.angelDetected).toBe(true);
      expect(state.emergencyLevel).toBe('EMERGENCY');
      expect(state.systemAlerts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('simulation — pause/resume', () => {
    it('pauseSimulation / resumeSimulation toggle isPaused', () => {
      useNervStore.getState().startSimulation();
      useNervStore.getState().pauseSimulation();
      expect(useNervStore.getState().simulation.isPaused).toBe(true);
      useNervStore.getState().resumeSimulation();
      expect(useNervStore.getState().simulation.isPaused).toBe(false);
    });
  });

  describe('simulation — tickSimulation', () => {
    it('decrements phaseTimeRemaining and increments totalElapsed', () => {
      useNervStore.getState().startSimulation();
      const before = useNervStore.getState().simulation.phaseTimeRemaining;
      useNervStore.getState().tickSimulation();
      const state = useNervStore.getState();
      expect(state.simulation.phaseTimeRemaining).toBe(before - 1);
      expect(state.simulation.totalElapsed).toBe(1);
    });

    it('is a no-op when paused', () => {
      useNervStore.getState().startSimulation();
      useNervStore.getState().pauseSimulation();
      const before = useNervStore.getState().simulation.phaseTimeRemaining;
      useNervStore.getState().tickSimulation();
      expect(useNervStore.getState().simulation.phaseTimeRemaining).toBe(before);
    });

    it('during CONTACT, modifies angelHp and nervDefense', () => {
      useNervStore.getState().startSimulation();
      // Force into CONTACT phase
      useNervStore.setState((s) => ({
        simulation: {
          ...s.simulation,
          phase: 'CONTACT' as const,
          phaseTimeRemaining: 20,
          phaseElapsed: 0,
        },
        syncRatios: { 'pilot-01': 80 },
      }));
      useNervStore.getState().tickSimulation();
      const sim = useNervStore.getState().simulation;
      expect(sim.angelHp).toBeLessThan(100);
      expect(sim.nervDefense).toBeLessThan(100);
    });
  });

  describe('simulation — advancePhase', () => {
    it('transitions through correct phase order', () => {
      useNervStore.getState().startSimulation();
      expect(useNervStore.getState().simulation.phase).toBe('DETECTION');

      useNervStore.getState().advancePhase();
      expect(useNervStore.getState().simulation.phase).toBe('APPROACH');

      useNervStore.getState().advancePhase();
      expect(useNervStore.getState().simulation.phase).toBe('CONTACT');

      useNervStore.getState().advancePhase();
      expect(useNervStore.getState().simulation.phase).toBe('RESOLUTION');
    });

    it('adds system alert on each transition', () => {
      useNervStore.getState().startSimulation();
      const alertsBefore = useNervStore.getState().systemAlerts.length;
      useNervStore.getState().advancePhase();
      expect(useNervStore.getState().systemAlerts.length).toBe(alertsBefore + 1);
    });
  });

  describe('simulation — resolveSimulation', () => {
    it('VICTORY resets emergency state and adds success alert', () => {
      useNervStore.getState().startSimulation();
      useNervStore.getState().resolveSimulation('VICTORY');
      const state = useNervStore.getState();
      expect(state.simulation.outcome).toBe('VICTORY');
      expect(state.simulation.phase).toBe('IDLE');
      expect(state.angelDetected).toBe(false);
      expect(state.emergencyLevel).toBe('NORMAL');
      expect(state.systemAlerts.some((a) => a.message.includes('ANGEL NEUTRALIZED'))).toBe(true);
    });

    it('DEFEAT keeps emergency and adds failure alert', () => {
      useNervStore.getState().startSimulation();
      useNervStore.getState().resolveSimulation('DEFEAT');
      const state = useNervStore.getState();
      expect(state.simulation.outcome).toBe('DEFEAT');
      expect(state.simulation.phase).toBe('IDLE');
      expect(state.emergencyLevel).toBe('EMERGENCY');
      expect(state.systemAlerts.some((a) => a.message.includes('EVACUATION ORDER'))).toBe(true);
    });
  });

  describe('simulation — resetSimulation', () => {
    it('returns everything to initial state', () => {
      useNervStore.getState().startSimulation();
      useNervStore.getState().resetSimulation();
      const state = useNervStore.getState();
      expect(state.simulation.phase).toBe('IDLE');
      expect(state.simulation.outcome).toBe('PENDING');
      expect(state.simulation.angelHp).toBe(100);
      expect(state.simulation.nervDefense).toBe(100);
      expect(state.simulation.currentAngelName).toBe('');
      expect(state.simulation.totalElapsed).toBe(0);
      expect(state.angelDetected).toBe(false);
      expect(state.emergencyLevel).toBe('NORMAL');
      expect(state.systemAlerts).toHaveLength(0);
    });
  });
});
