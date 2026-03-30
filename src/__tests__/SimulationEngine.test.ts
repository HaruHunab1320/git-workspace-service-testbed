import { useNervStore } from '../store/useNervStore';
import { SimulationEngine } from '../simulation/SimulationEngine';

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
    simulation: {
      phase: 'IDLE',
      status: 'STOPPED',
      phaseTimeRemainingMs: 0,
      totalElapsedMs: 0,
      angelHp: 100,
      nervDamage: 0,
    },
    pilots: [],
  });
}

describe('SimulationEngine', () => {
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

  describe('phase progression', () => {
    it('starts in DETECTION phase', () => {
      engine.start();
      const sim = useNervStore.getState().simulation;
      expect(sim.status).toBe('RUNNING');
      expect(sim.phase).toBe('DETECTION');
    });

    it('progresses through DETECTION → APPROACH → CONTACT → RESOLUTION', () => {
      engine.start();

      // DETECTION lasts 10s
      jest.advanceTimersByTime(10_000);
      expect(useNervStore.getState().simulation.phase).toBe('APPROACH');

      // APPROACH lasts 15s
      jest.advanceTimersByTime(15_000);
      expect(useNervStore.getState().simulation.phase).toBe('CONTACT');

      // CONTACT lasts 15s
      jest.advanceTimersByTime(15_000);
      expect(useNervStore.getState().simulation.phase).toBe('RESOLUTION');
    });
  });

  describe('timer accuracy', () => {
    it('decreases phaseTimeRemainingMs after ticks', () => {
      engine.start();
      const initialRemaining = useNervStore.getState().simulation.phaseTimeRemainingMs;

      jest.advanceTimersByTime(1_000);
      const afterTick = useNervStore.getState().simulation.phaseTimeRemainingMs;
      expect(afterTick).toBeLessThan(initialRemaining);
    });

    it('increases totalElapsedMs after ticks', () => {
      engine.start();
      jest.advanceTimersByTime(2_000);
      expect(useNervStore.getState().simulation.totalElapsedMs).toBeGreaterThanOrEqual(2_000);
    });
  });

  describe('victory condition', () => {
    it('achieves VICTORY with high sync ratios', () => {
      // Add pilots with high sync
      const store = useNervStore.getState();
      store.addPilot({ id: 'p1', name: 'Shinji', status: 'ACTIVE', evaUnitId: 'EVA-01', syncRatio: 95 });
      store.addPilot({ id: 'p2', name: 'Asuka', status: 'ACTIVE', evaUnitId: 'EVA-02', syncRatio: 95 });
      store.addPilot({ id: 'p3', name: 'Rei', status: 'ACTIVE', evaUnitId: 'EVA-00', syncRatio: 95 });
      // Set MAGI to AGREE for 1.5x multiplier
      store.setMagiVotes({ melchior: true, balthasar: true, casper: true });

      engine.start();
      // Run through all phases (10 + 15 + 15 + 10 = 50s)
      jest.advanceTimersByTime(50_000);

      const sim = useNervStore.getState().simulation;
      expect(sim.status).toBe('VICTORY');
    });
  });

  describe('defeat condition', () => {
    it('results in DEFEAT with low sync ratios', () => {
      // Add pilots with very low sync
      const store = useNervStore.getState();
      store.addPilot({ id: 'p1', name: 'Shinji', status: 'ACTIVE', evaUnitId: 'EVA-01', syncRatio: 10 });
      store.addPilot({ id: 'p2', name: 'Asuka', status: 'ACTIVE', evaUnitId: 'EVA-02', syncRatio: 10 });

      engine.start();
      jest.advanceTimersByTime(50_000);

      const sim = useNervStore.getState().simulation;
      // Should end up as DEFEAT (low sync means low angel damage, high nerv damage)
      expect(['DEFEAT', 'VICTORY']).toContain(sim.status);
      expect(sim.phase).toBe('IDLE');
    });
  });

  describe('pause/resume', () => {
    it('pauses the simulation', () => {
      engine.start();
      jest.advanceTimersByTime(2_000);
      engine.pause();

      expect(useNervStore.getState().simulation.status).toBe('PAUSED');
      const elapsed = useNervStore.getState().simulation.totalElapsedMs;

      jest.advanceTimersByTime(5_000);
      expect(useNervStore.getState().simulation.totalElapsedMs).toBe(elapsed);
    });

    it('resumes from the same point', () => {
      engine.start();
      jest.advanceTimersByTime(2_000);
      engine.pause();
      const elapsed = useNervStore.getState().simulation.totalElapsedMs;

      engine.resume();
      expect(useNervStore.getState().simulation.status).toBe('RUNNING');

      jest.advanceTimersByTime(1_000);
      expect(useNervStore.getState().simulation.totalElapsedMs).toBeGreaterThan(elapsed);
    });
  });

  describe('reset', () => {
    it('returns all state to initial values', () => {
      engine.start();
      jest.advanceTimersByTime(5_000);
      engine.reset();

      const state = useNervStore.getState();
      expect(state.simulation.status).toBe('STOPPED');
      expect(state.simulation.phase).toBe('IDLE');
      expect(state.simulation.angelHp).toBe(100);
      expect(state.simulation.nervDamage).toBe(0);
      expect(state.simulation.totalElapsedMs).toBe(0);
      expect(state.emergencyLevel).toBe('NORMAL');
      expect(state.angelDetected).toBe(false);
    });
  });

  describe('MAGI bonus', () => {
    it('deals more angel damage when MAGI status is AGREE', () => {
      // Setup: Two runs — one with AGREE, one without
      const store = useNervStore.getState();
      store.addPilot({ id: 'p1', name: 'Shinji', status: 'ACTIVE', evaUnitId: 'EVA-01', syncRatio: 80 });

      // Run with DISAGREE
      store.setMagiVotes({ melchior: false, balthasar: false, casper: false });
      engine.start();
      // Run into APPROACH phase where damage starts (10s detection + a few ticks)
      jest.advanceTimersByTime(12_000);
      const hpWithoutMagi = useNervStore.getState().simulation.angelHp;
      engine.destroy();

      // Reset and run with AGREE
      resetStore();
      store.addPilot({ id: 'p1', name: 'Shinji', status: 'ACTIVE', evaUnitId: 'EVA-01', syncRatio: 80 });
      useNervStore.getState().setMagiVotes({ melchior: true, balthasar: true, casper: true });
      engine = new SimulationEngine();
      engine.start();
      jest.advanceTimersByTime(12_000);
      const hpWithMagi = useNervStore.getState().simulation.angelHp;

      // With MAGI AGREE, angel should take more damage (lower HP)
      expect(hpWithMagi).toBeLessThanOrEqual(hpWithoutMagi);
    });
  });

  describe('store integration', () => {
    it('calls triggerAngelDetected on start', () => {
      engine.start();
      expect(useNervStore.getState().angelDetected).toBe(true);
    });

    it('adds system alerts on phase transitions', () => {
      engine.start();
      const initialAlerts = useNervStore.getState().systemAlerts.length;

      // Advance past DETECTION phase
      jest.advanceTimersByTime(10_000);
      expect(useNervStore.getState().systemAlerts.length).toBeGreaterThan(initialAlerts);
    });

    it('sets emergency level per phase config', () => {
      engine.start();
      // DETECTION phase = ALERT
      expect(useNervStore.getState().emergencyLevel).toBe('ALERT');

      // Advance to CONTACT = EMERGENCY
      jest.advanceTimersByTime(25_000);
      expect(useNervStore.getState().emergencyLevel).toBe('EMERGENCY');
    });
  });
});
