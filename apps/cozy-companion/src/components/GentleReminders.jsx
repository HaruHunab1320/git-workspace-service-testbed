import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_REMINDERS = [
  'Remember to drink some water.',
  'Take a deep breath... in and out.',
  'How about a quick stretch?',
  'Look away from the screen for 20 seconds.',
  'Check your posture - sit up tall!',
  'You are doing wonderful things.',
  'Unclench your jaw and relax your shoulders.',
  'A short walk can do wonders.',
];

const DEFAULT_INTERVAL_MS = 10 * 60 * 1000;

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(396, ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Audio not available - silently skip
  }
}

function GentleReminders({ reminders = DEFAULT_REMINDERS, intervalMs = DEFAULT_INTERVAL_MS }) {
  const [current, setCurrent] = useState(null);
  const [visible, setVisible] = useState(false);
  const indexRef = useRef(0);

  const showReminder = useCallback(() => {
    setCurrent(reminders[indexRef.current % reminders.length]);
    indexRef.current += 1;
    setVisible(true);
    playChime();
  }, [reminders]);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    const id = setInterval(showReminder, intervalMs);
    return () => clearInterval(id);
  }, [showReminder, intervalMs]);

  if (!visible || !current) return null;

  return (
    <div className="gentle-reminder">
      <p className="gentle-reminder-text">{current}</p>
      <button className="gentle-reminder-dismiss" onClick={dismiss}>Got it</button>
    </div>
  );
}

export default GentleReminders;
