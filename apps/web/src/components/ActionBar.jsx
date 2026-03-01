import './ActionBar.css';

export default function ActionBar({ advancing, onAdvanceDay, onAdvanceWeek, onNewGame }) {
  return (
    <div className="action-bar">
      <div className="action-bar-inner">
        <button className="btn btn-primary" onClick={onAdvanceDay} disabled={advancing}>
          {advancing ? '⏳ Advancing...' : '▶️ Advance Day'}
        </button>
        <button className="btn btn-secondary" onClick={onAdvanceWeek} disabled={advancing}>
          {'⏩ Skip 7 Days'}
        </button>
        <button className="btn btn-rose" onClick={onNewGame} disabled={advancing}>
          {'🆕 New Game'}
        </button>
      </div>
    </div>
  );
}
