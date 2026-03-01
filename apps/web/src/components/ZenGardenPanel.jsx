import { useState, useCallback } from 'react';
import { api } from '../api';
import ZenGardenTile from './ZenGardenTile';
import SucculentModal from './SucculentModal';
import RockModal from './RockModal';
import './ZenGardenPanel.css';

const RAKE_PATTERNS = ['circles', 'waves', 'lines', 'spiral'];

export default function ZenGardenPanel({ zenGarden, onRefresh, showToast }) {
  const [placementMode, setPlacementMode] = useState('succulent'); // 'succulent' | 'rock' | 'rake' | 'remove'
  const [modalTarget, setModalTarget] = useState(null); // { row, col, type: 'succulent' | 'rock' }
  const [rakePattern, setRakePattern] = useState('waves');

  const handleTileClick = useCallback(async (row, col) => {
    if (!zenGarden) return;
    const tile = zenGarden.tiles[row][col];

    if (placementMode === 'remove') {
      try {
        const result = await api.removeZenItem(row, col);
        showToast(result.message);
        await onRefresh();
      } catch (err) {
        showToast(err.message);
      }
      return;
    }

    if (placementMode === 'rake') {
      if (!tile.is_empty && tile.kind !== 'sand') {
        showToast('Can only rake empty sand tiles.');
        return;
      }
      try {
        const result = await api.rakeZenTile(row, col, rakePattern);
        showToast(result.message);
        await onRefresh();
      } catch (err) {
        showToast(err.message);
      }
      return;
    }

    // For succulent/rock placement, show modal if tile is empty
    if (tile.is_empty || (tile.kind === 'sand' && (!tile.rake_pattern || tile.rake_pattern === 'none'))) {
      setModalTarget({ row, col, type: placementMode });
    } else {
      showToast('This tile is occupied. Use remove mode first.');
    }
  }, [zenGarden, placementMode, rakePattern, onRefresh, showToast]);

  const handleRightClick = useCallback(async (row, col) => {
    try {
      const result = await api.removeZenItem(row, col);
      showToast(result.message);
      await onRefresh();
    } catch (err) {
      showToast(err.message);
    }
  }, [onRefresh, showToast]);

  if (!zenGarden) {
    return <div className="card"><p>No zen garden data.</p></div>;
  }

  const harmonyPercent = zenGarden.harmony_score || 0;

  return (
    <div className="zen-garden-panel">
      <div className="card">
        <h3 className="card-title">🧘 Zen Garden</h3>

        <div className="zen-stats">
          <span>🪴 Succulents: {zenGarden.succulent_count}</span>
          <span>🪨 Rocks: {zenGarden.rock_count}</span>
          <span>📅 Day {zenGarden.day}</span>
        </div>

        <div className="zen-harmony">
          <div className="harmony-label">
            Harmony: {harmonyPercent}/100
          </div>
          <div className="progress-bar" style={{ height: 8, flex: 1 }}>
            <div
              className={`progress-fill ${harmonyPercent >= 70 ? 'sage' : harmonyPercent >= 40 ? 'tan' : 'rose'}`}
              style={{ width: `${harmonyPercent}%` }}
            />
          </div>
        </div>
        <div className="harmony-desc">{zenGarden.harmony_description}</div>

        {/* Toolbar */}
        <div className="zen-toolbar">
          <button
            className={`btn btn-sm ${placementMode === 'succulent' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPlacementMode('succulent')}
          >
            🪴 Succulent
          </button>
          <button
            className={`btn btn-sm ${placementMode === 'rock' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPlacementMode('rock')}
          >
            🪨 Rock
          </button>
          <button
            className={`btn btn-sm ${placementMode === 'rake' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPlacementMode('rake')}
          >
            〰️ Rake
          </button>
          <button
            className={`btn btn-sm ${placementMode === 'remove' ? 'btn-rose' : 'btn-secondary'}`}
            onClick={() => setPlacementMode('remove')}
          >
            ✕ Remove
          </button>
        </div>

        {placementMode === 'rake' && (
          <div className="zen-rake-options">
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Pattern:</label>
            {RAKE_PATTERNS.map((p) => (
              <button
                key={p}
                className={`btn btn-sm ${rakePattern === p ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRakePattern(p)}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        <div
          className="zen-grid"
          style={{
            gridTemplateColumns: `repeat(${zenGarden.cols}, 1fr)`,
            gridTemplateRows: `repeat(${zenGarden.rows}, 1fr)`,
          }}
        >
          {zenGarden.tiles.map((row, r) =>
            row.map((tile, c) => (
              <ZenGardenTile
                key={`${r}-${c}`}
                tile={tile}
                onClick={handleTileClick}
                onRightClick={handleRightClick}
              />
            ))
          )}
        </div>

        <div className="zen-legend">
          <span>🌱 Sprout</span>
          <span>🌿 Young</span>
          <span>🪴 Mature</span>
          <span>🌸 Blooming</span>
          <span>🪨 Rock</span>
          <span>〰️ Raked</span>
        </div>

        <div className="zen-hint">
          Click a tile to {placementMode === 'remove' ? 'remove' : placementMode === 'rake' ? 'rake' : `place a ${placementMode}`}.
          Right-click any tile to remove it.
        </div>
      </div>

      {modalTarget && modalTarget.type === 'succulent' && (
        <SucculentModal
          row={modalTarget.row}
          col={modalTarget.col}
          onClose={() => setModalTarget(null)}
          onRefresh={onRefresh}
          showToast={showToast}
        />
      )}

      {modalTarget && modalTarget.type === 'rock' && (
        <RockModal
          row={modalTarget.row}
          col={modalTarget.col}
          onClose={() => setModalTarget(null)}
          onRefresh={onRefresh}
          showToast={showToast}
        />
      )}
    </div>
  );
}
