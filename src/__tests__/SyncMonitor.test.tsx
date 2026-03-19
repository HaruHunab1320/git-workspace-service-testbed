import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SyncMonitor from '../components/SyncMonitor';
import { eva_calculateSyncRatio } from '../components/SyncMonitor';
import { useNervStore } from '../store/useNervStore';

jest.mock('../store/useNervStore');
const mockUseNervStore = useNervStore as unknown as jest.Mock;

/**
 * Default NERV state used across all SyncMonitor tests.
 * Includes all state properties and action stubs so selector functions
 * never throw on missing keys.
 */
const defaultState = {
  emergencyLevel: 'NORMAL' as const,
  syncRatio: 100,
  syncRatios: {} as Record<string, number>,
  magiStatus: 'DISAGREE' as const,
  magiVotes: { melchior: false, balthasar: false, casper: false },
  evaPositions: [],
  systemAlerts: [] as Array<{ id: string; message: string; level: string; timestamp: number }>,
  angelDetected: false,
  setEmergencyLevel: jest.fn(),
  setSyncRatio: jest.fn(),
  setSyncRatios: jest.fn(),
  updatePilotSyncRatio: jest.fn(),
  setMagiVotes: jest.fn(),
  randomizeMagiVotes: jest.fn(),
  addSystemAlert: jest.fn(),
  clearSystemAlerts: jest.fn(),
  updateEvaPosition: jest.fn(),
  removeEvaPosition: jest.fn(),
  triggerAngelDetected: jest.fn(),
  resetEmergency: jest.fn(),
};

/**
 * Helper to mock the store with specific sync ratios and emergency level.
 * Uses the selector-compatible mockImplementation pattern.
 */
function mockStore(
  syncRatios: Record<string, number>,
  emergencyLevel: 'NORMAL' | 'ALERT' | 'EMERGENCY' = 'NORMAL',
  systemAlerts: Array<{ id: string; message: string; level: string; timestamp: number }> = [],
) {
  const state = { ...defaultState, syncRatios, emergencyLevel, systemAlerts };
  mockUseNervStore.mockImplementation((selector?: (s: typeof state) => unknown) => {
    if (typeof selector === 'function') return selector(state);
    return state;
  });
}

const TEST_PILOT_ID = 'pilot-asuka';

