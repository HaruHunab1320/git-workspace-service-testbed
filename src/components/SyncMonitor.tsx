import React from 'react';
import { useNervStore } from '../store/useNervStore';
import type { Pilot } from '../types/nerv.d';

const NERV_RED = '#FF3300';
const WARNING_ORANGE = '#FF9900';
const DEEP_BLACK = '#050505';
const NOMINAL_GREEN = '#39FF14';

const DEFAULT_PILOT: Pilot = {
  id: 'EVA-02',
  name: 'Asuka Langley Soryu',
  syncRate: 0,
  status: 'ACTIVE',
};

const SyncMonitor: React.FC = () => {
  const syncRatio = useNervStore((s) => s.syncRatio);
  const emergencyLevel = useNervStore((s) => s.emergencyLevel);

  const clampedRatio = Math.min(100, Math.max(0, syncRatio));
  const isEmergency = emergencyLevel === 'EMERGENCY';
  const isAlert = emergencyLevel === 'ALERT';

  const barColor = isEmergency ? NERV_RED : NOMINAL_GREEN;
  const statusLabel = isEmergency
    ? 'CRITICAL'
    : isAlert
      ? 'CAUTION'
      : 'NOMINAL';

  const pilotStatus: Pilot['status'] = isEmergency ? 'BERSERK' : 'ACTIVE';

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
        [SYSTEM_REPORT] Evangelion Sync-Ratio Monitor
      </h2>

      {/* Sync ratio numeric readout */}
      <div
        data-testid="sync-value"
        style={{
          color: barColor,
          fontSize: '2.25rem',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {clampedRatio.toFixed(1)}%
      </div>

      {/* Vertical progress bar */}
      <div
        style={{
          position: 'relative',
          width: '4rem',
          height: 200,
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
          >
            <span
              style={{
                position: 'absolute',
                left: '-2rem',
                top: '-0.5rem',
                fontSize: '10px',
                color: `${WARNING_ORANGE}99`,
              }}
            >
              {tick}
            </span>
          </div>
        ))}

        {/* Animated fill bar */}
        <div
          data-testid="sync-bar"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: `${clampedRatio}%`,
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

      {/* Status indicator */}
      <div
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

      {/* Emergency warning overlay */}
      {isEmergency && (
        <div
          data-testid="emergency-warning"
          style={{
            color: NERV_RED,
            fontWeight: 'bold',
            animation: 'emergency-pulse 0.8s ease-in-out infinite',
            letterSpacing: '0.2em',
          }}
        >
          [SYSTEM_REPORT] EMERGENCY STATE ACTIVE
        </div>
      )}

      {/* Pilot designation */}
      <div
        style={{
          fontSize: '10px',
          color: `${WARNING_ORANGE}80`,
          letterSpacing: '0.2em',
        }}
      >
        {DEFAULT_PILOT.id} // {DEFAULT_PILOT.name.toUpperCase()} // {pilotStatus}
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

export default SyncMonitor;
