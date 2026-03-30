import React, { useEffect } from 'react';
import { useNervStore } from '../store/useNervStore';
import { PHASE_ORDER } from '../systems/simulation';
import type { SimulationPhase } from '../types/nerv.d';

const PHASE_LABELS: SimulationPhase[] = ['DETECTION', 'APPROACH', 'CONTACT', 'RESOLUTION'];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function outcomeColor(outcome: string): string {
  if (outcome === 'WIN') return '#00FF00';
  if (outcome === 'LOSE') return '#FF0000';
  return '#CCCCCC';
}

function phaseStyle(
  phase: SimulationPhase,
  currentPhase: SimulationPhase,
): React.CSSProperties {
  const currentIdx = PHASE_ORDER.indexOf(currentPhase);
  const phaseIdx = PHASE_ORDER.indexOf(phase);

  if (phase === currentPhase) {
    return { background: '#FF3300', color: '#000000', padding: '2px 8px' };
  }
  if (currentIdx >= 0 && phaseIdx < currentIdx) {
    return { background: '#331100', color: '#666666', padding: '2px 8px' };
  }
  return { background: '#1A1A1A', color: '#444444', padding: '2px 8px' };
}

export function SimulationController() {
  const simulation = useNervStore((s) => s.simulation);
  const startSimulation = useNervStore((s) => s.startSimulation);
  const pauseSimulation = useNervStore((s) => s.pauseSimulation);
  const resumeSimulation = useNervStore((s) => s.resumeSimulation);
  const resetSimulation = useNervStore((s) => s.resetSimulation);
  const tickSimulation = useNervStore((s) => s.tickSimulation);

  useEffect(() => {
    if (simulation.status !== 'RUNNING') return;
    const id = setInterval(tickSimulation, 1000);
    return () => clearInterval(id);
  }, [simulation.status, tickSimulation]);

  const { phase, status, outcome, phaseTimeRemaining, totalElapsed, angelHp, nervIntegrity } =
    simulation;

  const isRunning = status === 'RUNNING';
  const isStopped = status === 'STOPPED';
  const isComplete = status === 'COMPLETE';

  return (
    <div
      style={{
        background: '#050505',
        border: '1px solid #FF3300',
        padding: '16px',
        fontFamily: "'Share Tech Mono', monospace",
        color: '#FF3300',
        minWidth: 340,
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: 12 }}>
        ANGEL ATTACK SIMULATOR
      </div>

      <div style={{ borderTop: '1px solid #331100', paddingTop: 8, marginBottom: 8 }}>
        <div style={{ fontSize: '11px', color: '#888', marginBottom: 4 }}>PHASE</div>
        <div style={{ display: 'flex', gap: 2 }}>
          {PHASE_LABELS.map((p) => (
            <span key={p} style={{ fontSize: '11px', ...phaseStyle(p, phase) }}>
              {p}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 8,
          fontSize: '12px',
        }}
      >
        <span>TIME: {formatTime(phaseTimeRemaining)}</span>
        <span>ELAPSED: {formatTime(totalElapsed)}</span>
      </div>

      <div style={{ borderTop: '1px solid #331100', paddingTop: 8, marginBottom: 8 }}>
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: 2 }}>
            ANGEL HP {Math.round(angelHp)}%
          </div>
          <div style={{ background: '#1A1A1A', height: 12, width: '100%' }}>
            <div
              data-testid="angel-hp-bar"
              style={{
                background: '#FF9900',
                height: '100%',
                width: `${angelHp}%`,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: 2 }}>
            NERV INTEGRITY {Math.round(nervIntegrity)}%
          </div>
          <div style={{ background: '#1A1A1A', height: 12, width: '100%' }}>
            <div
              data-testid="nerv-integrity-bar"
              style={{
                background: '#FF3300',
                height: '100%',
                width: `${nervIntegrity}%`,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid #331100',
          paddingTop: 8,
          marginBottom: 8,
          fontSize: '12px',
        }}
      >
        OUTCOME:{' '}
        <span style={{ color: outcomeColor(outcome), fontWeight: 'bold' }}>{outcome}</span>
      </div>

      <div
        style={{
          borderTop: '1px solid #331100',
          paddingTop: 8,
          display: 'flex',
          gap: 8,
        }}
      >
        {isStopped || isComplete ? (
          <button
            onClick={startSimulation}
            style={buttonStyle(false)}
          >
            START
          </button>
        ) : isRunning ? (
          <button
            onClick={pauseSimulation}
            style={buttonStyle(false)}
          >
            PAUSE
          </button>
        ) : (
          <button
            onClick={resumeSimulation}
            style={buttonStyle(false)}
          >
            RESUME
          </button>
        )}
        <button
          onClick={resetSimulation}
          style={buttonStyle(false)}
        >
          RESET
        </button>
      </div>
    </div>
  );
}

function buttonStyle(disabled: boolean): React.CSSProperties {
  return {
    background: 'transparent',
    border: '1px solid #FF3300',
    color: disabled ? '#662200' : '#FF3300',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '12px',
    padding: '6px 16px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}
