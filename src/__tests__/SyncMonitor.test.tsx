import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SyncMonitor from '../components/SyncMonitor';
import { useNervStore } from '../store/useNervStore';

// Mock the store
jest.mock('../store/useNervStore');
const mockUseNervStore = useNervStore as unknown as jest.Mock;

function mockStore(syncRatio: number, emergencyLevel: 'NORMAL' | 'ALERT' | 'EMERGENCY' = 'NORMAL') {
  const state = { syncRatio, emergencyLevel };
  mockUseNervStore.mockImplementation((selector?: (s: typeof state) => unknown) => {
    if (typeof selector === 'function') return selector(state);
    return state;
  });
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
      expect(bar.style.backgroundColor).toBe('rgb(57, 255, 20)');
    });

    it('uses NERV red bar during EMERGENCY state with pulse animation', () => {
      mockStore(50, 'EMERGENCY');
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.style.backgroundColor).toBe('rgb(255, 51, 0)');
      expect(bar.style.animation).toContain('emergency-pulse');
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
      expect(bar.style.backgroundColor).toBe('rgb(57, 255, 20)');
    });
  });

  describe('Pattern Blue — emergency overlay', () => {
    it('renders emergency overlay text when EMERGENCY is active', () => {
      mockStore(30, 'EMERGENCY');
      render(<SyncMonitor />);
      const warning = screen.getByTestId('emergency-warning');
      expect(warning).toHaveTextContent('[SYSTEM_REPORT] EMERGENCY STATE ACTIVE');
    });

    it('does not render emergency overlay when NORMAL', () => {
      mockStore(80, 'NORMAL');
      render(<SyncMonitor />);
      expect(screen.queryByTestId('emergency-warning')).not.toBeInTheDocument();
    });
  });
});
