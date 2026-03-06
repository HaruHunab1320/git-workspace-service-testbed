import { useState, useEffect, useCallback } from 'react';

export default function GentleReminders({ reminders = [], intervalMs = 30000 }) {
  const [index, setIndex] = useState(0);

  const advance = useCallback(() => {
    setIndex((prev) => (prev + 1) % reminders.length);
  }, [reminders.length]);

  useEffect(() => {
    if (reminders.length <= 1) return;
    const timer = setInterval(advance, intervalMs);
    return () => clearInterval(timer);
  }, [advance, intervalMs, reminders.length]);

  if (reminders.length === 0) return null;

  return (
    <div className="reminder-item">
      <span>*</span>
      <span>{reminders[index]}</span>
    </div>
  );
}
