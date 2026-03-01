import { useState, useEffect, useRef } from 'react';
import './TeaBrewingStation.css';

const TEAS = [
  { id: 'green', name: 'Green Tea', emoji: '🍵', steepTime: 12, color: '#a8c5a0', darkColor: '#7a9e72', description: 'Light and grassy with a gentle sweetness' },
  { id: 'black', name: 'Black Tea', emoji: '🫖', steepTime: 16, color: '#8b4513', darkColor: '#5c2d0e', description: 'Bold and malty, a morning classic' },
  { id: 'chamomile', name: 'Chamomile', emoji: '🌼', steepTime: 20, color: '#e8d478', darkColor: '#c4a83a', description: 'Floral and calming, perfect for evening' },
  { id: 'earl_grey', name: 'Earl Grey', emoji: '🫖', steepTime: 14, color: '#6b5b95', darkColor: '#4a3d6b', description: 'Fragrant bergamot meets smooth black tea' },
  { id: 'matcha', name: 'Matcha', emoji: '🍃', steepTime: 10, color: '#5a8a3c', darkColor: '#3d6128', description: 'Vibrant and earthy with umami depth' },
  { id: 'oolong', name: 'Oolong', emoji: '🍂', steepTime: 18, color: '#c4823a', darkColor: '#96622a', description: 'Complex and toasty with a sweet finish' },
];

export default function TeaBrewingStation({ showToast }) {
  const [selectedTea, setSelectedTea] = useState(null);
  const [brewing, setBrewing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startBrewing = (tea) => {
    if (brewing) return;
    setSelectedTea(tea);
    setBrewing(true);
    setDone(false);
    setProgress(0);

    const step = 100 / (tea.steepTime * 10);
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setBrewing(false);
          setDone(true);
          if (showToast) showToast(`${tea.emoji} Your ${tea.name} is ready!`);
          return 100;
        }
        return next;
      });
    }, 100);
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setBrewing(false);
    setDone(false);
    setProgress(0);
    setSelectedTea(null);
  };

  const teaColor = selectedTea
    ? `color-mix(in srgb, transparent ${100 - progress}%, ${selectedTea.color})`
    : 'transparent';

  const steamOpacity = brewing ? 0.3 + (progress / 100) * 0.5 : done ? 0.6 : 0;

  return (
    <div className="tea-station">
      <div className="card tea-header-card">
        <h2 className="card-title">🍵 Tea Brewing Station</h2>
        <p className="tea-subtitle">Select a tea and watch it steep</p>
      </div>

      <div className="tea-selection">
        {TEAS.map((tea) => (
          <button
            key={tea.id}
            className={`tea-option ${selectedTea?.id === tea.id ? 'selected' : ''}`}
            onClick={() => startBrewing(tea)}
            disabled={brewing}
          >
            <span className="tea-option-emoji">{tea.emoji}</span>
            <span className="tea-option-name">{tea.name}</span>
            <span className="tea-option-time">{tea.steepTime}s</span>
          </button>
        ))}
      </div>

      <div className="tea-brewing-area card">
        <div className="teacup-scene">
          {(brewing || done) && (
            <div className="steam-container" style={{ opacity: steamOpacity }}>
              <div className="steam steam-1" />
              <div className="steam steam-2" />
              <div className="steam steam-3" />
              <div className="steam steam-4" />
              <div className="steam steam-5" />
            </div>
          )}

          <div className="teacup">
            <div className="teacup-body">
              <div
                className="tea-liquid"
                style={{ background: teaColor }}
              />
              {brewing && (
                <div className="tea-bag">
                  <div className="tea-bag-string" />
                  <div className="tea-bag-body" />
                  <div className="tea-bag-tag" />
                </div>
              )}
            </div>
            <div className="teacup-handle" />
            <div className="teacup-saucer" />
          </div>
        </div>

        {selectedTea && (
          <div className="brew-info">
            <div className="brew-tea-name">
              {selectedTea.emoji} {selectedTea.name}
            </div>
            <p className="brew-description">{selectedTea.description}</p>

            <div className="steep-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progress}%`,
                    background: selectedTea.color,
                    transition: 'width 0.1s linear',
                  }}
                />
              </div>
              <div className="steep-label">
                {brewing
                  ? `Steeping... ${Math.round(progress)}%`
                  : done
                    ? 'Ready to enjoy!'
                    : 'Waiting...'}
              </div>
            </div>

            {done && (
              <div className="done-actions">
                <button className="btn btn-primary" onClick={reset}>
                  Brew Another
                </button>
              </div>
            )}
          </div>
        )}

        {!selectedTea && (
          <div className="brew-placeholder">
            Choose a tea above to begin brewing
          </div>
        )}
      </div>

      {selectedTea && done && (
        <div className="card tea-notes-card">
          <h3 className="card-title">Tasting Notes</h3>
          <div className="tasting-notes">
            <div className="note-item">
              <span className="note-label">Type</span>
              <span className="note-value">{selectedTea.name}</span>
            </div>
            <div className="note-item">
              <span className="note-label">Steep Time</span>
              <span className="note-value">{selectedTea.steepTime}s</span>
            </div>
            <div className="note-item">
              <span className="note-label">Character</span>
              <span className="note-value">{selectedTea.description}</span>
            </div>
            <div className="note-swatch" style={{ background: selectedTea.color }} />
          </div>
        </div>
      )}
    </div>
  );
}
