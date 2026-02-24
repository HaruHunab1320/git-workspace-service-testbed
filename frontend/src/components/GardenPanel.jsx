import { useState } from 'react';
import GardenPlot from './GardenPlot';
import PlantModal from './PlantModal';
import './GardenPanel.css';

export default function GardenPanel({ garden, season, onRefresh, showToast }) {
  const [plantTarget, setPlantTarget] = useState(null);

  if (!garden) {
    return <div className="card"><p>No garden data.</p></div>;
  }

  const handlePlotClick = (row, col) => {
    const plot = garden.plots[row][col];
    if (plot.is_empty) {
      setPlantTarget({ row, col });
    }
  };

  return (
    <div className="garden-panel">
      <div className="card">
        <h3 className="card-title">🌻 Your Garden</h3>
        <div className="garden-stats">
          <span>🌾 Harvests: {garden.total_harvests}</span>
          <span>📅 Day {garden.day}</span>
          <span>🌿 {garden.season}</span>
        </div>
        <div
          className="garden-grid"
          style={{
            gridTemplateColumns: `repeat(${garden.cols}, 1fr)`,
            gridTemplateRows: `repeat(${garden.rows}, 1fr)`,
          }}
        >
          {garden.plots.map((row, r) =>
            row.map((plot, c) => (
              <GardenPlot
                key={`${r}-${c}`}
                plot={plot}
                onClick={() => handlePlotClick(r, c)}
              />
            ))
          )}
        </div>
        <div className="garden-legend">
          <span>🌱 Seed</span>
          <span>🌿 Growing</span>
          <span>🌼 Flowering</span>
          <span>🌾 Harvestable</span>
          <span>🥀 Withered</span>
        </div>
      </div>

      {plantTarget && (
        <PlantModal
          row={plantTarget.row}
          col={plantTarget.col}
          season={season}
          onClose={() => setPlantTarget(null)}
          onRefresh={onRefresh}
          showToast={showToast}
        />
      )}
    </div>
  );
}
