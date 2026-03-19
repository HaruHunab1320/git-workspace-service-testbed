import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NervTerminal from '../components/NervTerminal';
import { useNervStore } from '../store/useNervStore';
import type { SystemAlert } from '../types/nerv';

// jsdom does not implement scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

jest.mock('../store/useNervStore');
const mockUseNervStore = useNervStore as unknown as jest.Mock;

function mockStore(overrides: Record<string, unknown> = {}) {
  const defaultState = {
    syncRatios: {},
    magiVotes: { melchior: false, balthasar: false, casper: false },
    magiStatus: 'DISAGREE' as const,
    systemAlerts: [] as SystemAlert[],
  };
  mockUseNervStore.mockReturnValue({ ...defaultState, ...overrides });
}

describe('NervTerminal', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('boot sequence', () => {
    it('renders boot messages on mount', () => {
      mockStore();
      render(<NervTerminal />);
      expect(screen.getByText(/NERV COMMAND TERMINAL/)).toBeInTheDocument();
      expect(screen.getByText(/MELCHIOR-1 ... ONLINE/)).toBeInTheDocument();
      expect(screen.getByText(/BALTHASAR-2 ... ONLINE/)).toBeInTheDocument();
      expect(screen.getByText(/CASPER-3 ... ONLINE/)).toBeInTheDocument();
    });

    it('boot messages contain [SYSTEM_REPORT] prefix', () => {
      mockStore();
      render(<NervTerminal />);
      expect(screen.getByText(/\[SYSTEM_REPORT\] NERV COMMAND TERMINAL/)).toBeInTheDocument();
    });
  });

  describe('command input', () => {
    it('renders an input field with placeholder', () => {
      mockStore();
      render(<NervTerminal />);
      expect(screen.getByPlaceholderText('Enter command...')).toBeInTheDocument();
    });

    it('renders the NERV> prompt', () => {
      mockStore();
      render(<NervTerminal />);
      expect(screen.getByText('NERV>')).toBeInTheDocument();
    });

    it('processes help command and displays available commands', () => {
      mockStore();
      render(<NervTerminal />);
      const input = screen.getByPlaceholderText('Enter command...');
      fireEvent.change(input, { target: { value: 'help' } });
      fireEvent.submit(input.closest('form')!);
      expect(screen.getByText(/AVAILABLE COMMANDS/)).toBeInTheDocument();
      expect(screen.getByText(/system --status/)).toBeInTheDocument();
      expect(screen.getByText(/magi --vote/)).toBeInTheDocument();
    });

    it('displays error for unknown commands', () => {
      mockStore();
      render(<NervTerminal />);
      const input = screen.getByPlaceholderText('Enter command...');
      fireEvent.change(input, { target: { value: 'foobar' } });
      fireEvent.submit(input.closest('form')!);
      expect(screen.getByText(/Unknown command: "foobar"/)).toBeInTheDocument();
    });
  });

  describe('header', () => {
    it('displays NERV Command Terminal header', () => {
      mockStore();
      render(<NervTerminal />);
      expect(screen.getByText('NERV Command Terminal')).toBeInTheDocument();
    });

    it('displays MAGI UPLINK status', () => {
      mockStore();
      render(<NervTerminal />);
      expect(screen.getByText(/MAGI UPLINK/)).toBeInTheDocument();
    });
  });

  describe('Pattern Blue — Emergency overlay', () => {
    const emergencyAlert: SystemAlert = {
      id: 'alert-pattern-blue',
      level: 'EMERGENCY',
      message: 'PATTERN BLUE DETECTED',
      timestamp: Date.now(),
    };

    it('renders emergency overlay when systemAlerts is populated', () => {
      mockStore({ systemAlerts: [emergencyAlert] });
      render(<NervTerminal />);
      expect(screen.getByTestId('emergency-overlay')).toBeInTheDocument();
    });

    it('does not render emergency overlay when systemAlerts is empty', () => {
      mockStore({ systemAlerts: [] });
      render(<NervTerminal />);
      expect(screen.queryByTestId('emergency-overlay')).not.toBeInTheDocument();
    });

    it('emergency overlay has NERV Red border', () => {
      mockStore({ systemAlerts: [emergencyAlert] });
      render(<NervTerminal />);
      expect(screen.getByTestId('emergency-overlay').className).toContain('border-[#FF3300]');
    });

    it('emergency overlay uses pulse animation', () => {
      mockStore({ systemAlerts: [emergencyAlert] });
      render(<NervTerminal />);
      expect(screen.getByTestId('emergency-overlay').className).toContain('animate-pulse');
    });
  });
});
