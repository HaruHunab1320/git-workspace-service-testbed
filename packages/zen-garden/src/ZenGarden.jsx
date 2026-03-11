import { useState } from 'react';
import useRakingCanvas from './hooks/useRakingCanvas';
import ToolPalette from './components/ToolPalette';
import './ZenGarden.css';

export default function ZenGarden({ showToast }) {
  const [tool, setTool] = useState('rake');
  const [rakeWidth, setRakeWidth] = useState(5);
  const [stoneColor, setStoneColor] = useState(0);

  const { canvasRef, undo, reset, save } = useRakingCanvas({
    tool,
    rakeWidth,
    stoneColor,
  });

  const handleUndo = () => {
    const ok = undo();
    if (!ok && showToast) showToast('Nothing to undo');
  };

  const handleReset = () => {
    reset();
    if (showToast) showToast('Garden cleared');
  };

  const handleSave = () => {
    save();
    if (showToast) showToast('Garden saved as image');
  };

  return (
    <div className="zen-garden">
      <div className="card zen-garden-header">
        <h2 className="card-title">🪨 Zen Garden</h2>
        <p className="zen-garden-subtitle">
          Rake the sand, place the stones, find your peace.
        </p>
      </div>

      <div className="card zen-garden-workspace">
        <ToolPalette
          tool={tool}
          onToolChange={setTool}
          rakeWidth={rakeWidth}
          onRakeWidthChange={setRakeWidth}
          stoneColor={stoneColor}
          onStoneColorChange={setStoneColor}
        />

        <div className="zen-canvas-wrap" data-tool={tool}>
          <canvas ref={canvasRef} />
        </div>

        <div className="zen-actions">
          <button className="btn btn-secondary btn-sm" onClick={handleUndo}>
            ↩ Undo
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleReset}>
            ✦ Reset
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleSave}>
            ⬇ Save
          </button>
        </div>
      </div>

      <div className="card zen-garden-tips">
        <h3 className="card-title">How to use</h3>
        <div className="zen-tips-grid">
          <span>
            🪮 <strong>Rake</strong> — drag to draw furrows
          </span>
          <span>
            🌊 <strong>Smooth</strong> — drag to erase marks
          </span>
          <span>
            🪨 <strong>Stone</strong> — click to place a stone
          </span>
          <span>
            🔘 <strong>Circles</strong> — click for ring patterns
          </span>
        </div>
      </div>
    </div>
  );
}
