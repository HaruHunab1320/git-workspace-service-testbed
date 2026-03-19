import React from 'react';
import { useNervStore } from '../store/useNervStore';
import type { Pilot } from '../types/nerv.d';

const NERV_RED = '#FF3300';
const WARNING_ORANGE = '#FF9900';
const DEEP_BLACK = '#050505';
const NOMINAL_GREEN = '#39FF14';

const DEFAULT_PILOTS: Pilot[] = [
  { id: 'pilot-shinji', name: 'Shinji Ikari', syncRate: 0, status: 'ACTIVE' },
  { id: 'pilot-asuka', name: 'Asuka Langley Soryu', syncRate: 0, status: 'ACTIVE' },
  { id: 'pilot-rei', name: 'Rei Ayanami', syncRate: 0, status: 'ACTIVE' },
];

/**
 * Clamps and returns the effective sync ratio for a pilot.
 * @param pilotId - The pilot identifier
 * @param ratio - Raw sync ratio value
 * @returns Clamped ratio between 0 and 100
 */
export function eva_calculateSyncRatio(_pilotId: string, ratio: number): number {
  return Math.min(100, Math.max(0, ratio));
}

/**
 * Evangelion sync-ratio monitoring widget with animated vertical progress bars.
 * Displays per-pilot syncRatios values (0-100) as vertical bars.
 * Under normal conditions, bars render in NERV Red (#FF3300).
 * When emergencyLevel is 'EMERGENCY', bars pulse with a CSS animation.
 * When systemAlerts is populated, an Emergency overlay is rendered.
 */
const SyncMonitor: React.FC = () => {
  const syncRatios = useNervStore((s) => s.syncRatios);
  const emergencyLevel = useNervStore((s) => s.emergencyLevel);
  const systemAlerts = useNervStore((s) => s.systemAlerts);

  const isEmergency = emergencyLevel === 'EMERGENCY';
  const isAlert = emergencyLevel === 'ALERT';
  const hasAlerts = systemAlerts.length > 0;

  const statusLabel = isEmergency
    ? 'CRITICAL'
    : isAlert
      ? 'CAUTION'
      : 'NOMINAL';

  const pilotsToDisplay = DEFAULT_PILOTS.map((pilot) => ({
    ...pilot,
    syncRate: eva_calculateSyncRatio(pilot.id, syncRatios[pilot.id] ?? 0),
    status: (isEmergency ? 'BERSERK' : 'ACTIVE') as Pilot['status'],
  }));

  return (
    <div
      style={{
        backgroundColor: DEEP_BLACK,
        fontFamily: "'Share Tech Mono', monospace",
        border: `1px solid ${WARNING_ORANGE}`,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <h2
        style={{
          color: WARNING_ORANGE,
          fontSize: '0.75rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          textAlign: 'center',
          width: '100%',
          margin: 0,
        }}
      >
        [SYSTEM_REPORT] EVANGELION SYNC-RATIO MONITOR
      </h2>

      {/* Per-pilot sync bars */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end' }}>
        {pilotsToDisplay.map((pilot) => {
          const barColor = isEmergency ? NERV_RED : NOMINAL_GREEN;
          return (
            <div
              key={pilot.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {/* Sync ratio numeric readout */}
              <div
                data-testid={`sync-value-${pilot.id}`}
                style={{
                  color: barColor,
                  fontSize: '1.25rem',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {pilot.syncRate.toFixed(1)}%
              </div>

              {/* Vertical progress bar */}
              <div
                style={{
                  position: 'relative',
                  width: '3rem',
                  height: 160,
                  border: `1px solid ${WARNING_ORANGE}`,
                  backgroundColor: 'black',
                }}
              >
                {/* Scale markings */}
                {[0, 25, 50, 75, 100].map((tick) => (
                  <div
                    key={tick}
                    style={{
                      position: 'absolute',
                      left: 0,
                      width: '100%',
                      borderTop: `1px solid ${WARNING_ORANGE}33`,
                      bottom: `${tick}%`,
                    }}
                  />
                ))}

                {/* Animated fill bar */}
                <div
                  data-testid={`sync-bar-${pilot.id}`}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: `${pilot.syncRate}%`,
                    backgroundColor: barColor,
                    transition: 'all 500ms ease-in-out',
                    boxShadow: isEmergency
                      ? `0 0 12px ${NERV_RED}, inset 0 0 8px rgba(255,51,0,0.4)`
                      : `0 0 8px ${barColor}40`,
                    animation: isEmergency
                      ? 'emergency-pulse 0.8s ease-in-out infinite'
                      : 'none',
                  }}
                />
              </div>

              {/* Pilot label */}
              <div
                style={{
                  fontSize: '9px',
                  color: `${WARNING_ORANGE}80`,
                  letterSpacing: '0.1em',
                  textAlign: 'center',
                  maxWidth: '5rem',
                }}
              >
                {pilot.name.toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status indicator */}
      <div
        data-testid="sync-status"
        style={{
          fontSize: '0.75rem',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: isEmergency ? NERV_RED : NOMINAL_GREEN,
          animation: isEmergency
            ? 'emergency-pulse 0.8s ease-in-out infinite'
            : 'none',
        }}
      >
        [SYSTEM_REPORT] STATUS: {statusLabel}
      </div>

      {/* Emergency warning overlay — Pattern Blue */}
      {(isEmergency || hasAlerts) && (
        <div
          data-testid="emergency-warning"
          style={{
            color: NERV_RED,
            fontWeight: 'bold',
            animation: 'emergency-pulse 0.8s ease-in-out infinite',
            letterSpacing: '0.2em',
            textAlign: 'center',
          }}
        >
          {hasAlerts
            ? systemAlerts.map((alert) => (
                <div key={alert.id}>{alert.message}</div>
              ))
            : '[SYSTEM_REPORT] EMERGENCY STATE ACTIVE'}
        </div>
      )}

      <style>{`
        @keyframes emergency-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default SyncMonitor;
