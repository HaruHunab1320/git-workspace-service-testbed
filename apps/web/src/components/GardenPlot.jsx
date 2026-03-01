const STAGE_EMOJI = {
  seed: '🌱',
  sprout: '🌿',
  growing: '🌿',
  flowering: '🌼',
  harvestable: '🌾',
  withered: '🥀',
};

export default function GardenPlot({ plot, onClick }) {
  if (plot.is_empty) {
    return (
      <div className="garden-plot empty" onClick={onClick} title="Empty plot - click to plant">
        <span className="plot-emoji">⬛</span>
      </div>
    );
  }

  const emoji = STAGE_EMOJI[plot.stage] || '🌱';
  const progress = Math.round((plot.growth_progress || 0) * 100);

  return (
    <div
      className={`garden-plot planted ${plot.is_harvestable ? 'harvestable' : ''}`}
      title={`${plot.crop} (${plot.stage}) - ${progress}% grown`}
    >
      <span className="plot-emoji">{plot.is_harvestable ? '✨' : ''}{emoji}</span>
      <div className="plot-name">{plot.crop}</div>
      <div className="progress-bar" style={{ height: 4, marginTop: 4 }}>
        <div
          className="progress-fill sage"
          style={{ width: `${progress}%` }}
        />
      </div>
      {plot.watered_today && <span className="plot-watered">💧</span>}
    </div>
  );
}
