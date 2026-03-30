import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SimulationController from '../components/SimulationController';
import { useNervStore } from '../store/useNervStore';
import { eva_initialSimulationState } from '../simulation/engine';

jest.mock('../store/useNervStore');
const mockUseNervStore = useNervStore as unknown as jest.Mock;

const defaultState: Record<string, unknown> = {
  emergencyLevel: 'NORMAL',
  syncRatio: 100,
  syncRatios: {},
  magiStatus: 'DISAGREE',
  magiVotes: { melchior: false, balthasar: false, casper: false },
  evaPositions: [],
  systemAlerts: [],
  angelDetected: false,
  simulation: eva_initialSimulationState(),
  pilots: [],
  setEmergencyLevel: jest.fn(),
  setSyncRatio: jest.fn(),
  setSyncRatios: jest.fn(),
  updateSyncRatio: jest.fn(),
  updatePilotSyncRatio: jest.fn(),
  setMagiVotes: jest.fn(),
  setMagiStatus: jest.fn(),
  randomizeMagiVotes: jest.fn(),
  addSystemAlert: jest.fn(),
  clearSystemAlerts: jest.fn(),
  setEvaPositions: jest.fn(),
  updateEvaPosition: jest.fn(),
  removeEvaPosition: jest.fn(),
  triggerAngelDetected: jest.fn(),
  resetEmergency: jest.fn(),
  startSimulation: jest.fn(),
  pauseSimulation: jest.fn(),
  resumeSimulation: jest.fn(),
  resetSimulation: jest.fn(),
  advancePhase: jest.fn(),
  tickSimulation: jest.fn(),
  damageAngel: jest.fn(),
  damageNerv: jest.fn(),
  resolveSimulation: jest.fn(),
  addPilot: jest.fn(),
  removePilot: jest.fn(),
  setPilotStatus: jest.fn(),
  assignEvaUnit: jest.fn(),
  setPilotSyncRatio: jest.fn(),
};

function mockStore(overrides: Partial<typeof defaultState> = {}) {
  const state = { ...defaultState, ...overrides };
  mockUseNervStore.mockImplementation((selector?: (s: Record<string, unknown>) => unknown) =>
    selector ? selector(state) : state,
  );
}

describe('SimulationController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders in IDLE/standby state with START button visible', () => {
    mockStore();
    render(<SimulationController />);
    expect(screen.getByTestId('simulation-controller')).toBeInTheDocument();
    expect(screen.getByTestId('simulation-phase')).toHaveTextContent('STANDBY');
    expect(screen.getByTestId('simulation-btn-start')).toBeInTheDocument();
  });

  it('START button calls startSimulation', () => {
    mockStore();
    render(<SimulationController />);
    fireEvent.click(screen.getByTestId('simulation-btn-start'));
    expect(defaultState.startSimulation).toHaveBeenCalledTimes(1);
  });

  it('shows angel name and phase when simulation running', () => {
    mockStore({
      simulation: {
        ...eva_initialSimulationState(),
        phase: 'DETECTION',
        currentAngelName: 'SACHIEL',
        phaseTimeRemaining: 8,
      },
    });
    render(<SimulationController />);
    expect(screen.getByTestId('simulation-phase')).toHaveTextContent('DETECTION');
    expect(screen.getByTestId('simulation-angel-name')).toHaveTextContent('TARGET: SACHIEL');
  });

  it('timer displays correct phaseTimeRemaining', () => {
    mockStore({
      simulation: {
        ...eva_initialSimulationState(),
        phase: 'APPROACH',
        currentAngelName: 'RAMIEL',
        phaseTimeRemaining: 12,
      },
    });
    render(<SimulationController />);
    expect(screen.getByTestId('simulation-timer')).toHaveTextContent('12s');
  });

  it('PAUSE button appears during active simulation and calls pauseSimulation', () => {
    mockStore({
      simulation: {
        ...eva_initialSimulationState(),
        phase: 'CONTACT',
        currentAngelName: 'ZERUEL',
        phaseTimeRemaining: 15,
      },
    });
    render(<SimulationController />);
    const btn = screen.getByTestId('simulation-btn-pause');
    expect(btn).toHaveTextContent('PAUSE');
    fireEvent.click(btn);
    expect(defaultState.pauseSimulation).toHaveBeenCalledTimes(1);
  });

  it('RESUME button appears when paused and calls resumeSimulation', () => {
    mockStore({
      simulation: {
        ...eva_initialSimulationState(),
        phase: 'CONTACT',
        isPaused: true,
        currentAngelName: 'ZERUEL',
        phaseTimeRemaining: 10,
      },
    });
    render(<SimulationController />);
    const btn = screen.getByTestId('simulation-btn-pause');
    expect(btn).toHaveTextContent('RESUME');
    fireEvent.click(btn);
    expect(defaultState.resumeSimulation).toHaveBeenCalledTimes(1);
  });

  it('RESET button calls resetSimulation', () => {
    mockStore({
      simulation: {
        ...eva_initialSimulationState(),
        phase: 'DETECTION',
        currentAngelName: 'SACHIEL',
        phaseTimeRemaining: 5,
      },
    });
    render(<SimulationController />);
    fireEvent.click(screen.getByTestId('simulation-btn-reset'));
    expect(defaultState.resetSimulation).toHaveBeenCalledTimes(1);
  });

  it('health bars reflect angelHp and nervDefense values', () => {
    mockStore({
      simulation: {
        ...eva_initialSimulationState(),
        phase: 'CONTACT',
        currentAngelName: 'ISRAFEL',
        phaseTimeRemaining: 10,
        angelHp: 65,
        nervDefense: 40,
      },
    });
    render(<SimulationController />);
    expect(screen.getByTestId('simulation-angel-hp')).toHaveTextContent('65%');
    expect(screen.getByTestId('simulation-nerv-defense')).toHaveTextContent('40%');
  });

  it('displays VICTORY outcome with correct styling', () => {
    mockStore({
      simulation: {
        ...eva_initialSimulationState(),
        outcome: 'VICTORY',
      },
    });
    render(<SimulationController />);
    const outcome = screen.getByTestId('simulation-outcome');
    expect(outcome).toHaveTextContent('ANGEL NEUTRALIZED');
    expect(outcome.style.color).toBe('rgb(57, 255, 20)');
  });

  it('displays DEFEAT outcome with correct styling', () => {
    mockStore({
      simulation: {
        ...eva_initialSimulationState(),
        outcome: 'DEFEAT',
      },
    });
    render(<SimulationController />);
    const outcome = screen.getByTestId('simulation-outcome');
    expect(outcome).toHaveTextContent('DEFENSE BREACH');
    expect(outcome.style.color).toBe('rgb(255, 51, 0)');
  });

  it('phase badge shows correct color per phase', () => {
    const phases = [
      { phase: 'DETECTION', expectedBg: 'rgb(57, 255, 20)' },
      { phase: 'APPROACH', expectedBg: 'rgb(255, 153, 0)' },
      { phase: 'CONTACT', expectedBg: 'rgb(255, 51, 0)' },
      { phase: 'RESOLUTION', expectedBg: 'rgb(255, 215, 0)' },
    ] as const;

    for (const { phase, expectedBg } of phases) {
      mockStore({
        simulation: {
          ...eva_initialSimulationState(),
          phase,
          currentAngelName: 'SACHIEL',
          phaseTimeRemaining: 5,
        },
      });
      const { unmount } = render(<SimulationController />);
      const badge = screen.getByTestId('simulation-phase');
      expect(badge.style.backgroundColor).toBe(expectedBg);
      unmount();
    }
  });
});
