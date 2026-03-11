import { useState, useEffect, useCallback } from 'react';
import { PastelButton } from '@cozy-village/ui';

export default function GentleReminders({
  reminders = [],
  intervalMs = 30000,
}) {
  const [index, setIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);

  const advance = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % reminders.length);
      setTransitioning(false);
    }, 300);
  }, [reminders.length]);

  useEffect(() => {
    if (reminders.length <= 1 || paused) return;
    const timer = setInterval(advance, intervalMs);
    return () => clearInterval(timer);
  }, [advance, intervalMs, reminders.length, paused]);

  if (reminders.length === 0) return null;

  return (
    <div className="gentle-reminders">
      <div
        className={`reminder-card ${transitioning ? 'reminder-card--fading' : ''}`}
      >
        <div className="reminder-card__icon">*</div>
        <p className="reminder-card__text">{reminders[index]}</p>
      </div>

      <div className="reminder-controls">
        <div className="reminder-dots">
          {reminders.map((_, i) => (
            <button
              key={i}
              className={`reminder-dot ${i === index ? 'reminder-dot--active' : ''}`}
              onClick={() => {
                setIndex(i);
                setTransitioning(false);
              }}
              aria-label={`Reminder ${i + 1}`}
            />
          ))}
        </div>

        <div className="reminder-actions">
          <PastelButton
            variant="ghost"
            size="sm"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? 'Resume' : 'Pause'}
          </PastelButton>
          <PastelButton variant="ghost" size="sm" onClick={advance}>
            Next
          </PastelButton>
        </div>
      </div>
    </div>
  );
}
