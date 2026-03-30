import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PilotPanel from '../components/PilotPanel';
import { useNervStore } from '../store/useNervStore';
import type { PilotRecord } from '../types/nerv.d';

jest.mock('../store/useNervStore');
const mockUseNervStore = useNervStore as unknown as jest.Mock;

const mockAddPilot = jest.fn();
const mockRemovePilot = jest.fn();
const mockSetPilotStatus = jest.fn();
const mockAssignEvaUnit = jest.fn();
const mockSetPilotSyncRatio = jest.fn();

const defaultState = {
  pilots: [] as PilotRecord[],
  syncRatios: {} as Record<string, number>,
  addPilot: mockAddPilot,
  removePilot: mockRemovePilot,
  setPilotStatus: mockSetPilotStatus,
  assignEvaUnit: mockAssignEvaUnit,
  setPilotSyncRatio: mockSetPilotSyncRatio,
};

function mockStore(overrides: Partial<typeof defaultState> = {}) {
  const state = { ...defaultState, ...overrides };
  mockUseNervStore.mockImplementation((selector?: (s: typeof state) => unknown) => {
    if (typeof selector === 'function') return selector(state);
    return state;
  });
}

describe('PilotPanel', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders empty state with no pilots message', () => {
    mockStore();
    render(<PilotPanel />);
    expect(screen.getByTestId('no-pilots')).toHaveTextContent('NO PILOTS REGISTERED');
  });

  it('renders the add pilot input and button', () => {
    mockStore();
    render(<PilotPanel />);
    expect(screen.getByTestId('pilot-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('btn-add-pilot')).toBeInTheDocument();
  });

  it('calls addPilot when clicking ADD with a name', () => {
    mockStore();
    render(<PilotPanel />);
    fireEvent.change(screen.getByTestId('pilot-name-input'), { target: { value: 'Shinji Ikari' } });
    fireEvent.click(screen.getByTestId('btn-add-pilot'));
    expect(mockAddPilot).toHaveBeenCalledTimes(1);
    expect(mockAddPilot.mock.calls[0][0].name).toBe('Shinji Ikari');
    expect(mockAddPilot.mock.calls[0][0].status).toBe('ACTIVE');
    expect(mockAddPilot.mock.calls[0][0].syncRatio).toBe(75);
  });

  it('does not call addPilot when name is empty', () => {
    mockStore();
    render(<PilotPanel />);
    fireEvent.click(screen.getByTestId('btn-add-pilot'));
    expect(mockAddPilot).not.toHaveBeenCalled();
  });

  it('adds pilot on Enter key', () => {
    mockStore();
    render(<PilotPanel />);
    const input = screen.getByTestId('pilot-name-input');
    fireEvent.change(input, { target: { value: 'Asuka' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockAddPilot).toHaveBeenCalledTimes(1);
  });

  it('renders pilot rows when pilots exist', () => {
    mockStore({
      pilots: [
        { id: 'p1', name: 'Shinji', status: 'ACTIVE' as const, evaUnitId: 'EVA-01' as const, syncRatio: 75 },
        { id: 'p2', name: 'Asuka', status: 'ACTIVE' as const, evaUnitId: 'EVA-02' as const, syncRatio: 80 },
      ],
      syncRatios: { p1: 75, p2: 80 },
    });
    render(<PilotPanel />);
    expect(screen.getByTestId('pilot-row-p1')).toBeInTheDocument();
    expect(screen.getByTestId('pilot-row-p2')).toBeInTheDocument();
  });

  it('calls removePilot when REMOVE button is clicked', () => {
    mockStore({
      pilots: [
        { id: 'p1', name: 'Shinji', status: 'ACTIVE' as const, evaUnitId: null, syncRatio: 75 },
      ],
      syncRatios: { p1: 75 },
    });
    render(<PilotPanel />);
    fireEvent.click(screen.getByTestId('btn-remove-p1'));
    expect(mockRemovePilot).toHaveBeenCalledWith('p1');
  });

  it('cycles pilot status on status button click', () => {
    mockStore({
      pilots: [
        { id: 'p1', name: 'Shinji', status: 'ACTIVE' as const, evaUnitId: null, syncRatio: 75 },
      ],
      syncRatios: { p1: 75 },
    });
    render(<PilotPanel />);
    fireEvent.click(screen.getByTestId('btn-status-p1'));
    // ACTIVE → INACTIVE
    expect(mockSetPilotStatus).toHaveBeenCalledWith('p1', 'INACTIVE');
  });

  it('cycles from BERSERK back to ACTIVE', () => {
    mockStore({
      pilots: [
        { id: 'p1', name: 'Shinji', status: 'BERSERK' as const, evaUnitId: null, syncRatio: 75 },
      ],
      syncRatios: { p1: 75 },
    });
    render(<PilotPanel />);
    fireEvent.click(screen.getByTestId('btn-status-p1'));
    expect(mockSetPilotStatus).toHaveBeenCalledWith('p1', 'ACTIVE');
  });

  it('displays sync ratio value', () => {
    mockStore({
      pilots: [
        { id: 'p1', name: 'Shinji', status: 'ACTIVE' as const, evaUnitId: null, syncRatio: 82 },
      ],
      syncRatios: { p1: 82 },
    });
    render(<PilotPanel />);
    expect(screen.getByTestId('sync-display-p1')).toHaveTextContent('82%');
  });

  it('calls setPilotSyncRatio on slider change', () => {
    mockStore({
      pilots: [
        { id: 'p1', name: 'Shinji', status: 'ACTIVE' as const, evaUnitId: null, syncRatio: 75 },
      ],
      syncRatios: { p1: 75 },
    });
    render(<PilotPanel />);
    fireEvent.change(screen.getByTestId('slider-sync-p1'), { target: { value: '90' } });
    expect(mockSetPilotSyncRatio).toHaveBeenCalledWith('p1', 90);
  });

  it('calls assignEvaUnit on EVA select change', () => {
    mockStore({
      pilots: [
        { id: 'p1', name: 'Shinji', status: 'ACTIVE' as const, evaUnitId: null, syncRatio: 75 },
      ],
      syncRatios: { p1: 75 },
    });
    render(<PilotPanel />);
    fireEvent.change(screen.getByTestId('select-eva-p1'), { target: { value: 'EVA-01' } });
    expect(mockAssignEvaUnit).toHaveBeenCalledWith('p1', 'EVA-01');
  });

  it('displays pilot count', () => {
    mockStore({
      pilots: [
        { id: 'p1', name: 'Shinji', status: 'ACTIVE' as const, evaUnitId: null, syncRatio: 75 },
        { id: 'p2', name: 'Asuka', status: 'ACTIVE' as const, evaUnitId: null, syncRatio: 80 },
      ],
      syncRatios: { p1: 75, p2: 80 },
    });
    render(<PilotPanel />);
    expect(screen.getByText(/REGISTERED: 2 PILOTS/)).toBeInTheDocument();
  });

  it('shows status button with correct label', () => {
    mockStore({
      pilots: [
        { id: 'p1', name: 'Shinji', status: 'INACTIVE' as const, evaUnitId: null, syncRatio: 75 },
      ],
      syncRatios: { p1: 75 },
    });
    render(<PilotPanel />);
    expect(screen.getByTestId('btn-status-p1')).toHaveTextContent('INACTIVE');
  });
});
