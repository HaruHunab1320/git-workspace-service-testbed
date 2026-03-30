import { useNervStore } from '../store/useNervStore';
import type { SimulationPhase, EmergencyLevel } from '../types/nerv.d';

const TICK_INTERVAL_MS = 500;

interface PhaseConfig {
  phase: SimulationPhase;
  durationMs: number;
  emergencyLevel: EmergencyLevel;
  alert: string;
}

const PHASE_SEQUENCE: PhaseConfig[] = [
  {
    phase: 'DETECTION',
    durationMs: 10_000,
    emergencyLevel: 'ALERT',
    alert: '[MAGI] PATTERN BLUE \u2014 COMMENCING ANALYSIS',
  },
  {
    phase: 'APPROACH',
    durationMs: 15_000,
    emergencyLevel: 'ALERT',
    alert: '[TACTICAL] ANGEL APPROACHING \u2014 ALL UNITS PREPARE FOR SORTIE',
  },
  {
    phase: 'CONTACT',
    durationMs: 15_000,
    emergencyLevel: 'EMERGENCY',
    alert: '[COMBAT] CONTACT \u2014 EVA UNITS ENGAGING TARGET',
  },
  {
    phase: 'RESOLUTION',
    durationMs: 10_000,
    emergencyLevel: 'EMERGENCY',
    alert: '[COMBAT] FINAL PHASE \u2014 CONCENTRATE ALL FIRE',
  },
];

