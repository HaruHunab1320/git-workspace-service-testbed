import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GeoFrontMap from '../components/GeoFrontMap';
import { useNervStore } from '../store/useNervStore';
import type { SystemAlert } from '../types/nerv';

jest.mock('../store/useNervStore');
const mockUseNervStore = useNervStore as unknown as jest.Mock;

function mockStore(systemAlerts: SystemAlert[] = []) {
  mockUseNervStore.mockReturnValue({
    systemAlerts,
  });
}

describe('GeoFrontMap', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('rendering', () => {
    it('renders the GeoFront Topology Map label', () => {
      mockStore();
      render(<GeoFrontMap />);
      expect(screen.getByText('GeoFront Topology Map')).toBeInTheDocument();
    });

    it('renders 63 hexagonal sectors (9x7 grid)', () => {
      mockStore();
      render(<GeoFrontMap />);
      expect(screen.getByText('SECTORS: 63')).toBeInTheDocument();
    });

    it('renders the SVG map with proper aria label', () => {
      mockStore();
      render(<GeoFrontMap />);
      expect(screen.getByRole('img', { name: 'GeoFront hexagonal map' })).toBeInTheDocument();
    });

    it('renders hex cells with hex-coordinates as test IDs', () => {
      mockStore();
      render(<GeoFrontMap />);
      expect(screen.getByTestId('hex-0-0')).toBeInTheDocument();
      expect(screen.getByTestId('hex-3-4')).toBeInTheDocument();
      expect(screen.getByTestId('hex-6-8')).toBeInTheDocument();
    });
  });

  describe('status display', () => {
    it('displays [NORMAL] when no alerts', () => {
      mockStore([]);
      render(<GeoFrontMap />);
      expect(screen.getByText('[NORMAL]')).toBeInTheDocument();
    });

    it('displays [EMERGENCY] when emergency alert is present', () => {
      mockStore([{
        id: 'alert-1',
        level: 'EMERGENCY',
        message: 'Test emergency',
        timestamp: Date.now(),
      }]);
      render(<GeoFrontMap />);
      expect(screen.getByText('[EMERGENCY]')).toBeInTheDocument();
    });

    it('displays [ALERT] when warning alert is present', () => {
      mockStore([{
        id: 'alert-1',
        level: 'WARNING',
        message: 'Test warning',
        timestamp: Date.now(),
      }]);
      render(<GeoFrontMap />);
      expect(screen.getByText('[ALERT]')).toBeInTheDocument();
    });
  });

  describe('GEOFRONT label', () => {
    it('renders GEOFRONT center text', () => {
      mockStore();
      render(<GeoFrontMap />);
      expect(screen.getByText('GEOFRONT')).toBeInTheDocument();
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
      mockStore([emergencyAlert]);
      render(<GeoFrontMap />);
      expect(screen.getByTestId('emergency-overlay')).toBeInTheDocument();
    });

    it('does not render emergency overlay when systemAlerts is empty', () => {
      mockStore([]);
      render(<GeoFrontMap />);
      expect(screen.queryByTestId('emergency-overlay')).not.toBeInTheDocument();
    });

    it('emergency overlay contains [SYSTEM_REPORT] prefix', () => {
      mockStore([emergencyAlert]);
      render(<GeoFrontMap />);
      expect(screen.getByTestId('emergency-overlay')).toHaveTextContent('[SYSTEM_REPORT]');
    });

    it('emergency overlay has NERV Red border', () => {
      mockStore([emergencyAlert]);
      render(<GeoFrontMap />);
      expect(screen.getByTestId('emergency-overlay').className).toContain('border-[#FF3300]');
    });

    it('emergency overlay pulses with animation', () => {
      mockStore([emergencyAlert]);
      render(<GeoFrontMap />);
      expect(screen.getByTestId('emergency-overlay').className).toContain('animate-pulse');
    });
  });
});
