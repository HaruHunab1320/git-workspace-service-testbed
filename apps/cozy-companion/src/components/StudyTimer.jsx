import { useState, useEffect, useRef } from 'react';
import { PastelButton, PastelBadge, PastelProgress } from '@cozy-village/ui';

const STUDY_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const STATE_CONFIG = {
  idle: {
    label: 'Ready when you are',
    variant: 'lavender',
    progress: 'lavender',
  },
  studying: { label: 'Focus time', variant: 'mint', progress: 'mint' },
  break: { label: 'Break time', variant: 'peach', progress: 'peach' },
};

function StudyTimer({ studyState, onStateChange }) {
  const [timeLeft, setTimeLeft] = useState(STUDY_DURATION);
  const intervalRef = useRef(null);

  const totalTime = studyState === 'break' ? BREAK_DURATION : STUDY_DURATION;
  const elapsed = totalTime - timeLeft;
  const config = STATE_CONFIG[studyState] || STATE_CONFIG.idle;

  useEffect(() => {
    if (studyState === 'idle') {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          if (studyState === 'studying') {
            onStateChange('break');
            return BREAK_DURATION;
          } else {
            onStateChange('idle');
            return STUDY_DURATION;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [studyState, onStateChange]);

  const handleStart = () => {
    setTimeLeft(STUDY_DURATION);
    onStateChange('studying');
  };

  const handleStop = () => {
    setTimeLeft(STUDY_DURATION);
    onStateChange('idle');
  };

  return (
    <div className="study-timer">
      <div className="study-timer__display">
        <span className="timer-time">{formatTime(timeLeft)}</span>
        <PastelBadge variant={config.variant} size="sm">
          {config.label}
        </PastelBadge>
      </div>

      <PastelProgress
        value={elapsed}
        max={totalTime}
        variant={config.progress}
        size="sm"
      />

      <div className="timer-controls">
        {studyState === 'idle' ? (
          <PastelButton variant="mint" onClick={handleStart}>
            Start Studying
          </PastelButton>
        ) : (
          <PastelButton variant="blush" onClick={handleStop}>
            Stop
          </PastelButton>
        )}
      </div>
    </div>
  );
}

export default StudyTimer;
