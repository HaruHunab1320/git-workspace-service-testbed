import { useNervStore } from '../store/useNervStore';

const TICK_INTERVAL_MS = 1_000;

/**
 * SimulationEngine — thin orchestrator that drives the angel attack simulation
 * via a setInterval tick loop. All state mutations are delegated to the
 * Zustand store actions (startSimulation, tickSimulation, etc.).
 */
export class SimulationEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  private get store() {
    return useNervStore.getState();
  }

  /** Start a new simulation. Begins the tick interval. */
  start(): void {
    if (this.intervalId !== null) return;

    this.store.startSimulation();
    this.intervalId = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  /** Pause the running simulation. Stops the tick interval. */
  pause(): void {
    if (this.intervalId === null) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.store.pauseSimulation();
  }

  /** Resume a paused simulation. Restarts the tick interval. */
  resume(): void {
    if (this.intervalId !== null) return;
    this.store.resumeSimulation();
    this.intervalId = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  /** Reset the simulation to initial state. Stops any running interval. */
  reset(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.store.resetSimulation();
  }

  /** Clean up the interval timer without resetting store state. */
  destroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Returns true if the tick interval is currently active. */
  isRunning(): boolean {
    return this.intervalId !== null;
  }

  private tick(): void {
    const sim = this.store.simulation;

    // Stop the interval if simulation has ended
    if (sim.phase === 'IDLE' || sim.outcome !== 'PENDING') {
      if (this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      return;
    }

    this.store.tickSimulation();
  }
}
