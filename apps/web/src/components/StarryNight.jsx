import { useState, useEffect } from 'react';
import './StarryNight.css';

const STORAGE_KEY = 'stars-enabled';

export default function StarryNight() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
    if (enabled) {
      document.body.classList.add('stars-active');
    } else {
      document.body.classList.remove('stars-active');
    }
    return () => document.body.classList.remove('stars-active');
  }, [enabled]);

  return (
    <>
      {enabled && (
        <div className="stars-overlay" aria-hidden="true">
          <div className="stars-layer stars-small" />
          <div className="stars-layer stars-medium" />
          <div className="stars-layer stars-large" />
        </div>
      )}

      <button
        className={`stars-fab ${enabled ? 'active' : ''}`}
        onClick={() => setEnabled((v) => !v)}
        title="Starry Night Sky"
      >
        <span className="stars-fab-icon">{enabled ? '\u2728' : '\u2B50'}</span>
      </button>
    </>
  );
}
