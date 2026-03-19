import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MagiDashboard from '../components/MagiDashboard';
import { useNervStore } from '../store/useNervStore';
import type { MagiStatus, SystemAlert } from '../types/nerv';

jest.mock('../store/useNervStore');
const mockUseNervStore = useNervStore as unknown as jest.Mock;

function mockStore(
  votes: { melchior: boolean; balthasar: boolean; casper: boolean },
  magiStatus: MagiStatus = 'DISAGREE',
  systemAlerts: SystemAlert[] = [],
) {
  mockUseNervStore.mockReturnValue({
    magiVotes: votes,
    magiStatus,
    systemAlerts,
  });
}

describe('MagiDashboard', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('2/3 consensus voting logic', () => {
    it('displays PRIORITY: APPROVED when all three vote true (AGREE)', () => {
      mockStore({ melchior: true, balthasar: true, casper: true }, 'AGREE');
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus')).toHaveTextContent('PRIORITY: APPROVED');
    });

    it('displays PRIORITY: APPROVED when melchior and balthasar vote true (AGREE)', () => {
      mockStore({ melchior: true, balthasar: true, casper: false }, 'AGREE');
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus')).toHaveTextContent('PRIORITY: APPROVED');
    });

    it('displays PRIORITY: APPROVED when melchior and casper vote true (AGREE)', () => {
      mockStore({ melchior: true, balthasar: false, casper: true }, 'AGREE');
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus')).toHaveTextContent('PRIORITY: APPROVED');
    });

    it('displays PRIORITY: APPROVED when balthasar and casper vote true (AGREE)', () => {
      mockStore({ melchior: false, balthasar: true, casper: true }, 'AGREE');
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus')).toHaveTextContent('PRIORITY: APPROVED');
    });

    it('displays PRIORITY: CONFLICT when only one MAGI approves', () => {
      mockStore({ melchior: true, balthasar: false, casper: false }, 'CONFLICT');
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus')).toHaveTextContent('PRIORITY: CONFLICT');
    });

    it('displays PRIORITY: REJECTED when no votes are true (DISAGREE)', () => {
      mockStore({ melchior: false, balthasar: false, casper: false }, 'DISAGREE');
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus')).toHaveTextContent('PRIORITY: REJECTED');
    });
  });

  describe('magiStatus display', () => {
    it('shows MAGI STATUS: AGREE when status is AGREE', () => {
      mockStore({ melchior: true, balthasar: true, casper: true }, 'AGREE');
      render(<MagiDashboard />);
      expect(screen.getByTestId('magi-status')).toHaveTextContent('MAGI STATUS: AGREE');
    });

    it('shows MAGI STATUS: CONFLICT when status is CONFLICT', () => {
      mockStore({ melchior: true, balthasar: false, casper: false }, 'CONFLICT');
      render(<MagiDashboard />);
      expect(screen.getByTestId('magi-status')).toHaveTextContent('MAGI STATUS: CONFLICT');
    });

    it('shows MAGI STATUS: DISAGREE when status is DISAGREE', () => {
      mockStore({ melchior: false, balthasar: false, casper: false }, 'DISAGREE');
      render(<MagiDashboard />);
      expect(screen.getByTestId('magi-status')).toHaveTextContent('MAGI STATUS: DISAGREE');
    });
  });

  describe('individual vote display', () => {
    it('shows APPROVE for each system that votes true', () => {
      mockStore({ melchior: true, balthasar: true, casper: false }, 'AGREE');
      render(<MagiDashboard />);
      expect(screen.getByTestId('melchior')).toHaveTextContent('APPROVE');
      expect(screen.getByTestId('balthasar')).toHaveTextContent('APPROVE');
      expect(screen.getByTestId('casper')).toHaveTextContent('REJECT');
    });

    it('shows REJECT for each system that votes false', () => {
      mockStore({ melchior: false, balthasar: false, casper: false }, 'DISAGREE');
      render(<MagiDashboard />);
      expect(screen.getByTestId('melchior')).toHaveTextContent('REJECT');
      expect(screen.getByTestId('balthasar')).toHaveTextContent('REJECT');
      expect(screen.getByTestId('casper')).toHaveTextContent('REJECT');
    });
  });

  describe('styling', () => {
    it('applies green color class to consensus when approved', () => {
      mockStore({ melchior: true, balthasar: true, casper: true }, 'AGREE');
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus').className).toContain('text-[#39FF14]');
    });

    it('applies orange color class to consensus when rejected', () => {
      mockStore({ melchior: false, balthasar: false, casper: false }, 'DISAGREE');
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus').className).toContain('text-[#FF9900]');
    });

    it('uses Deep Black background', () => {
      mockStore({ melchior: false, balthasar: false, casper: false }, 'DISAGREE');
      const { container } = render(<MagiDashboard />);
      expect(container.firstChild).toHaveClass('bg-[#050505]');
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
      mockStore(
        { melchior: true, balthasar: true, casper: true },
        'AGREE',
        [emergencyAlert],
      );
      render(<MagiDashboard />);
      expect(screen.getByTestId('emergency-overlay')).toBeInTheDocument();
    });

    it('does not render emergency overlay when systemAlerts is empty', () => {
      mockStore({ melchior: true, balthasar: true, casper: true }, 'AGREE', []);
      render(<MagiDashboard />);
      expect(screen.queryByTestId('emergency-overlay')).not.toBeInTheDocument();
    });

    it('emergency overlay contains [SYSTEM_REPORT] prefix', () => {
      mockStore(
        { melchior: false, balthasar: false, casper: false },
        'DISAGREE',
        [emergencyAlert],
      );
      render(<MagiDashboard />);
      expect(screen.getByTestId('emergency-overlay')).toHaveTextContent('[SYSTEM_REPORT]');
    });

    it('emergency overlay has NERV Red border color', () => {
      mockStore(
        { melchior: false, balthasar: false, casper: false },
        'DISAGREE',
        [emergencyAlert],
      );
      render(<MagiDashboard />);
      expect(screen.getByTestId('emergency-overlay').className).toContain('border-[#FF3300]');
    });

    it('emergency overlay pulses with animation', () => {
      mockStore(
        { melchior: false, balthasar: false, casper: false },
        'DISAGREE',
        [emergencyAlert],
      );
      render(<MagiDashboard />);
      expect(screen.getByTestId('emergency-overlay').className).toContain('animate-pulse');
    });
  });
});
