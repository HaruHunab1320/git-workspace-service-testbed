import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SyncMonitor from '../components/SyncMonitor';
import { useNervStore } from '../store/useNervStore';

// Mock the store
jest.mock('../store/useNervStore');
const mockUseNervStore = useNervStore as unknown as jest.Mock;

/**
 * Default NERV state used across all SyncMonitor tests.
 * Includes all state properties and action stubs so selector functions
 * never throw on missing keys.
 */
const defaultState: Record<string, unknown> = {
  emergencyLevel: 'NORMAL',
  syncRatio: 100,
  syncRatios: {},
  magiStatus: 'DISAGREE',
  magiVotes: { melchior: false, balthasar: false, casper: false },
  evaPositions: [],
  systemAlerts: [],
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
 * Helper to mock the store with specific sync ratio and emergency level.
 * Uses the selector-compatible mockImplementation pattern.
 */
function mockStore(syncRatio: number, emergencyLevel: 'NORMAL' | 'ALERT' | 'EMERGENCY' = 'NORMAL') {
  const state = { ...defaultState, syncRatio, emergencyLevel };
  mockUseNervStore.mockImplementation((selector?: (s: Record<string, unknown>) => unknown) =>
    selector ? selector(state) : state,
  );
}

describe('SyncMonitor', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('sync ratio progress bar', () => {
    it('sets bar height to 0% when syncRatio is 0', () => {
      mockStore(0);
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.style.height).toBe('0%');
    });

    it('sets bar height to 50% when syncRatio is 50', () => {
      mockStore(50);
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.style.height).toBe('50%');
    });

    it('sets bar height to 100% when syncRatio is 100', () => {
      mockStore(100);
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.style.height).toBe('100%');
    });

    it('clamps bar height to 100% when syncRatio exceeds 100', () => {
      mockStore(150);
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.style.height).toBe('100%');
    });

    it('clamps bar height to 0% for negative syncRatio', () => {
      mockStore(-10);
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.style.height).toBe('0%');
    });

    it('handles fractional syncRatio values', () => {
      mockStore(73.5);
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.style.height).toBe('73.5%');
    });
  });

  describe('sync value display', () => {
    it('displays the sync ratio as a percentage', () => {
      mockStore(42.7);
      render(<SyncMonitor />);
      expect(screen.getByTestId('sync-value')).toHaveTextContent('42.7%');
    });

    it('displays 0.0% when syncRatio is 0', () => {
      mockStore(0);
      render(<SyncMonitor />);
      expect(screen.getByTestId('sync-value')).toHaveTextContent('0.0%');
    });
  });

  describe('emergency level reactions', () => {
    it('uses green bar color during NORMAL state', () => {
      mockStore(50, 'NORMAL');
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.className).toContain('bg-[#39FF14]');
      expect(bar.className).not.toContain('animate-pulse');
    });

    it('uses red pulsing bar during EMERGENCY state', () => {
      mockStore(50, 'EMERGENCY');
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.className).toContain('bg-red-500');
      expect(bar.className).toContain('animate-pulse');
    });

    it('shows emergency warning during EMERGENCY state', () => {
      mockStore(50, 'EMERGENCY');
      render(<SyncMonitor />);
      expect(screen.getByTestId('emergency-warning')).toBeInTheDocument();
    });

    it('does not show emergency warning during NORMAL state', () => {
      mockStore(50, 'NORMAL');
      render(<SyncMonitor />);
      expect(screen.queryByTestId('emergency-warning')).not.toBeInTheDocument();
    });

    it('does not show emergency warning during ALERT state', () => {
      mockStore(50, 'ALERT');
      render(<SyncMonitor />);
      expect(screen.queryByTestId('emergency-warning')).not.toBeInTheDocument();
    });

    it('uses green bar during ALERT state (not emergency)', () => {
      mockStore(50, 'ALERT');
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.className).toContain('bg-[#39FF14]');
      expect(bar.className).not.toContain('bg-red-500');
    });
  });

  describe('Pattern Blue — Emergency Overlay', () => {
    it('renders emergency warning when systemAlerts is populated and level is EMERGENCY', () => {
      const state = {
        ...defaultState,
        syncRatio: 75,
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
      mockUseNervStore.mockImplementation((selector?: (s: Record<string, unknown>) => unknown) =>
        selector ? selector(state) : state,
      );
      render(<SyncMonitor />);
      expect(screen.getByTestId('emergency-warning')).toBeInTheDocument();
    });
  });
});