export class SimulationEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private currentPhaseIndex = 0;
  private phaseElapsedMs = 0;
  private totalElapsedMs = 0;
  private angelHp = 100;
  private nervDefense = 100;

  private get store() {
    return useNervStore.getState();
  }

  start(): void {
    if (this.intervalId !== null) return;

    this.currentPhaseIndex = 0;
    this.phaseElapsedMs = 0;
    this.totalElapsedMs = 0;
    this.angelHp = 100;
    this.nervDefense = 100;

    this.store.triggerAngelDetected();
    this.enterPhase(0);

    useNervStore.setState((state) => ({
      simulation: {
        ...state.simulation,
        outcome: 'PENDING',
        isPaused: false,
        angelHp: this.angelHp,
        nervDefense: this.nervDefense,
        totalElapsed: 0,
      },
    }));

    this.intervalId = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  pause(): void {
    if (this.intervalId === null) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.store.pauseSimulation();
  }

  resume(): void {
    if (this.intervalId !== null) return;
    this.store.resumeSimulation();
    this.intervalId = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  reset(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentPhaseIndex = 0;
    this.phaseElapsedMs = 0;
    this.totalElapsedMs = 0;
    this.angelHp = 100;
    this.nervDefense = 100;

    this.store.resetSimulation();

    // Reset sync ratios for existing pilots
    const pilots = this.store.pilots;
    for (const pilot of pilots) {
      this.store.setPilotSyncRatio(pilot.id, 75);
    }
  }

  destroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    const config = PHASE_SEQUENCE[this.currentPhaseIndex];
    if (!config) return;

    this.phaseElapsedMs += TICK_INTERVAL_MS;
    this.totalElapsedMs += TICK_INTERVAL_MS;

    this.applyCombatEffects(config.phase);
    this.checkWinLose();

    // Check if we won or lost during combat effects
    const simState = this.store.simulation;
    if (simState.outcome === 'VICTORY' || simState.outcome === 'DEFEAT') return;

    const remaining = Math.max(0, config.durationMs - this.phaseElapsedMs);
    const remainingSec = Math.ceil(remaining / 1000);
    const totalElapsedSec = Math.floor(this.totalElapsedMs / 1000);

    useNervStore.setState((state) => ({
      simulation: {
        ...state.simulation,
        phaseTimeRemaining: remainingSec,
        totalElapsed: totalElapsedSec,
        angelHp: this.angelHp,
        nervDefense: this.nervDefense,
      },
    }));

    if (this.phaseElapsedMs >= config.durationMs) {
      this.advancePhase();
    }
  }

  private applyCombatEffects(phase: SimulationPhase): void {
    const state = this.store;
    const pilots = state.pilots;
    const avgSync =
      pilots.length > 0
        ? pilots
            .filter((p) => p.status === 'ACTIVE' || p.status === 'BERSERK')
            .reduce((sum, p) => sum + (state.syncRatios[p.id] ?? p.syncRatio), 0) /
          Math.max(1, pilots.filter((p) => p.status === 'ACTIVE' || p.status === 'BERSERK').length)
        : 50;

    const syncFactor = avgSync / 100;
    const magiMultiplier = state.magiStatus === 'AGREE' ? 1.5 : 1.0;

    // Apply fluctuation to sync ratios
    for (const pilot of pilots) {
      if (pilot.status === 'ACTIVE' || pilot.status === 'BERSERK') {
        const current = state.syncRatios[pilot.id] ?? pilot.syncRatio;
        const delta = (Math.random() - 0.5) * 4;
        state.updateSyncRatio(pilot.id, current + delta);
      }
    }

    switch (phase) {
      case 'DETECTION':
        // No combat damage during detection
        break;
      case 'APPROACH':
        this.angelHp -= 0.5 * syncFactor * magiMultiplier;
        this.nervDefense -= 0.3;
        break;
      case 'CONTACT':
        this.angelHp -= 1.5 * syncFactor * magiMultiplier;
        this.nervDefense -= 0.8;
        break;
      case 'RESOLUTION':
        this.angelHp -= 2.0 * syncFactor * magiMultiplier;
        this.nervDefense -= 1.2;
        break;
    }

    this.angelHp = Math.max(0, Math.min(100, this.angelHp));
    this.nervDefense = Math.max(0, Math.min(100, this.nervDefense));
  }

  private advancePhase(): void {
    this.currentPhaseIndex++;
    this.phaseElapsedMs = 0;

    if (this.currentPhaseIndex >= PHASE_SEQUENCE.length) {
      this.checkWinLose(true);
      return;
    }

    const config = PHASE_SEQUENCE[this.currentPhaseIndex];
    this.store.setEmergencyLevel(config.emergencyLevel);
    this.store.addSystemAlert({ message: config.alert, level: 'CRITICAL' });
    this.store.randomizeMagiVotes();

    useNervStore.setState((state) => ({
      simulation: {
        ...state.simulation,
        phase: config.phase,
        phaseTimeRemaining: Math.ceil(config.durationMs / 1000),
        phaseElapsed: 0,
      },
    }));
  }

  private enterPhase(index: number): void {
    const config = PHASE_SEQUENCE[index];
    if (!config) return;

    this.store.setEmergencyLevel(config.emergencyLevel);
    this.store.addSystemAlert({ message: config.alert, level: 'CRITICAL' });
    this.store.randomizeMagiVotes();

    useNervStore.setState((state) => ({
      simulation: {
        ...state.simulation,
        phase: config.phase,
        phaseTimeRemaining: Math.ceil(config.durationMs / 1000),
        phaseElapsed: 0,
      },
    }));
  }

  private checkWinLose(forceResolve = false): void {
    if (this.angelHp <= 0) {
      this.endSimulation('VICTORY');
      this.store.addSystemAlert({
        message: '[COMBAT] ANGEL NEUTRALIZED \u2014 PATTERN BLUE CLEAR',
        level: 'INFO',
      });
      this.store.setEmergencyLevel('NORMAL');
      useNervStore.setState({ angelDetected: false });
      return;
    }

    if (this.nervDefense <= 0) {
      this.endSimulation('DEFEAT');
      this.store.addSystemAlert({
        message: '[SYSTEM] CRITICAL FAILURE \u2014 GEOFRONT BREACH',
        level: 'EMERGENCY',
      });
      return;
    }

    if (forceResolve) {
      if (this.angelHp < 50) {
        this.endSimulation('VICTORY');
        this.store.addSystemAlert({
          message: '[COMBAT] ANGEL NEUTRALIZED \u2014 PATTERN BLUE CLEAR',
          level: 'INFO',
        });
        this.store.setEmergencyLevel('NORMAL');
        useNervStore.setState({ angelDetected: false });
      } else {
        this.endSimulation('DEFEAT');
        this.store.addSystemAlert({
          message: '[SYSTEM] CRITICAL FAILURE \u2014 GEOFRONT BREACH',
          level: 'EMERGENCY',
        });
      }
    }
  }

  private endSimulation(outcome: 'VICTORY' | 'DEFEAT'): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    useNervStore.setState((state) => ({
      simulation: {
        ...state.simulation,
        outcome,
        phase: 'IDLE' as const,
        isPaused: false,
        angelHp: this.angelHp,
        nervDefense: this.nervDefense,
      },
    }));
  }
}
