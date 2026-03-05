import { useState, useEffect } from 'react';
import './FloatingClouds.css';

const STORAGE_KEY = 'clouds-enabled';

export default function FloatingClouds() {
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
      document.body.classList.add('clouds-active');
    } else {
      document.body.classList.remove('clouds-active');
    }
    return () => document.body.classList.remove('clouds-active');
  }, [enabled]);

  return (
    <>
      {enabled && (
        <div className="clouds-overlay" aria-hidden="true">
          <div className="clouds-cloud clouds-cloud-1" />
          <div className="clouds-cloud clouds-cloud-2" />
          <div className="clouds-cloud clouds-cloud-3" />
          <div className="clouds-cloud clouds-cloud-4" />
          <div className="clouds-cloud clouds-cloud-5" />
          <div className="clouds-cloud clouds-cloud-6" />
          <div className="clouds-cloud clouds-cloud-7" />
        </div>
      )}

      <button
        className={`clouds-fab ${enabled ? 'active' : ''}`}
        onClick={() => setEnabled((v) => !v)}
        title="Floating Clouds"
      >
        <span className="clouds-fab-icon">{enabled ? '\u2601\uFE0F' : '\u2601'}</span>
      </button>
    </>
  );
}
