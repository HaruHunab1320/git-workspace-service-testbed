import { useState, useEffect, useRef } from 'react';
import './AmbientSounds.css';

export default function AmbientSounds({ sounds, weather, season }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const prevSceneRef = useRef('');

  // Update ambient soundscape when weather or season changes
  useEffect(() => {
    const key = `${season}-${weather?.current_weather || ''}`;
    if (key !== prevSceneRef.current) {
      prevSceneRef.current = key;
      sounds.setAmbientScene(weather, season);
    }
  }, [weather, season, sounds]);

  // Stop ambient when disabled
  useEffect(() => {
    if (!sounds.enabled) {
      sounds.stopAmbient();
    } else {
      sounds.setAmbientScene(weather, season);
    }
  }, [sounds.enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleEnabled = () => {
    sounds.setEnabled((prev) => !prev);
  };

  const weatherLabel = () => {
    const w = (weather?.current_weather || '').toLowerCase();
    if (w.includes('rain')) return 'rain';
    if (w.includes('storm')) return 'storm';
    if (w.includes('snow') || w.includes('blizzard')) return 'snow';
    if (w.includes('wind') || w.includes('breezy')) return 'wind';
    if (w.includes('fog')) return 'fog';
    return 'clear';
  };

  const sceneEmoji = () => {
    const w = weatherLabel();
    const emojis = {
      rain: '🌧️',
      storm: '⛈️',
      snow: '❄️',
      wind: '🍃',
      fog: '🌫️',
      clear: '☀️',
    };
    return emojis[w] || '☀️';
  };

  const seasonEmoji = () => {
    const emojis = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };
    return emojis[season] || '🌿';
  };

  return (
    <div className={`ambient-sounds ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {isExpanded ? (
        <div className="ambient-panel">
          <div className="ambient-header">
            <span className="ambient-title">ambient sounds</span>
            <button
              className="ambient-collapse-btn"
              onClick={() => setIsExpanded(false)}
            >
              &minus;
            </button>
          </div>

          <div className="ambient-scene">
            <span className="ambient-scene-label">
              {seasonEmoji()} {season} {sceneEmoji()} {weatherLabel()}
            </span>
          </div>

          <div className="ambient-toggle-row">
            <span className="ambient-label">Sounds</span>
            <button
              className={`ambient-toggle ${sounds.enabled ? 'on' : 'off'}`}
              onClick={toggleEnabled}
            >
              <span className="ambient-toggle-knob" />
            </button>
          </div>

          <div className="ambient-layers">
            <div className="ambient-layer-row">
              <button
                className={`ambient-layer-toggle ${sounds.rainOn ? 'on' : 'off'}`}
                onClick={() => sounds.setRainOn((prev) => !prev)}
                disabled={!sounds.enabled}
                title="Toggle rain"
              >
                <span className="ambient-layer-icon">🌧️</span>
              </button>
              <span className="ambient-layer-name">Rain</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={sounds.rainVolume}
                onChange={(e) =>
                  sounds.setRainVolume(parseFloat(e.target.value))
                }
                className="ambient-slider"
                disabled={!sounds.enabled || !sounds.rainOn}
              />
            </div>
            <div className="ambient-layer-row">
              <button
                className={`ambient-layer-toggle ${sounds.cafeOn ? 'on' : 'off'}`}
                onClick={() => sounds.setCafeOn((prev) => !prev)}
                disabled={!sounds.enabled}
                title="Toggle cafe sounds"
              >
                <span className="ambient-layer-icon">☕</span>
              </button>
              <span className="ambient-layer-name">Cafe</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={sounds.cafeVolume}
                onChange={(e) =>
                  sounds.setCafeVolume(parseFloat(e.target.value))
                }
                className="ambient-slider"
                disabled={!sounds.enabled || !sounds.cafeOn}
              />
            </div>
          </div>

          <div className="ambient-divider" />

          <div className="ambient-slider-group">
            <div className="ambient-slider-row">
              <span className="ambient-slider-label">Ambience</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={sounds.ambientVolume}
                onChange={(e) =>
                  sounds.setAmbientVolume(parseFloat(e.target.value))
                }
                className="ambient-slider"
                disabled={!sounds.enabled}
              />
            </div>
            <div className="ambient-slider-row">
              <span className="ambient-slider-label">UI Tones</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={sounds.uiVolume}
                onChange={(e) => sounds.setUiVolume(parseFloat(e.target.value))}
                className="ambient-slider"
                disabled={!sounds.enabled}
              />
            </div>
          </div>

          <div className="ambient-hint">Sounds adapt to weather & season</div>
        </div>
      ) : (
        <button
          className={`ambient-fab ${sounds.enabled ? 'active' : ''}`}
          onClick={() => setIsExpanded(true)}
          title="Ambient Sounds"
        >
          <span className="ambient-fab-icon">
            {sounds.enabled ? '🔔' : '🔕'}
          </span>
          {sounds.enabled && <span className="ambient-fab-wave" />}
        </button>
      )}
    </div>
  );
}
