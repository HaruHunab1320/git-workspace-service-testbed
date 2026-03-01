const STAGE_EMOJI = {
  sprout: '🌱',
  young: '🌿',
  mature: '🪴',
  blooming: '🌸',
};

const RAKE_EMOJI = {
  circles: '〰️',
  waves: '🌊',
  lines: '═',
  spiral: '🌀',
};

export default function ZenGardenTile({ tile, onClick, onRightClick }) {
  const handleContextMenu = (e) => {
    e.preventDefault();
    if (onRightClick) onRightClick(tile.row, tile.col);
  };

  // Empty sand tile
  if (tile.is_empty && !tile.rake_pattern || tile.rake_pattern === 'none') {
    if (tile.kind === 'sand' && tile.rake_pattern && tile.rake_pattern !== 'none') {
      // Raked sand
      return (
        <div
          className="zen-tile raked"
          onClick={() => onClick(tile.row, tile.col)}
          onContextMenu={handleContextMenu}
          title={`Raked ${tile.rake_pattern} pattern - click to change`}
        >
          <span className="tile-emoji">{RAKE_EMOJI[tile.rake_pattern] || '~'}</span>
          <div className="tile-label">{tile.rake_pattern}</div>
        </div>
      );
    }
    return (
      <div
        className="zen-tile empty"
        onClick={() => onClick(tile.row, tile.col)}
        onContextMenu={handleContextMenu}
        title="Empty tile - click to place something"
      >
        <span className="tile-emoji">.</span>
      </div>
    );
  }

  // Raked sand
  if (tile.kind === 'sand' && tile.rake_pattern && tile.rake_pattern !== 'none') {
    return (
      <div
        className="zen-tile raked"
        onClick={() => onClick(tile.row, tile.col)}
        onContextMenu={handleContextMenu}
        title={`Raked ${tile.rake_pattern} pattern - right-click to remove`}
      >
        <span className="tile-emoji">{RAKE_EMOJI[tile.rake_pattern] || '~'}</span>
        <div className="tile-label">{tile.rake_pattern}</div>
      </div>
    );
  }

  // Succulent tile
  if (tile.kind === 'succulent' && tile.succulent) {
    const emoji = STAGE_EMOJI[tile.succulent_stage] || '🌱';
    const progress = Math.round((tile.growth_progress || 0) * 100);
    const isBlooming = tile.succulent_stage === 'blooming';

    return (
      <div
        className={`zen-tile succulent ${isBlooming ? 'blooming' : ''} ${tile.is_rare ? 'rare' : ''}`}
        onClick={() => onClick(tile.row, tile.col)}
        onContextMenu={handleContextMenu}
        title={`${tile.succulent} (${tile.succulent_stage}) - ${progress}% grown`}
      >
        <span className="tile-emoji">{isBlooming ? '✨' : ''}{emoji}</span>
        <div className="tile-label">{tile.succulent}</div>
        <div className="progress-bar" style={{ height: 3, marginTop: 3 }}>
          <div
            className="progress-fill sage"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  // Rock tile
  if (tile.kind === 'rock' && tile.rock) {
    return (
      <div
        className={`zen-tile rock ${tile.is_special ? 'special' : ''}`}
        onClick={() => onClick(tile.row, tile.col)}
        onContextMenu={handleContextMenu}
        title={`${tile.rock} (${tile.rock_size}) - right-click to remove`}
      >
        <span className="tile-emoji">{tile.rock_emoji || '🪨'}</span>
        <div className="tile-label">{tile.rock}</div>
      </div>
    );
  }

  // Fallback
  return (
    <div
      className="zen-tile empty"
      onClick={() => onClick(tile.row, tile.col)}
      onContextMenu={handleContextMenu}
    >
      <span className="tile-emoji">.</span>
    </div>
  );
}
