import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SyncMonitor from '../components/SyncMonitor';
import { useNervStore } from '../store/useNervStore';

// Mock the store
jest.mock('../store/useNervStore');
const mockUseNervStore = useNervStore as unknown as jest.Mock;

function mockStore(syncRatios: Record<string, number>, emergencyLevel: 'NORMAL' | 'ALERT' | 'EMERGENCY' = 'NORMAL') {
  mockUseNervStore.mockReturnValue({
    syncRatios,
    emergencyLevel,
  });
}

describe('SyncMonitor', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('sync ratio progress bar', () => {
    it('sets bar height to 0% when syncRatios is empty', () => {
      mockStore({});
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.style.height).toBe('0%');
    });

    it('sets bar height to 50% when average syncRatio is 50', () => {
      mockStore({ 'pilot-01': 50 });
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.style.height).toBe('50%');
    });

    it('sets bar height to 100% when average syncRatio is 100', () => {
      mockStore({ 'pilot-01': 100 });
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.style.height).toBe('100%');
    });

    it('clamps bar height to 100% when syncRatio exceeds 100', () => {
      mockStore({ 'pilot-01': 150 });
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.style.height).toBe('100%');
    });

    it('averages multiple pilot sync ratios', () => {
      mockStore({ 'pilot-01': 60, 'pilot-02': 40 });
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.style.height).toBe('50%');
    });

    it('handles fractional syncRatio values', () => {
      mockStore({ 'pilot-01': 73.5 });
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.style.height).toBe('73.5%');
    });
  });

  describe('sync value display', () => {
    it('displays the average sync ratio as a percentage', () => {
      mockStore({ 'pilot-01': 42.7 });
      render(<SyncMonitor />);
      expect(screen.getByTestId('sync-value')).toHaveTextContent('42.7%');
    });

    it('displays 0.0% when syncRatios is empty', () => {
      mockStore({});
      render(<SyncMonitor />);
      expect(screen.getByTestId('sync-value')).toHaveTextContent('0.0%');
    });
  });

  describe('emergency level reactions', () => {
    it('uses NERV red bar color during NORMAL state', () => {
      mockStore({ 'pilot-01': 50 }, 'NORMAL');
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.className).toContain('bg-[#FF3300]');
      expect(bar.className).not.toContain('animate-pulse');
    });

    it('uses red pulsing bar during EMERGENCY state', () => {
      mockStore({ 'pilot-01': 50 }, 'EMERGENCY');
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.className).toContain('bg-red-500');
      expect(bar.className).toContain('animate-pulse');
    });

    it('shows emergency warning during EMERGENCY state', () => {
      mockStore({ 'pilot-01': 50 }, 'EMERGENCY');
      render(<SyncMonitor />);
      expect(screen.getByTestId('emergency-warning')).toBeInTheDocument();
    });

    it('does not show emergency warning during NORMAL state', () => {
      mockStore({ 'pilot-01': 50 }, 'NORMAL');
      render(<SyncMonitor />);
      expect(screen.queryByTestId('emergency-warning')).not.toBeInTheDocument();
    });

    it('does not show emergency warning during ALERT state', () => {
      mockStore({ 'pilot-01': 50 }, 'ALERT');
      render(<SyncMonitor />);
      expect(screen.queryByTestId('emergency-warning')).not.toBeInTheDocument();
    });

    it('uses NERV red bar during ALERT state (not emergency)', () => {
      mockStore({ 'pilot-01': 50 }, 'ALERT');
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.className).toContain('bg-[#FF3300]');
      expect(bar.className).not.toContain('bg-red-500');
    });
  });
});
