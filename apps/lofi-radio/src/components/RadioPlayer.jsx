import { useAudioPlayback } from '../state/AudioPlaybackProvider';
import { STATIONS } from '../state/constants';
import './RadioPlayer.css';

export default function RadioPlayer() {
  const {
    state,
    radioToggle,
    radioNextStation,
    radioPrevStation,
    radioSetStation,
    radioSetVolume,
  } = useAudioPlayback();

  const { isPlaying, stationIndex, volume, hasError } = state.radio;
  const station = STATIONS[stationIndex];

  return (
    <div className="radio">
      <div className="radio-header">
        <h2 className="radio-title">lo-fi radio</h2>
      </div>

      <div className="radio-visualizer">
        <div className={`radio-vinyl ${isPlaying ? 'spinning' : ''}`}>
          <div className="radio-vinyl-label">{station.emoji}</div>
        </div>
        {isPlaying && (
          <div className="radio-bars">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="radio-bar"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="radio-station-info">
        <span className="radio-station-name">
          {station.emoji} {station.name}
        </span>
        {hasError && <span className="radio-error">stream unavailable</span>}
      </div>

      <div className="radio-controls">
        <button
          className="radio-ctrl-btn"
          onClick={radioPrevStation}
          title="Previous station"
        >
          &#x23EE;
        </button>
        <button
          className="radio-ctrl-btn radio-play-btn"
          onClick={radioToggle}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '\u23F8' : '\u25B6'}
        </button>
        <button
          className="radio-ctrl-btn"
          onClick={radioNextStation}
          title="Next station"
        >
          &#x23ED;
        </button>
      </div>

      <div className="radio-volume">
        <span className="radio-volume-icon">
          {volume === 0 ? '\u{1F507}' : volume < 0.5 ? '\u{1F509}' : '\u{1F50A}'}
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => radioSetVolume(parseFloat(e.target.value))}
          className="radio-volume-slider"
        />
      </div>

      <div className="radio-station-list">
        {STATIONS.map((s, i) => (
          <button
            key={i}
            className={`radio-station-btn ${i === stationIndex ? 'active' : ''}`}
            onClick={() => radioSetStation(i)}
          >
            {s.emoji} {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
