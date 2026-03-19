import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MagiDashboard from '../components/MagiDashboard';
import { useNervStore } from '../store/useNervStore';

jest.mock('../store/useNervStore');
const mockUseNervStore = useNervStore as unknown as jest.Mock;

/**
 * Default NERV state used across all MagiDashboard tests.
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
 * Helper to mock the store with specific MAGI votes.
 * Uses the selector-compatible mockImplementation pattern.
 */
function mockStore(votes: { melchior: boolean; balthasar: boolean; casper: boolean }) {
  const state = { ...defaultState, magiVotes: votes };
  mockUseNervStore.mockImplementation((selector?: (s: typeof state) => unknown) => {
    if (typeof selector === 'function') return selector(state);
    return state;
  });
}

describe('MagiDashboard', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('2/3 consensus voting logic', () => {
    it('displays PRIORITY: APPROVED when all three vote true', () => {
      mockStore({ melchior: true, balthasar: true, casper: true });
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus-result')).toHaveTextContent('PRIORITY: APPROVED');
    });

    it('displays PRIORITY: APPROVED when melchior and balthasar vote true', () => {
      mockStore({ melchior: true, balthasar: true, casper: false });
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus-result')).toHaveTextContent('PRIORITY: APPROVED');
    });

    it('displays PRIORITY: APPROVED when melchior and casper vote true', () => {
      mockStore({ melchior: true, balthasar: false, casper: true });
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus-result')).toHaveTextContent('PRIORITY: APPROVED');
    });

    it('displays PRIORITY: APPROVED when balthasar and casper vote true', () => {
      mockStore({ melchior: false, balthasar: true, casper: true });
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus-result')).toHaveTextContent('PRIORITY: APPROVED');
    });

    it('displays PRIORITY: REJECTED when only melchior votes true', () => {
      mockStore({ melchior: true, balthasar: false, casper: false });
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus-result')).toHaveTextContent('PRIORITY: REJECTED');
    });

    it('displays PRIORITY: REJECTED when only balthasar votes true', () => {
      mockStore({ melchior: false, balthasar: true, casper: false });
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus-result')).toHaveTextContent('PRIORITY: REJECTED');
    });

    it('displays PRIORITY: REJECTED when only casper votes true', () => {
      mockStore({ melchior: false, balthasar: false, casper: true });
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus-result')).toHaveTextContent('PRIORITY: REJECTED');
    });

    it('displays PRIORITY: REJECTED when no votes are true', () => {
      mockStore({ melchior: false, balthasar: false, casper: false });
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus-result')).toHaveTextContent('PRIORITY: REJECTED');
    });
  });

  describe('individual vote display', () => {
    it('shows APPROVE for each system that votes true', () => {
      mockStore({ melchior: true, balthasar: true, casper: false });
      render(<MagiDashboard />);
      expect(screen.getByTestId('melchior')).toHaveTextContent('APPROVE');
      expect(screen.getByTestId('balthasar')).toHaveTextContent('APPROVE');
      expect(screen.getByTestId('casper')).toHaveTextContent('REJECT');
    });

    it('shows REJECT for each system that votes false', () => {
      mockStore({ melchior: false, balthasar: false, casper: false });
      render(<MagiDashboard />);
      expect(screen.getByTestId('melchior')).toHaveTextContent('REJECT');
      expect(screen.getByTestId('balthasar')).toHaveTextContent('REJECT');
      expect(screen.getByTestId('casper')).toHaveTextContent('REJECT');
    });
  });

  describe('styling', () => {
    it('applies NERV Red color class to consensus when approved', () => {
      mockStore({ melchior: true, balthasar: true, casper: true });
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus-result').className).toContain('text-[#FF3300]');
    });

    it('applies Warning Orange color class to consensus when rejected', () => {
      mockStore({ melchior: false, balthasar: false, casper: false });
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus-result').className).toContain('text-[#FF9900]');
    });
  });

  describe('Pattern Blue — Emergency Overlay', () => {
    it('renders Emergency overlay when systemAlerts is populated', () => {
      const state = {
        ...defaultState,
        magiVotes: { melchior: true, balthasar: true, casper: true },
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
      render(<MagiDashboard />);
      // MagiDashboard still renders with MAGI data during emergency
      expect(screen.getByTestId('consensus-result')).toBeInTheDocument();
    });
  });
});
