import { useState, useEffect, useRef, useCallback } from 'react';
import './FocusTimer.css';

const PRESETS = [
  { label: '15m', minutes: 15, emoji: '🌸' },
  { label: '25m', minutes: 25, emoji: '🍵' },
  { label: '45m', minutes: 45, emoji: '📖' },
];

const BREAK_MINUTES = 5;

const PASTEL_RINGS = {
  focus: { track: '#f0e6ef', fill: '#c8a2c8', glow: 'rgba(200, 162, 200, 0.35)' },
  break: { track: '#e6f0e8', fill: '#a8c5ab', glow: 'rgba(168, 197, 171, 0.35)' },
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function playChime(volume = 0.15) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;

    // Three gentle bell tones ascending
    const notes = [523.3, 659.3, 784.0, 1046.5];
    notes.forEach((freq, i) => {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume * (0.5 - i * 0.08), t + i * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.22 + 0.8);
      gain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.22);
      osc.connect(gain);
      osc.start(t + i * 0.22);
      osc.stop(t + i * 0.22 + 0.8);

      // Soft harmonic overtone
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(volume * 0.06, t + i * 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + i * 0.22 + 0.5);
      gain2.connect(ctx.destination);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, t + i * 0.22);
      osc2.connect(gain2);
      osc2.start(t + i * 0.22);
      osc2.stop(t + i * 0.22 + 0.5);
    });

    // Clean up context after sounds finish
    setTimeout(() => ctx.close(), 3000);
  } catch {
    // Web Audio not available
  }
}

function playTick(volume = 0.04) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + 0.06);

    setTimeout(() => ctx.close(), 200);
  } catch {
    // Web Audio not available
  }
}

export default function FocusTimer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [presetIdx, setPresetIdx] = useState(1); // default 25min
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(PRESETS[1].minutes * 60);
  const [totalSeconds, setTotalSeconds] = useState(PRESETS[1].minutes * 60);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef(null);

  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const colors = isBreak ? PASTEL_RINGS.break : PASTEL_RINGS.focus;

  // SVG ring dimensions
  const size = 160;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const startBreak = useCallback(() => {
    stopTimer();
    setIsBreak(true);
    const breakSecs = BREAK_MINUTES * 60;
    setSecondsLeft(breakSecs);
    setTotalSeconds(breakSecs);
    setIsRunning(true);
  }, [stopTimer]);

  const selectPreset = useCallback((idx) => {
    stopTimer();
    setPresetIdx(idx);
    setIsBreak(false);
    const secs = PRESETS[idx].minutes * 60;
    setSecondsLeft(secs);
    setTotalSeconds(secs);
  }, [stopTimer]);

  const resetTimer = useCallback(() => {
    stopTimer();
    setIsBreak(false);
    const secs = PRESETS[presetIdx].minutes * 60;
    setSecondsLeft(secs);
    setTotalSeconds(secs);
  }, [stopTimer, presetIdx]);

  // Tick logic
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Timer complete
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsRunning(false);
          playChime();

          if (!isBreak) {
            setSessions((s) => s + 1);
            // Auto-start break after a beat
            setTimeout(() => startBreak(), 1200);
          }
          return 0;
        }
        // Soft tick at 5-second marks under 30s
        if (prev <= 30 && prev % 5 === 0) {
          playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isBreak, startBreak]);

  const toggleRun = () => {
    if (secondsLeft === 0) {
      resetTimer();
      return;
    }
    setIsRunning((r) => !r);
  };

  return (
    <div className={`timer-widget ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {isExpanded ? (
        <div className="timer-panel">
          <div className="timer-header">
            <span className="timer-title">
              {isBreak ? 'break time' : 'focus timer'}
            </span>
            <button
              className="timer-collapse-btn"
              onClick={() => setIsExpanded(false)}
            >
              &minus;
            </button>
          </div>

          {/* Progress Ring */}
          <div className="timer-ring-area">
            <svg
              className="timer-ring-svg"
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
            >
              {/* Glow filter */}
              <defs>
                <filter id="timer-glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Track ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={colors.track}
                strokeWidth={stroke}
              />
              {/* Progress ring */}
              <circle
                className="timer-ring-progress"
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={colors.fill}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                filter={progress > 0 ? 'url(#timer-glow)' : undefined}
              />
            </svg>

            <div className="timer-ring-center">
              <span className="timer-time">{formatTime(secondsLeft)}</span>
              <span className="timer-label">
                {isBreak ? 'relax' : PRESETS[presetIdx].emoji}
              </span>
            </div>
          </div>

          {/* Presets (only when not in break) */}
          {!isBreak && !isRunning && secondsLeft === totalSeconds && (
            <div className="timer-presets">
              {PRESETS.map((p, i) => (
                <button
                  key={p.label}
                  className={`timer-preset-btn ${i === presetIdx ? 'active' : ''}`}
                  onClick={() => selectPreset(i)}
                >
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="timer-controls">
            <button
              className="timer-ctrl-btn timer-reset-btn"
              onClick={resetTimer}
              title="Reset"
            >
              ↺
            </button>
            <button
              className={`timer-ctrl-btn timer-play-btn ${isRunning ? 'running' : ''}`}
              onClick={toggleRun}
              title={isRunning ? 'Pause' : 'Start'}
            >
              {secondsLeft === 0 ? '↺' : isRunning ? '⏸' : '▶'}
            </button>
            {!isBreak && isRunning && (
              <button
                className="timer-ctrl-btn timer-skip-btn"
                onClick={() => {
                  stopTimer();
                  setSessions((s) => s + 1);
                  startBreak();
                }}
                title="Skip to break"
              >
                ⏭
              </button>
            )}
            {isBreak && (
              <button
                className="timer-ctrl-btn timer-skip-btn"
                onClick={resetTimer}
                title="Skip break"
              >
                ⏭
              </button>
            )}
          </div>

          {/* Session counter */}
          <div className="timer-sessions">
            {sessions > 0 && (
              <span className="timer-session-count">
                {Array.from({ length: Math.min(sessions, 8) }, (_, i) => (
                  <span key={i} className="timer-session-dot" />
                ))}
                {sessions > 8 && <span className="timer-session-extra">+{sessions - 8}</span>}
              </span>
            )}
            <span className="timer-session-label">
              {sessions === 0
                ? 'no sessions yet'
                : `${sessions} session${sessions !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>
      ) : (
        <button
          className={`timer-fab ${isRunning ? 'active' : ''}`}
          onClick={() => setIsExpanded(true)}
          title="Focus Timer"
        >
          <span className="timer-fab-icon">⏳</span>
          {isRunning && (
            <>
              <svg className="timer-fab-ring" width="56" height="56" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r="25"
                  fill="none"
                  stroke={colors.fill}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 25}
                  strokeDashoffset={2 * Math.PI * 25 * (1 - progress)}
                  transform="rotate(-90 28 28)"
                  opacity="0.8"
                />
              </svg>
              <span className="timer-fab-time">{formatTime(secondsLeft)}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
