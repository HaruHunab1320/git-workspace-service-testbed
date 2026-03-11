import './ToolPalette.css';

const TOOLS = [
  { id: 'rake', emoji: '🪮', label: 'Rake' },
  { id: 'smooth', emoji: '🌊', label: 'Smooth' },
  { id: 'stone', emoji: '🪨', label: 'Stone' },
  { id: 'circle', emoji: '🔘', label: 'Circles' },
];

const RAKE_WIDTHS = [
  { value: 3, label: '3' },
  { value: 5, label: '5' },
  { value: 7, label: '7' },
];

const STONE_COLORS = [
  { value: 0, label: 'Gray', color: '#6b6b6b' },
  { value: 1, label: 'Brown', color: '#8a8078' },
  { value: 2, label: 'Teal', color: '#556b70' },
];

export default function ToolPalette({
  tool,
  onToolChange,
  rakeWidth,
  onRakeWidthChange,
  stoneColor,
  onStoneColorChange,
}) {
  return (
    <div className="zen-palette">
      <div className="zen-palette-tools">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            className={`zen-tool-btn ${tool === t.id ? 'active' : ''}`}
            onClick={() => onToolChange(t.id)}
            title={t.label}
          >
            <span className="zen-tool-emoji">{t.emoji}</span>
            <span className="zen-tool-label">{t.label}</span>
          </button>
        ))}
      </div>

      {tool === 'rake' && (
        <div className="zen-palette-sub">
          <span className="zen-sub-label">Tines</span>
          {RAKE_WIDTHS.map((w) => (
            <button
              key={w.value}
              className={`zen-sub-btn ${rakeWidth === w.value ? 'active' : ''}`}
              onClick={() => onRakeWidthChange(w.value)}
            >
              {w.label}
            </button>
          ))}
        </div>
      )}

      {tool === 'stone' && (
        <div className="zen-palette-sub">
          <span className="zen-sub-label">Color</span>
          {STONE_COLORS.map((c) => (
            <button
              key={c.value}
              className={`zen-sub-btn zen-color-btn ${stoneColor === c.value ? 'active' : ''}`}
              onClick={() => onStoneColorChange(c.value)}
              title={c.label}
            >
              <span
                className="zen-color-swatch"
                style={{ background: c.color }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
