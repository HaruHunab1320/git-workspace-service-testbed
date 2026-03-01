import { useState, useRef, useEffect, useCallback } from 'react';
import './LofiPlayer.css';

const STATIONS = [
  { name: 'Sleepy Village', url: 'https://stream.zeno.fm/0r0xa792kwzuv', emoji: '🏡' },
  { name: 'Rainy Window', url: 'https://stream.zeno.fm/f3wvbbqmdg8uv', emoji: '🌧️' },
  { name: 'Cozy Fireplace', url: 'https://stream.zeno.fm/4d6bhkaqmg8uv', emoji: '🔥' },
  { name: 'Moonlit Garden', url: 'https://stream.zeno.fm/mfnb0u0cxzzuv', emoji: '🌙' },
];

export default function LofiPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [stationIdx, setStationIdx] = useState(0);
  const [volume, setVolume] = useState(0.4);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef(null);

  const station = STATIONS[stationIdx];

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.play().then(() => {
      setIsPlaying(true);
      setHasError(false);
    }).catch(() => {
      setHasError(true);
      setIsPlaying(false);
    });
  }, [volume]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const nextStation = () => {
    const wasPlaying = isPlaying;
    pause();
    setHasError(false);
    setStationIdx((prev) => (prev + 1) % STATIONS.length);
    if (wasPlaying) {
      setTimeout(() => play(), 100);
    }
  };

  const prevStation = () => {
    const wasPlaying = isPlaying;
    pause();
    setHasError(false);
    setStationIdx((prev) => (prev - 1 + STATIONS.length) % STATIONS.length);
    if (wasPlaying) {
      setTimeout(() => play(), 100);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const wasPlaying = isPlaying;
    audio.src = station.url;
    audio.load();
    if (wasPlaying) {
      play();
    }
  }, [stationIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`lofi-player ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <audio ref={audioRef} crossOrigin="anonymous" preload="none" />

      {isExpanded ? (
        <div className="lofi-panel">
          <div className="lofi-header">
            <span className="lofi-title">lo-fi radio</span>
            <button className="lofi-collapse-btn" onClick={() => setIsExpanded(false)}>
              &minus;
            </button>
          </div>

          <div className="lofi-visualizer">
            <div className="lofi-vinyl-area">
              <div className={`lofi-vinyl ${isPlaying ? 'spinning' : ''}`}>
                <div className="lofi-vinyl-label">{station.emoji}</div>
              </div>
            </div>
            {isPlaying && (
              <div className="lofi-bars">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="lofi-bar"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="lofi-station-info">
            <span className="lofi-station-name">{station.emoji} {station.name}</span>
            {hasError && <span className="lofi-error">stream unavailable</span>}
          </div>

          <div className="lofi-controls">
            <button className="lofi-ctrl-btn" onClick={prevStation} title="Previous station">
              ⏮
            </button>
            <button
              className="lofi-ctrl-btn lofi-play-btn"
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="lofi-ctrl-btn" onClick={nextStation} title="Next station">
              ⏭
            </button>
          </div>

          <div className="lofi-volume">
            <span className="lofi-volume-icon">{volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="lofi-volume-slider"
            />
          </div>

          <div className="lofi-station-list">
            {STATIONS.map((s, i) => (
              <button
                key={i}
                className={`lofi-station-btn ${i === stationIdx ? 'active' : ''}`}
                onClick={() => {
                  const wasPlaying = isPlaying;
                  pause();
                  setHasError(false);
                  setStationIdx(i);
                  if (wasPlaying) setTimeout(() => play(), 100);
                }}
              >
                {s.emoji} {s.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          className={`lofi-fab ${isPlaying ? 'playing' : ''}`}
          onClick={() => setIsExpanded(true)}
          title="Lo-fi Radio"
        >
          <span className="lofi-fab-icon">🎵</span>
          {isPlaying && <span className="lofi-fab-pulse" />}
        </button>
      )}
    </div>
  );
}
