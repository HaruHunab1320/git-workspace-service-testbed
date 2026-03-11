import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import './ConstellationGazer.css';

function StarField({ constellations, selected, onSelect, _season }) {
  const containerRef = useRef(null);

  const renderLine = (c, lineIdx, pair) => {
    const stars = c.stars || [];
    if (!stars[pair[0]] || !stars[pair[1]]) return null;
    const a = stars[pair[0]];
    const b = stars[pair[1]];
    const dx = (b.x - a.x) * 100;
    const dy = (b.y - a.y) * 100;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return (
      <div
        key={`${c.name}-line-${lineIdx}`}
        className="sky-line"
        style={{
          left: `${a.x * 100}%`,
          top: `${a.y * 100}%`,
          width: `${length}%`,
          transform: `rotate(${angle}deg)`,
        }}
      />
    );
  };

  return (
    <div className="constellation-sky" ref={containerRef}>
      <div className="constellation-sky-shimmer" />
      {constellations.map((c) => {
        const _isSelected = selected?.name === c.name;
        if (c.discovered && c.lines) {
          return c.lines.map((pair, i) => renderLine(c, i, pair));
        }
        return null;
      })}
      {constellations.map((c) => {
        const stars = c.discovered ? c.stars || [] : c.hint_stars || [];
        return stars.map((star, i) => {
          const size = 2 + star.brightness * 4;
          return (
            <div
              key={`${c.name}-star-${i}`}
              className={`sky-star ${c.discovered ? 'discovered' : 'hint'}`}
              style={{
                left: `${star.x * 100}%`,
                top: `${star.y * 100}%`,
                width: size,
                height: size,
                animationDelay: `${(star.x * 1000 + star.y * 500) % 3}s`,
              }}
              onClick={() => onSelect(c)}
              title={c.discovered ? c.name : 'Undiscovered...'}
            />
          );
        });
      })}
    </div>
  );
}

function DifficultyDots({ level }) {
  return (
    <span className="constellation-difficulty">
      {[1, 2, 3].map((d) => (
        <span
          key={d}
          className={`constellation-difficulty-dot ${d <= level ? 'filled' : ''}`}
        />
      ))}
    </span>
  );
}

export default function ConstellationGazer({ showToast, _season }) {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const result = await api.getConstellations();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch constellations:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDiscover = async (name) => {
    try {
      const result = await api.discoverConstellation(name);
      showToast(result.message);
      await fetchData();
      setSelected((prev) =>
        prev?.name === name ? result.constellation : prev
      );
    } catch (err) {
      showToast(err.message || 'Could not discover constellation');
    }
  };

  if (loading || !data) {
    return <div className="constellation-panel">Loading night sky...</div>;
  }

  const { constellations, catalog } = data;

  return (
    <div className="constellation-panel">
      <div className="constellation-header">
        <h2>Constellation Gazer</h2>
        <span className="constellation-catalog">
          {catalog.discovered}/{catalog.total} discovered ({catalog.completion}
          %)
        </span>
      </div>

      <StarField
        constellations={constellations}
        selected={selected}
        onSelect={setSelected}
        season={data.season}
      />

      {selected && (
        <div className="constellation-detail">
          <h3>{selected.name}</h3>
          <div className="constellation-card-meta">
            <DifficultyDots level={selected.difficulty} />
            <span>{selected.star_count} stars</span>
            {selected.discovered && (
              <span className="constellation-discovered-badge">Discovered</span>
            )}
          </div>
          <div className="constellation-seasons">
            {selected.seasons.map((s) => (
              <span
                key={s}
                className={`constellation-season-tag ${s === data.season ? 'current' : ''}`}
              >
                {s}
              </span>
            ))}
          </div>
          {selected.discovered && selected.lore && (
            <p className="constellation-lore">{selected.lore}</p>
          )}
          {!selected.discovered && (
            <button
              className="constellation-discover-btn"
              onClick={() => handleDiscover(selected.name)}
            >
              Discover this constellation
            </button>
          )}
          {selected.discovered && selected.player_note !== undefined && (
            <div
              style={{
                marginTop: 8,
                fontSize: '0.85rem',
                color: 'var(--brown-light)',
              }}
            >
              {selected.player_note
                ? `Your note: "${selected.player_note}"`
                : 'No personal note yet.'}
            </div>
          )}
        </div>
      )}

      <div className="constellation-list">
        {constellations.map((c) => (
          <div
            key={c.name}
            className={`constellation-card ${selected?.name === c.name ? 'active' : ''} ${!c.discovered ? 'undiscovered' : ''}`}
            onClick={() => setSelected(c)}
          >
            <div className="constellation-card-name">
              {c.discovered ? c.name : '???'}
            </div>
            <div className="constellation-card-meta">
              <DifficultyDots level={c.difficulty} />
              <span>{c.star_count} stars</span>
              {c.discovered && (
                <span className="constellation-discovered-badge">Found</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
