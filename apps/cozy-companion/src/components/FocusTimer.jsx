import { useState, useEffect, useRef, useCallback } from 'react';
import { PastelButton, PastelProgress, PastelBadge } from '@cozy-village/ui';

const PRESETS = [
  { label: '5 min', seconds: 300 },
  { label: '15 min', seconds: 900 },
  { label: '25 min', seconds: 1500 },
];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FocusTimer({ showToast }) {
  const [totalSeconds, setTotalSeconds] = useState(1500);
  const [remaining, setRemaining] = useState(1500);
  const [running, setRunning] = useState(false);
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
          showToast?.('Focus session complete!', 'success');
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

  return (
    <div className="timer-display">
      <div className="timer-time">{formatTime(remaining)}</div>

      <PastelProgress
        value={elapsed}
        max={totalSeconds}
        variant="lavender"
        size="md"
      />

      <div className="timer-controls" style={{ marginTop: '12px' }}>
        <PastelButton variant="mint" size="sm" onClick={toggle}>
          {running ? 'Pause' : remaining < totalSeconds && remaining > 0 ? 'Resume' : 'Start'}
        </PastelButton>
        <PastelButton variant="ghost" size="sm" onClick={reset}>
          Reset
        </PastelButton>
      </div>

      <div className="timer-controls" style={{ marginTop: '8px' }}>
        {PRESETS.map((p) => (
          <PastelBadge
            key={p.seconds}
            variant={totalSeconds === p.seconds ? 'lavender' : 'peach'}
            size="sm"
            style={{ cursor: 'pointer' }}
            onClick={() => selectPreset(p.seconds)}
          >
            {p.label}
          </PastelBadge>
        ))}
      </div>
    </div>
  );
}
