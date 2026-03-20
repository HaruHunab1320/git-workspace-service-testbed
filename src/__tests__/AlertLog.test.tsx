import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlertLog from '../components/AlertLog';
import { eva_alertColor, eva_formatTimestamp } from '../components/AlertLog';
import { useNervStore } from '../store/useNervStore';

// jsdom does not implement scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

jest.mock('../store/useNervStore');
const mockUseNervStore = useNervStore as unknown as jest.Mock;

/**
 * Default NERV state used across all AlertLog tests.
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

function mockStore(overrides: Partial<typeof defaultState> = {}) {
  const state = { ...defaultState, ...overrides };
  mockUseNervStore.mockImplementation((selector?: (s: Record<string, unknown>) => unknown) =>
    selector ? selector(state) : state,
  );
}

describe('AlertLog', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('eva_alertColor utility', () => {
    it('returns NERV Red for EMERGENCY level', () => {
      expect(eva_alertColor('EMERGENCY')).toBe('#FF3300');
    });

    it('returns NERV Red for CRITICAL level', () => {
      expect(eva_alertColor('CRITICAL')).toBe('#FF3300');
    });

    it('returns Warning Orange for WARNING level', () => {
      expect(eva_alertColor('WARNING')).toBe('#FF9900');
    });

    it('returns Nominal Green for INFO level', () => {
      expect(eva_alertColor('INFO')).toBe('#39FF14');
    });
  });

  describe('eva_formatTimestamp utility', () => {
    it('formats a timestamp as HH:MM:SS', () => {
      // Use a fixed timestamp: 2025-01-01T12:34:56
      const ts = new Date(2025, 0, 1, 12, 34, 56).getTime();
      expect(eva_formatTimestamp(ts)).toBe('12:34:56');
    });
  });

  describe('empty state', () => {
    it('renders the alert log panel', () => {
      mockStore();
      render(<AlertLog />);
      expect(screen.getByTestId('alert-log')).toBeInTheDocument();
    });

    it('displays "0 ACTIVE" count when no alerts', () => {
      mockStore();
      render(<AlertLog />);
      expect(screen.getByTestId('alert-count')).toHaveTextContent('0 ACTIVE');
    });

    it('shows empty state message when no alerts', () => {
      mockStore();
      render(<AlertLog />);
      expect(screen.getByTestId('alert-empty')).toHaveTextContent('NO ACTIVE ALERTS');
    });

    it('does not show the clear button when no alerts', () => {
      mockStore();
      render(<AlertLog />);
      expect(screen.queryByTestId('clear-alerts-btn')).not.toBeInTheDocument();
    });
  });

  describe('with alerts', () => {
    const testAlerts = [
      {
        id: 'alert-1',
        message: 'PATTERN BLUE DETECTED — ANGEL APPROACHING',
        level: 'EMERGENCY' as const,
        timestamp: new Date(2025, 0, 1, 14, 30, 0).getTime(),
      },
      {
        id: 'alert-2',
        message: 'EVA-01 sync ratio declining',
        level: 'WARNING' as const,
        timestamp: new Date(2025, 0, 1, 14, 31, 15).getTime(),
      },
      {
        id: 'alert-3',
        message: 'MAGI diagnostic complete',
        level: 'INFO' as const,
        timestamp: new Date(2025, 0, 1, 14, 32, 30).getTime(),
      },
    ];

    it('displays the correct alert count', () => {
      mockStore({ systemAlerts: testAlerts });
      render(<AlertLog />);
      expect(screen.getByTestId('alert-count')).toHaveTextContent('3 ACTIVE');
    });

    it('renders each alert entry', () => {
      mockStore({ systemAlerts: testAlerts });
      render(<AlertLog />);
      expect(screen.getByTestId('alert-entry-alert-1')).toBeInTheDocument();
      expect(screen.getByTestId('alert-entry-alert-2')).toBeInTheDocument();
      expect(screen.getByTestId('alert-entry-alert-3')).toBeInTheDocument();
    });

    it('displays alert messages', () => {
      mockStore({ systemAlerts: testAlerts });
      render(<AlertLog />);
      expect(screen.getByTestId('alert-msg-alert-1')).toHaveTextContent('PATTERN BLUE DETECTED');
      expect(screen.getByTestId('alert-msg-alert-2')).toHaveTextContent('EVA-01 sync ratio declining');
      expect(screen.getByTestId('alert-msg-alert-3')).toHaveTextContent('MAGI diagnostic complete');
    });

    it('displays formatted timestamps', () => {
      mockStore({ systemAlerts: testAlerts });
      render(<AlertLog />);
      expect(screen.getByTestId('alert-time-alert-1')).toHaveTextContent('14:30:00');
      expect(screen.getByTestId('alert-time-alert-2')).toHaveTextContent('14:31:15');
    });

    it('does not show empty state message when alerts exist', () => {
      mockStore({ systemAlerts: testAlerts });
      render(<AlertLog />);
      expect(screen.queryByTestId('alert-empty')).not.toBeInTheDocument();
    });

    it('shows the clear button when alerts exist', () => {
      mockStore({ systemAlerts: testAlerts });
      render(<AlertLog />);
      expect(screen.getByTestId('clear-alerts-btn')).toBeInTheDocument();
    });

    it('calls clearSystemAlerts when clear button is clicked', () => {
      mockStore({ systemAlerts: testAlerts });
      render(<AlertLog />);
      fireEvent.click(screen.getByTestId('clear-alerts-btn'));
      expect(defaultState.clearSystemAlerts).toHaveBeenCalledTimes(1);
    });
  });

  describe('emergency level styling', () => {
    it('uses orange border during NORMAL state', () => {
      mockStore();
      render(<AlertLog />);
      const panel = screen.getByTestId('alert-log');
      expect(panel.style.borderColor).not.toBe('');
    });

    it('uses red border during EMERGENCY state', () => {
      mockStore({
        emergencyLevel: 'EMERGENCY',
        systemAlerts: [
          {
            id: 'alert-1',
            message: 'EMERGENCY ACTIVE',
            level: 'EMERGENCY' as const,
            timestamp: Date.now(),
          },
        ],
      });
      render(<AlertLog />);
      const panel = screen.getByTestId('alert-log');
      expect(panel.style.border).toContain('rgb(255, 51, 0)');
    });
  });

  describe('Pattern Blue — Emergency Overlay', () => {
    it('renders Emergency alert entries when systemAlerts is populated', () => {
      mockStore({
        systemAlerts: [
          {
            id: 'alert-1',
            message: 'PATTERN BLUE DETECTED — ANGEL APPROACHING',
            level: 'EMERGENCY' as const,
            timestamp: Date.now(),
          },
        ],
        emergencyLevel: 'EMERGENCY',
      });
      render(<AlertLog />);
      expect(screen.getByText(/PATTERN BLUE/)).toBeInTheDocument();
      expect(screen.getByTestId('alert-count')).toHaveTextContent('1 ACTIVE');
    });
  });
});
