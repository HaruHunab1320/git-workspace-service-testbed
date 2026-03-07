import { useState, useEffect, useRef, useCallback } from 'react';
import './GentleReminders.css';

const REMINDERS = [
  {
    id: 'water',
    emoji: '\u{1F4A7}',
    message: 'Time for a sip of water',
    detail: 'Stay hydrated, friend',
  },
  {
    id: 'stretch',
    emoji: '\u{1F331}',
    message: 'Stretch break',
    detail: 'Roll your shoulders and breathe',
  },
  {
    id: 'eyes',
    emoji: '\u{1F30C}',
    message: 'Rest your eyes',
    detail: 'Look at something far away for 20s',
  },
  {
    id: 'breathe',
    emoji: '\u{1F343}',
    message: 'Deep breath',
    detail: 'Inhale for 4, hold for 4, exhale for 4',
  },
  {
    id: 'posture',
    emoji: '\u{1FA91}',
    message: 'Check your posture',
    detail: 'Sit up tall, relax your jaw',
  },
];

const DEFAULT_INTERVAL_MIN = 30;
const INTERVAL_OPTIONS = [15, 20, 30, 45, 60];

function playGentleChime(volume = 0.1) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;

    // Two soft ascending tones
    [392, 523.3].forEach((freq, i) => {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume * (0.4 - i * 0.1), t + i * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.3 + 1.0);
      gain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.3);
      osc.connect(gain);
      osc.start(t + i * 0.3);
      osc.stop(t + i * 0.3 + 1.0);
    });

    setTimeout(() => ctx.close(), 2000);
  } catch {
    // Web Audio not available
  }
}

export default function GentleReminders() {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem('cozy-reminders-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [intervalMin, setIntervalMin] = useState(() => {
    const saved = localStorage.getItem('cozy-reminders-interval');
    return saved ? Number(saved) : DEFAULT_INTERVAL_MIN;
  });
  const [activeReminder, setActiveReminder] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const timerRef = useRef(null);
  const reminderIndexRef = useRef(Math.floor(Math.random() * REMINDERS.length));

  const dismiss = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => {
      setActiveReminder(null);
      setFadeOut(false);
    }, 400);
  }, []);

  const showNextReminder = useCallback(() => {
    const reminder = REMINDERS[reminderIndexRef.current % REMINDERS.length];
    reminderIndexRef.current += 1;
    setActiveReminder(reminder);
    setFadeOut(false);
    playGentleChime();

    // Auto-dismiss after 15 seconds
    setTimeout(() => {
      dismiss();
    }, 15000);
  }, [dismiss]);

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!enabled) return;
    timerRef.current = setTimeout(
      () => {
        showNextReminder();
        scheduleNext();
      },
      intervalMin * 60 * 1000
    );
  }, [enabled, intervalMin, showNextReminder]);

  useEffect(() => {
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleNext]);

  useEffect(() => {
    localStorage.setItem('cozy-reminders-enabled', JSON.stringify(enabled));
  }, [enabled]);

  useEffect(() => {
    localStorage.setItem('cozy-reminders-interval', String(intervalMin));
  }, [intervalMin]);

  const toggleEnabled = () => {
    setEnabled((prev) => !prev);
    if (activeReminder) dismiss();
  };

  return (
    <>
      {/* Settings toggle button */}
      <button
        className={`reminder-fab ${enabled ? 'enabled' : 'disabled'}`}
        onClick={() => setIsSettingsOpen((prev) => !prev)}
        title="Gentle Reminders"
      >
        <span className="reminder-fab-icon">{'\u{1F33F}'}</span>
      </button>

      {/* Settings dropdown */}
      {isSettingsOpen && (
        <div className="reminder-settings">
          <div className="reminder-settings-header">
            <span className="reminder-settings-title">gentle reminders</span>
            <button
              className="reminder-settings-close"
              onClick={() => setIsSettingsOpen(false)}
            >
              &times;
            </button>
          </div>

          <label className="reminder-toggle-row">
            <span>Enabled</span>
            <button
              className={`reminder-toggle-btn ${enabled ? 'on' : 'off'}`}
              onClick={toggleEnabled}
            >
              <span className="reminder-toggle-knob" />
            </button>
          </label>

          <div className="reminder-interval-row">
            <span className="reminder-interval-label">Every</span>
            <div className="reminder-interval-options">
              {INTERVAL_OPTIONS.map((min) => (
                <button
                  key={min}
                  className={`reminder-interval-btn ${min === intervalMin ? 'active' : ''}`}
                  onClick={() => {
                    setIntervalMin(min);
                    scheduleNext();
                  }}
                >
                  {min}m
                </button>
              ))}
            </div>
          </div>

          <div className="reminder-preview">
            <button className="reminder-preview-btn" onClick={showNextReminder}>
              preview reminder
            </button>
          </div>
        </div>
      )}

      {/* Active reminder notification */}
      {activeReminder && (
        <div
          className={`reminder-notification ${fadeOut ? 'fade-out' : 'fade-in'}`}
          onClick={dismiss}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && dismiss()}
        >
          <span className="reminder-emoji">{activeReminder.emoji}</span>
          <div className="reminder-text">
            <span className="reminder-message">{activeReminder.message}</span>
            <span className="reminder-detail">{activeReminder.detail}</span>
          </div>
          <span className="reminder-dismiss">click to dismiss</span>
        </div>
      )}
    </>
  );
}