describe('SyncMonitor', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('eva_calculateSyncRatio utility', () => {
    it('clamps values to 0-100 range', () => {
      expect(eva_calculateSyncRatio('pilot-01', 50)).toBe(50);
      expect(eva_calculateSyncRatio('pilot-01', -10)).toBe(0);
      expect(eva_calculateSyncRatio('pilot-01', 150)).toBe(100);
      expect(eva_calculateSyncRatio('pilot-01', 0)).toBe(0);
      expect(eva_calculateSyncRatio('pilot-01', 100)).toBe(100);
    });

    it('preserves fractional values within range', () => {
      expect(eva_calculateSyncRatio('pilot-01', 73.5)).toBe(73.5);
    });
  });

  describe('sync ratio progress bars', () => {
    it('sets bar height to 0% when syncRatio is 0', () => {
      mockStore({ [TEST_PILOT_ID]: 0 });
      render(<SyncMonitor />);
      const bar = screen.getByTestId(`sync-bar-${TEST_PILOT_ID}`);
      expect(bar.style.height).toBe('0%');
    });

    it('sets bar height to 50% when syncRatio is 50', () => {
      mockStore({ [TEST_PILOT_ID]: 50 });
      render(<SyncMonitor />);
      const bar = screen.getByTestId(`sync-bar-${TEST_PILOT_ID}`);
      expect(bar.style.height).toBe('50%');
    });

    it('sets bar height to 100% when syncRatio is 100', () => {
      mockStore({ [TEST_PILOT_ID]: 100 });
      render(<SyncMonitor />);
      const bar = screen.getByTestId(`sync-bar-${TEST_PILOT_ID}`);
      expect(bar.style.height).toBe('100%');
    });

    it('clamps bar height to 100% when syncRatio exceeds 100', () => {
      mockStore({ [TEST_PILOT_ID]: 150 });
      render(<SyncMonitor />);
      const bar = screen.getByTestId(`sync-bar-${TEST_PILOT_ID}`);
      expect(bar.style.height).toBe('100%');
    });

    it('clamps bar height to 0% for negative syncRatio', () => {
      mockStore({ [TEST_PILOT_ID]: -10 });
      render(<SyncMonitor />);
      const bar = screen.getByTestId(`sync-bar-${TEST_PILOT_ID}`);
      expect(bar.style.height).toBe('0%');
    });

    it('handles fractional syncRatio values', () => {
      mockStore({ [TEST_PILOT_ID]: 73.5 });
      render(<SyncMonitor />);
      const bar = screen.getByTestId(`sync-bar-${TEST_PILOT_ID}`);
      expect(bar.style.height).toBe('73.5%');
    });

    it('defaults to 0% when pilot has no syncRatio entry', () => {
      mockStore({});
      render(<SyncMonitor />);
      const bar = screen.getByTestId(`sync-bar-${TEST_PILOT_ID}`);
      expect(bar.style.height).toBe('0%');
    });
  });

  describe('sync value display', () => {
    it('displays the sync ratio as a percentage', () => {
      mockStore({ [TEST_PILOT_ID]: 42.7 });
      render(<SyncMonitor />);
      expect(screen.getByTestId(`sync-value-${TEST_PILOT_ID}`)).toHaveTextContent('42.7%');
    });

    it('displays 0.0% when syncRatio is 0', () => {
      mockStore({ [TEST_PILOT_ID]: 0 });
      render(<SyncMonitor />);
      expect(screen.getByTestId(`sync-value-${TEST_PILOT_ID}`)).toHaveTextContent('0.0%');
    });
  });

  describe('emergency level reactions', () => {
    it('uses green bar color during NORMAL state', () => {
      mockStore({ [TEST_PILOT_ID]: 50 }, 'NORMAL');
      render(<SyncMonitor />);
      const bar = screen.getByTestId(`sync-bar-${TEST_PILOT_ID}`);
      expect(bar.style.backgroundColor).toBe('rgb(57, 255, 20)');
    });

    it('uses NERV red bar during EMERGENCY state with pulse animation', () => {
      mockStore({ [TEST_PILOT_ID]: 50 }, 'EMERGENCY');
      render(<SyncMonitor />);
      const bar = screen.getByTestId(`sync-bar-${TEST_PILOT_ID}`);
      expect(bar.style.backgroundColor).toBe('rgb(255, 51, 0)');
      expect(bar.style.animation).toContain('emergency-pulse');
    });

    it('shows emergency warning during EMERGENCY state', () => {
      mockStore({ [TEST_PILOT_ID]: 50 }, 'EMERGENCY');
      render(<SyncMonitor />);
      expect(screen.getByTestId('emergency-warning')).toBeInTheDocument();
    });

    it('does not show emergency warning during NORMAL state', () => {
      mockStore({ [TEST_PILOT_ID]: 50 }, 'NORMAL');
      render(<SyncMonitor />);
      expect(screen.queryByTestId('emergency-warning')).not.toBeInTheDocument();
    });

    it('does not show emergency warning during ALERT state without alerts', () => {
      mockStore({ [TEST_PILOT_ID]: 50 }, 'ALERT');
      render(<SyncMonitor />);
      expect(screen.queryByTestId('emergency-warning')).not.toBeInTheDocument();
    });

    it('uses green bar during ALERT state (not emergency)', () => {
      mockStore({ [TEST_PILOT_ID]: 50 }, 'ALERT');
      render(<SyncMonitor />);
      const bar = screen.getByTestId(`sync-bar-${TEST_PILOT_ID}`);
      expect(bar.style.backgroundColor).toBe('rgb(57, 255, 20)');
    });
  });

  describe('Pattern Blue — Emergency Overlay', () => {
    it('renders Emergency overlay when systemAlerts is populated', () => {
      mockStore(
        { [TEST_PILOT_ID]: 30 },
        'EMERGENCY',
        [
          {
            id: 'alert-1',
            message: 'PATTERN BLUE DETECTED — ANGEL APPROACHING',
            level: 'EMERGENCY',
            timestamp: Date.now(),
          },
        ],
      );
      render(<SyncMonitor />);
      const warning = screen.getByTestId('emergency-warning');
      expect(warning).toBeInTheDocument();
      expect(screen.getByText(/PATTERN BLUE/)).toBeInTheDocument();
    });

    it('does not render emergency overlay when NORMAL with no alerts', () => {
      mockStore({ [TEST_PILOT_ID]: 80 }, 'NORMAL');
      render(<SyncMonitor />);
      expect(screen.queryByTestId('emergency-warning')).not.toBeInTheDocument();
    });
  });

  describe('Pattern Blue — Emergency Overlay (direct state)', () => {
    it('renders emergency warning when systemAlerts is populated and level is EMERGENCY', () => {
      const state = {
        ...defaultState,
        syncRatios: { [TEST_PILOT_ID]: 75 },
        systemAlerts: [
          {
            id: 'alert-1',
            message: 'PATTERN BLUE DETECTED — ANGEL APPROACHING',
            level: 'EMERGENCY' as const,
            timestamp: Date.now(),
          },
        ],
        emergencyLevel: 'EMERGENCY' as const,
      };
      mockUseNervStore.mockImplementation((selector?: (s: typeof state) => unknown) => {
        if (typeof selector === 'function') return selector(state);
        return state;
      });
      render(<SyncMonitor />);
      expect(screen.getByTestId('emergency-warning')).toBeInTheDocument();
    });
  });
});
