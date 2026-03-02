import { useState } from 'react';
import './SleepingCat.css';

export default function SleepingCat() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="sleepingcat-widget">
      {isExpanded ? (
        <div className="sleepingcat-panel">
          <div className="sleepingcat-header">
            <span className="sleepingcat-title">desk kitty</span>
            <button
              className="sleepingcat-collapse-btn"
              onClick={() => setIsExpanded(false)}
            >
              &minus;
            </button>
          </div>

          <div className="sleepingcat-desk">
            <div className="sleepingcat-cat">
              {/* Head */}
              <div className="sleepingcat-head">
                <div className="sleepingcat-ear-left" />
                <div className="sleepingcat-ear-right" />
                <div className="sleepingcat-eyes">
                  <div className="sleepingcat-eye" />
                  <div className="sleepingcat-eye" />
                </div>
                <div className="sleepingcat-nose" />
              </div>

              {/* Paws tucked under head */}
              <div className="sleepingcat-paws">
                <div className="sleepingcat-paw" />
                <div className="sleepingcat-paw" />
              </div>

              {/* Body */}
              <div className="sleepingcat-body" />

              {/* Tail */}
              <div className="sleepingcat-tail" />

              {/* Zzz */}
              <div className="sleepingcat-zzz">
                <span className="sleepingcat-z">z</span>
                <span className="sleepingcat-z">z</span>
                <span className="sleepingcat-z">z</span>
              </div>
            </div>
          </div>

          <div className="sleepingcat-status">purring softly...</div>

          <div className="sleepingcat-purr">
            <div className="sleepingcat-purr-bar" />
            <div className="sleepingcat-purr-bar" />
            <div className="sleepingcat-purr-bar" />
            <div className="sleepingcat-purr-bar" />
            <div className="sleepingcat-purr-bar" />
            <div className="sleepingcat-purr-bar" />
            <div className="sleepingcat-purr-bar" />
            <span className="sleepingcat-purr-label">prrr</span>
          </div>
        </div>
      ) : (
        <button
          className="sleepingcat-fab"
          onClick={() => setIsExpanded(true)}
          title="Desk Kitty"
        >
          <span className="sleepingcat-fab-icon">🐱</span>
          <span className="sleepingcat-fab-zzz">z</span>
        </button>
      )}
    </div>
  );
}
