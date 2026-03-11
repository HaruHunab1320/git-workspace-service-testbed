import { useState, useEffect, useRef, useCallback } from 'react';
import { PastelButton, PastelBadge, PastelProgress } from '@cozy-village/ui';

const PRESETS = [
  { label: '5 min', seconds: 300 },
  { label: '15 min', seconds: 900 },
  { label: '25 min', seconds: 1500 },
  { label: '45 min', seconds: 2700 },
];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function CircularProgress({ value, max, size = 120, strokeWidth = 6 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, Math.max(0, value / max));
  const offset = circumference * (1 - pct);
  const center = size / 2;

  return (
    <svg
      className="timer-ring"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      <circle
        className="timer-ring__track"
        cx={center}
        cy={center}
        r={radius}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        className="timer-ring__fill"
        cx={center}
        cy={center}
        r={radius}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
      />
    </svg>
  );
}

export default function FocusTimer({ showToast }) {
  const [totalSeconds, setTotalSeconds] = useState(1500);
  const [remaining, setRemaining] = useState(1500);
  const [running, setRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef(null);

  const stop = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          stop();
          setSessionsCompleted((s) => s + 1);
          showToast?.('Focus session complete! Great work.', 'success');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, stop, showToast]);

  const selectPreset = (seconds) => {
    stop();
    setTotalSeconds(seconds);
    setRemaining(seconds);
  };

  const toggle = () => {
    if (remaining <= 0) {
      setRemaining(totalSeconds);
    }
    setRunning((r) => !r);
  };

  const reset = () => {
    stop();
    setRemaining(totalSeconds);
  };

  const elapsed = totalSeconds - remaining;
  const isComplete = remaining === 0;

  return (
    <div className="focus-timer">
      <div className="focus-timer__display">
        <CircularProgress
          value={elapsed}
          max={totalSeconds}
          size={140}
          strokeWidth={8}
        />
        <div className="focus-timer__time-overlay">
          <span
            className={`timer-time ${running ? 'timer-time--active' : ''} ${isComplete ? 'timer-time--done' : ''}`}
          >
            {formatTime(remaining)}
          </span>
          <span className="timer-state-label">
            {running ? 'Focusing...' : isComplete ? 'Done!' : 'Ready'}
          </span>
        </div>
      </div>

      <PastelProgress
        value={elapsed}
        max={totalSeconds}
        variant="lavender"
        size="sm"
      />

      <div className="timer-controls">
        <PastelButton
          variant={running ? 'blush' : 'mint'}
          size="sm"
          onClick={toggle}
        >
          {running
            ? 'Pause'
            : remaining < totalSeconds && remaining > 0
              ? 'Resume'
              : 'Start'}
        </PastelButton>
        <PastelButton variant="ghost" size="sm" onClick={reset}>
          Reset
        </PastelButton>
      </div>

      <div className="timer-presets">
        {PRESETS.map((p) => (
          <PastelBadge
            key={p.seconds}
            variant={totalSeconds === p.seconds ? 'lavender' : 'peach'}
            size="sm"
            className="timer-preset-badge"
            onClick={() => selectPreset(p.seconds)}
          >
            {p.label}
          </PastelBadge>
        ))}
      </div>

      {sessionsCompleted > 0 && (
        <div className="timer-sessions">
          <PastelBadge variant="mint" size="sm">
            {sessionsCompleted} session{sessionsCompleted !== 1 ? 's' : ''}{' '}
            today
          </PastelBadge>
        </div>
      )}
    </div>
  );
}
