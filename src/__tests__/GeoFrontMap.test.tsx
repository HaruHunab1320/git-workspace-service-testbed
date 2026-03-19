
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GeoFrontMap from '../ui/map/GeoFrontMap';
import { useNervStore } from '../store/useNervStore';

// Mock the store
jest.mock('../store/useNervStore');
const mockUseNervStore = useNervStore as unknown as jest.Mock;

/**
 * Default NERV state used across all GeoFrontMap tests.
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
 * Helper to mock the store with a specific emergency level.
 * Uses the selector-compatible mockImplementation pattern.
 */
function mockStore(emergencyLevel: 'NORMAL' | 'ALERT' | 'EMERGENCY' = 'NORMAL') {
  const state = { ...defaultState, emergencyLevel };
  mockUseNervStore.mockImplementation((selector?: (s: Record<string, unknown>) => unknown) =>
    selector ? selector(state) : state,
  );
}

describe('GeoFrontMap', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('rendering', () => {
    it('renders the SVG hexagonal map', () => {
      mockStore('NORMAL');
      render(<GeoFrontMap />);
      const svg = screen.getByRole('img', { name: /geofront hexagonal map/i });
      expect(svg).toBeInTheDocument();
    });

    it('renders the GEOFRONT center label', () => {
      mockStore('NORMAL');
      render(<GeoFrontMap />);
      expect(screen.getByText('GEOFRONT')).toBeInTheDocument();
    });

    it('renders 63 hexagon polygons (9x7 grid)', () => {
      mockStore('NORMAL');
      const { container } = render(<GeoFrontMap />);
      const polygons = container.querySelectorAll('polygon');
      expect(polygons.length).toBe(63);
    });
  });

  describe('emergency level visual states', () => {
    it('displays [NORMAL] status label during NORMAL state', () => {
      mockStore('NORMAL');
      render(<GeoFrontMap />);
      expect(screen.getByText('[NORMAL]')).toBeInTheDocument();
    });

    it('displays [ALERT] status label during ALERT state', () => {
      mockStore('ALERT');
      render(<GeoFrontMap />);
      expect(screen.getByText('[ALERT]')).toBeInTheDocument();
    });

    it('displays [EMERGENCY] status label during EMERGENCY state', () => {
      mockStore('EMERGENCY');
      render(<GeoFrontMap />);
      expect(screen.getByText('[EMERGENCY]')).toBeInTheDocument();
    });

    it('applies pulse animation class during EMERGENCY state', () => {
      mockStore('EMERGENCY');
      render(<GeoFrontMap />);
      const statusLabel = screen.getByText('[EMERGENCY]');
      expect(statusLabel.className).toContain('animate-pulse');
    });

    it('does not apply pulse animation during NORMAL state', () => {
      mockStore('NORMAL');
      render(<GeoFrontMap />);
      const statusLabel = screen.getByText('[NORMAL]');
      expect(statusLabel.className).not.toContain('animate-pulse');
    });

    it('uses NERV Red center label color during NORMAL state', () => {
      mockStore('NORMAL');
      const { container } = render(<GeoFrontMap />);
      const textElement = container.querySelector('text');
      expect(textElement).toHaveAttribute('fill', '#FF3300');
    });

    it('uses orange center label color during EMERGENCY state', () => {
      mockStore('EMERGENCY');
      const { container } = render(<GeoFrontMap />);
      const textElement = container.querySelector('text');
      expect(textElement).toHaveAttribute('fill', '#FF9900');
    });
  });

  describe('legend', () => {
    it('displays ACTIVE and ALERT legend items', () => {
      mockStore('NORMAL');
      render(<GeoFrontMap />);
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('ALERT')).toBeInTheDocument();
    });

    it('displays the total sector count', () => {
      mockStore('NORMAL');
      render(<GeoFrontMap />);
      expect(screen.getByText('SECTORS: 63')).toBeInTheDocument();
    });
  });

  describe('Pattern Blue — Emergency Overlay', () => {
    it('renders emergency visual state when systemAlerts is populated', () => {
      const state = {
        ...defaultState,
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
      render(<GeoFrontMap />);
      // GeoFront shows EMERGENCY status and pulsing animation
      const statusLabel = screen.getByText('[EMERGENCY]');
      expect(statusLabel.className).toContain('animate-pulse');
    });
  });
});
