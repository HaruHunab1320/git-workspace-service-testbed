import { useNervStore } from '../store/useNervStore';

describe('useNervStore - MAGI 2/3 majority consensus', () => {
  beforeEach(() => {
    // Reset store to defaults
    useNervStore.setState({
      emergencyLevel: 'NORMAL',
      magiStatus: 'DISAGREE',
      magiVotes: { melchior: false, balthasar: false, casper: false },
      syncRatios: {},
      systemAlerts: [],
      evaPositions: [],
      syncRatio: 0,
    });
  });

  it('returns AGREE when all three vote true (3/3)', () => {
    useNervStore.getState().setMagiVotes({ melchior: true, balthasar: true, casper: true });
    expect(useNervStore.getState().magiStatus).toBe('AGREE');
  });

  it('returns AGREE when melchior + balthasar vote true (2/3 majority)', () => {
    useNervStore.getState().setMagiVotes({ melchior: true, balthasar: true, casper: false });
    expect(useNervStore.getState().magiStatus).toBe('AGREE');
  });

  it('returns AGREE when melchior + casper vote true (2/3 majority)', () => {
    useNervStore.getState().setMagiVotes({ melchior: true, balthasar: false, casper: true });
    expect(useNervStore.getState().magiStatus).toBe('AGREE');
  });

  it('returns AGREE when balthasar + casper vote true (2/3 majority)', () => {
    useNervStore.getState().setMagiVotes({ melchior: false, balthasar: true, casper: true });
    expect(useNervStore.getState().magiStatus).toBe('AGREE');
  });

  it('returns CONFLICT when only one votes true (1/3)', () => {
    useNervStore.getState().setMagiVotes({ melchior: true, balthasar: false, casper: false });
    expect(useNervStore.getState().magiStatus).toBe('CONFLICT');
  });

  it('returns CONFLICT when only balthasar votes true', () => {
    useNervStore.getState().setMagiVotes({ melchior: false, balthasar: true, casper: false });
    expect(useNervStore.getState().magiStatus).toBe('CONFLICT');
  });

  it('returns CONFLICT when only casper votes true', () => {
    useNervStore.getState().setMagiVotes({ melchior: false, balthasar: false, casper: true });
    expect(useNervStore.getState().magiStatus).toBe('CONFLICT');
  });

  it('returns DISAGREE when no votes are true (0/3)', () => {
    useNervStore.getState().setMagiVotes({ melchior: false, balthasar: false, casper: false });
    expect(useNervStore.getState().magiStatus).toBe('DISAGREE');
  });
});

describe('useNervStore - systemAlerts', () => {
  beforeEach(() => {
    useNervStore.setState({ systemAlerts: [] });
  });

  it('adds alerts to the array', () => {
    useNervStore.getState().addSystemAlert('[SYSTEM_REPORT] ANGEL DETECTED');
    expect(useNervStore.getState().systemAlerts).toEqual(['[SYSTEM_REPORT] ANGEL DETECTED']);
  });

  it('clears all alerts', () => {
    useNervStore.getState().addSystemAlert('alert1');
    useNervStore.getState().addSystemAlert('alert2');
    useNervStore.getState().clearSystemAlerts();
    expect(useNervStore.getState().systemAlerts).toEqual([]);
  });
});

describe('useNervStore - evaPositions', () => {
  it('stores EVA positions with hex coordinates', () => {
    const positions = [
      { pilotId: 'shinji', hex: { row: 3, col: 4 }, label: 'EVA-01' },
      { pilotId: 'asuka', hex: { row: 2, col: 5 }, label: 'EVA-02' },
    ];
    useNervStore.getState().setEvaPositions(positions);
    expect(useNervStore.getState().evaPositions).toEqual(positions);
    expect(useNervStore.getState().evaPositions[0].hex.row).toBe(3);
    expect(useNervStore.getState().evaPositions[0].hex.col).toBe(4);
  });
});

describe('useNervStore - syncRatios coexistence', () => {
  it('supports both syncRatio (legacy) and syncRatios (new)', () => {
    useNervStore.getState().setSyncRatio(95.5);
    useNervStore.getState().setSyncRatios({ 'EVA-01': 95.5, 'EVA-02': 87.2 });
    expect(useNervStore.getState().syncRatio).toBe(95.5);
    expect(useNervStore.getState().syncRatios).toEqual({ 'EVA-01': 95.5, 'EVA-02': 87.2 });
  });
});
