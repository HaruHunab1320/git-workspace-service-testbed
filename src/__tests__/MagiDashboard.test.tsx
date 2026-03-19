import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MagiDashboard from '../components/MagiDashboard';
import { useNervStore } from '../store/useNervStore';

// Mock the store
jest.mock('../store/useNervStore');
const mockUseNervStore = useNervStore as unknown as jest.Mock;

function mockStore(votes: { melchior: boolean; balthasar: boolean; casper: boolean }) {
  mockUseNervStore.mockReturnValue({
    magiVotes: votes,
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
      expect(screen.getByTestId('consensus')).toHaveTextContent('PRIORITY: APPROVED');
    });

    it('displays PRIORITY: APPROVED when melchior and balthasar vote true', () => {
      mockStore({ melchior: true, balthasar: true, casper: false });
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus')).toHaveTextContent('PRIORITY: APPROVED');
    });

    it('displays PRIORITY: APPROVED when melchior and casper vote true', () => {
      mockStore({ melchior: true, balthasar: false, casper: true });
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus')).toHaveTextContent('PRIORITY: APPROVED');
    });

    it('displays PRIORITY: APPROVED when balthasar and casper vote true', () => {
      mockStore({ melchior: false, balthasar: true, casper: true });
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus')).toHaveTextContent('PRIORITY: APPROVED');
    });

    it('displays PRIORITY: REJECTED when only melchior votes true', () => {
      mockStore({ melchior: true, balthasar: false, casper: false });
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus')).toHaveTextContent('PRIORITY: REJECTED');
    });

    it('displays PRIORITY: REJECTED when only balthasar votes true', () => {
      mockStore({ melchior: false, balthasar: true, casper: false });
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus')).toHaveTextContent('PRIORITY: REJECTED');
    });

    it('displays PRIORITY: REJECTED when only casper votes true', () => {
      mockStore({ melchior: false, balthasar: false, casper: true });
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus')).toHaveTextContent('PRIORITY: REJECTED');
    });

    it('displays PRIORITY: REJECTED when no votes are true', () => {
      mockStore({ melchior: false, balthasar: false, casper: false });
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus')).toHaveTextContent('PRIORITY: REJECTED');
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
    it('applies NERV red color class to consensus when approved', () => {
      mockStore({ melchior: true, balthasar: true, casper: true });
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus').className).toContain('text-[#FF3300]');
    });

    it('applies orange color class to consensus when rejected', () => {
      mockStore({ melchior: false, balthasar: false, casper: false });
      render(<MagiDashboard />);
      expect(screen.getByTestId('consensus').className).toContain('text-[#FF9900]');
    });
  });
});
