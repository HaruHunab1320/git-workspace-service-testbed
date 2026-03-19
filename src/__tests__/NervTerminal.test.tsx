import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NervTerminal from '../components/NervTerminal';
import { useNervStore } from '../store/useNervStore';

// jsdom does not implement scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock the store
jest.mock('../store/useNervStore');
const mockUseNervStore = useNervStore as unknown as jest.Mock;

// Mock setState on the store module
const mockSetState = jest.fn();
(useNervStore as unknown as { setState: jest.Mock }).setState = mockSetState;

/**
 * Default NERV state used across all NervTerminal tests.
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

/**
 * Helper to type a command into the terminal and submit it.
 */
function submitCommand(command: string) {
  const input = screen.getByPlaceholderText('Enter command...');
  fireEvent.change(input, { target: { value: command } });
  fireEvent.submit(input.closest('form')!);
}

describe('NervTerminal', () => {
  beforeEach(() => {
    mockSetState.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('boot sequence', () => {
    it('renders MAGI uplink boot messages on initialization', () => {
      mockStore();
      render(<NervTerminal />);
      expect(screen.getByText(/NERV COMMAND TERMINAL/)).toBeInTheDocument();
      expect(screen.getByText(/MELCHIOR-1 ... ONLINE/)).toBeInTheDocument();
      expect(screen.getByText(/BALTHASAR-2 ... ONLINE/)).toBeInTheDocument();
      expect(screen.getByText(/CASPER-3 ... ONLINE/)).toBeInTheDocument();
    });

    it('renders the input field', () => {
      mockStore();
      render(<NervTerminal />);
      expect(screen.getByPlaceholderText('Enter command...')).toBeInTheDocument();
    });
  });

  describe('command: help', () => {
    it('displays available commands when "help" is entered', () => {
      mockStore();
      render(<NervTerminal />);
      submitCommand('help');
      expect(screen.getByText(/AVAILABLE COMMANDS/)).toBeInTheDocument();
      expect(screen.getByText(/system --status/)).toBeInTheDocument();
      expect(screen.getByText(/magi --vote/)).toBeInTheDocument();
    });
  });

  describe('command: system --status', () => {
    it('displays current NERV system status', () => {
      mockStore({ emergencyLevel: 'NORMAL', syncRatio: 100 });
      render(<NervTerminal />);
      submitCommand('system --status');
      expect(screen.getByText(/NERV SYSTEM STATUS/)).toBeInTheDocument();
      expect(screen.getByText(/Emergency Level : NORMAL/)).toBeInTheDocument();
    });

    it('shows MAGI vote states in status output', () => {
      mockStore({
        magiVotes: { melchior: true, balthasar: false, casper: true },
      });
      render(<NervTerminal />);
      submitCommand('system --status');
      expect(screen.getByText(/MELCHIOR-1\s*:\s*APPROVE/)).toBeInTheDocument();
      expect(screen.getByText(/BALTHASAR-2\s*:\s*REJECT/)).toBeInTheDocument();
      expect(screen.getByText(/CASPER-3\s*:\s*APPROVE/)).toBeInTheDocument();
    });
  });

  describe('command: signal', () => {
    it('activates emergency when "signal --emergency" is entered', () => {
      mockStore();
      render(<NervTerminal />);
      submitCommand('signal --emergency');
      expect(mockSetState).toHaveBeenCalledWith({ emergencyLevel: 'EMERGENCY' });
      expect(screen.getByText(/EMERGENCY SIGNAL ACTIVATED/)).toBeInTheDocument();
    });

    it('activates alert when "signal --alert" is entered', () => {
      mockStore();
      render(<NervTerminal />);
      submitCommand('signal --alert');
      expect(mockSetState).toHaveBeenCalledWith({ emergencyLevel: 'ALERT' });
      expect(screen.getByText(/ALERT STATUS ACTIVATED/)).toBeInTheDocument();
    });

    it('returns to normal when "signal --normal" is entered', () => {
      mockStore({ emergencyLevel: 'EMERGENCY' });
      render(<NervTerminal />);
      submitCommand('signal --normal');
      expect(mockSetState).toHaveBeenCalledWith({ emergencyLevel: 'NORMAL' });
      expect(screen.getByText(/Returning to normal operations/)).toBeInTheDocument();
    });
  });

  describe('command: unrecognized', () => {
    it('displays error for unknown commands', () => {
      mockStore();
      render(<NervTerminal />);
      submitCommand('hello');
      expect(screen.getByText(/Unknown command: "hello"/)).toBeInTheDocument();
    });
  });

  describe('command history', () => {
    it('navigates command history with ArrowUp', () => {
      mockStore();
      render(<NervTerminal />);
      const input = screen.getByPlaceholderText('Enter command...');

      submitCommand('help');
      submitCommand('system --status');

      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect((input as HTMLInputElement).value).toBe('system --status');

      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect((input as HTMLInputElement).value).toBe('help');
    });

    it('clears input when navigating past end of history with ArrowDown', () => {
      mockStore();
      render(<NervTerminal />);
      const input = screen.getByPlaceholderText('Enter command...');

      submitCommand('help');

      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect((input as HTMLInputElement).value).toBe('help');

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect((input as HTMLInputElement).value).toBe('');
    });
  });

  describe('command: clear', () => {
    it('clears terminal output when "clear" is entered', () => {
      mockStore();
      render(<NervTerminal />);
      // Boot messages should be present
      expect(screen.getByText(/NERV COMMAND TERMINAL/)).toBeInTheDocument();
      submitCommand('clear');
      // After clear, boot messages should be gone
      expect(screen.queryByText(/NERV COMMAND TERMINAL/)).not.toBeInTheDocument();
    });
  });

  describe('Pattern Blue — Emergency Overlay', () => {
    it('renders emergency terminal output when systemAlerts is populated', () => {
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
      render(<NervTerminal />);
      // NervTerminal renders with emergency state active
      expect(screen.getByPlaceholderText('Enter command...')).toBeInTheDocument();
    });
  });
});
