import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GeoFrontMap from '../components/GeoFrontMap';
import { useNervStore } from '../store/useNervStore';

// Mock the store
jest.mock('../store/useNervStore');
const mockUseNervStore = useNervStore as unknown as jest.Mock;

function mockStore(overrides: Record<string, unknown> = {}) {
  const defaults = {
    emergencyLevel: 'NORMAL',
    systemAlerts: [],
    evaPositions: [],
  };
  mockUseNervStore.mockImplementation((selector: (s: typeof defaults) => unknown) =>
    selector({ ...defaults, ...overrides })
  );
}

describe('GeoFrontMap', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('hexagonal grid rendering', () => {
    it('renders 63 hex sectors (9x7 grid)', () => {
      mockStore();
      const { container } = render(<GeoFrontMap />);
      const hexGroups = container.querySelectorAll('g[data-hex]');
      expect(hexGroups.length).toBe(63);
    });

    it('uses row-col coordinate format for hex keys', () => {
      mockStore();
      const { container } = render(<GeoFrontMap />);
      const firstHex = container.querySelector('g[data-hex="0-0"]');
      const centerHex = container.querySelector('g[data-hex="3-4"]');
      expect(firstHex).toBeInTheDocument();
      expect(centerHex).toBeInTheDocument();
    });
  });

  describe('dome hex coloring', () => {
    it('renders dome hexes green (#39FF14) in NORMAL state', () => {
      mockStore({ emergencyLevel: 'NORMAL' });
      const { container } = render(<GeoFrontMap />);
      // Center hex (3-4) is in the dome
      const centerGroup = container.querySelector('g[data-hex="3-4"]');
      const polygon = centerGroup?.querySelector('polygon');
      expect(polygon?.getAttribute('fill')).toBe('#39FF14');
    });

    it('renders dome hexes orange (#FF9900) in ALERT state', () => {
      mockStore({ emergencyLevel: 'ALERT' });
      const { container } = render(<GeoFrontMap />);
      const centerGroup = container.querySelector('g[data-hex="3-4"]');
      const polygon = centerGroup?.querySelector('polygon');
      expect(polygon?.getAttribute('fill')).toBe('#FF9900');
    });

    it('renders dome hexes orange (#FF9900) in EMERGENCY state', () => {
      mockStore({ emergencyLevel: 'EMERGENCY' });
      const { container } = render(<GeoFrontMap />);
      const centerGroup = container.querySelector('g[data-hex="3-4"]');
      const polygon = centerGroup?.querySelector('polygon');
      expect(polygon?.getAttribute('fill')).toBe('#FF9900');
    });
  });

  describe('emergency overlay with systemAlerts', () => {
    it('shows system alerts when populated', () => {
      mockStore({ systemAlerts: ['ANGEL DETECTED - PATTERN BLUE'] });
      render(<GeoFrontMap />);
      expect(screen.getByText(/ANGEL DETECTED/)).toBeInTheDocument();
    });

    it('prefixes alerts with [SYSTEM_REPORT]', () => {
      mockStore({ systemAlerts: ['ANGEL DETECTED'] });
      render(<GeoFrontMap />);
      expect(screen.getByText(/\[SYSTEM_REPORT\] ANGEL DETECTED/)).toBeInTheDocument();
    });

    it('triggers emergency mode when systemAlerts is populated', () => {
      mockStore({ emergencyLevel: 'NORMAL', systemAlerts: ['ANGEL DETECTED'] });
      const { container } = render(<GeoFrontMap />);
      // Dome hex should be orange even though emergencyLevel is NORMAL
      const centerGroup = container.querySelector('g[data-hex="3-4"]');
      const polygon = centerGroup?.querySelector('polygon');
      expect(polygon?.getAttribute('fill')).toBe('#FF9900');
    });
  });

  describe('EVA position tracking', () => {
    it('renders EVA unit labels at specified hex coordinates', () => {
      mockStore({
        evaPositions: [
          { pilotId: 'shinji', hex: { row: 2, col: 3 }, label: 'EVA-01' },
        ],
      });
      render(<GeoFrontMap />);
      expect(screen.getByText('EVA-01')).toBeInTheDocument();
    });

    it('fills EVA hexes with NERV Red (#FF3300)', () => {
      mockStore({
        evaPositions: [
          { pilotId: 'shinji', hex: { row: 3, col: 4 }, label: 'EVA-01' },
        ],
      });
      const { container } = render(<GeoFrontMap />);
      const evaGroup = container.querySelector('g[data-hex="3-4"]');
      const polygon = evaGroup?.querySelector('polygon');
      expect(polygon?.getAttribute('fill')).toBe('#FF3300');
    });
  });

  describe('[SYSTEM_REPORT] prefix', () => {
    it('prefixes the header with [SYSTEM_REPORT]', () => {
      mockStore();
      render(<GeoFrontMap />);
      expect(screen.getByText(/\[SYSTEM_REPORT\] GeoFront Topology Map/)).toBeInTheDocument();
    });
  });

  describe('Share-Tech-Mono font', () => {
    it('applies Share Tech Mono font to the container', () => {
      mockStore();
      const { container } = render(<GeoFrontMap />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.fontFamily).toContain('Share Tech Mono');
    });
  });
});
