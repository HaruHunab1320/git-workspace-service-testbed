import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SimulationController from '../components/SimulationController';
import { useNervStore } from '../store/useNervStore';

jest.mock('../store/useNervStore');
jest.mock('../simulation/SimulationEngine', () => ({
  SimulationEngine: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    reset: jest.fn(),
    destroy: jest.fn(),
  })),
}));

const mockUseNervStore = useNervStore as unknown as jest.Mock;

const defaultSimulation = {
  phase: 'IDLE' as const,
  status: 'STOPPED' as const,
  phaseTimeRemainingMs: 0,
  totalElapsedMs: 0,
  angelHp: 100,
  nervDamage: 0,
};

const defaultState = {
  emergencyLevel: 'NORMAL' as const,
  syncRatio: 100,
  syncRatios: {},
  magiStatus: 'DISAGREE' as const,
  magiVotes: { melchior: false, balthasar: false, casper: false },
  evaPositions: [],
  systemAlerts: [],
  angelDetected: false,
  simulation: defaultSimulation,
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
  updateSimulation: jest.fn(),
  resetSimulation: jest.fn(),
  addPilot: jest.fn(),
  removePilot: jest.fn(),
  setPilotStatus: jest.fn(),
  assignEvaUnit: jest.fn(),
  setPilotSyncRatio: jest.fn(),
};

function mockStore(overrides: Partial<typeof defaultState> = {}) {
  const state = { ...defaultState, ...overrides };
  mockUseNervStore.mockImplementation((selector?: (s: typeof state) => unknown) => {
    if (typeof selector === 'function') return selector(state);
    return state;
  });
}

describe('SimulationController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders idle state with STOPPED status', () => {
    mockStore();
    render(<SimulationController />);
    expect(screen.getByTestId('sim-status')).toHaveTextContent('STOPPED');
    expect(screen.getByTestId('btn-start')).not.toBeDisabled();
    expect(screen.getByTestId('btn-pause')).toBeDisabled();
  });

  it('shows START button enabled when STOPPED', () => {
    mockStore();
    render(<SimulationController />);
    const btn = screen.getByTestId('btn-start');
    expect(btn).not.toBeDisabled();
    expect(btn).toHaveTextContent('START');
  });

  it('shows PAUSE button disabled when STOPPED', () => {
    mockStore();
    render(<SimulationController />);
    expect(screen.getByTestId('btn-pause')).toBeDisabled();
  });

  it('shows RUNNING status when simulation is running', () => {
    mockStore({
      simulation: { ...defaultSimulation, status: 'RUNNING', phase: 'DETECTION' },
    });
    render(<SimulationController />);
    expect(screen.getByTestId('sim-status')).toHaveTextContent('RUNNING');
  });

  it('displays current phase name', () => {
    mockStore({
      simulation: { ...defaultSimulation, status: 'RUNNING', phase: 'CONTACT' },
    });
    render(<SimulationController />);
    expect(screen.getByTestId('sim-phase')).toHaveTextContent('CONTACT');
  });

  it('reflects angel HP in progress bar', () => {
    mockStore({
      simulation: { ...defaultSimulation, angelHp: 68 },
    });
    render(<SimulationController />);
    const bar = screen.getByTestId('angel-hp-bar');
    expect(bar.style.width).toBe('68%');
  });

  it('reflects NERV damage in progress bar', () => {
    mockStore({
      simulation: { ...defaultSimulation, nervDamage: 32 },
    });
    render(<SimulationController />);
    const bar = screen.getByTestId('nerv-dmg-bar');
    expect(bar.style.width).toBe('32%');
  });

  it('shows victory indicator when status is VICTORY', () => {
    mockStore({
      simulation: { ...defaultSimulation, status: 'VICTORY', phase: 'IDLE', angelHp: 0 },
    });
    render(<SimulationController />);
    expect(screen.getByTestId('victory-indicator')).toBeInTheDocument();
  });

  it('shows defeat indicator when status is DEFEAT', () => {
    mockStore({
      simulation: { ...defaultSimulation, status: 'DEFEAT', phase: 'IDLE', nervDamage: 100 },
    });
    render(<SimulationController />);
    expect(screen.getByTestId('defeat-indicator')).toBeInTheDocument();
  });

  it('enables RESET button when not STOPPED', () => {
    mockStore({
      simulation: { ...defaultSimulation, status: 'RUNNING', phase: 'DETECTION' },
    });
    render(<SimulationController />);
    expect(screen.getByTestId('btn-reset')).not.toBeDisabled();
  });

  it('shows RESUME label when PAUSED', () => {
    mockStore({
      simulation: { ...defaultSimulation, status: 'PAUSED', phase: 'APPROACH' },
    });
    render(<SimulationController />);
    expect(screen.getByTestId('btn-start')).toHaveTextContent('RESUME');
  });
});
