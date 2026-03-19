import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SyncMonitor from '../components/SyncMonitor';
import { useNervStore } from '../store/useNervStore';
import type { SystemAlert, SyncRatios } from '../types/nerv';

jest.mock('../store/useNervStore');
const mockUseNervStore = useNervStore as unknown as jest.Mock;

function mockStore(
  syncRatios: SyncRatios = {},
  systemAlerts: SystemAlert[] = [],
) {
  mockUseNervStore.mockReturnValue({
    syncRatios,
    systemAlerts,
  });
}

describe('SyncMonitor', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('sync ratio display with multiple pilots', () => {
    it('renders individual sync bars per pilot', () => {
      mockStore({ 'pilot-shinji': 75, 'pilot-asuka': 90 });
      render(<SyncMonitor />);
      expect(screen.getByTestId('sync-bar-pilot-shinji')).toBeInTheDocument();
      expect(screen.getByTestId('sync-bar-pilot-asuka')).toBeInTheDocument();
    });

    it('sets correct height for each pilot bar', () => {
      mockStore({ 'pilot-shinji': 60, 'pilot-asuka': 85 });
      render(<SyncMonitor />);
      expect(screen.getByTestId('sync-bar-pilot-shinji').style.height).toBe('60%');
      expect(screen.getByTestId('sync-bar-pilot-asuka').style.height).toBe('85%');
    });

    it('clamps bar height to 100% for ratios exceeding 100', () => {
      mockStore({ 'pilot-rei': 150 });
      render(<SyncMonitor />);
      expect(screen.getByTestId('sync-bar-pilot-rei').style.height).toBe('100%');
    });

    it('clamps bar height to 0% for negative ratios', () => {
      mockStore({ 'pilot-rei': -10 });
      render(<SyncMonitor />);
      expect(screen.getByTestId('sync-bar-pilot-rei').style.height).toBe('0%');
    });
  });

  describe('average sync value display', () => {
    it('displays the average sync ratio as a percentage', () => {
      mockStore({ 'pilot-shinji': 40, 'pilot-asuka': 60 });
      render(<SyncMonitor />);
      expect(screen.getByTestId('sync-value')).toHaveTextContent('50.0%');
    });

    it('displays 0.0% when no pilots are registered', () => {
      mockStore({});
      render(<SyncMonitor />);
      expect(screen.getByTestId('sync-value')).toHaveTextContent('0.0%');
    });

    it('displays single pilot ratio correctly', () => {
      mockStore({ 'pilot-shinji': 73.5 });
      render(<SyncMonitor />);
      expect(screen.getByTestId('sync-value')).toHaveTextContent('73.5%');
    });
  });

  describe('empty state', () => {
    it('renders a default empty bar when no pilots are registered', () => {
      mockStore({});
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar');
      expect(bar.style.height).toBe('0%');
    });
  });

  describe('emergency alert reactions', () => {
    it('uses green bar color when no alerts', () => {
      mockStore({ 'pilot-shinji': 50 }, []);
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar-pilot-shinji');
      expect(bar.className).toContain('bg-[#39FF14]');
      expect(bar.className).not.toContain('animate-pulse');
    });

    it('uses red pulsing bar when systemAlerts is populated', () => {
      const alert: SystemAlert = {
        id: 'alert-1',
        level: 'EMERGENCY',
        message: 'Pattern Blue detected',
        timestamp: Date.now(),
      };
      mockStore({ 'pilot-shinji': 50 }, [alert]);
      render(<SyncMonitor />);
      const bar = screen.getByTestId('sync-bar-pilot-shinji');
      expect(bar.className).toContain('bg-red-500');
      expect(bar.className).toContain('animate-pulse');
    });

    it('shows emergency warning when systemAlerts is populated', () => {
      const alert: SystemAlert = {
        id: 'alert-1',
        level: 'EMERGENCY',
        message: 'Pattern Blue detected',
        timestamp: Date.now(),
      };
      mockStore({ 'pilot-shinji': 50 }, [alert]);
      render(<SyncMonitor />);
      expect(screen.getByTestId('emergency-warning')).toBeInTheDocument();
    });

    it('does not show emergency warning when no alerts', () => {
      mockStore({ 'pilot-shinji': 50 }, []);
      render(<SyncMonitor />);
      expect(screen.queryByTestId('emergency-warning')).not.toBeInTheDocument();
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
      mockStore({ 'pilot-shinji': 50 }, [emergencyAlert]);
      render(<SyncMonitor />);
      expect(screen.getByTestId('emergency-overlay')).toBeInTheDocument();
    });

    it('does not render emergency overlay when systemAlerts is empty', () => {
      mockStore({ 'pilot-shinji': 50 }, []);
      render(<SyncMonitor />);
      expect(screen.queryByTestId('emergency-overlay')).not.toBeInTheDocument();
    });

    it('emergency overlay contains [SYSTEM_REPORT] prefix', () => {
      mockStore({ 'pilot-shinji': 50 }, [emergencyAlert]);
      render(<SyncMonitor />);
      expect(screen.getByTestId('emergency-overlay')).toHaveTextContent('[SYSTEM_REPORT]');
    });

    it('emergency overlay has NERV Red border', () => {
      mockStore({ 'pilot-shinji': 50 }, [emergencyAlert]);
      render(<SyncMonitor />);
      expect(screen.getByTestId('emergency-overlay').className).toContain('border-[#FF3300]');
    });

    it('emergency overlay uses pulse animation', () => {
      mockStore({ 'pilot-shinji': 50 }, [emergencyAlert]);
      render(<SyncMonitor />);
      expect(screen.getByTestId('emergency-overlay').className).toContain('animate-pulse');
    });
  });
});
