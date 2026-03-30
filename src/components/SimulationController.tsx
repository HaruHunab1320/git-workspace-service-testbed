import React, { useRef, useEffect } from 'react';
import { useNervStore } from '../store/useNervStore';
import { SimulationEngine } from '../simulation/SimulationEngine';

const NERV_RED = '#FF3300';
const WARNING_ORANGE = '#FF9900';
const DEEP_BLACK = '#050505';
const NOMINAL_GREEN = '#33FF33';

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const sec = String(totalSec % 60).padStart(2, '0');
  return `${min}:${sec}`;
}

function hpBarColor(hp: number): string {
  if (hp > 66) return NOMINAL_GREEN;
  if (hp > 33) return '#FFFF00';
  return NERV_RED;
}

function dmgBarColor(dmg: number): string {
  if (dmg < 33) return NOMINAL_GREEN;
  if (dmg < 66) return WARNING_ORANGE;
  return NERV_RED;
}

const SimulationController: React.FC = () => {
  const { phase, status, phaseTimeRemainingMs, totalElapsedMs, angelHp, nervDamage } =
    useNervStore((s) => s.simulation);
  const emergencyLevel = useNervStore((s) => s.emergencyLevel);

  const engineRef = useRef<SimulationEngine | null>(null);

  useEffect(() => {
    engineRef.current = new SimulationEngine();
    return () => engineRef.current?.destroy();
  }, []);

  const handleStart = () => {
    if (status === 'PAUSED') engineRef.current?.resume();
    else engineRef.current?.start();
  };

  const handlePause = () => engineRef.current?.pause();
  const handleReset = () => engineRef.current?.reset();

  const startEnabled = status === 'STOPPED' || status === 'DEFEAT' || status === 'VICTORY';
  const pauseEnabled = status === 'RUNNING';
  const resumeEnabled = status === 'PAUSED';
  const resetEnabled = status !== 'STOPPED';

  const currentPhaseConfig: Record<string, number> = {
    DETECTION: 10_000,
    APPROACH: 15_000,
    CONTACT: 15_000,
    RESOLUTION: 10_000,
  };
  const phaseDuration = currentPhaseConfig[phase] ?? 0;

  return (
    <div
      data-testid="simulation-controller"
      style={{
        backgroundColor: DEEP_BLACK,
        border: `1px solid ${NERV_RED}`,
        fontFamily: "'Share Tech Mono', monospace",
        color: NERV_RED,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div style={{ fontSize: '0.875rem', fontWeight: 'bold', letterSpacing: '0.15em' }}>
        ANGEL ATTACK SIMULATION
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
        <span data-testid="sim-status">STATUS: {status}</span>
        <span
          data-testid="sim-phase"
          style={{
            animation:
              emergencyLevel === 'EMERGENCY' ? 'phase-pulse 0.8s ease-in-out infinite' : 'none',
          }}
        >
          PHASE: {phase}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: WARNING_ORANGE }}>
        <span>ELAPSED: {formatTime(totalElapsedMs)}</span>
        <span>
          PHASE: {formatTime(phaseDuration - phaseTimeRemainingMs)} / {formatTime(phaseDuration)}
        </span>
      </div>

      {/* Angel HP bar */}
      <div>
        <div style={{ fontSize: '0.65rem', color: WARNING_ORANGE, marginBottom: '0.25rem' }}>
          ANGEL
        </div>
        <div style={{ position: 'relative', height: 16, backgroundColor: '#111', border: `1px solid ${WARNING_ORANGE}33` }}>
          <div
            data-testid="angel-hp-bar"
            style={{
              height: '100%',
              width: `${angelHp}%`,
              backgroundColor: hpBarColor(angelHp),
              transition: 'width 400ms, background-color 400ms',
            }}
          />
        </div>
        <div style={{ fontSize: '0.65rem', color: WARNING_ORANGE, textAlign: 'right' }}>
          HP: {Math.round(angelHp)}%
        </div>
      </div>

      {/* NERV Damage bar */}
      <div>
        <div style={{ fontSize: '0.65rem', color: WARNING_ORANGE, marginBottom: '0.25rem' }}>
          NERV
        </div>
        <div style={{ position: 'relative', height: 16, backgroundColor: '#111', border: `1px solid ${WARNING_ORANGE}33` }}>
          <div
            data-testid="nerv-dmg-bar"
            style={{
              height: '100%',
              width: `${nervDamage}%`,
              backgroundColor: dmgBarColor(nervDamage),
              transition: 'width 400ms, background-color 400ms',
            }}
          />
        </div>
        <div style={{ fontSize: '0.65rem', color: WARNING_ORANGE, textAlign: 'right' }}>
          DMG: {Math.round(nervDamage)}%
        </div>
      </div>

      {/* Victory / Defeat indicator */}
      {status === 'VICTORY' && (
        <div data-testid="victory-indicator" style={{ color: NOMINAL_GREEN, textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.2em' }}>
          VICTORY - ANGEL NEUTRALIZED
        </div>
      )}
      {status === 'DEFEAT' && (
        <div data-testid="defeat-indicator" style={{ color: NERV_RED, textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.2em' }}>
          DEFEAT - GEOFRONT BREACH
        </div>
      )}

      {/* Control buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button
          data-testid="btn-start"
          onClick={handleStart}
          disabled={!startEnabled && !resumeEnabled}
          style={{
            border: `1px solid ${WARNING_ORANGE}`,
            backgroundColor: 'transparent',
            color: WARNING_ORANGE,
            fontFamily: "'Share Tech Mono', monospace",
            padding: '0.4rem 1rem',
            cursor: startEnabled || resumeEnabled ? 'pointer' : 'default',
            opacity: startEnabled || resumeEnabled ? 1 : 0.3,
          }}
        >
          {status === 'PAUSED' ? '\u25B6 RESUME' : '\u25B6 START'}
        </button>
        <button
          data-testid="btn-pause"
          onClick={handlePause}
          disabled={!pauseEnabled}
          style={{
            border: `1px solid ${WARNING_ORANGE}`,
            backgroundColor: 'transparent',
            color: WARNING_ORANGE,
            fontFamily: "'Share Tech Mono', monospace",
            padding: '0.4rem 1rem',
            cursor: pauseEnabled ? 'pointer' : 'default',
            opacity: pauseEnabled ? 1 : 0.3,
          }}
        >
          \u23F8 PAUSE
        </button>
        <button
          data-testid="btn-reset"
          onClick={handleReset}
          disabled={!resetEnabled}
          style={{
            border: `1px solid ${WARNING_ORANGE}`,
            backgroundColor: 'transparent',
            color: WARNING_ORANGE,
            fontFamily: "'Share Tech Mono', monospace",
            padding: '0.4rem 1rem',
            cursor: resetEnabled ? 'pointer' : 'default',
            opacity: resetEnabled ? 1 : 0.3,
          }}
        >
          \u27F2 RESET
        </button>
      </div>

      <style>{`
        @keyframes phase-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default SimulationController;
