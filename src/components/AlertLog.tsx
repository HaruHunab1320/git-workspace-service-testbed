import React, { useRef, useEffect } from 'react';
import { useNervStore } from '../store/useNervStore';
import type { SystemAlert } from '../types/nerv.d';

const NERV_RED = '#FF3300';
const WARNING_ORANGE = '#FF9900';
const DEEP_BLACK = '#050505';
const NOMINAL_GREEN = '#39FF14';

/**
 * Maps a SystemAlert severity level to a display color.
 */
function eva_alertColor(level: SystemAlert['level']): string {
  switch (level) {
    case 'EMERGENCY':
      return NERV_RED;
    case 'CRITICAL':
      return NERV_RED;
    case 'WARNING':
      return WARNING_ORANGE;
    case 'INFO':
      return NOMINAL_GREEN;
  }
}

/**
 * Formats an alert timestamp to HH:MM:SS for display.
 */
function eva_formatTimestamp(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toTimeString().slice(0, 8);
}

/**
 * Alert Log Panel — real-time system alert timeline.
 * Displays all active systemAlerts from the Zustand store with
 * severity-colored indicators, timestamps, and a clear button.
 * Auto-scrolls to the latest alert.
 *
 * Store dependencies: `systemAlerts`, `clearSystemAlerts`, `emergencyLevel`
 */
const AlertLog: React.FC = () => {
  const systemAlerts = useNervStore((s) => s.systemAlerts);
  const clearSystemAlerts = useNervStore((s) => s.clearSystemAlerts);
  const emergencyLevel = useNervStore((s) => s.emergencyLevel);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isEmergency = emergencyLevel === 'EMERGENCY';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [systemAlerts]);

  return (
    <div
      data-testid="alert-log"
      style={{
        backgroundColor: DEEP_BLACK,
        fontFamily: "'Share Tech Mono', monospace",
        border: `1px solid ${isEmergency ? NERV_RED : WARNING_ORANGE}`,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 200,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 0.75rem',
          borderBottom: `1px solid ${isEmergency ? NERV_RED : WARNING_ORANGE}`,
        }}
      >
        <span
          style={{
            color: WARNING_ORANGE,
            fontSize: '0.75rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          [SYSTEM_REPORT] ALERT LOG
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            data-testid="alert-count"
            style={{
              color: systemAlerts.length > 0 ? NERV_RED : NOMINAL_GREEN,
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
            }}
          >
            {systemAlerts.length} ACTIVE
          </span>
          {systemAlerts.length > 0 && (
            <button
              data-testid="clear-alerts-btn"
              onClick={clearSystemAlerts}
              style={{
                backgroundColor: 'transparent',
                border: `1px solid ${WARNING_ORANGE}`,
                color: WARNING_ORANGE,
                fontSize: '0.625rem',
                letterSpacing: '0.15em',
                padding: '0.2rem 0.5rem',
                cursor: 'pointer',
                fontFamily: "'Share Tech Mono', monospace",
                textTransform: 'uppercase',
              }}
            >
              CLEAR ALL
            </button>
          )}
        </div>
      </div>

      {/* Alert list */}
      <div
        data-testid="alert-list"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.5rem 0.75rem',
        }}
      >
        {systemAlerts.length === 0 ? (
          <div
            data-testid="alert-empty"
            style={{
              color: `${NOMINAL_GREEN}80`,
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              textAlign: 'center',
              padding: '2rem 0',
            }}
          >
            NO ACTIVE ALERTS — ALL SYSTEMS NOMINAL
          </div>
        ) : (
          systemAlerts.map((alert) => (
            <div
              key={alert.id}
              data-testid={`alert-entry-${alert.id}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                padding: '0.4rem 0',
                borderBottom: `1px solid ${WARNING_ORANGE}15`,
                animation:
                  alert.level === 'EMERGENCY'
                    ? 'emergency-pulse 0.8s ease-in-out infinite'
                    : 'none',
              }}
            >
              {/* Severity indicator */}
              <span
                data-testid={`alert-level-${alert.id}`}
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  minWidth: 8,
                  borderRadius: '50%',
                  backgroundColor: eva_alertColor(alert.level),
                  marginTop: 3,
                  boxShadow: `0 0 6px ${eva_alertColor(alert.level)}80`,
                }}
              />

              {/* Timestamp */}
              <span
                data-testid={`alert-time-${alert.id}`}
                style={{
                  color: `${WARNING_ORANGE}80`,
                  fontSize: '0.625rem',
                  whiteSpace: 'nowrap',
                  marginTop: 1,
                }}
              >
                {eva_formatTimestamp(alert.timestamp)}
              </span>

              {/* Level badge */}
              <span
                style={{
                  color: eva_alertColor(alert.level),
                  fontSize: '0.625rem',
                  fontWeight: 'bold',
                  letterSpacing: '0.1em',
                  whiteSpace: 'nowrap',
                  marginTop: 1,
                }}
              >
                [{alert.level}]
              </span>

              {/* Message */}
              <span
                data-testid={`alert-msg-${alert.id}`}
                style={{
                  color: eva_alertColor(alert.level),
                  fontSize: '0.75rem',
                  lineHeight: 1.4,
                }}
              >
                {alert.message}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes emergency-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export { eva_alertColor, eva_formatTimestamp };
export default AlertLog;
