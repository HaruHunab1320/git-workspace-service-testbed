import { useState, useRef, useEffect, useCallback } from 'react';
import './RadioPlayer.css';

const STATIONS = [
  { name: 'Sleepy Village', url: 'https://stream.zeno.fm/0r0xa792kwzuv', emoji: '🏡', color: '#7a9e7e' },
  { name: 'Rainy Window', url: 'https://stream.zeno.fm/f3wvbbqmdg8uv', emoji: '🌧️', color: '#6b8fa3' },
  { name: 'Cozy Fireplace', url: 'https://stream.zeno.fm/4d6bhkaqmg8uv', emoji: '🔥', color: '#c8848a' },
  { name: 'Moonlit Garden', url: 'https://stream.zeno.fm/mfnb0u0cxzzuv', emoji: '🌙', color: '#8b7ec8' },
];

export default function RadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [stationIdx, setStationIdx] = useState(0);
  const [volume, setVolume] = useState(0.4);
  const [hasError, setHasError] = useState(false);
  const [dialAngle, setDialAngle] = useState(0);
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
    if (isPlaying) pause();
    else play();
  };

  const nextStation = () => {
    const wasPlaying = isPlaying;
    pause();
    setHasError(false);
    const nextIdx = (stationIdx + 1) % STATIONS.length;
    setStationIdx(nextIdx);
    setDialAngle(nextIdx * (270 / (STATIONS.length - 1)));
    if (wasPlaying) setTimeout(() => play(), 100);
  };

  const prevStation = () => {
    const wasPlaying = isPlaying;
    pause();
    setHasError(false);
    const prevIdx = (stationIdx - 1 + STATIONS.length) % STATIONS.length;
    setStationIdx(prevIdx);
    setDialAngle(prevIdx * (270 / (STATIONS.length - 1)));
    if (wasPlaying) setTimeout(() => play(), 100);
  };

  const selectStation = (idx) => {
    const wasPlaying = isPlaying;
    pause();
    setHasError(false);
    setStationIdx(idx);
    setDialAngle(idx * (270 / (STATIONS.length - 1)));
    if (wasPlaying) setTimeout(() => play(), 100);
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const wasPlaying = isPlaying;
    audio.src = station.url;
    audio.load();
    if (wasPlaying) play();
  }, [stationIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="radio-ui">
      <audio ref={audioRef} crossOrigin="anonymous" preload="none" />

      {/* Wooden cabinet body */}
      <div className="radio-cabinet">
        {/* Top speaker grille */}
        <div className="radio-speaker-grille">
          <div className="radio-grille-pattern">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="radio-grille-slot" />
            ))}
          </div>
        </div>

        {/* Frequency display */}
        <div className="radio-display">
          <div className="radio-display-glass">
            <div className="radio-freq-band">
              {STATIONS.map((s, i) => (
                <span
                  key={i}
                  className={`radio-freq-mark ${i === stationIdx ? 'active' : ''}`}
                >
                  {s.emoji}
                </span>
              ))}
            </div>
            <div
              className="radio-needle"
              style={{ left: `${12 + stationIdx * (76 / (STATIONS.length - 1))}%` }}
            />
            <div className="radio-station-label">
              {station.name}
            </div>
            {isPlaying && (
              <div className="radio-on-air">
                ON AIR
              </div>
            )}
            {hasError && (
              <div className="radio-signal-lost">
                NO SIGNAL
              </div>
            )}
          </div>
        </div>

        {/* Vinyl window */}
        <div className="radio-vinyl-window">
          <div className={`radio-vinyl ${isPlaying ? 'spinning' : ''}`}>
            <div className="radio-vinyl-groove radio-vinyl-groove-1" />
            <div className="radio-vinyl-groove radio-vinyl-groove-2" />
            <div className="radio-vinyl-groove radio-vinyl-groove-3" />
            <div className="radio-vinyl-center">
              <span className="radio-vinyl-emoji">{station.emoji}</span>
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div className="radio-controls">
          {/* Tuning dial */}
          <div className="radio-dial-group">
            <span className="radio-dial-label">TUNE</span>
            <div className="radio-dial-wrapper">
              <button
                className="radio-dial-btn"
                onClick={prevStation}
                aria-label="Previous station"
              >
                ◀
              </button>
              <div className="radio-dial">
                <div
                  className="radio-dial-knob"
                  style={{ transform: `rotate(${dialAngle}deg)` }}
                >
                  <div className="radio-dial-indicator" />
                </div>
              </div>
              <button
                className="radio-dial-btn"
                onClick={nextStation}
                aria-label="Next station"
              >
                ▶
              </button>
            </div>
          </div>

          {/* Play button */}
          <button
            className={`radio-power-btn ${isPlaying ? 'active' : ''}`}
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <div className="radio-power-light" />
            <span className="radio-power-label">
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </span>
          </button>

          {/* Volume knob */}
          <div className="radio-dial-group">
            <span className="radio-dial-label">VOL</span>
            <div className="radio-volume-knob-wrapper">
              <div className="radio-volume-knob">
                <div
                  className="radio-volume-knob-inner"
                  style={{ transform: `rotate(${volume * 270 - 135}deg)` }}
                >
                  <div className="radio-dial-indicator" />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="radio-volume-input"
                aria-label="Volume"
              />
            </div>
          </div>
        </div>

        {/* Station presets */}
        <div className="radio-presets">
          {STATIONS.map((s, i) => (
            <button
              key={i}
              className={`radio-preset-btn ${i === stationIdx ? 'active' : ''}`}
              onClick={() => selectStation(i)}
              style={{ '--station-color': s.color }}
            >
              <span className="radio-preset-num">{i + 1}</span>
              <span className="radio-preset-name">{s.name}</span>
            </button>
          ))}
        </div>

        {/* Decorative feet */}
        <div className="radio-feet">
          <div className="radio-foot" />
          <div className="radio-foot" />
        </div>
      </div>

      {/* Ambient glow when playing */}
      {isPlaying && (
        <div
          className="radio-ambient-glow"
          style={{ '--glow-color': station.color }}
        />
      )}
    </div>
  );
}
