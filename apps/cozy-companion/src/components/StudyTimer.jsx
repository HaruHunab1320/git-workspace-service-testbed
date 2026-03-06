import { useState, useEffect, useRef } from 'react';

const STUDY_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function StudyTimer({ studyState, onStateChange }) {
  const [timeLeft, setTimeLeft] = useState(STUDY_DURATION);
  const intervalRef = useRef(null);

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
      <h2 className="section-title">Study Timer</h2>
      <div className="timer-display">{formatTime(timeLeft)}</div>
      <div className="timer-label">
        {studyState === 'studying' && 'Focus time'}
        {studyState === 'break' && 'Break time'}
        {studyState === 'idle' && 'Ready when you are'}
      </div>
      <div className="timer-controls">
        {studyState === 'idle' ? (
          <button className="btn btn--primary" onClick={handleStart}>
            Start Studying
          </button>
        ) : (
          <button className="btn btn--secondary" onClick={handleStop}>
            Stop
          </button>
        )}
      </div>
    </div>
  );
}

export default StudyTimer;
