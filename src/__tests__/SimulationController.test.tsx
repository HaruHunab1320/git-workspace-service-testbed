import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SimulationController } from '../components/SimulationController';
import { useNervStore } from '../store/useNervStore';

const INITIAL_SIMULATION = {
  phase: 'IDLE' as const,
  status: 'STOPPED' as const,
  outcome: 'PENDING' as const,
  phaseTimeRemaining: 0,
  totalElapsed: 0,
  angelHp: 100,
  nervIntegrity: 100,
};

describe('SimulationController', () => {
  beforeEach(() => {
    useNervStore.setState({
      emergencyLevel: 'NORMAL',
      syncRatio: 100,
      syncRatios: {},
      magiVotes: { melchior: false, balthasar: false, casper: false },
      magiStatus: 'DISAGREE',
      systemAlerts: [],
      evaPositions: [],
      angelDetected: false,
      simulation: { ...INITIAL_SIMULATION },
    });
  });

  it('renders initial IDLE state with START button', () => {
    render(<SimulationController />);
    expect(screen.getByText('ANGEL ATTACK SIMULATOR')).toBeInTheDocument();
    expect(screen.getByText('START')).toBeInTheDocument();
    expect(screen.getByText('RESET')).toBeInTheDocument();
  });

  it('shows PENDING outcome initially', () => {
    render(<SimulationController />);
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('clicking START calls startSimulation', () => {
    render(<SimulationController />);
    fireEvent.click(screen.getByText('START'));
    const state = useNervStore.getState();
    expect(state.simulation.status).toBe('RUNNING');
    expect(state.simulation.phase).toBe('DETECTION');
    expect(state.angelDetected).toBe(true);
  });

  it('shows PAUSE button when running', () => {
    render(<SimulationController />);
    fireEvent.click(screen.getByText('START'));
    expect(screen.getByText('PAUSE')).toBeInTheDocument();
  });

  it('clicking PAUSE sets status to PAUSED', () => {
    render(<SimulationController />);
    fireEvent.click(screen.getByText('START'));
    fireEvent.click(screen.getByText('PAUSE'));
    expect(useNervStore.getState().simulation.status).toBe('PAUSED');
  });

  it('shows RESUME button when paused', () => {
    render(<SimulationController />);
    fireEvent.click(screen.getByText('START'));
    fireEvent.click(screen.getByText('PAUSE'));
    expect(screen.getByText('RESUME')).toBeInTheDocument();
  });

  it('clicking RESET returns to initial state', () => {
    render(<SimulationController />);
    fireEvent.click(screen.getByText('START'));
    fireEvent.click(screen.getByText('RESET'));
    const state = useNervStore.getState();
    expect(state.simulation.status).toBe('STOPPED');
    expect(state.simulation.phase).toBe('IDLE');
    expect(state.angelDetected).toBe(false);
    expect(state.emergencyLevel).toBe('NORMAL');
  });

  it('displays HP bars', () => {
    render(<SimulationController />);
    expect(screen.getByTestId('angel-hp-bar')).toBeInTheDocument();
    expect(screen.getByTestId('nerv-integrity-bar')).toBeInTheDocument();
  });

  it('shows WIN outcome with correct styling', () => {
    useNervStore.setState({
      simulation: {
        ...INITIAL_SIMULATION,
        status: 'COMPLETE',
        outcome: 'WIN',
        angelHp: 0,
      },
    });
    render(<SimulationController />);
    const winText = screen.getByText('WIN');
    expect(winText).toBeInTheDocument();
    expect(winText.style.color).toBe('rgb(0, 255, 0)');
  });

  it('shows LOSE outcome with correct styling', () => {
    useNervStore.setState({
      simulation: {
        ...INITIAL_SIMULATION,
        status: 'COMPLETE',
        outcome: 'LOSE',
        nervIntegrity: 0,
      },
    });
    render(<SimulationController />);
    const loseText = screen.getByText('LOSE');
    expect(loseText).toBeInTheDocument();
    expect(loseText.style.color).toBe('rgb(255, 0, 0)');
  });
});
