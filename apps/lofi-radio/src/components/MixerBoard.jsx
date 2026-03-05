import { useAudioPlayback } from '../state/AudioPlaybackProvider';
import { CHANNELS, PRESETS } from '../state/constants';
import './MixerBoard.css';

export default function MixerBoard() {
  const {
    state,
    mixerToggle,
    mixerSetChannel,
    mixerSetMasterVolume,
    mixerApplyPreset,
    mixerReset,
  } = useAudioPlayback();

  const { isPlaying, channels, masterVolume, activePreset } = state.mixer;
  const activeCount = CHANNELS.filter((ch) => channels[ch.id] > 0).length;

  return (
    <div className="mixer">
      <div className="mixer-header">
        <h2 className="mixer-title">ambient mixer</h2>
        <p className="mixer-subtitle">
          Layer sounds to craft your perfect atmosphere
        </p>
      </div>

      <div className="mixer-presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            className={`mixer-preset-btn ${activePreset === preset.id ? 'active' : ''}`}
            onClick={() => mixerApplyPreset(preset)}
          >
            <span className="mixer-preset-emoji">{preset.emoji}</span>
            <span className="mixer-preset-name">{preset.name}</span>
          </button>
        ))}
      </div>

      <div className="mixer-board">
        <div className="mixer-channels">
          {CHANNELS.map((ch) => {
            const level = channels[ch.id];
            const isActive = level > 0;
            return (
              <div
                key={ch.id}
                className={`mixer-channel ${isActive ? 'active' : ''}`}
              >
                <div className="mixer-channel-header">
                  <span className="mixer-channel-emoji">{ch.emoji}</span>
                  <span className="mixer-channel-name">{ch.name}</span>
                </div>
                <div className="mixer-fader-track">
                  <div
                    className="mixer-fader-fill"
                    style={{
                      height: `${level * 100}%`,
                      background: ch.color,
                      opacity: isPlaying ? 1 : 0.5,
                    }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={level}
                    onChange={(e) =>
                      mixerSetChannel(ch.id, parseFloat(e.target.value))
                    }
                    className="mixer-fader"
                    title={ch.description}
                  />
                </div>
                <span className="mixer-channel-value">
                  {Math.round(level * 100)}%
                </span>
              </div>
            );
          })}
        </div>

        <div className="mixer-visualizer">
          {isPlaying ? (
            <div className="mixer-wave-container">
              {CHANNELS.map((ch) => {
                const level = channels[ch.id];
                if (level === 0) return null;
                return (
                  <div
                    key={ch.id}
                    className="mixer-wave-ring"
                    style={{
                      borderColor: ch.color,
                      opacity: 0.3 + level * 0.5,
                      animationDuration: `${3 + (1 - level) * 4}s`,
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="mixer-idle-icon">&#x1F3A7;</div>
          )}
        </div>
      </div>

      <div className="mixer-controls">
        <div className="mixer-transport">
          <button
            className={`mixer-play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={mixerToggle}
          >
            {isPlaying ? '\u23F9 Stop' : '\u25B6 Play'}
          </button>
          <button className="mixer-reset-btn" onClick={mixerReset}>
            Reset
          </button>
        </div>

        <div className="mixer-master">
          <span className="mixer-master-label">Master</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) =>
              mixerSetMasterVolume(parseFloat(e.target.value))
            }
            className="mixer-master-slider"
          />
          <span className="mixer-master-value">
            {masterVolume === 0
              ? '\u{1F507}'
              : masterVolume < 0.5
                ? '\u{1F509}'
                : '\u{1F50A}'}
          </span>
        </div>

        <div className="mixer-status">
          {activeCount} layer{activeCount !== 1 ? 's' : ''} active
        </div>
      </div>
    </div>
  );
}
